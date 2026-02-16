"use client";

import { useState, useEffect, useCallback, use } from "react";
import { toast } from "sonner";
import {
  ArrowLeft, ArrowRight, Check, Clock, User, Scissors, Calendar,
  Phone, CheckCircle2,
} from "lucide-react";
import {
  getBusinessBySlug,
  getAvailableSlots,
  createPublicBooking,
} from "@/actions/public-booking";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Service {
  id: string;
  name: string;
  duration: number;
  price: number;
  category: { name: string } | null;
}

interface StaffMember {
  id: string;
  title: string | null;
  color: string | null;
  user: { name: string; image: string | null };
  workingHours: { dayOfWeek: number; isOpen: boolean }[];
}

type Step = "services" | "staff" | "datetime" | "info" | "done";

const STEPS: { key: Step; label: string; icon: any }[] = [
  { key: "services", label: "Hizmet", icon: Scissors },
  { key: "staff", label: "Personel", icon: User },
  { key: "datetime", label: "Tarih/Saat", icon: Calendar },
  { key: "info", label: "Bilgiler", icon: Phone },
];

export default function BookingPage({
  params,
}: {
  params: Promise<{ domain: string }>;
}) {
  const { domain } = use(params);
  const [business, setBusiness] = useState<any>(null);
  const [step, setStep] = useState<Step>("services");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [notes, setNotes] = useState("");

  // Load business data
  useEffect(() => {
    getBusinessBySlug(domain).then((data) => {
      setBusiness(data);
      setIsLoading(false);
    });
  }, [domain]);

  // Generate next 14 days
  const dateOptions = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return {
      value: d.toISOString().split("T")[0],
      label: d.toLocaleDateString("tr-TR", { weekday: "short", day: "numeric", month: "short" }),
      dayOfWeek: d.getDay(),
    };
  });

  // Load available slots when date or staff changes
  useEffect(() => {
    if (!business || !selectedMemberId || !selectedDate) return;
    const totalDuration = selectedServiceIds.reduce((sum, id) => {
      const svc = business.services.find((s: Service) => s.id === id);
      return sum + (svc?.duration || 0);
    }, 0);
    if (totalDuration === 0) return;

    setSlotsLoading(true);
    setSelectedTime("");
    getAvailableSlots(business.id, selectedMemberId, selectedDate, totalDuration).then(
      (slots) => {
        setAvailableSlots(slots);
        setSlotsLoading(false);
      }
    );
  }, [business, selectedMemberId, selectedDate, selectedServiceIds]);

  // Computed values
  const services: Service[] = business?.services || [];
  const staff: StaffMember[] = business?.members || [];

  const selectedServices = services.filter((s) => selectedServiceIds.includes(s.id));
  const totalDuration = selectedServices.reduce((sum, s) => sum + s.duration, 0);
  const totalPrice = selectedServices.reduce((sum, s) => sum + s.price, 0);
  const selectedStaff = staff.find((m) => m.id === selectedMemberId);

  const toggleService = (id: string) => {
    setSelectedServiceIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const canProceed = () => {
    switch (step) {
      case "services": return selectedServiceIds.length > 0;
      case "staff": return !!selectedMemberId;
      case "datetime": return !!selectedDate && !!selectedTime;
      case "info": return customerName.length >= 2 && customerPhone.length >= 7;
      default: return false;
    }
  };

  const nextStep = () => {
    const order: Step[] = ["services", "staff", "datetime", "info"];
    const idx = order.indexOf(step);
    if (idx < order.length - 1) setStep(order[idx + 1]);
  };

  const prevStep = () => {
    const order: Step[] = ["services", "staff", "datetime", "info"];
    const idx = order.indexOf(step);
    if (idx > 0) setStep(order[idx - 1]);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    const result = await createPublicBooking(domain, {
      customerName,
      customerPhone,
      memberId: selectedMemberId,
      date: selectedDate,
      time: selectedTime,
      serviceIds: selectedServiceIds,
      notes: notes || undefined,
    });

    if (result.error) {
      toast.error(result.error);
    } else {
      setStep("done");
    }
    setIsSubmitting(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Yukleniyor...</p>
      </div>
    );
  }

  if (!business) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Isletme bulunamadi.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/50">
      {/* Header */}
      <div className="bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 py-6 text-center">
          <a href={`/${domain}`} className="text-sm text-primary-foreground/70 hover:text-primary-foreground">
            {business.name}
          </a>
          <h1 className="text-2xl font-bold mt-1">Online Randevu Al</h1>
        </div>
      </div>

      {/* Stepper */}
      {step !== "done" && (
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-center gap-1">
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              const stepOrder: Step[] = ["services", "staff", "datetime", "info"];
              const currentIdx = stepOrder.indexOf(step);
              const stepIdx = stepOrder.indexOf(s.key);
              const isActive = step === s.key;
              const isDone = stepIdx < currentIdx;

              return (
                <div key={s.key} className="flex items-center">
                  {i > 0 && (
                    <div className={`w-8 h-0.5 mx-1 ${isDone ? "bg-primary" : "bg-border"}`} />
                  )}
                  <button
                    onClick={() => { if (isDone) setStep(s.key); }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors
                      ${isActive ? "bg-primary text-primary-foreground" : ""}
                      ${isDone ? "bg-primary/10 text-primary cursor-pointer" : ""}
                      ${!isActive && !isDone ? "text-muted-foreground" : ""}
                    `}
                  >
                    {isDone ? <Check className="h-3.5 w-3.5" /> : <Icon className="h-3.5 w-3.5" />}
                    <span className="hidden sm:inline">{s.label}</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 pb-8">
        {/* Step 1: Services */}
        {step === "services" && (
          <div className="max-w-2xl mx-auto space-y-3">
            <h2 className="text-lg font-semibold">Hizmet Seciniz</h2>
            <p className="text-sm text-muted-foreground">Birden fazla hizmet secebilirsiniz.</p>
            {services.map((service) => {
              const isSelected = selectedServiceIds.includes(service.id);
              return (
                <Card
                  key={service.id}
                  className={`cursor-pointer transition-all ${isSelected ? "ring-2 ring-primary" : "hover:bg-muted/50"}`}
                  onClick={() => toggleService(service.id)}
                >
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                      <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center transition-colors ${isSelected ? "border-primary bg-primary" : "border-muted-foreground"}`}>
                        {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
                      </div>
                      <div>
                        <p className="font-medium">{service.name}</p>
                        <div className="flex gap-2 mt-0.5">
                          <span className="text-xs text-muted-foreground">{service.duration} dk</span>
                          {service.category && (
                            <Badge variant="outline" className="text-[10px] h-4">{service.category.name}</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <span className="font-semibold">{service.price} TL</span>
                  </CardContent>
                </Card>
              );
            })}
            {selectedServiceIds.length > 0 && (
              <div className="flex justify-between items-center pt-2 text-sm font-medium">
                <span>{selectedServices.length} hizmet, {totalDuration} dk</span>
                <span>{totalPrice} TL</span>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Staff */}
        {step === "staff" && (
          <div className="max-w-2xl mx-auto space-y-3">
            <h2 className="text-lg font-semibold">Personel Seciniz</h2>
            {staff.map((member) => {
              const isSelected = selectedMemberId === member.id;
              return (
                <Card
                  key={member.id}
                  className={`cursor-pointer transition-all ${isSelected ? "ring-2 ring-primary" : "hover:bg-muted/50"}`}
                  onClick={() => setSelectedMemberId(member.id)}
                >
                  <CardContent className="flex items-center gap-4 p-4">
                    <div
                      className="h-12 w-12 rounded-full flex items-center justify-center text-white font-semibold text-lg shrink-0"
                      style={{ backgroundColor: member.color || "#64748b" }}
                    >
                      {member.user.name.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{member.user.name}</p>
                      {member.title && (
                        <p className="text-sm text-muted-foreground">{member.title}</p>
                      )}
                    </div>
                    {isSelected && (
                      <Check className="h-5 w-5 text-primary" />
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Step 3: Date & Time */}
        {step === "datetime" && (
          <div className="max-w-2xl mx-auto space-y-4">
            <h2 className="text-lg font-semibold">Tarih ve Saat Seciniz</h2>

            {/* Date picker */}
            <div>
              <Label className="text-sm text-muted-foreground mb-2 block">Tarih</Label>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {dateOptions.map((d) => (
                  <button
                    key={d.value}
                    onClick={() => setSelectedDate(d.value)}
                    className={`flex flex-col items-center px-3 py-2 rounded-lg border min-w-[72px] text-sm transition-colors
                      ${selectedDate === d.value ? "bg-primary text-primary-foreground border-primary" : "hover:bg-muted"}
                    `}
                  >
                    <span className="text-[10px] uppercase">{d.label.split(" ")[0]}</span>
                    <span className="font-semibold">{d.label.split(" ").slice(1).join(" ")}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Time slots */}
            {selectedDate && (
              <div>
                <Label className="text-sm text-muted-foreground mb-2 block">
                  Musait Saatler
                  {selectedStaff && <span className="ml-1">({selectedStaff.user.name})</span>}
                </Label>
                {slotsLoading ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">Musait saatler yukleniyor...</p>
                ) : availableSlots.length > 0 ? (
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                    {availableSlots.map((slot) => (
                      <button
                        key={slot}
                        onClick={() => setSelectedTime(slot)}
                        className={`py-2 px-3 rounded-lg border text-sm font-medium transition-colors
                          ${selectedTime === slot ? "bg-primary text-primary-foreground border-primary" : "hover:bg-muted"}
                        `}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground py-4 text-center">
                    Bu tarihte musait saat bulunmuyor.
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Step 4: Customer Info */}
        {step === "info" && (
          <div className="max-w-md mx-auto space-y-4">
            <h2 className="text-lg font-semibold">Bilgilerinizi Giriniz</h2>

            {/* Summary */}
            <Card>
              <CardContent className="p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Hizmetler:</span>
                  <span>{selectedServices.map((s) => s.name).join(", ")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Personel:</span>
                  <span>{selectedStaff?.user.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tarih:</span>
                  <span>
                    {new Date(selectedDate).toLocaleDateString("tr-TR", {
                      weekday: "long", day: "numeric", month: "long",
                    })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Saat:</span>
                  <span>{selectedTime}</span>
                </div>
                <div className="flex justify-between font-medium border-t pt-2">
                  <span>Toplam ({totalDuration} dk)</span>
                  <span>{totalPrice} TL</span>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-3">
              <div className="space-y-2">
                <Label>Ad Soyad *</Label>
                <Input
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Adiniz Soyadiniz"
                />
              </div>
              <div className="space-y-2">
                <Label>Telefon *</Label>
                <Input
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="0532 xxx xx xx"
                  type="tel"
                />
              </div>
              <div className="space-y-2">
                <Label>Not (opsiyonel)</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ozel istekleriniz..."
                  rows={2}
                />
              </div>
            </div>
          </div>
        )}

        {/* Done */}
        {step === "done" && (
          <div className="max-w-md mx-auto text-center py-12">
            <div className="mx-auto h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold">Randevunuz Alindi!</h2>
            <p className="text-muted-foreground mt-2">
              {selectedStaff?.user.name} ile{" "}
              {selectedDate && new Date(selectedDate).toLocaleDateString("tr-TR", {
                day: "numeric", month: "long",
              })}{" "}
              saat {selectedTime} icin randevunuz olusturuldu.
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Isletme tarafindan onaylandiginda bilgilendirileceksiniz.
            </p>
            <div className="mt-6 flex gap-2 justify-center">
              <Button variant="outline" asChild>
                <a href={`/${domain}`}>Isletme Sayfasi</a>
              </Button>
              <Button onClick={() => {
                setStep("services");
                setSelectedServiceIds([]);
                setSelectedMemberId("");
                setSelectedDate("");
                setSelectedTime("");
                setCustomerName("");
                setCustomerPhone("");
                setNotes("");
              }}>
                Yeni Randevu Al
              </Button>
            </div>
          </div>
        )}

        {/* Navigation buttons */}
        {step !== "done" && (
          <div className="max-w-2xl mx-auto flex justify-between mt-6">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={step === "services"}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Geri
            </Button>

            {step === "info" ? (
              <Button onClick={handleSubmit} disabled={!canProceed() || isSubmitting}>
                {isSubmitting ? "Gonderiliyor..." : "Randevu Olustur"}
                <Check className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={nextStep} disabled={!canProceed()}>
                Devam Et
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t bg-background px-4 py-4 text-center text-xs text-muted-foreground">
        Powered by{" "}
        <a href="https://karendijital.click" className="font-medium text-primary hover:underline">
          Karen Dijital
        </a>
      </footer>
    </div>
  );
}
