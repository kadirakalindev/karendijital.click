"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentMembership } from "@/lib/get-business";

export async function getMonthlyReport(businessId: string, year: number, month: number) {
  const membership = await getCurrentMembership(businessId);
  if (!membership) return null;

  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 1);

  // Daily revenue data for chart
  const dailyData: { date: string; revenue: number; expense: number }[] = [];
  const daysInMonth = new Date(year, month, 0).getDate();

  for (let d = 1; d <= daysInMonth; d++) {
    dailyData.push({
      date: `${d}`,
      revenue: 0,
      expense: 0,
    });
  }

  // Get invoices for revenue
  const invoices = await prisma.invoice.findMany({
    where: {
      businessId,
      createdAt: { gte: start, lt: end },
      status: { in: ["PAID", "PARTIAL"] },
    },
    include: { payments: true },
  });

  for (const inv of invoices) {
    for (const p of inv.payments) {
      const day = new Date(p.paidAt).getDate();
      if (day >= 1 && day <= daysInMonth) {
        dailyData[day - 1].revenue += p.amount;
      }
    }
  }

  // Get expenses
  const expenses = await prisma.expense.findMany({
    where: { businessId, date: { gte: start, lt: end } },
    include: { category: true },
  });

  for (const exp of expenses) {
    const day = new Date(exp.date).getDate();
    if (day >= 1 && day <= daysInMonth) {
      dailyData[day - 1].expense += exp.amount;
    }
  }

  // Totals
  const totalRevenue = dailyData.reduce((s, d) => s + d.revenue, 0);
  const totalExpense = dailyData.reduce((s, d) => s + d.expense, 0);

  // Appointment stats
  const [totalAppointments, completedAppointments, cancelledAppointments] =
    await Promise.all([
      prisma.appointment.count({
        where: { businessId, startTime: { gte: start, lt: end } },
      }),
      prisma.appointment.count({
        where: { businessId, startTime: { gte: start, lt: end }, status: "COMPLETED" },
      }),
      prisma.appointment.count({
        where: { businessId, startTime: { gte: start, lt: end }, status: "CANCELLED" },
      }),
    ]);

  // Staff performance
  const staffStats = await prisma.appointment.groupBy({
    by: ["memberId"],
    where: { businessId, startTime: { gte: start, lt: end }, status: "COMPLETED" },
    _count: true,
  });

  const staffMembers = await prisma.businessMember.findMany({
    where: { businessId, isActive: true },
    include: { user: { select: { name: true } } },
  });

  const staffPerformance = staffMembers.map((m) => {
    const stat = staffStats.find((s) => s.memberId === m.id);
    return {
      name: m.user.name,
      appointments: stat?._count || 0,
    };
  });

  // Top services
  const serviceStats = await prisma.appointmentService.groupBy({
    by: ["serviceId"],
    where: {
      appointment: { businessId, startTime: { gte: start, lt: end }, status: "COMPLETED" },
    },
    _count: true,
    _sum: { price: true },
  });

  const serviceIds = serviceStats.map((s) => s.serviceId);
  const serviceNames = await prisma.service.findMany({
    where: { id: { in: serviceIds } },
    select: { id: true, name: true },
  });

  const topServices = serviceStats
    .map((s) => ({
      name: serviceNames.find((sn) => sn.id === s.serviceId)?.name || "?",
      count: s._count,
      revenue: s._sum.price || 0,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Expense categories breakdown
  const expenseCategoryMap: Record<string, number> = {};
  for (const exp of expenses) {
    const catName = exp.category?.name || "Kategorisiz";
    expenseCategoryMap[catName] = (expenseCategoryMap[catName] || 0) + exp.amount;
  }
  const expenseBreakdown = Object.entries(expenseCategoryMap).map(([name, amount]) => ({
    name,
    amount,
  }));

  // New customers this month
  const newCustomers = await prisma.customer.count({
    where: { businessId, isActive: true, createdAt: { gte: start, lt: end } },
  });

  return {
    dailyData,
    totalRevenue,
    totalExpense,
    netProfit: totalRevenue - totalExpense,
    totalAppointments,
    completedAppointments,
    cancelledAppointments,
    staffPerformance,
    topServices,
    expenseBreakdown,
    newCustomers,
  };
}
