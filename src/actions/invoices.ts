"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentMembership } from "@/lib/get-business";
import { revalidatePath } from "next/cache";

export async function getInvoices(businessId: string, month?: string) {
  const membership = await getCurrentMembership(businessId);
  if (!membership) return [];

  const where: any = { businessId };
  if (month) {
    const start = new Date(month + "-01");
    const end = new Date(start);
    end.setMonth(end.getMonth() + 1);
    where.createdAt = { gte: start, lt: end };
  }

  return prisma.invoice.findMany({
    where,
    include: {
      customer: { select: { id: true, name: true, phone: true } },
      appointment: {
        select: {
          id: true,
          startTime: true,
          member: { select: { user: { select: { name: true } } } },
        },
      },
      payments: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function createInvoiceFromAppointment(
  businessId: string,
  appointmentId: string,
  discount: number = 0
) {
  const membership = await getCurrentMembership(businessId);
  if (!membership) return { error: "Yetkisiz islem" };

  // Check if invoice already exists
  const existing = await prisma.invoice.findUnique({
    where: { appointmentId },
  });
  if (existing) return { error: "Bu randevu icin fatura zaten mevcut" };

  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId, businessId },
    include: {
      services: true,
      products: true,
    },
  });
  if (!appointment) return { error: "Randevu bulunamadi" };

  const serviceTotal = appointment.services.reduce((sum, s) => sum + s.price, 0);
  const productTotal = appointment.products.reduce((sum, p) => sum + p.price * p.quantity, 0);
  const subtotal = serviceTotal + productTotal;
  const total = Math.max(0, subtotal - discount);

  // Generate invoice number
  const count = await prisma.invoice.count({ where: { businessId } });
  const invoiceNo = `F-${String(count + 1).padStart(5, "0")}`;

  const invoice = await prisma.invoice.create({
    data: {
      businessId,
      customerId: appointment.customerId,
      appointmentId,
      invoiceNo,
      subtotal,
      discount,
      total,
      status: "PENDING",
    },
  });

  revalidatePath("/invoices");
  return { success: true, invoiceId: invoice.id };
}

export async function createManualInvoice(
  businessId: string,
  data: {
    customerId?: string;
    subtotal: number;
    discount: number;
    notes?: string;
  }
) {
  const membership = await getCurrentMembership(businessId);
  if (!membership) return { error: "Yetkisiz islem" };

  const total = Math.max(0, data.subtotal - data.discount);
  const count = await prisma.invoice.count({ where: { businessId } });
  const invoiceNo = `F-${String(count + 1).padStart(5, "0")}`;

  await prisma.invoice.create({
    data: {
      businessId,
      customerId: data.customerId || null,
      invoiceNo,
      subtotal: data.subtotal,
      discount: data.discount,
      total,
      notes: data.notes || null,
      status: "PENDING",
    },
  });

  revalidatePath("/invoices");
  return { success: true };
}

export async function addPayment(
  businessId: string,
  invoiceId: string,
  data: { amount: number; method: string; note?: string }
) {
  const membership = await getCurrentMembership(businessId);
  if (!membership) return { error: "Yetkisiz islem" };

  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId, businessId },
    include: { payments: true },
  });
  if (!invoice) return { error: "Fatura bulunamadi" };

  const totalPaid = invoice.payments.reduce((sum, p) => sum + p.amount, 0) + data.amount;

  await prisma.$transaction([
    prisma.payment.create({
      data: {
        invoiceId,
        amount: data.amount,
        method: data.method as any,
        note: data.note || null,
      },
    }),
    prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        status: totalPaid >= invoice.total ? "PAID" : "PARTIAL",
      },
    }),
  ]);

  revalidatePath("/invoices");
  return { success: true };
}
