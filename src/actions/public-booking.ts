"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getBusinessBySlug(slug: string) {
  return prisma.business.findUnique({
    where: { slug, isActive: true },
    include: {
      workingHours: { orderBy: { dayOfWeek: "asc" } },
      services: {
        where: { isActive: true },
        include: { category: true },
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      },
      members: {
        where: { isActive: true },
        include: {
          user: { select: { name: true, image: true } },
          workingHours: { orderBy: { dayOfWeek: "asc" } },
          staffServices: true,
        },
      },
    },
  });
}

export async function getAvailableSlots(
  businessId: string,
  memberId: string,
  date: string,
  durationMinutes: number
) {
  // Get staff working hours for this day
  const dateObj = new Date(date);
  const dayOfWeek = dateObj.getDay(); // 0=Sunday

  const staffHours = await prisma.staffWorkingHour.findUnique({
    where: { memberId_dayOfWeek: { memberId, dayOfWeek } },
  });

  // If no working hours set, try business working hours
  let openTime = "09:00";
  let closeTime = "19:00";
  let isOpen = true;
  let breakStart: string | null = null;
  let breakEnd: string | null = null;

  if (staffHours) {
    isOpen = staffHours.isOpen;
    openTime = staffHours.openTime;
    closeTime = staffHours.closeTime;
    breakStart = staffHours.breakStart;
    breakEnd = staffHours.breakEnd;
  } else {
    // Fall back to business working hours
    const businessHours = await prisma.businessWorkingHour.findFirst({
      where: { businessId, dayOfWeek },
    });
    if (businessHours) {
      isOpen = businessHours.isOpen;
      openTime = businessHours.openTime;
      closeTime = businessHours.closeTime;
      breakStart = businessHours.breakStart || null;
      breakEnd = businessHours.breakEnd || null;
    }
  }

  if (!isOpen) return [];

  // Get existing appointments for this staff on this date
  const dayStart = new Date(`${date}T00:00:00`);
  const dayEnd = new Date(`${date}T23:59:59`);

  const existingAppointments = await prisma.appointment.findMany({
    where: {
      memberId,
      status: { not: "CANCELLED" },
      startTime: { gte: dayStart, lte: dayEnd },
    },
    select: { startTime: true, endTime: true },
    orderBy: { startTime: "asc" },
  });

  // Generate 15-minute interval slots
  const slots: string[] = [];
  const [openH, openM] = openTime.split(":").map(Number);
  const [closeH, closeM] = closeTime.split(":").map(Number);
  const openMinutes = openH * 60 + openM;
  const closeMinutes = closeH * 60 + closeM;

  let breakStartMin = -1;
  let breakEndMin = -1;
  if (breakStart && breakEnd) {
    const [bsH, bsM] = breakStart.split(":").map(Number);
    const [beH, beM] = breakEnd.split(":").map(Number);
    breakStartMin = bsH * 60 + bsM;
    breakEndMin = beH * 60 + beM;
  }

  for (let m = openMinutes; m + durationMinutes <= closeMinutes; m += 15) {
    const slotStart = m;
    const slotEnd = m + durationMinutes;

    // Skip if slot overlaps with break
    if (breakStartMin >= 0 && slotStart < breakEndMin && slotEnd > breakStartMin) {
      continue;
    }

    // Check if slot overlaps with any existing appointment
    const slotStartTime = new Date(dateObj);
    slotStartTime.setHours(Math.floor(slotStart / 60), slotStart % 60, 0, 0);
    const slotEndTime = new Date(dateObj);
    slotEndTime.setHours(Math.floor(slotEnd / 60), slotEnd % 60, 0, 0);

    const hasConflict = existingAppointments.some((apt) => {
      const aptStart = new Date(apt.startTime);
      const aptEnd = new Date(apt.endTime);
      return slotStartTime < aptEnd && slotEndTime > aptStart;
    });

    if (!hasConflict) {
      const h = Math.floor(slotStart / 60);
      const mi = slotStart % 60;
      slots.push(`${String(h).padStart(2, "0")}:${String(mi).padStart(2, "0")}`);
    }
  }

  // Filter out past slots if date is today
  const now = new Date();
  if (dateObj.toDateString() === now.toDateString()) {
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    return slots.filter((slot) => {
      const [h, m] = slot.split(":").map(Number);
      return h * 60 + m > currentMinutes;
    });
  }

  return slots;
}

export async function createPublicBooking(
  slug: string,
  data: {
    customerName: string;
    customerPhone: string;
    memberId: string;
    date: string;
    time: string;
    serviceIds: string[];
    notes?: string;
  }
) {
  if (!data.customerName || data.customerName.length < 2) {
    return { error: "Ad soyad en az 2 karakter olmali" };
  }
  if (!data.customerPhone) {
    return { error: "Telefon numarasi gerekli" };
  }
  if (!data.memberId) return { error: "Personel secilmeli" };
  if (!data.serviceIds || data.serviceIds.length === 0) {
    return { error: "En az bir hizmet secilmeli" };
  }

  const business = await prisma.business.findUnique({
    where: { slug, isActive: true },
  });
  if (!business) return { error: "Isletme bulunamadi" };

  // Get services
  const services = await prisma.service.findMany({
    where: { id: { in: data.serviceIds }, businessId: business.id, isActive: true },
  });
  if (services.length === 0) return { error: "Gecersiz hizmet" };

  const totalDuration = services.reduce((sum, s) => sum + s.duration, 0);
  const startTime = new Date(`${data.date}T${data.time}:00`);
  const endTime = new Date(startTime.getTime() + totalDuration * 60000);

  // Check past time
  if (startTime < new Date()) {
    return { error: "Gecmis bir zaman secilemez" };
  }

  // Check conflict
  const conflict = await prisma.appointment.findFirst({
    where: {
      businessId: business.id,
      memberId: data.memberId,
      status: { not: "CANCELLED" },
      startTime: { lt: endTime },
      endTime: { gt: startTime },
    },
  });
  if (conflict) {
    return { error: "Bu saat araliginda baska bir randevu mevcut. Lutfen baska bir saat seciniz." };
  }

  // Find or create customer
  let customer = await prisma.customer.findFirst({
    where: {
      businessId: business.id,
      phone: data.customerPhone,
      isActive: true,
    },
  });

  if (!customer) {
    customer = await prisma.customer.create({
      data: {
        businessId: business.id,
        name: data.customerName,
        phone: data.customerPhone,
      },
    });
  }

  // Create appointment
  await prisma.appointment.create({
    data: {
      businessId: business.id,
      customerId: customer.id,
      memberId: data.memberId,
      startTime,
      endTime,
      notes: data.notes || null,
      status: "PENDING",
      services: {
        create: services.map((s) => ({
          serviceId: s.id,
          price: s.price,
          duration: s.duration,
        })),
      },
    },
  });

  return { success: true };
}
