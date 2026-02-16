"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentMembership } from "@/lib/get-business";
import { revalidatePath } from "next/cache";

export async function getAppointments(
  businessId: string,
  start: string,
  end: string,
  memberId?: string
) {
  const membership = await getCurrentMembership(businessId);
  if (!membership) return [];

  const where: any = {
    businessId,
    startTime: { gte: new Date(start) },
    endTime: { lte: new Date(end) },
    status: { not: "CANCELLED" },
  };
  if (memberId) where.memberId = memberId;

  return prisma.appointment.findMany({
    where,
    include: {
      customer: { select: { id: true, name: true, phone: true } },
      member: {
        include: { user: { select: { name: true } } },
      },
      services: {
        include: { service: { select: { id: true, name: true } } },
      },
      products: {
        include: { product: { select: { id: true, name: true } } },
      },
    },
    orderBy: { startTime: "asc" },
  });
}

export async function getAppointmentById(businessId: string, appointmentId: string) {
  const membership = await getCurrentMembership(businessId);
  if (!membership) return null;

  return prisma.appointment.findUnique({
    where: { id: appointmentId, businessId },
    include: {
      customer: { select: { id: true, name: true, phone: true } },
      member: {
        include: { user: { select: { name: true } } },
      },
      services: {
        include: { service: { select: { id: true, name: true, price: true, duration: true } } },
      },
      products: {
        include: { product: { select: { id: true, name: true, price: true } } },
      },
    },
  });
}

export async function createAppointment(
  businessId: string,
  data: {
    customerId?: string;
    customerName?: string;
    customerPhone?: string;
    memberId: string;
    startTime: string;
    services: { serviceId: string; price: number; duration: number }[];
    notes?: string;
  }
) {
  const membership = await getCurrentMembership(businessId);
  if (!membership) return { error: "Yetkisiz islem" };

  if (!data.memberId) return { error: "Personel secilmeli" };
  if (!data.services || data.services.length === 0) return { error: "En az bir hizmet secilmeli" };

  // Calculate total duration and end time
  const totalDuration = data.services.reduce((sum, s) => sum + s.duration, 0);
  const startTime = new Date(data.startTime);
  const endTime = new Date(startTime.getTime() + totalDuration * 60000);

  // Check for time conflicts
  const conflict = await prisma.appointment.findFirst({
    where: {
      businessId,
      memberId: data.memberId,
      status: { not: "CANCELLED" },
      OR: [
        { startTime: { lt: endTime }, endTime: { gt: startTime } },
      ],
    },
  });

  if (conflict) {
    return { error: "Bu saat araliginda baska bir randevu mevcut" };
  }

  await prisma.appointment.create({
    data: {
      businessId,
      customerId: data.customerId || null,
      customerName: data.customerName || null,
      customerPhone: data.customerPhone || null,
      memberId: data.memberId,
      startTime,
      endTime,
      notes: data.notes || null,
      services: {
        create: data.services.map((s) => ({
          serviceId: s.serviceId,
          price: s.price,
          duration: s.duration,
        })),
      },
    },
  });

  revalidatePath("/appointments");
  return { success: true };
}

export async function updateAppointment(
  businessId: string,
  appointmentId: string,
  data: {
    customerId?: string;
    customerName?: string;
    customerPhone?: string;
    memberId: string;
    startTime: string;
    services: { serviceId: string; price: number; duration: number }[];
    notes?: string;
    status?: string;
  }
) {
  const membership = await getCurrentMembership(businessId);
  if (!membership) return { error: "Yetkisiz islem" };

  const totalDuration = data.services.reduce((sum, s) => sum + s.duration, 0);
  const startTime = new Date(data.startTime);
  const endTime = new Date(startTime.getTime() + totalDuration * 60000);

  // Check for time conflicts (excluding current appointment)
  const conflict = await prisma.appointment.findFirst({
    where: {
      businessId,
      memberId: data.memberId,
      id: { not: appointmentId },
      status: { not: "CANCELLED" },
      OR: [
        { startTime: { lt: endTime }, endTime: { gt: startTime } },
      ],
    },
  });

  if (conflict) {
    return { error: "Bu saat araliginda baska bir randevu mevcut" };
  }

  await prisma.$transaction([
    prisma.appointmentService.deleteMany({ where: { appointmentId } }),
    prisma.appointment.update({
      where: { id: appointmentId, businessId },
      data: {
        customerId: data.customerId || null,
        customerName: data.customerName || null,
        customerPhone: data.customerPhone || null,
        memberId: data.memberId,
        startTime,
        endTime,
        notes: data.notes || null,
        status: (data.status as any) || undefined,
        services: {
          create: data.services.map((s) => ({
            serviceId: s.serviceId,
            price: s.price,
            duration: s.duration,
          })),
        },
      },
    }),
  ]);

  revalidatePath("/appointments");
  return { success: true };
}

export async function updateAppointmentStatus(
  businessId: string,
  appointmentId: string,
  status: string
) {
  const membership = await getCurrentMembership(businessId);
  if (!membership) return { error: "Yetkisiz islem" };

  await prisma.appointment.update({
    where: { id: appointmentId, businessId },
    data: { status: status as any },
  });

  revalidatePath("/appointments");
  return { success: true };
}

export async function updateAppointmentTime(
  businessId: string,
  appointmentId: string,
  startTime: string,
  endTime: string,
  memberId?: string
) {
  const membership = await getCurrentMembership(businessId);
  if (!membership) return { error: "Yetkisiz islem" };

  const apt = await prisma.appointment.findUnique({
    where: { id: appointmentId, businessId },
  });
  if (!apt) return { error: "Randevu bulunamadi" };

  const targetMemberId = memberId || apt.memberId;
  const start = new Date(startTime);
  const end = new Date(endTime);

  // Check for conflicts
  const conflict = await prisma.appointment.findFirst({
    where: {
      businessId,
      memberId: targetMemberId,
      id: { not: appointmentId },
      status: { not: "CANCELLED" },
      OR: [
        { startTime: { lt: end }, endTime: { gt: start } },
      ],
    },
  });

  if (conflict) {
    return { error: "Bu saat araliginda baska bir randevu mevcut" };
  }

  await prisma.appointment.update({
    where: { id: appointmentId, businessId },
    data: {
      startTime: start,
      endTime: end,
      memberId: targetMemberId,
    },
  });

  revalidatePath("/appointments");
  return { success: true };
}

export async function cancelAppointment(businessId: string, appointmentId: string) {
  const membership = await getCurrentMembership(businessId);
  if (!membership) return { error: "Yetkisiz islem" };

  await prisma.appointment.update({
    where: { id: appointmentId, businessId },
    data: { status: "CANCELLED" },
  });

  revalidatePath("/appointments");
  return { success: true };
}

export async function completeAppointment(businessId: string, appointmentId: string) {
  const membership = await getCurrentMembership(businessId);
  if (!membership) return { error: "Yetkisiz islem" };

  await prisma.appointment.update({
    where: { id: appointmentId, businessId },
    data: { status: "COMPLETED" },
  });

  revalidatePath("/appointments");
  return { success: true };
}
