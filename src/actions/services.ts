"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentMembership } from "@/lib/get-business";
import { serviceSchema } from "@/lib/validations";
import { revalidatePath } from "next/cache";

export async function getServices(businessId: string) {
  const membership = await getCurrentMembership(businessId);
  if (!membership) return [];

  return prisma.service.findMany({
    where: { businessId, isActive: true },
    include: { category: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
}

export async function getServiceCategories(businessId: string) {
  const membership = await getCurrentMembership(businessId);
  if (!membership) return [];

  return prisma.serviceCategory.findMany({
    where: { businessId },
    orderBy: { sortOrder: "asc" },
  });
}

export async function createService(
  businessId: string,
  data: { name: string; categoryId?: string; description?: string; duration: number; price: number }
) {
  const membership = await getCurrentMembership(businessId);
  if (!membership) return { error: "Yetkisiz islem" };

  const validated = serviceSchema.safeParse(data);
  if (!validated.success) return { error: validated.error.issues[0].message };

  await prisma.service.create({
    data: {
      businessId,
      name: validated.data.name,
      categoryId: validated.data.categoryId || null,
      description: validated.data.description || null,
      duration: validated.data.duration,
      price: validated.data.price,
    },
  });

  revalidatePath("/services");
  return { success: true };
}

export async function updateService(
  businessId: string,
  serviceId: string,
  data: { name: string; categoryId?: string; description?: string; duration: number; price: number }
) {
  const membership = await getCurrentMembership(businessId);
  if (!membership) return { error: "Yetkisiz islem" };

  const validated = serviceSchema.safeParse(data);
  if (!validated.success) return { error: validated.error.issues[0].message };

  await prisma.service.update({
    where: { id: serviceId, businessId },
    data: {
      name: validated.data.name,
      categoryId: validated.data.categoryId || null,
      description: validated.data.description || null,
      duration: validated.data.duration,
      price: validated.data.price,
    },
  });

  revalidatePath("/services");
  return { success: true };
}

export async function deleteService(businessId: string, serviceId: string) {
  const membership = await getCurrentMembership(businessId);
  if (!membership) return { error: "Yetkisiz islem" };

  await prisma.service.update({
    where: { id: serviceId, businessId },
    data: { isActive: false },
  });

  revalidatePath("/services");
  return { success: true };
}

export async function createServiceCategory(businessId: string, name: string) {
  const membership = await getCurrentMembership(businessId);
  if (!membership) return { error: "Yetkisiz islem" };

  if (!name || name.length < 2) return { error: "Kategori adi en az 2 karakter olmali" };

  try {
    await prisma.serviceCategory.create({ data: { businessId, name } });
    revalidatePath("/services");
    return { success: true };
  } catch {
    return { error: "Bu kategori zaten mevcut" };
  }
}
