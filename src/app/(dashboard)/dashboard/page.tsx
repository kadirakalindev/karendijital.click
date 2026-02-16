"use client";

import { useState, useEffect, useCallback } from "react";
import { useBusiness } from "@/providers/business-provider";
import { getDashboardStats } from "@/actions/dashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Users, Scissors, TrendingUp, TrendingDown, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface DashboardData {
  todayAppointments: number;
  totalCustomers: number;
  totalServices: number;
  monthlyRevenue: number;
  monthlyExpenses: number;
  upcomingAppointments: {
    id: string;
    startTime: string;
    status: string;
    customer: { name: string } | null;
    member: { user: { name: string } };
    services: { service: { name: string } }[];
  }[];
}

export default function DashboardPage() {
  const { currentBusiness } = useBusiness();
  const [data, setData] = useState<DashboardData | null>(null);

  const load = useCallback(async () => {
    if (!currentBusiness) return;
    const stats = await getDashboardStats(currentBusiness.businessId);
    setData(stats as any);
  }, [currentBusiness]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Panel</h1>
        <p className="text-muted-foreground">
          Isletmenizin genel durumuna buradan goz atabilirsiniz.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bugunun Randevulari</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.todayAppointments ?? 0}</div>
            <p className="text-xs text-muted-foreground">randevu planlanmis</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Musteri</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.totalCustomers ?? 0}</div>
            <p className="text-xs text-muted-foreground">kayitli musteri</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aktif Hizmetler</CardTitle>
            <Scissors className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.totalServices ?? 0}</div>
            <p className="text-xs text-muted-foreground">hizmet tanimli</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bu Ayin Cirosu</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(data?.monthlyRevenue ?? 0).toFixed(0)} TL</div>
            <p className="text-xs text-muted-foreground">toplam ciro</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Yaklasan Randevular
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data?.upcomingAppointments && data.upcomingAppointments.length > 0 ? (
              <div className="space-y-3">
                {data.upcomingAppointments.map((apt) => (
                  <div key={apt.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                    <div>
                      <p className="text-sm font-medium">{apt.customer?.name || "Misafir"}</p>
                      <p className="text-xs text-muted-foreground">
                        {apt.services.map((s) => s.service.name).join(", ")}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm">
                        {new Date(apt.startTime).toLocaleDateString("tr-TR", { day: "numeric", month: "short" })}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(apt.startTime).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Yaklasan randevu bulunmuyor.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5" />
              Bu Ayin Masraflari
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {(data?.monthlyExpenses ?? 0).toFixed(0)} TL
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Net: {((data?.monthlyRevenue ?? 0) - (data?.monthlyExpenses ?? 0)).toFixed(0)} TL
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
