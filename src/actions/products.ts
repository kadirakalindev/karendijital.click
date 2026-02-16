"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentMembership } from "@/lib/get-business";
import { revalidatePath } from "next/cache";

export async function getProducts(businessId: string) {
  const membership = await getCurrentMembership(businessId);
  if (!membership) return [];

  return prisma.product.findMany({
    where: { businessId, isActive: true },
    orderBy: { name: "asc" },
  });
}

export async function createProduct(
  businessId: string,
  data: { name: string; description?: string; price: number; stock: number }
) {
  const membership = await getCurrentMembership(businessId);
  if (!membership) return { error: "Yetkisiz islem" };

  if (!data.name || data.name.length < 2) return { error: "Urun adi en az 2 karakter olmali" };
  if (data.price < 0) return { error: "Fiyat 0'dan kucuk olamaz" };

  await prisma.product.create({
    data: {
      businessId,
      name: data.name,
      description: data.description || null,
      price: data.price,
      stock: data.stock || 0,
    },
  });

  revalidatePath("/products");
  return { success: true };
}

export async function updateProduct(
  businessId: string,
  productId: string,
  data: { name: string; description?: string; price: number; stock: number }
) {
  const membership = await getCurrentMembership(businessId);
  if (!membership) return { error: "Yetkisiz islem" };

  if (!data.name || data.name.length < 2) return { error: "Urun adi en az 2 karakter olmali" };

  await prisma.product.update({
    where: { id: productId, businessId },
    data: {
      name: data.name,
      description: data.description || null,
      price: data.price,
      stock: data.stock,
    },
  });

  revalidatePath("/products");
  return { success: true };
}

export async function deleteProduct(businessId: string, productId: string) {
  const membership = await getCurrentMembership(businessId);
  if (!membership) return { error: "Yetkisiz islem" };

  await prisma.product.update({
    where: { id: productId, businessId },
    data: { isActive: false },
  });

  revalidatePath("/products");
  return { success: true };
}
