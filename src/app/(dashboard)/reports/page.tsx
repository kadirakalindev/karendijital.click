"use client";

import { useState, useEffect, useCallback } from "react";
import { useBusiness } from "@/providers/business-provider";
import { getMonthlyReport } from "@/actions/reports";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  BarChart3, TrendingUp, TrendingDown, CalendarCheck, Users, Scissors, DollarSign,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";

interface ReportData {
  dailyData: { date: string; revenue: number; expense: number }[];
  totalRevenue: number;
  totalExpense: number;
  netProfit: number;
  totalAppointments: number;
  completedAppointments: number;
  cancelledAppointments: number;
  staffPerformance: { name: string; appointments: number }[];
  topServices: { name: string; count: number; revenue: number }[];
  expenseBreakdown: { name: string; amount: number }[];
  newCustomers: number;
}

const PIE_COLORS = ["#3b82f6", "#ef4444", "#22c55e", "#f59e0b", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316"];

export default function ReportsPage() {
  const { currentBusiness } = useBusiness();
  const [report, setReport] = useState<ReportData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });

  const load = useCallback(async () => {
    if (!currentBusiness) return;
    setIsLoading(true);
    const [y, m] = selectedMonth.split("-").map(Number);
    const data = await getMonthlyReport(currentBusiness.businessId, y, m);
    setReport(data);
    setIsLoading(false);
  }, [currentBusiness, selectedMonth]);

  useEffect(() => { load(); }, [load]);

  const monthLabel = (() => {
    const [y, m] = selectedMonth.split("-").map(Number);
    const months = ["Ocak", "Subat", "Mart", "Nisan", "Mayis", "Haziran", "Temmuz", "Agustos", "Eylul", "Ekim", "Kasim", "Aralik"];
    return `${months[m - 1]} ${y}`;
  })();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Raporlar</h1>
          <p className="text-muted-foreground">{monthLabel} raporu</p>
        </div>
        <Input
          type="month"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="w-44"
        />
      </div>

      {isLoading && (
        <div className="flex h-32 items-center justify-center">
          <p className="text-muted-foreground">Yukleniyor...</p>
        </div>
      )}

      {!isLoading && report && (
        <>
          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Toplam Gelir</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {report.totalRevenue.toLocaleString("tr-TR")} TL
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Toplam Gider</CardTitle>
                <TrendingDown className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-500">
                  {report.totalExpense.toLocaleString("tr-TR")} TL
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Net Kar</CardTitle>
                <DollarSign className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${report.netProfit >= 0 ? "text-blue-600" : "text-red-500"}`}>
                  {report.netProfit.toLocaleString("tr-TR")} TL
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Yeni Musteri</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{report.newCustomers}</div>
              </CardContent>
            </Card>
          </div>

          {/* Revenue/Expense Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Gunluk Gelir / Gider
              </CardTitle>
            </CardHeader>
            <CardContent>
              {report.dailyData.some((d) => d.revenue > 0 || d.expense > 0) ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={report.dailyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" fontSize={12} />
                    <YAxis fontSize={12} />
                    <Tooltip
                      formatter={(value) => `${Number(value).toLocaleString("tr-TR")} TL`}
                      labelFormatter={(label) => `Gun ${label}`}
                    />
                    <Bar dataKey="revenue" name="Gelir" fill="#22c55e" radius={[2, 2, 0, 0]} />
                    <Bar dataKey="expense" name="Gider" fill="#ef4444" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-48 items-center justify-center text-muted-foreground">
                  Bu ay icin veri bulunmuyor
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            {/* Appointment Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarCheck className="h-5 w-5" />
                  Randevu Istatistikleri
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Toplam Randevu</span>
                    <span className="text-lg font-bold">{report.totalAppointments}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Tamamlanan</span>
                    <Badge variant="default">{report.completedAppointments}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Iptal Edilen</span>
                    <Badge variant="destructive">{report.cancelledAppointments}</Badge>
                  </div>
                  {report.totalAppointments > 0 && (
                    <div className="flex items-center justify-between border-t pt-3">
                      <span className="text-sm text-muted-foreground">Tamamlanma Orani</span>
                      <span className="font-medium">
                        %{((report.completedAppointments / report.totalAppointments) * 100).toFixed(0)}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Expense Breakdown Pie Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Gider Dagilimi</CardTitle>
              </CardHeader>
              <CardContent>
                {report.expenseBreakdown.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie
                        data={report.expenseBreakdown}
                        dataKey="amount"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label={({ name, percent }) => `${name} %${((percent ?? 0) * 100).toFixed(0)}`}
                        fontSize={12}
                      >
                        {report.expenseBreakdown.map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => `${Number(value).toLocaleString("tr-TR")} TL`} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-48 items-center justify-center text-muted-foreground">
                    Bu ay gider kaydi yok
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {/* Staff Performance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Personel Performansi
                </CardTitle>
              </CardHeader>
              <CardContent>
                {report.staffPerformance.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Personel</TableHead>
                        <TableHead className="text-right">Tamamlanan Randevu</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {report.staffPerformance
                        .sort((a, b) => b.appointments - a.appointments)
                        .map((s) => (
                          <TableRow key={s.name}>
                            <TableCell className="font-medium">{s.name}</TableCell>
                            <TableCell className="text-right">
                              <Badge variant="secondary">{s.appointments}</Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="flex h-32 items-center justify-center text-muted-foreground">
                    Aktif personel yok
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Top Services */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Scissors className="h-5 w-5" />
                  En Populer Hizmetler
                </CardTitle>
              </CardHeader>
              <CardContent>
                {report.topServices.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Hizmet</TableHead>
                        <TableHead className="text-right">Adet</TableHead>
                        <TableHead className="text-right">Ciro</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {report.topServices.map((s) => (
                        <TableRow key={s.name}>
                          <TableCell className="font-medium">{s.name}</TableCell>
                          <TableCell className="text-right">{s.count}</TableCell>
                          <TableCell className="text-right text-green-600">
                            {s.revenue.toLocaleString("tr-TR")} TL
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="flex h-32 items-center justify-center text-muted-foreground">
                    Bu ay tamamlanan hizmet yok
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {!isLoading && !report && (
        <div className="flex h-48 items-center justify-center">
          <p className="text-muted-foreground">Rapor verisi yuklenemedi</p>
        </div>
      )}
    </div>
  );
}
