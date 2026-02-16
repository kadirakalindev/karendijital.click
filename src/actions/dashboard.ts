"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentMembership } from "@/lib/get-business";

export async function getDashboardStats(businessId: string) {
  const membership = await getCurrentMembership(businessId);
  if (!membership) return null;

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(todayStart);
  todayEnd.setDate(todayEnd.getDate() + 1);

  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const [
    todayAppointments,
    totalCustomers,
    totalServices,
    monthlyRevenue,
    upcomingAppointments,
    monthlyExpenses,
  ] = await Promise.all([
    prisma.appointment.count({
      where: { businessId, startTime: { gte: todayStart, lt: todayEnd }, status: { not: "CANCELLED" } },
    }),
    prisma.customer.count({ where: { businessId, isActive: true } }),
    prisma.service.count({ where: { businessId, isActive: true } }),
    prisma.invoice.aggregate({
      where: { businessId, createdAt: { gte: monthStart, lt: monthEnd }, status: { in: ["PAID", "PARTIAL"] } },
      _sum: { total: true },
    }),
    prisma.appointment.findMany({
      where: { businessId, startTime: { gte: now }, status: { not: "CANCELLED" } },
      include: {
        customer: { select: { name: true } },
        member: { include: { user: { select: { name: true } } } },
        services: { include: { service: { select: { name: true } } } },
      },
      orderBy: { startTime: "asc" },
      take: 5,
    }),
    prisma.expense.aggregate({
      where: { businessId, date: { gte: monthStart, lt: monthEnd } },
      _sum: { amount: true },
    }),
  ]);

  return {
    todayAppointments,
    totalCustomers,
    totalServices,
    monthlyRevenue: monthlyRevenue._sum.total || 0,
    monthlyExpenses: monthlyExpenses._sum.amount || 0,
    upcomingAppointments,
  };
}
