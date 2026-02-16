"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentMembership } from "@/lib/get-business";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";

export async function getStaffMembers(businessId: string) {
  const membership = await getCurrentMembership(businessId);
  if (!membership) return [];

  return prisma.businessMember.findMany({
    where: { businessId, isActive: true },
    include: {
      user: { select: { id: true, name: true, email: true, phone: true, image: true } },
      workingHours: { orderBy: { dayOfWeek: "asc" } },
      staffServices: { include: { service: true } },
    },
    orderBy: { createdAt: "asc" },
  });
}

export async function addStaffMember(
  businessId: string,
  data: {
    name: string;
    email: string;
    phone?: string;
    password: string;
    role: "OWNER" | "MANAGER" | "STAFF";
    title?: string;
    color?: string;
  }
) {
  const membership = await getCurrentMembership(businessId);
  if (!membership) return { error: "Yetkisiz islem" };
  if (membership.role !== "OWNER" && membership.role !== "MANAGER") {
    return { error: "Bu islemi yapmaya yetkiniz yok" };
  }

  if (!data.name || data.name.length < 2) return { error: "Isim en az 2 karakter olmali" };
  if (!data.email) return { error: "E-posta gerekli" };
  if (!data.password || data.password.length < 6) return { error: "Sifre en az 6 karakter olmali" };

  try {
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // Check if user already exists
    let user = await prisma.user.findUnique({ where: { email: data.email } });

    if (user) {
      // Check if already a member of this business
      const existingMember = await prisma.businessMember.findUnique({
        where: { businessId_userId: { businessId, userId: user.id } },
      });
      if (existingMember) {
        return { error: "Bu kullanici zaten isletmeye kayitli" };
      }
    } else {
      user = await prisma.user.create({
        data: {
          name: data.name,
          email: data.email,
          phone: data.phone || null,
          password: hashedPassword,
        },
      });
    }

    await prisma.businessMember.create({
      data: {
        businessId,
        userId: user.id,
        role: data.role,
        title: data.title || null,
        color: data.color || null,
      },
    });

    revalidatePath("/staff");
    return { success: true };
  } catch (e: any) {
    if (e.code === "P2002") {
      return { error: "Bu e-posta adresi zaten kayitli" };
    }
    return { error: "Bir hata olustu" };
  }
}

export async function updateStaffMember(
  businessId: string,
  memberId: string,
  data: {
    role?: "OWNER" | "MANAGER" | "STAFF";
    title?: string;
    color?: string;
  }
) {
  const membership = await getCurrentMembership(businessId);
  if (!membership) return { error: "Yetkisiz islem" };
  if (membership.role !== "OWNER" && membership.role !== "MANAGER") {
    return { error: "Bu islemi yapmaya yetkiniz yok" };
  }

  await prisma.businessMember.update({
    where: { id: memberId, businessId },
    data: {
      role: data.role,
      title: data.title ?? undefined,
      color: data.color ?? undefined,
    },
  });

  revalidatePath("/staff");
  return { success: true };
}

export async function removeStaffMember(businessId: string, memberId: string) {
  const membership = await getCurrentMembership(businessId);
  if (!membership) return { error: "Yetkisiz islem" };
  if (membership.role !== "OWNER") {
    return { error: "Sadece isletme sahibi personel cikarabilir" };
  }

  // Cannot remove yourself
  const target = await prisma.businessMember.findUnique({ where: { id: memberId } });
  if (target?.userId === membership.userId) {
    return { error: "Kendinizi cikaramazsiniz" };
  }

  await prisma.businessMember.update({
    where: { id: memberId, businessId },
    data: { isActive: false },
  });

  revalidatePath("/staff");
  return { success: true };
}

export async function updateStaffWorkingHours(
  businessId: string,
  memberId: string,
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
  if (!membership) return { error: "Yetkisiz islem" };

  // Verify member belongs to business
  const member = await prisma.businessMember.findUnique({
    where: { id: memberId, businessId },
  });
  if (!member) return { error: "Personel bulunamadi" };

  // Upsert each day
  for (const h of hours) {
    await prisma.staffWorkingHour.upsert({
      where: { memberId_dayOfWeek: { memberId, dayOfWeek: h.dayOfWeek } },
      create: {
        memberId,
        dayOfWeek: h.dayOfWeek,
        isOpen: h.isOpen,
        openTime: h.openTime,
        closeTime: h.closeTime,
        breakStart: h.breakStart || null,
        breakEnd: h.breakEnd || null,
      },
      update: {
        isOpen: h.isOpen,
        openTime: h.openTime,
        closeTime: h.closeTime,
        breakStart: h.breakStart || null,
        breakEnd: h.breakEnd || null,
      },
    });
  }

  revalidatePath("/staff");
  return { success: true };
}

export async function getStaffWorkingHours(businessId: string, memberId: string) {
  const membership = await getCurrentMembership(businessId);
  if (!membership) return [];

  return prisma.staffWorkingHour.findMany({
    where: { memberId, member: { businessId } },
    orderBy: { dayOfWeek: "asc" },
  });
}
