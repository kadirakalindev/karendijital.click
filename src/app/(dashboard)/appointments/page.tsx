"use client";

import { useState, useEffect, useCallback, useMemo, lazy, Suspense } from "react";
import { toast } from "sonner";
import { Plus, X, Check, Clock, Ban, ChevronDown } from "lucide-react";
import { useBusiness } from "@/providers/business-provider";
import {
  getAppointments,
  createAppointment,
  updateAppointment,
  updateAppointmentTime,
  updateAppointmentStatus,
  cancelAppointment,
  completeAppointment,
  getAppointmentById,
} from "@/actions/appointments";
import { getStaffMembers } from "@/actions/staff";
import { getServices } from "@/actions/services";
import { getCustomers } from "@/actions/customers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const CalendarView = lazy(() => import("@/components/appointments/calendar-view"));

interface StaffMember {
  id: string;
  color: string | null;
  user: { name: string };
}

interface ServiceItem {
  id: string;
  name: string;
  price: number;
  duration: number;
}

interface CustomerItem {
  id: string;
  name: string;
  phone: string | null;
}

interface AppointmentData {
  id: string;
  startTime: string;
  endTime: string;
  status: string;
  notes: string | null;
  customerName: string | null;
  customerPhone: string | null;
  customer: { id: string; name: string; phone: string | null } | null;
  member: { id: string; color: string | null; user: { name: string } };
  services: { service: { id: string; name: string }; price: number; duration: number }[];
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Bekliyor",
  CONFIRMED: "Onaylandi",
  IN_PROGRESS: "Devam Ediyor",
  COMPLETED: "Tamamlandi",
  CANCELLED: "Iptal",
  NO_SHOW: "Gelmedi",
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: "#f59e0b",
  CONFIRMED: "#3b82f6",
  IN_PROGRESS: "#8b5cf6",
  COMPLETED: "#22c55e",
  CANCELLED: "#ef4444",
  NO_SHOW: "#6b7280",
};

export default function AppointmentsPage() {
  const { currentBusiness } = useBusiness();
  const [appointments, setAppointments] = useState<AppointmentData[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [customers, setCustomers] = useState<CustomerItem[]>([]);
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [filterMemberId, setFilterMemberId] = useState<string>("");

  // Dialog states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Create form
  const [form, setForm] = useState({
    customerId: "",
    customerName: "",
    customerPhone: "",
    memberId: "",
    date: "",
    time: "09:00",
    notes: "",
  });
  const [selectedServices, setSelectedServices] = useState<
    { serviceId: string; price: number; duration: number }[]
  >([]);
  const [customerMode, setCustomerMode] = useState<"existing" | "new">("existing");

  // Load base data
  const loadBaseData = useCallback(async () => {
    if (!currentBusiness) return;
    const [s, srv, cst] = await Promise.all([
      getStaffMembers(currentBusiness.businessId),
      getServices(currentBusiness.businessId),
      getCustomers(currentBusiness.businessId),
    ]);
    setStaff(s as any);
    setServices(srv as any);
    setCustomers(cst as any);
  }, [currentBusiness]);

  useEffect(() => { loadBaseData(); }, [loadBaseData]);

  // Load appointments when date range changes
  const loadAppointments = useCallback(async () => {
    if (!currentBusiness || !dateRange.start || !dateRange.end) return;
    const data = await getAppointments(
      currentBusiness.businessId,
      dateRange.start,
      dateRange.end,
      filterMemberId && filterMemberId !== "all" ? filterMemberId : undefined
    );
    setAppointments(data as any);
  }, [currentBusiness, dateRange, filterMemberId]);

  useEffect(() => { loadAppointments(); }, [loadAppointments]);

  // Map appointments to calendar events
  const calendarEvents = useMemo(() => {
    return appointments.map((apt) => {
      const customerDisplay = apt.customer?.name || apt.customerName || "Misafir";
      const serviceNames = apt.services.map((s) => s.service.name).join(", ");
      return {
        id: apt.id,
        title: `${customerDisplay} - ${serviceNames}`,
        start: apt.startTime,
        end: apt.endTime,
        backgroundColor: apt.member.color || STATUS_COLORS[apt.status] || "#3b82f6",
        borderColor: STATUS_COLORS[apt.status] || "#3b82f6",
        extendedProps: { appointment: apt },
      };
    });
  }, [appointments]);

  // Calendar handlers
  const handleDatesSet = (start: string, end: string) => {
    setDateRange({ start, end });
  };

  const handleDateSelect = (info: any) => {
    const startDate = new Date(info.startStr);
    setForm({
      customerId: "",
      customerName: "",
      customerPhone: "",
      memberId: staff.length > 0 ? staff[0].id : "",
      date: startDate.toISOString().split("T")[0],
      time: `${String(startDate.getHours()).padStart(2, "0")}:${String(startDate.getMinutes()).padStart(2, "0")}`,
      notes: "",
    });
    setSelectedServices([]);
    setCustomerMode("existing");
    setSelectedAppointment(null);
    setIsCreateOpen(true);
  };

  const handleEventClick = (info: any) => {
    const apt = info.event.extendedProps.appointment as AppointmentData;
    setSelectedAppointment(apt);
    setIsDetailOpen(true);
  };

  const handleEventDrop = async (info: any) => {
    if (!currentBusiness) return;
    const result = await updateAppointmentTime(
      currentBusiness.businessId,
      info.event.id,
      info.event.startStr,
      info.event.endStr
    );
    if (result.error) {
      toast.error(result.error);
      info.revert();
    } else {
      toast.success("Randevu tasildi");
      loadAppointments();
    }
  };

  const handleEventResize = async (info: any) => {
    if (!currentBusiness) return;
    const result = await updateAppointmentTime(
      currentBusiness.businessId,
      info.event.id,
      info.event.startStr,
      info.event.endStr
    );
    if (result.error) {
      toast.error(result.error);
      info.revert();
    } else {
      toast.success("Randevu suresi guncellendi");
      loadAppointments();
    }
  };

  // Service selection
  const addServiceToForm = (serviceId: string) => {
    const service = services.find((s) => s.id === serviceId);
    if (!service || selectedServices.find((s) => s.serviceId === serviceId)) return;
    setSelectedServices([
      ...selectedServices,
      { serviceId, price: service.price, duration: service.duration },
    ]);
  };

  const removeServiceFromForm = (serviceId: string) => {
    setSelectedServices(selectedServices.filter((s) => s.serviceId !== serviceId));
  };

  const totalDuration = selectedServices.reduce((sum, s) => sum + s.duration, 0);
  const totalPrice = selectedServices.reduce((sum, s) => sum + s.price, 0);

  // Submit create
  const handleCreate = async () => {
    if (!currentBusiness) return;
    setIsLoading(true);

    const startTime = `${form.date}T${form.time}:00`;
    const result = await createAppointment(currentBusiness.businessId, {
      customerId: customerMode === "existing" && form.customerId ? form.customerId : undefined,
      customerName: customerMode === "new" ? form.customerName : undefined,
      customerPhone: customerMode === "new" ? form.customerPhone : undefined,
      memberId: form.memberId,
      startTime,
      services: selectedServices,
      notes: form.notes || undefined,
    });

    if (result.error) toast.error(result.error);
    else {
      toast.success("Randevu olusturuldu");
      setIsCreateOpen(false);
      loadAppointments();
    }
    setIsLoading(false);
  };

  // Status actions
  const handleStatusChange = async (appointmentId: string, status: string) => {
    if (!currentBusiness) return;
    let result;
    if (status === "CANCELLED") {
      result = await cancelAppointment(currentBusiness.businessId, appointmentId);
    } else if (status === "COMPLETED") {
      result = await completeAppointment(currentBusiness.businessId, appointmentId);
    } else {
      result = await updateAppointmentStatus(currentBusiness.businessId, appointmentId, status);
    }

    if (result.error) toast.error(result.error);
    else {
      toast.success("Durum guncellendi");
      setIsDetailOpen(false);
      loadAppointments();
    }
  };

  // Edit from detail
  const handleEditFromDetail = () => {
    if (!selectedAppointment) return;
    const apt = selectedAppointment;
    const startDate = new Date(apt.startTime);

    setForm({
      customerId: apt.customer?.id || "",
      customerName: apt.customerName || "",
      customerPhone: apt.customerPhone || "",
      memberId: apt.member.id,
      date: startDate.toISOString().split("T")[0],
      time: `${String(startDate.getHours()).padStart(2, "0")}:${String(startDate.getMinutes()).padStart(2, "0")}`,
      notes: apt.notes || "",
    });
    setSelectedServices(
      apt.services.map((s) => ({
        serviceId: s.service.id,
        price: s.price,
        duration: s.duration,
      }))
    );
    setCustomerMode(apt.customer ? "existing" : "new");
    setIsDetailOpen(false);
    setIsCreateOpen(true);
  };

  // Submit edit
  const handleUpdate = async () => {
    if (!currentBusiness || !selectedAppointment) return;
    setIsLoading(true);

    const startTime = `${form.date}T${form.time}:00`;
    const result = await updateAppointment(currentBusiness.businessId, selectedAppointment.id, {
      customerId: customerMode === "existing" && form.customerId ? form.customerId : undefined,
      customerName: customerMode === "new" ? form.customerName : undefined,
      customerPhone: customerMode === "new" ? form.customerPhone : undefined,
      memberId: form.memberId,
      startTime,
      services: selectedServices,
      notes: form.notes || undefined,
    });

    if (result.error) toast.error(result.error);
    else {
      toast.success("Randevu guncellendi");
      setIsCreateOpen(false);
      setSelectedAppointment(null);
      loadAppointments();
    }
    setIsLoading(false);
  };

  const openNewDialog = () => {
    const now = new Date();
    setForm({
      customerId: "",
      customerName: "",
      customerPhone: "",
      memberId: staff.length > 0 ? staff[0].id : "",
      date: now.toISOString().split("T")[0],
      time: `${String(now.getHours()).padStart(2, "0")}:00`,
      notes: "",
    });
    setSelectedServices([]);
    setCustomerMode("existing");
    setSelectedAppointment(null);
    setIsCreateOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Randevular</h1>
          <p className="text-muted-foreground">
            Takvim uzerinde randevularinizi yonetin.
          </p>
        </div>
        <div className="flex gap-2">
          {/* Staff filter */}
          <Select value={filterMemberId} onValueChange={setFilterMemberId}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Tum personel" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tum personel</SelectItem>
              {staff.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: m.color || "#94a3b8" }} />
                    {m.user.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={openNewDialog}>
            <Plus className="mr-2 h-4 w-4" />
            Yeni Randevu
          </Button>
        </div>
      </div>

      {/* Staff color legend */}
      {staff.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {staff.map((m) => (
            <div key={m.id} className="flex items-center gap-1.5 text-sm">
              <div className="h-3 w-3 rounded-full" style={{ backgroundColor: m.color || "#94a3b8" }} />
              <span>{m.user.name}</span>
            </div>
          ))}
        </div>
      )}

      <Card>
        <CardContent className="pt-6">
          <Suspense fallback={<div className="flex h-96 items-center justify-center text-muted-foreground">Takvim yukleniyor...</div>}>
            <CalendarView
              events={calendarEvents}
              onEventClick={handleEventClick}
              onDateSelect={handleDateSelect}
              onEventDrop={handleEventDrop}
              onEventResize={handleEventResize}
              onDatesSet={handleDatesSet}
            />
          </Suspense>
        </CardContent>
      </Card>

      {/* Create/Edit Appointment Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedAppointment ? "Randevu Duzenle" : "Yeni Randevu"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Customer selection */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label>Musteri</Label>
                <div className="flex gap-1 ml-auto">
                  <Button
                    type="button"
                    variant={customerMode === "existing" ? "default" : "outline"}
                    size="sm"
                    className="h-6 text-xs"
                    onClick={() => setCustomerMode("existing")}
                  >
                    Mevcut
                  </Button>
                  <Button
                    type="button"
                    variant={customerMode === "new" ? "default" : "outline"}
                    size="sm"
                    className="h-6 text-xs"
                    onClick={() => setCustomerMode("new")}
                  >
                    Yeni
                  </Button>
                </div>
              </div>
              {customerMode === "existing" ? (
                <Select value={form.customerId} onValueChange={(v) => setForm({ ...form, customerId: v })}>
                  <SelectTrigger><SelectValue placeholder="Musteri seciniz" /></SelectTrigger>
                  <SelectContent>
                    {customers.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name} {c.phone ? `(${c.phone})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    value={form.customerName}
                    onChange={(e) => setForm({ ...form, customerName: e.target.value })}
                    placeholder="Ad Soyad"
                  />
                  <Input
                    value={form.customerPhone}
                    onChange={(e) => setForm({ ...form, customerPhone: e.target.value })}
                    placeholder="Telefon"
                  />
                </div>
              )}
            </div>

            {/* Staff selection */}
            <div className="space-y-2">
              <Label>Personel *</Label>
              <Select value={form.memberId} onValueChange={(v) => setForm({ ...form, memberId: v })}>
                <SelectTrigger><SelectValue placeholder="Personel seciniz" /></SelectTrigger>
                <SelectContent>
                  {staff.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full" style={{ backgroundColor: m.color || "#94a3b8" }} />
                        {m.user.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date & Time */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tarih *</Label>
                <Input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Saat *</Label>
                <Input
                  type="time"
                  value={form.time}
                  onChange={(e) => setForm({ ...form, time: e.target.value })}
                  step="900"
                />
              </div>
            </div>

            {/* Service selection */}
            <div className="space-y-2">
              <Label>Hizmetler *</Label>
              <Select onValueChange={addServiceToForm} value="">
                <SelectTrigger><SelectValue placeholder="Hizmet ekle..." /></SelectTrigger>
                <SelectContent>
                  {services
                    .filter((s) => !selectedServices.find((ss) => ss.serviceId === s.id))
                    .map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name} ({s.duration} dk - {s.price} TL)
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>

              {selectedServices.length > 0 && (
                <div className="space-y-1 mt-2">
                  {selectedServices.map((ss) => {
                    const service = services.find((s) => s.id === ss.serviceId);
                    if (!service) return null;
                    return (
                      <div key={ss.serviceId} className="flex items-center justify-between p-2 border rounded text-sm">
                        <span>{service.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">{ss.duration} dk</span>
                          <span>{ss.price} TL</span>
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeServiceFromForm(ss.serviceId)}>
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                  <div className="flex justify-between text-sm font-medium pt-1">
                    <span>Toplam: {totalDuration} dk</span>
                    <span>{totalPrice} TL</span>
                  </div>
                </div>
              )}
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label>Notlar</Label>
              <Textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Randevu notu..."
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsCreateOpen(false); setSelectedAppointment(null); }}>
              Iptal
            </Button>
            <Button
              onClick={selectedAppointment ? handleUpdate : handleCreate}
              disabled={isLoading || !form.memberId || !form.date || !form.time || selectedServices.length === 0}
            >
              {selectedAppointment ? "Guncelle" : "Olustur"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Appointment Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Randevu Detayi</DialogTitle>
          </DialogHeader>
          {selectedAppointment && (
            <div className="space-y-4">
              {/* Status */}
              <div className="flex items-center justify-between">
                <Badge style={{ backgroundColor: STATUS_COLORS[selectedAppointment.status] }} className="text-white">
                  {STATUS_LABELS[selectedAppointment.status]}
                </Badge>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      Durum Degistir <ChevronDown className="ml-1 h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => handleStatusChange(selectedAppointment.id, "CONFIRMED")}>
                      <Check className="mr-2 h-4 w-4 text-blue-500" /> Onayla
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleStatusChange(selectedAppointment.id, "IN_PROGRESS")}>
                      <Clock className="mr-2 h-4 w-4 text-purple-500" /> Baslat
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleStatusChange(selectedAppointment.id, "COMPLETED")}>
                      <Check className="mr-2 h-4 w-4 text-green-500" /> Tamamla
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleStatusChange(selectedAppointment.id, "NO_SHOW")}>
                      <Ban className="mr-2 h-4 w-4 text-gray-500" /> Gelmedi
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleStatusChange(selectedAppointment.id, "CANCELLED")} className="text-destructive">
                      <X className="mr-2 h-4 w-4" /> Iptal Et
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Customer */}
              <div>
                <p className="text-sm text-muted-foreground">Musteri</p>
                <p className="font-medium">
                  {selectedAppointment.customer?.name || selectedAppointment.customerName || "Misafir"}
                </p>
                {(selectedAppointment.customer?.phone || selectedAppointment.customerPhone) && (
                  <p className="text-sm text-muted-foreground">
                    {selectedAppointment.customer?.phone || selectedAppointment.customerPhone}
                  </p>
                )}
              </div>

              {/* Staff */}
              <div>
                <p className="text-sm text-muted-foreground">Personel</p>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full" style={{ backgroundColor: selectedAppointment.member.color || "#94a3b8" }} />
                  <p className="font-medium">{selectedAppointment.member.user.name}</p>
                </div>
              </div>

              {/* Time */}
              <div>
                <p className="text-sm text-muted-foreground">Tarih ve Saat</p>
                <p className="font-medium">
                  {new Date(selectedAppointment.startTime).toLocaleDateString("tr-TR", {
                    weekday: "long", day: "numeric", month: "long", year: "numeric",
                  })}{" "}
                  {new Date(selectedAppointment.startTime).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
                  {" - "}
                  {new Date(selectedAppointment.endTime).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>

              {/* Services */}
              <div>
                <p className="text-sm text-muted-foreground">Hizmetler</p>
                <div className="space-y-1 mt-1">
                  {selectedAppointment.services.map((s, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span>{s.service.name} ({s.duration} dk)</span>
                      <span>{s.price} TL</span>
                    </div>
                  ))}
                  <div className="flex justify-between text-sm font-medium border-t pt-1">
                    <span>Toplam</span>
                    <span>{selectedAppointment.services.reduce((sum, s) => sum + s.price, 0)} TL</span>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {selectedAppointment.notes && (
                <div>
                  <p className="text-sm text-muted-foreground">Notlar</p>
                  <p className="text-sm">{selectedAppointment.notes}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailOpen(false)}>Kapat</Button>
            {selectedAppointment && selectedAppointment.status !== "CANCELLED" && selectedAppointment.status !== "COMPLETED" && (
              <Button onClick={handleEditFromDetail}>Duzenle</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
