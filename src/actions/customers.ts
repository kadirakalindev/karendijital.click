"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentMembership } from "@/lib/get-business";
import { customerSchema } from "@/lib/validations";
import { revalidatePath } from "next/cache";

export async function getCustomers(businessId: string, search?: string) {
  const membership = await getCurrentMembership(businessId);
  if (!membership) return [];

  return prisma.customer.findMany({
    where: {
      businessId,
      isActive: true,
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { phone: { contains: search } },
              { email: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function createCustomer(
  businessId: string,
  data: {
    name: string;
    phone?: string;
    email?: string;
    gender?: "MALE" | "FEMALE" | "OTHER";
    birthDate?: string;
    notes?: string;
  }
) {
  const membership = await getCurrentMembership(businessId);
  if (!membership) return { error: "Yetkisiz islem" };

  const validated = customerSchema.safeParse(data);
  if (!validated.success) {
    return { error: validated.error.issues[0].message };
  }

  try {
    await prisma.customer.create({
      data: {
        businessId,
        name: validated.data.name,
        phone: validated.data.phone || null,
        email: validated.data.email || null,
        gender: validated.data.gender || null,
        birthDate: validated.data.birthDate
          ? new Date(validated.data.birthDate)
          : null,
        notes: validated.data.notes || null,
      },
    });
    revalidatePath("/customers");
    return { success: true };
  } catch (e: any) {
    if (e.code === "P2002") {
      return { error: "Bu telefon numarasi zaten kayitli" };
    }
    return { error: "Bir hata olustu" };
  }
}

export async function updateCustomer(
  businessId: string,
  customerId: string,
  data: {
    name: string;
    phone?: string;
    email?: string;
    gender?: "MALE" | "FEMALE" | "OTHER";
    birthDate?: string;
    notes?: string;
  }
) {
  const membership = await getCurrentMembership(businessId);
  if (!membership) return { error: "Yetkisiz islem" };

  const validated = customerSchema.safeParse(data);
  if (!validated.success) {
    return { error: validated.error.issues[0].message };
  }

  try {
    await prisma.customer.update({
      where: { id: customerId, businessId },
      data: {
        name: validated.data.name,
        phone: validated.data.phone || null,
        email: validated.data.email || null,
        gender: validated.data.gender || null,
        birthDate: validated.data.birthDate
          ? new Date(validated.data.birthDate)
          : null,
        notes: validated.data.notes || null,
      },
    });
    revalidatePath("/customers");
    return { success: true };
  } catch (e: any) {
    if (e.code === "P2002") {
      return { error: "Bu telefon numarasi zaten kayitli" };
    }
    return { error: "Bir hata olustu" };
  }
}

export async function deleteCustomer(businessId: string, customerId: string) {
  const membership = await getCurrentMembership(businessId);
  if (!membership) return { error: "Yetkisiz islem" };

  await prisma.customer.update({
    where: { id: customerId, businessId },
    data: { isActive: false },
  });

  revalidatePath("/customers");
  return { success: true };
}
