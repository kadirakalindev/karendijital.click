"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { useBusiness } from "@/providers/business-provider";
import {
  getBusinessProfile, updateBusinessProfile,
  getBusinessWorkingHours, updateBusinessWorkingHours,
  getBusinessHolidays, createHoliday, deleteHoliday,
  getNotificationSettings, updateNotificationSetting,
} from "@/actions/settings";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Settings, Clock, CalendarOff, Bell, CreditCard, ImageIcon, Plus, Trash2, Save,
} from "lucide-react";

const DAY_NAMES = ["Pazar", "Pazartesi", "Sali", "Carsamba", "Persembe", "Cuma", "Cumartesi"];

const NOTIFICATION_LABELS: Record<string, { label: string; desc: string }> = {
  APPOINTMENT_REMINDER: { label: "Randevu Hatirlatmasi", desc: "Randevu oncesi musteri bilgilendirilir" },
  APPOINTMENT_CONFIRMATION: { label: "Randevu Onay", desc: "Randevu olusturuldiginda bilgi verilir" },
  APPOINTMENT_CANCELLATION: { label: "Randevu Iptal", desc: "Randevu iptal edildiginde bilgi verilir" },
  BIRTHDAY_GREETING: { label: "Dogum Gunu Kutlamasi", desc: "Musteri dogum gununde mesaj gonderilir" },
};

interface ProfileData {
  name: string;
  slug: string;
  description: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  district: string;
  website: string;
  instagram: string;
}

interface WorkingHourData {
  dayOfWeek: number;
  isOpen: boolean;
  openTime: string;
  closeTime: string;
  breakStart: string;
  breakEnd: string;
}

interface HolidayData {
  id: string;
  name: string;
  date: string;
  isRecurring: boolean;
}

interface NotifData {
  type: string;
  isEnabled: boolean;
  template: string;
  sendBefore: number | null;
}

export default function SettingsPage() {
  const { currentBusiness } = useBusiness();
  const [isLoading, setIsLoading] = useState(false);

  // Profile
  const [profile, setProfile] = useState<ProfileData>({
    name: "", slug: "", description: "", phone: "", email: "",
    address: "", city: "", district: "", website: "", instagram: "",
  });

  // Working Hours
  const [hours, setHours] = useState<WorkingHourData[]>(
    Array.from({ length: 7 }, (_, i) => ({
      dayOfWeek: i, isOpen: i >= 1 && i <= 6,
      openTime: "09:00", closeTime: "19:00", breakStart: "", breakEnd: "",
    }))
  );

  // Holidays
  const [holidays, setHolidays] = useState<HolidayData[]>([]);
  const [isHolidayOpen, setIsHolidayOpen] = useState(false);
  const [holidayForm, setHolidayForm] = useState({ name: "", date: "", isRecurring: false });

  // Notifications
  const [notifications, setNotifications] = useState<NotifData[]>([]);

  const load = useCallback(async () => {
    if (!currentBusiness) return;
    const bid = currentBusiness.businessId;

    const [prof, wh, hol, notif] = await Promise.all([
      getBusinessProfile(bid),
      getBusinessWorkingHours(bid),
      getBusinessHolidays(bid),
      getNotificationSettings(bid),
    ]);

    if (prof) {
      setProfile({
        name: prof.name || "",
        slug: prof.slug || "",
        description: prof.description || "",
        phone: prof.phone || "",
        email: prof.email || "",
        address: prof.address || "",
        city: prof.city || "",
        district: prof.district || "",
        website: prof.website || "",
        instagram: prof.instagram || "",
      });
    }

    if (wh && wh.length > 0) {
      setHours(
        Array.from({ length: 7 }, (_, i) => {
          const existing = wh.find((h: any) => h.dayOfWeek === i);
          return existing
            ? {
                dayOfWeek: i,
                isOpen: existing.isOpen,
                openTime: existing.openTime,
                closeTime: existing.closeTime,
                breakStart: existing.breakStart || "",
                breakEnd: existing.breakEnd || "",
              }
            : {
                dayOfWeek: i, isOpen: i >= 1 && i <= 6,
                openTime: "09:00", closeTime: "19:00", breakStart: "", breakEnd: "",
              };
        })
      );
    }

    if (hol) {
      setHolidays(
        (hol as any[]).map((h) => ({
          id: h.id,
          name: h.name,
          date: new Date(h.date).toISOString().split("T")[0],
          isRecurring: h.isRecurring,
        }))
      );
    }

    if (notif) {
      const types = Object.keys(NOTIFICATION_LABELS);
      setNotifications(
        types.map((type) => {
          const existing = (notif as any[]).find((n) => n.type === type);
          return {
            type,
            isEnabled: existing?.isEnabled ?? false,
            template: existing?.template || "",
            sendBefore: existing?.sendBefore || null,
          };
        })
      );
    }
  }, [currentBusiness]);

  useEffect(() => { load(); }, [load]);

  // Handlers
  const saveProfile = async () => {
    if (!currentBusiness) return;
    setIsLoading(true);
    const result = await updateBusinessProfile(currentBusiness.businessId, {
      name: profile.name,
      description: profile.description || undefined,
      phone: profile.phone || undefined,
      email: profile.email || undefined,
      address: profile.address || undefined,
      city: profile.city || undefined,
      district: profile.district || undefined,
      website: profile.website || undefined,
      instagram: profile.instagram || undefined,
    });
    if (result.error) toast.error(result.error);
    else toast.success("Profil guncellendi");
    setIsLoading(false);
  };

  const saveWorkingHours = async () => {
    if (!currentBusiness) return;
    setIsLoading(true);
    const result = await updateBusinessWorkingHours(
      currentBusiness.businessId,
      hours.map((h) => ({
        ...h,
        breakStart: h.breakStart || undefined,
        breakEnd: h.breakEnd || undefined,
      }))
    );
    if (result.error) toast.error(result.error);
    else toast.success("Calisma saatleri guncellendi");
    setIsLoading(false);
  };

  const addHoliday = async () => {
    if (!currentBusiness || !holidayForm.name || !holidayForm.date) return;
    setIsLoading(true);
    const result = await createHoliday(currentBusiness.businessId, holidayForm);
    if (result.error) toast.error(result.error);
    else {
      toast.success("Tatil gunu eklendi");
      setIsHolidayOpen(false);
      setHolidayForm({ name: "", date: "", isRecurring: false });
      load();
    }
    setIsLoading(false);
  };

  const removeHoliday = async (id: string) => {
    if (!currentBusiness) return;
    const result = await deleteHoliday(currentBusiness.businessId, id);
    if (result.error) toast.error(result.error);
    else { toast.success("Tatil gunu silindi"); load(); }
  };

  const toggleNotification = async (type: string, isEnabled: boolean) => {
    if (!currentBusiness) return;
    const existing = notifications.find((n) => n.type === type);
    await updateNotificationSetting(currentBusiness.businessId, {
      type,
      isEnabled,
      template: existing?.template,
      sendBefore: existing?.sendBefore || undefined,
    });
    setNotifications((prev) =>
      prev.map((n) => (n.type === type ? { ...n, isEnabled } : n))
    );
    toast.success(isEnabled ? "Bildirim aktif edildi" : "Bildirim kapatildi");
  };

  const updateHour = (dayOfWeek: number, field: keyof WorkingHourData, value: any) => {
    setHours((prev) =>
      prev.map((h) => (h.dayOfWeek === dayOfWeek ? { ...h, [field]: value } : h))
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Ayarlar</h1>
        <p className="text-muted-foreground">Isletme ayarlarinizi yapilandirin.</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList className="flex-wrap">
          <TabsTrigger value="profile">
            <Settings className="mr-2 h-4 w-4" /> Profil
          </TabsTrigger>
          <TabsTrigger value="hours">
            <Clock className="mr-2 h-4 w-4" /> Calisma Saatleri
          </TabsTrigger>
          <TabsTrigger value="holidays">
            <CalendarOff className="mr-2 h-4 w-4" /> Tatil Gunleri
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="mr-2 h-4 w-4" /> Bildirimler
          </TabsTrigger>
          <TabsTrigger value="subscription">
            <CreditCard className="mr-2 h-4 w-4" /> Abonelik
          </TabsTrigger>
          <TabsTrigger value="gallery">
            <ImageIcon className="mr-2 h-4 w-4" /> Galeri
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Isletme Profili</CardTitle>
              <CardDescription>
                Isletmenizin temel bilgilerini duzenleyin. Slug: <span className="font-mono">{profile.slug}</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Isletme Adi *</Label>
                  <Input value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Telefon</Label>
                  <Input value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} placeholder="0532 xxx xx xx" />
                </div>
                <div className="space-y-2">
                  <Label>E-posta</Label>
                  <Input type="email" value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Instagram</Label>
                  <Input value={profile.instagram} onChange={(e) => setProfile({ ...profile, instagram: e.target.value })} placeholder="kullanici_adi" />
                </div>
                <div className="space-y-2">
                  <Label>Website</Label>
                  <Input value={profile.website} onChange={(e) => setProfile({ ...profile, website: e.target.value })} placeholder="https://..." />
                </div>
                <div className="space-y-2">
                  <Label>Sehir</Label>
                  <Input value={profile.city} onChange={(e) => setProfile({ ...profile, city: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Ilce</Label>
                  <Input value={profile.district} onChange={(e) => setProfile({ ...profile, district: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Adres</Label>
                <Input value={profile.address} onChange={(e) => setProfile({ ...profile, address: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Aciklama</Label>
                <Input value={profile.description} onChange={(e) => setProfile({ ...profile, description: e.target.value })} placeholder="Isletme hakkinda kisa bilgi..." />
              </div>
              <Button onClick={saveProfile} disabled={isLoading || !profile.name}>
                <Save className="mr-2 h-4 w-4" /> Kaydet
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Working Hours Tab */}
        <TabsContent value="hours">
          <Card>
            <CardHeader>
              <CardTitle>Calisma Saatleri</CardTitle>
              <CardDescription>Isletmenizin calisma gun ve saatlerini belirleyin.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {hours.map((h) => (
                  <div key={h.dayOfWeek} className="flex flex-wrap items-center gap-3 rounded-lg border p-3">
                    <div className="flex items-center gap-2 w-32">
                      <Switch
                        checked={h.isOpen}
                        onCheckedChange={(v) => updateHour(h.dayOfWeek, "isOpen", v)}
                      />
                      <span className={`text-sm font-medium ${!h.isOpen ? "text-muted-foreground" : ""}`}>
                        {DAY_NAMES[h.dayOfWeek]}
                      </span>
                    </div>
                    {h.isOpen && (
                      <>
                        <div className="flex items-center gap-1">
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
                        </div>
                        <div className="flex items-center gap-1 text-sm">
                          <span className="text-muted-foreground">Mola:</span>
                          <Input
                            type="time"
                            value={h.breakStart}
                            onChange={(e) => updateHour(h.dayOfWeek, "breakStart", e.target.value)}
                            className="w-28"
                            placeholder="--:--"
                          />
                          <span className="text-muted-foreground">-</span>
                          <Input
                            type="time"
                            value={h.breakEnd}
                            onChange={(e) => updateHour(h.dayOfWeek, "breakEnd", e.target.value)}
                            className="w-28"
                            placeholder="--:--"
                          />
                        </div>
                      </>
                    )}
                    {!h.isOpen && (
                      <Badge variant="secondary">Kapali</Badge>
                    )}
                  </div>
                ))}
              </div>
              <Button onClick={saveWorkingHours} disabled={isLoading}>
                <Save className="mr-2 h-4 w-4" /> Kaydet
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Holidays Tab */}
        <TabsContent value="holidays">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Tatil Gunleri</CardTitle>
                <CardDescription>Isletmenizin kapali oldugu ozel gunleri belirleyin.</CardDescription>
              </div>
              <Button onClick={() => { setHolidayForm({ name: "", date: "", isRecurring: false }); setIsHolidayOpen(true); }}>
                <Plus className="mr-2 h-4 w-4" /> Ekle
              </Button>
            </CardHeader>
            <CardContent>
              {holidays.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tatil Adi</TableHead>
                      <TableHead>Tarih</TableHead>
                      <TableHead>Tekrar</TableHead>
                      <TableHead className="w-16"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {holidays.map((h) => (
                      <TableRow key={h.id}>
                        <TableCell className="font-medium">{h.name}</TableCell>
                        <TableCell>{new Date(h.date).toLocaleDateString("tr-TR")}</TableCell>
                        <TableCell>
                          {h.isRecurring ? (
                            <Badge variant="secondary">Her yil</Badge>
                          ) : (
                            <Badge variant="outline">Tek seferlik</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" onClick={() => removeHoliday(h.id)}>
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="flex h-32 items-center justify-center">
                  <p className="text-sm text-muted-foreground">Tanimli tatil gunu yok</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Bildirim Ayarlari</CardTitle>
              <CardDescription>SMS ve WhatsApp bildirim ayarlarini yapilandirin.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {notifications.map((n) => {
                  const info = NOTIFICATION_LABELS[n.type];
                  if (!info) return null;
                  return (
                    <div key={n.type} className="flex items-center justify-between rounded-lg border p-4">
                      <div>
                        <p className="font-medium">{info.label}</p>
                        <p className="text-sm text-muted-foreground">{info.desc}</p>
                      </div>
                      <Switch
                        checked={n.isEnabled}
                        onCheckedChange={(v) => toggleNotification(n.type, v)}
                      />
                    </div>
                  );
                })}
                {notifications.length === 0 && (
                  <div className="flex h-32 items-center justify-center">
                    <p className="text-sm text-muted-foreground">Bildirim ayarlari yukleniyor...</p>
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  Not: Bildirimler SMS/WhatsApp entegrasyonu yapilandirildiginda aktif olacaktir.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Subscription Tab */}
        <TabsContent value="subscription">
          <Card>
            <CardHeader>
              <CardTitle>Abonelik</CardTitle>
              <CardDescription>Abonelik planini goruntuleyip degistirin.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex h-48 items-center justify-center rounded-lg border border-dashed">
                <p className="text-muted-foreground">Abonelik yonetimi yakinda eklenecek</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Gallery Tab */}
        <TabsContent value="gallery">
          <Card>
            <CardHeader>
              <CardTitle>Galeri</CardTitle>
              <CardDescription>Isletmenizin fotograf galerisini yonetin.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex h-48 items-center justify-center rounded-lg border border-dashed">
                <p className="text-muted-foreground">Galeri yonetimi yakinda eklenecek</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Holiday Dialog */}
      <Dialog open={isHolidayOpen} onOpenChange={setIsHolidayOpen}>
        <DialogContent aria-describedby={undefined}>
          <DialogHeader><DialogTitle>Tatil Gunu Ekle</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Tatil Adi *</Label>
              <Input
                value={holidayForm.name}
                onChange={(e) => setHolidayForm({ ...holidayForm, name: e.target.value })}
                placeholder="Orn: Yilbasi"
              />
            </div>
            <div className="space-y-2">
              <Label>Tarih *</Label>
              <Input
                type="date"
                value={holidayForm.date}
                onChange={(e) => setHolidayForm({ ...holidayForm, date: e.target.value })}
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={holidayForm.isRecurring}
                onCheckedChange={(v) => setHolidayForm({ ...holidayForm, isRecurring: v })}
              />
              <Label>Her yil tekrarlansin</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsHolidayOpen(false)}>Iptal</Button>
            <Button onClick={addHoliday} disabled={isLoading || !holidayForm.name || !holidayForm.date}>
              Ekle
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
