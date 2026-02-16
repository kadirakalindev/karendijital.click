"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentMembership } from "@/lib/get-business";
import { revalidatePath } from "next/cache";

export async function getPackages(businessId: string) {
  const membership = await getCurrentMembership(businessId);
  if (!membership) return [];

  return prisma.package.findMany({
    where: { businessId, isActive: true },
    include: {
      packageServices: {
        include: { service: { select: { id: true, name: true, price: true, duration: true } } },
      },
    },
    orderBy: { name: "asc" },
  });
}

export async function createPackage(
  businessId: string,
  data: {
    name: string;
    description?: string;
    price: number;
    services: { serviceId: string; quantity: number }[];
  }
) {
  const membership = await getCurrentMembership(businessId);
  if (!membership) return { error: "Yetkisiz islem" };

  if (!data.name || data.name.length < 2) return { error: "Paket adi en az 2 karakter olmali" };
  if (data.price < 0) return { error: "Fiyat 0'dan kucuk olamaz" };
  if (!data.services || data.services.length === 0) return { error: "En az bir hizmet secilmeli" };

  await prisma.package.create({
    data: {
      businessId,
      name: data.name,
      description: data.description || null,
      price: data.price,
      packageServices: {
        create: data.services.map((s) => ({
          serviceId: s.serviceId,
          quantity: s.quantity,
        })),
      },
    },
  });

  revalidatePath("/packages");
  return { success: true };
}

export async function updatePackage(
  businessId: string,
  packageId: string,
  data: {
    name: string;
    description?: string;
    price: number;
    services: { serviceId: string; quantity: number }[];
  }
) {
  const membership = await getCurrentMembership(businessId);
  if (!membership) return { error: "Yetkisiz islem" };

  if (!data.name || data.name.length < 2) return { error: "Paket adi en az 2 karakter olmali" };

  // Delete old package services and create new ones
  await prisma.$transaction([
    prisma.packageService.deleteMany({ where: { packageId } }),
    prisma.package.update({
      where: { id: packageId, businessId },
      data: {
        name: data.name,
        description: data.description || null,
        price: data.price,
        packageServices: {
          create: data.services.map((s) => ({
            serviceId: s.serviceId,
            quantity: s.quantity,
          })),
        },
      },
    }),
  ]);

  revalidatePath("/packages");
  return { success: true };
}

export async function deletePackage(businessId: string, packageId: string) {
  const membership = await getCurrentMembership(businessId);
  if (!membership) return { error: "Yetkisiz islem" };

  await prisma.package.update({
    where: { id: packageId, businessId },
    data: { isActive: false },
  });

  revalidatePath("/packages");
  return { success: true };
}
