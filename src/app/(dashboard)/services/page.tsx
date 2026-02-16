"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Scissors, FolderPlus } from "lucide-react";
import { useBusiness } from "@/providers/business-provider";
import {
  getServices,
  getServiceCategories,
  createService,
  updateService,
  deleteService,
  createServiceCategory,
} from "@/actions/services";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

interface Service {
  id: string;
  name: string;
  description: string | null;
  duration: number;
  price: number;
  category: { id: string; name: string } | null;
}

interface Category {
  id: string;
  name: string;
}

export default function ServicesPage() {
  const { currentBusiness } = useBusiness();
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCatDialogOpen, setIsCatDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [newCatName, setNewCatName] = useState("");

  const [form, setForm] = useState({
    name: "", categoryId: "", description: "", duration: "30", price: "0",
  });

  const load = useCallback(async () => {
    if (!currentBusiness) return;
    const [s, c] = await Promise.all([
      getServices(currentBusiness.businessId),
      getServiceCategories(currentBusiness.businessId),
    ]);
    setServices(s as any);
    setCategories(c as any);
  }, [currentBusiness]);

  useEffect(() => { load(); }, [load]);

  const openNew = () => {
    setEditingService(null);
    setForm({ name: "", categoryId: "", description: "", duration: "30", price: "0" });
    setIsDialogOpen(true);
  };

  const openEdit = (service: Service) => {
    setEditingService(service);
    setForm({
      name: service.name,
      categoryId: service.category?.id || "",
      description: service.description || "",
      duration: String(service.duration),
      price: String(service.price),
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!currentBusiness) return;
    setIsLoading(true);

    const payload = {
      name: form.name,
      categoryId: form.categoryId || undefined,
      description: form.description || undefined,
      duration: Number(form.duration),
      price: Number(form.price),
    };

    const result = editingService
      ? await updateService(currentBusiness.businessId, editingService.id, payload)
      : await createService(currentBusiness.businessId, payload);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(editingService ? "Hizmet guncellendi" : "Hizmet eklendi");
      setIsDialogOpen(false);
      load();
    }
    setIsLoading(false);
  };

  const handleDelete = async (service: Service) => {
    if (!currentBusiness) return;
    if (!confirm(`${service.name} silinecek, emin misiniz?`)) return;

    const result = await deleteService(currentBusiness.businessId, service.id);
    if (result.error) toast.error(result.error);
    else { toast.success("Hizmet silindi"); load(); }
  };

  const handleAddCategory = async () => {
    if (!currentBusiness) return;
    const result = await createServiceCategory(currentBusiness.businessId, newCatName);
    if (result.error) toast.error(result.error);
    else {
      toast.success("Kategori eklendi");
      setNewCatName("");
      setIsCatDialogOpen(false);
      load();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Hizmetler</h1>
          <p className="text-muted-foreground">{services.length} aktif hizmet</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsCatDialogOpen(true)}>
            <FolderPlus className="mr-2 h-4 w-4" />
            Kategori Ekle
          </Button>
          <Button onClick={openNew}>
            <Plus className="mr-2 h-4 w-4" />
            Yeni Hizmet
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          {services.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Hizmet Adi</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead>Sure</TableHead>
                  <TableHead>Fiyat</TableHead>
                  <TableHead className="w-24">Islemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {services.map((service) => (
                  <TableRow key={service.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{service.name}</p>
                        {service.description && (
                          <p className="text-xs text-muted-foreground">{service.description}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {service.category ? (
                        <Badge variant="outline">{service.category.name}</Badge>
                      ) : "-"}
                    </TableCell>
                    <TableCell>{service.duration} dk</TableCell>
                    <TableCell className="font-medium">{service.price} TL</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(service)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(service)}>
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
                <Scissors className="mx-auto h-8 w-8 text-muted-foreground" />
                <p className="mt-2 text-sm text-muted-foreground">Henuz hizmet eklenmemis</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Hizmet Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingService ? "Hizmet Duzenle" : "Yeni Hizmet"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Hizmet Adi *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Sac Kesimi" />
            </div>
            <div className="space-y-2">
              <Label>Kategori</Label>
              <Select value={form.categoryId} onValueChange={(v) => setForm({ ...form, categoryId: v })}>
                <SelectTrigger><SelectValue placeholder="Kategori seciniz" /></SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Sure (dakika) *</Label>
                <Input type="number" value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Fiyat (TL) *</Label>
                <Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Aciklama</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Hizmet aciklamasi..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Iptal</Button>
            <Button onClick={handleSubmit} disabled={isLoading || !form.name}>{editingService ? "Guncelle" : "Ekle"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Kategori Dialog */}
      <Dialog open={isCatDialogOpen} onOpenChange={setIsCatDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Yeni Kategori</DialogTitle></DialogHeader>
          <div className="space-y-2">
            <Label>Kategori Adi</Label>
            <Input value={newCatName} onChange={(e) => setNewCatName(e.target.value)} placeholder="Sac Bakimi" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCatDialogOpen(false)}>Iptal</Button>
            <Button onClick={handleAddCategory} disabled={!newCatName}>Ekle</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
