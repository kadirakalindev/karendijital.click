"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentMembership } from "@/lib/get-business";
import { revalidatePath } from "next/cache";

export async function getBusinessProfile(businessId: string) {
  const membership = await getCurrentMembership(businessId);
  if (!membership) return null;

  return prisma.business.findUnique({
    where: { id: businessId },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      phone: true,
      email: true,
      address: true,
      city: true,
      district: true,
      website: true,
      instagram: true,
    },
  });
}

export async function updateBusinessProfile(
  businessId: string,
  data: {
    name: string;
    description?: string;
    phone?: string;
    email?: string;
    address?: string;
    city?: string;
    district?: string;
    website?: string;
    instagram?: string;
  }
) {
  const membership = await getCurrentMembership(businessId);
  if (!membership || !["OWNER", "MANAGER"].includes(membership.role)) {
    return { error: "Yetkisiz islem" };
  }

  await prisma.business.update({
    where: { id: businessId },
    data: {
      name: data.name,
      description: data.description || null,
      phone: data.phone || null,
      email: data.email || null,
      address: data.address || null,
      city: data.city || null,
      district: data.district || null,
      website: data.website || null,
      instagram: data.instagram || null,
    },
  });

  revalidatePath("/settings");
  return { success: true };
}

// Working Hours
export async function getBusinessWorkingHours(businessId: string) {
  const membership = await getCurrentMembership(businessId);
  if (!membership) return [];

  return prisma.businessWorkingHour.findMany({
    where: { businessId },
    orderBy: { dayOfWeek: "asc" },
  });
}

export async function updateBusinessWorkingHours(
  businessId: string,
  hours: {
    dayOfWeek: number;
    isOpen: boolean;
    openTime: string;
    closeTime: string;
    breakStart?: string;
    breakEnd?: string;
  }[]
) {
  const membership = await getCurrentMembership(businessId);
  if (!membership || !["OWNER", "MANAGER"].includes(membership.role)) {
    return { error: "Yetkisiz islem" };
  }

  const upserts = hours.map((h) =>
    prisma.businessWorkingHour.upsert({
      where: { businessId_dayOfWeek: { businessId, dayOfWeek: h.dayOfWeek } },
      update: {
        isOpen: h.isOpen,
        openTime: h.openTime,
        closeTime: h.closeTime,
        breakStart: h.breakStart || null,
        breakEnd: h.breakEnd || null,
      },
      create: {
        businessId,
        dayOfWeek: h.dayOfWeek,
        isOpen: h.isOpen,
        openTime: h.openTime,
        closeTime: h.closeTime,
        breakStart: h.breakStart || null,
        breakEnd: h.breakEnd || null,
      },
    })
  );

  await prisma.$transaction(upserts);
  revalidatePath("/settings");
  return { success: true };
}

// Holidays
export async function getBusinessHolidays(businessId: string) {
  const membership = await getCurrentMembership(businessId);
  if (!membership) return [];

  return prisma.businessHoliday.findMany({
    where: { businessId },
    orderBy: { date: "asc" },
  });
}

export async function createHoliday(
  businessId: string,
  data: { name: string; date: string; isRecurring: boolean }
) {
  const membership = await getCurrentMembership(businessId);
  if (!membership || !["OWNER", "MANAGER"].includes(membership.role)) {
    return { error: "Yetkisiz islem" };
  }

  await prisma.businessHoliday.create({
    data: {
      businessId,
      name: data.name,
      date: new Date(data.date),
      isRecurring: data.isRecurring,
    },
  });

  revalidatePath("/settings");
  return { success: true };
}

export async function deleteHoliday(businessId: string, holidayId: string) {
  const membership = await getCurrentMembership(businessId);
  if (!membership || !["OWNER", "MANAGER"].includes(membership.role)) {
    return { error: "Yetkisiz islem" };
  }

  await prisma.businessHoliday.delete({
    where: { id: holidayId },
  });

  revalidatePath("/settings");
  return { success: true };
}

// Notification Settings
export async function getNotificationSettings(businessId: string) {
  const membership = await getCurrentMembership(businessId);
  if (!membership) return [];

  return prisma.notificationSetting.findMany({
    where: { businessId },
  });
}

export async function updateNotificationSetting(
  businessId: string,
  data: { type: string; isEnabled: boolean; template?: string; sendBefore?: number }
) {
  const membership = await getCurrentMembership(businessId);
  if (!membership || !["OWNER", "MANAGER"].includes(membership.role)) {
    return { error: "Yetkisiz islem" };
  }

  await prisma.notificationSetting.upsert({
    where: { businessId_type: { businessId, type: data.type as any } },
    update: {
      isEnabled: data.isEnabled,
      template: data.template || null,
      sendBefore: data.sendBefore || null,
    },
    create: {
      businessId,
      type: data.type as any,
      isEnabled: data.isEnabled,
      template: data.template || null,
      sendBefore: data.sendBefore || null,
    },
  });

  revalidatePath("/settings");
  return { success: true };
}
