"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentMembership } from "@/lib/get-business";
import { revalidatePath } from "next/cache";

export async function getExpenses(businessId: string, month?: string) {
  const membership = await getCurrentMembership(businessId);
  if (!membership) return [];

  const where: any = { businessId };
  if (month) {
    const start = new Date(month + "-01");
    const end = new Date(start);
    end.setMonth(end.getMonth() + 1);
    where.date = { gte: start, lt: end };
  }

  return prisma.expense.findMany({
    where,
    include: { category: true },
    orderBy: { date: "desc" },
  });
}

export async function getExpenseCategories(businessId: string) {
  const membership = await getCurrentMembership(businessId);
  if (!membership) return [];

  return prisma.expenseCategory.findMany({
    where: { businessId },
    orderBy: { name: "asc" },
  });
}

export async function createExpense(
  businessId: string,
  data: { description: string; amount: number; categoryId?: string; date: string }
) {
  const membership = await getCurrentMembership(businessId);
  if (!membership) return { error: "Yetkisiz islem" };

  if (!data.description) return { error: "Aciklama gerekli" };
  if (data.amount <= 0) return { error: "Tutar 0'dan buyuk olmali" };

  await prisma.expense.create({
    data: {
      businessId,
      description: data.description,
      amount: data.amount,
      categoryId: data.categoryId || null,
      date: new Date(data.date),
    },
  });

  revalidatePath("/expenses");
  return { success: true };
}

export async function updateExpense(
  businessId: string,
  expenseId: string,
  data: { description: string; amount: number; categoryId?: string; date: string }
) {
  const membership = await getCurrentMembership(businessId);
  if (!membership) return { error: "Yetkisiz islem" };

  await prisma.expense.update({
    where: { id: expenseId, businessId },
    data: {
      description: data.description,
      amount: data.amount,
      categoryId: data.categoryId || null,
      date: new Date(data.date),
    },
  });

  revalidatePath("/expenses");
  return { success: true };
}

export async function deleteExpense(businessId: string, expenseId: string) {
  const membership = await getCurrentMembership(businessId);
  if (!membership) return { error: "Yetkisiz islem" };

  await prisma.expense.delete({
    where: { id: expenseId, businessId },
  });

  revalidatePath("/expenses");
  return { success: true };
}

export async function createExpenseCategory(businessId: string, name: string) {
  const membership = await getCurrentMembership(businessId);
  if (!membership) return { error: "Yetkisiz islem" };

  if (!name || name.length < 2) return { error: "Kategori adi en az 2 karakter olmali" };

  try {
    await prisma.expenseCategory.create({ data: { businessId, name } });
    revalidatePath("/expenses");
    return { success: true };
  } catch {
    return { error: "Bu kategori zaten mevcut" };
  }
}
