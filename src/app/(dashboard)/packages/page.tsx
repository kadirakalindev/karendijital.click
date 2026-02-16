"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Package, X } from "lucide-react";
import { useBusiness } from "@/providers/business-provider";
import { getPackages, createPackage, updatePackage, deletePackage } from "@/actions/packages";
import { getServices } from "@/actions/services";
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
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface ServiceItem {
  id: string;
  name: string;
  price: number;
  duration: number;
}

interface PackageServiceItem {
  serviceId: string;
  quantity: number;
  service: ServiceItem;
}

interface PackageItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  packageServices: PackageServiceItem[];
}

export default function PackagesPage() {
  const { currentBusiness } = useBusiness();
  const [packages, setPackages] = useState<PackageItem[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<PackageItem | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [form, setForm] = useState({ name: "", description: "", price: "0" });
  const [selectedServices, setSelectedServices] = useState<{ serviceId: string; quantity: number }[]>([]);

  const load = useCallback(async () => {
    if (!currentBusiness) return;
    const [p, s] = await Promise.all([
      getPackages(currentBusiness.businessId),
      getServices(currentBusiness.businessId),
    ]);
    setPackages(p as any);
    setServices(s as any);
  }, [currentBusiness]);

  useEffect(() => { load(); }, [load]);

  const openNew = () => {
    setEditingPackage(null);
    setForm({ name: "", description: "", price: "0" });
    setSelectedServices([]);
    setIsDialogOpen(true);
  };

  const openEdit = (pkg: PackageItem) => {
    setEditingPackage(pkg);
    setForm({
      name: pkg.name,
      description: pkg.description || "",
      price: String(pkg.price),
    });
    setSelectedServices(
      pkg.packageServices.map((ps) => ({ serviceId: ps.serviceId, quantity: ps.quantity }))
    );
    setIsDialogOpen(true);
  };

  const addService = (serviceId: string) => {
    if (selectedServices.find((s) => s.serviceId === serviceId)) return;
    setSelectedServices([...selectedServices, { serviceId, quantity: 1 }]);
  };

  const removeService = (serviceId: string) => {
    setSelectedServices(selectedServices.filter((s) => s.serviceId !== serviceId));
  };

  const updateQuantity = (serviceId: string, quantity: number) => {
    setSelectedServices(
      selectedServices.map((s) => (s.serviceId === serviceId ? { ...s, quantity: Math.max(1, quantity) } : s))
    );
  };

  const totalServiceValue = selectedServices.reduce((sum, ss) => {
    const service = services.find((s) => s.id === ss.serviceId);
    return sum + (service ? service.price * ss.quantity : 0);
  }, 0);

  const handleSubmit = async () => {
    if (!currentBusiness) return;
    setIsLoading(true);

    const payload = {
      name: form.name,
      description: form.description || undefined,
      price: Number(form.price),
      services: selectedServices,
    };

    const result = editingPackage
      ? await updatePackage(currentBusiness.businessId, editingPackage.id, payload)
      : await createPackage(currentBusiness.businessId, payload);

    if (result.error) toast.error(result.error);
    else {
      toast.success(editingPackage ? "Paket guncellendi" : "Paket eklendi");
      setIsDialogOpen(false);
      load();
    }
    setIsLoading(false);
  };

  const handleDelete = async (pkg: PackageItem) => {
    if (!currentBusiness) return;
    if (!confirm(`${pkg.name} silinecek, emin misiniz?`)) return;

    const result = await deletePackage(currentBusiness.businessId, pkg.id);
    if (result.error) toast.error(result.error);
    else { toast.success("Paket silindi"); load(); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Paketler</h1>
          <p className="text-muted-foreground">{packages.length} aktif paket</p>
        </div>
        <Button onClick={openNew}>
          <Plus className="mr-2 h-4 w-4" />
          Yeni Paket
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          {packages.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Paket Adi</TableHead>
                  <TableHead>Hizmetler</TableHead>
                  <TableHead>Fiyat</TableHead>
                  <TableHead className="w-24">Islemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {packages.map((pkg) => (
                  <TableRow key={pkg.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{pkg.name}</p>
                        {pkg.description && (
                          <p className="text-xs text-muted-foreground">{pkg.description}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {pkg.packageServices.map((ps) => (
                          <Badge key={ps.serviceId} variant="outline" className="text-xs">
                            {ps.service.name} x{ps.quantity}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{pkg.price} TL</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(pkg)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(pkg)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex h-32 items-center justify-center">
              <div className="text-center">
                <Package className="mx-auto h-8 w-8 text-muted-foreground" />
                <p className="mt-2 text-sm text-muted-foreground">Henuz paket eklenmemis</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingPackage ? "Paket Duzenle" : "Yeni Paket"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Paket Adi *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Gelin Paketi" />
            </div>
            <div className="space-y-2">
              <Label>Aciklama</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Paket aciklamasi..." />
            </div>

            {/* Service selection */}
            <div className="space-y-2">
              <Label>Hizmetler *</Label>
              <Select onValueChange={addService} value="">
                <SelectTrigger><SelectValue placeholder="Hizmet ekle..." /></SelectTrigger>
                <SelectContent>
                  {services
                    .filter((s) => !selectedServices.find((ss) => ss.serviceId === s.id))
                    .map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.name} ({s.price} TL)</SelectItem>
                    ))}
                </SelectContent>
              </Select>

              {selectedServices.length > 0 && (
                <div className="space-y-2 mt-2">
                  {selectedServices.map((ss) => {
                    const service = services.find((s) => s.id === ss.serviceId);
                    if (!service) return null;
                    return (
                      <div key={ss.serviceId} className="flex items-center gap-2 p-2 border rounded">
                        <span className="flex-1 text-sm">{service.name}</span>
                        <span className="text-xs text-muted-foreground">{service.price} TL</span>
                        <span className="text-xs">x</span>
                        <Input
                          type="number"
                          min={1}
                          value={ss.quantity}
                          onChange={(e) => updateQuantity(ss.serviceId, Number(e.target.value))}
                          className="w-16 h-8"
                        />
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => removeService(ss.serviceId)}>
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    );
                  })}
                  <p className="text-xs text-muted-foreground">
                    Toplam hizmet degeri: {totalServiceValue} TL
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Paket Fiyati (TL) *</Label>
              <Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
              {totalServiceValue > 0 && Number(form.price) < totalServiceValue && (
                <p className="text-xs text-green-600">
                  %{Math.round((1 - Number(form.price) / totalServiceValue) * 100)} indirim
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Iptal</Button>
            <Button onClick={handleSubmit} disabled={isLoading || !form.name || selectedServices.length === 0}>
              {editingPackage ? "Guncelle" : "Ekle"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
