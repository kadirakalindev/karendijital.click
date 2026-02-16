"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, UserCog, Clock } from "lucide-react";
import { useBusiness } from "@/providers/business-provider";
import {
  getStaffMembers,
  addStaffMember,
  updateStaffMember,
  removeStaffMember,
  updateStaffWorkingHours,
} from "@/actions/staff";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";

interface StaffMember {
  id: string;
  role: "OWNER" | "MANAGER" | "STAFF";
  title: string | null;
  color: string | null;
  user: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
  };
  workingHours: {
    id: string;
    dayOfWeek: number;
    isOpen: boolean;
    openTime: string;
    closeTime: string;
    breakStart: string | null;
    breakEnd: string | null;
  }[];
}

const ROLE_LABELS: Record<string, string> = {
  OWNER: "Isletme Sahibi",
  MANAGER: "Yonetici",
  STAFF: "Personel",
};

const ROLE_COLORS: Record<string, "default" | "secondary" | "outline"> = {
  OWNER: "default",
  MANAGER: "secondary",
  STAFF: "outline",
};

const DAY_NAMES = ["Pazar", "Pazartesi", "Sali", "Carsamba", "Persembe", "Cuma", "Cumartesi"];

const DEFAULT_HOURS = DAY_NAMES.map((_, i) => ({
  dayOfWeek: i,
  isOpen: i >= 1 && i <= 6, // Mon-Sat open
  openTime: "09:00",
  closeTime: "19:00",
  breakStart: "12:00",
  breakEnd: "13:00",
}));

const STAFF_COLORS = [
  "#3b82f6", "#ef4444", "#22c55e", "#f59e0b", "#8b5cf6",
  "#ec4899", "#06b6d4", "#f97316",
];

export default function StaffPage() {
  const { currentBusiness } = useBusiness();
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isHoursDialogOpen, setIsHoursDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<StaffMember | null>(null);
  const [hoursMember, setHoursMember] = useState<StaffMember | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [form, setForm] = useState({
    name: "", email: "", phone: "", password: "",
    role: "STAFF" as string, title: "", color: STAFF_COLORS[0],
  });

  const [hours, setHours] = useState(DEFAULT_HOURS);

  const load = useCallback(async () => {
    if (!currentBusiness) return;
    const data = await getStaffMembers(currentBusiness.businessId);
    setStaff(data as any);
  }, [currentBusiness]);

  useEffect(() => { load(); }, [load]);

  const openNew = () => {
    setEditingMember(null);
    const nextColor = STAFF_COLORS[staff.length % STAFF_COLORS.length];
    setForm({ name: "", email: "", phone: "", password: "", role: "STAFF", title: "", color: nextColor });
    setIsDialogOpen(true);
  };

  const openEdit = (member: StaffMember) => {
    setEditingMember(member);
    setForm({
      name: member.user.name,
      email: member.user.email,
      phone: member.user.phone || "",
      password: "",
      role: member.role,
      title: member.title || "",
      color: member.color || STAFF_COLORS[0],
    });
    setIsDialogOpen(true);
  };

  const openHours = (member: StaffMember) => {
    setHoursMember(member);
    if (member.workingHours.length > 0) {
      const mapped = DAY_NAMES.map((_, i) => {
        const existing = member.workingHours.find((h) => h.dayOfWeek === i);
        return existing
          ? {
              dayOfWeek: i,
              isOpen: existing.isOpen,
              openTime: existing.openTime,
              closeTime: existing.closeTime,
              breakStart: existing.breakStart || "",
              breakEnd: existing.breakEnd || "",
            }
          : { dayOfWeek: i, isOpen: false, openTime: "09:00", closeTime: "19:00", breakStart: "", breakEnd: "" };
      });
      setHours(mapped);
    } else {
      setHours(DEFAULT_HOURS);
    }
    setIsHoursDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!currentBusiness) return;
    setIsLoading(true);

    if (editingMember) {
      const result = await updateStaffMember(currentBusiness.businessId, editingMember.id, {
        role: form.role as any,
        title: form.title || undefined,
        color: form.color || undefined,
      });
      if (result.error) toast.error(result.error);
      else { toast.success("Personel guncellendi"); setIsDialogOpen(false); load(); }
    } else {
      const result = await addStaffMember(currentBusiness.businessId, {
        name: form.name,
        email: form.email,
        phone: form.phone || undefined,
        password: form.password,
        role: form.role as any,
        title: form.title || undefined,
        color: form.color || undefined,
      });
      if (result.error) toast.error(result.error);
      else { toast.success("Personel eklendi"); setIsDialogOpen(false); load(); }
    }
    setIsLoading(false);
  };

  const handleRemove = async (member: StaffMember) => {
    if (!currentBusiness) return;
    if (!confirm(`${member.user.name} cikarilacak, emin misiniz?`)) return;

    const result = await removeStaffMember(currentBusiness.businessId, member.id);
    if (result.error) toast.error(result.error);
    else { toast.success("Personel cikarildi"); load(); }
  };

  const handleSaveHours = async () => {
    if (!currentBusiness || !hoursMember) return;
    setIsLoading(true);

    const result = await updateStaffWorkingHours(
      currentBusiness.businessId,
      hoursMember.id,
      hours.map((h) => ({
        ...h,
        breakStart: h.breakStart || undefined,
        breakEnd: h.breakEnd || undefined,
      }))
    );

    if (result.error) toast.error(result.error);
    else { toast.success("Calisma saatleri kaydedildi"); setIsHoursDialogOpen(false); load(); }
    setIsLoading(false);
  };

  const updateHour = (dayOfWeek: number, field: string, value: any) => {
    setHours((prev) =>
      prev.map((h) => (h.dayOfWeek === dayOfWeek ? { ...h, [field]: value } : h))
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Personel</h1>
          <p className="text-muted-foreground">{staff.length} kayitli personel</p>
        </div>
        <Button onClick={openNew}>
          <Plus className="mr-2 h-4 w-4" />
          Yeni Personel
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          {staff.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ad Soyad</TableHead>
                  <TableHead>Unvan</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>E-posta</TableHead>
                  <TableHead>Telefon</TableHead>
                  <TableHead className="w-32">Islemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {staff.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div
                          className="h-3 w-3 rounded-full shrink-0"
                          style={{ backgroundColor: member.color || "#94a3b8" }}
                        />
                        <span className="font-medium">{member.user.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>{member.title || "-"}</TableCell>
                    <TableCell>
                      <Badge variant={ROLE_COLORS[member.role]}>
                        {ROLE_LABELS[member.role]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{member.user.email}</TableCell>
                    <TableCell>{member.user.phone || "-"}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openHours(member)} title="Calisma Saatleri">
                          <Clock className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => openEdit(member)} title="Duzenle">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        {member.role !== "OWNER" && (
                          <Button variant="ghost" size="icon" onClick={() => handleRemove(member)} title="Cikar">
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex h-32 items-center justify-center">
              <div className="text-center">
                <UserCog className="mx-auto h-8 w-8 text-muted-foreground" />
                <p className="mt-2 text-sm text-muted-foreground">Henuz personel eklenmemis</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Personel Ekle/Duzenle Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingMember ? "Personel Duzenle" : "Yeni Personel"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {!editingMember && (
              <>
                <div className="space-y-2">
                  <Label>Ad Soyad *</Label>
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ahmet Yilmaz" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>E-posta *</Label>
                    <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="personel@email.com" />
                  </div>
                  <div className="space-y-2">
                    <Label>Telefon</Label>
                    <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="0532 xxx xx xx" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Sifre *</Label>
                  <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="En az 6 karakter" />
                </div>
              </>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Rol</Label>
                <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="STAFF">Personel</SelectItem>
                    <SelectItem value="MANAGER">Yonetici</SelectItem>
                    <SelectItem value="OWNER">Isletme Sahibi</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Unvan</Label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Kuafor, Guzellik Uzmani" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Takvim Rengi</Label>
              <div className="flex gap-2">
                {STAFF_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={`h-8 w-8 rounded-full border-2 transition-all ${form.color === c ? "border-foreground scale-110" : "border-transparent"}`}
                    style={{ backgroundColor: c }}
                    onClick={() => setForm({ ...form, color: c })}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Iptal</Button>
            <Button
              onClick={handleSubmit}
              disabled={isLoading || (!editingMember && (!form.name || !form.email || !form.password))}
            >
              {editingMember ? "Guncelle" : "Ekle"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Calisma Saatleri Dialog */}
      <Dialog open={isHoursDialogOpen} onOpenChange={setIsHoursDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {hoursMember?.user.name} - Calisma Saatleri
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {hours.map((h) => (
              <div key={h.dayOfWeek} className="flex items-center gap-3">
                <div className="w-24 text-sm font-medium">{DAY_NAMES[h.dayOfWeek]}</div>
                <Switch
                  checked={h.isOpen}
                  onCheckedChange={(v) => updateHour(h.dayOfWeek, "isOpen", v)}
                />
                {h.isOpen ? (
                  <div className="flex items-center gap-2 flex-1">
                    <Input
                      type="time"
                      value={h.openTime}
                      onChange={(e) => updateHour(h.dayOfWeek, "openTime", e.target.value)}
                      className="w-28"
                    />
                    <span className="text-muted-foreground">-</span>
                    <Input
                      type="time"
                      value={h.closeTime}
                      onChange={(e) => updateHour(h.dayOfWeek, "closeTime", e.target.value)}
                      className="w-28"
                    />
                    <span className="text-xs text-muted-foreground ml-2">Mola:</span>
                    <Input
                      type="time"
                      value={h.breakStart}
                      onChange={(e) => updateHour(h.dayOfWeek, "breakStart", e.target.value)}
                      className="w-28"
                    />
                    <span className="text-muted-foreground">-</span>
                    <Input
                      type="time"
                      value={h.breakEnd}
                      onChange={(e) => updateHour(h.dayOfWeek, "breakEnd", e.target.value)}
                      className="w-28"
                    />
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground">Kapali</span>
                )}
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsHoursDialogOpen(false)}>Iptal</Button>
            <Button onClick={handleSaveHours} disabled={isLoading}>Kaydet</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
