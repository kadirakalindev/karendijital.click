"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Plus, Search, Pencil, Trash2, Users } from "lucide-react";
import { useBusiness } from "@/providers/business-provider";
import { getCustomers, createCustomer, updateCustomer, deleteCustomer } from "@/actions/customers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface Customer {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  gender: string | null;
  balance: number;
  notes: string | null;
  birthDate: string | null;
  createdAt: string;
}

export default function CustomersPage() {
  const { currentBusiness } = useBusiness();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    gender: "",
    birthDate: "",
    notes: "",
  });

  const loadCustomers = useCallback(async () => {
    if (!currentBusiness) return;
    const data = await getCustomers(currentBusiness.businessId, search || undefined);
    setCustomers(data as any);
  }, [currentBusiness, search]);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  const openNew = () => {
    setEditingCustomer(null);
    setForm({ name: "", phone: "", email: "", gender: "", birthDate: "", notes: "" });
    setIsDialogOpen(true);
  };

  const openEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setForm({
      name: customer.name,
      phone: customer.phone || "",
      email: customer.email || "",
      gender: customer.gender || "",
      birthDate: customer.birthDate ? customer.birthDate.split("T")[0] : "",
      notes: customer.notes || "",
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!currentBusiness) return;
    setIsLoading(true);

    const payload = {
      name: form.name,
      phone: form.phone || undefined,
      email: form.email || undefined,
      gender: (form.gender || undefined) as any,
      birthDate: form.birthDate || undefined,
      notes: form.notes || undefined,
    };

    const result = editingCustomer
      ? await updateCustomer(currentBusiness.businessId, editingCustomer.id, payload)
      : await createCustomer(currentBusiness.businessId, payload);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(editingCustomer ? "Musteri guncellendi" : "Musteri eklendi");
      setIsDialogOpen(false);
      loadCustomers();
    }
    setIsLoading(false);
  };

  const handleDelete = async (customer: Customer) => {
    if (!currentBusiness) return;
    if (!confirm(`${customer.name} silinecek, emin misiniz?`)) return;

    const result = await deleteCustomer(currentBusiness.businessId, customer.id);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Musteri silindi");
      loadCustomers();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Musteriler</h1>
          <p className="text-muted-foreground">
            {customers.length} kayitli musteri
          </p>
        </div>
        <Button onClick={openNew}>
          <Plus className="mr-2 h-4 w-4" />
          Yeni Musteri
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Isim, telefon veya e-posta ile ara..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {customers.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ad Soyad</TableHead>
                  <TableHead>Telefon</TableHead>
                  <TableHead>E-posta</TableHead>
                  <TableHead>Bakiye</TableHead>
                  <TableHead className="w-24">Islemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell className="font-medium">{customer.name}</TableCell>
                    <TableCell>{customer.phone || "-"}</TableCell>
                    <TableCell>{customer.email || "-"}</TableCell>
                    <TableCell>
                      <Badge variant={customer.balance >= 0 ? "secondary" : "destructive"}>
                        {customer.balance} TL
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(customer)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(customer)}>
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
                <Users className="mx-auto h-8 w-8 text-muted-foreground" />
                <p className="mt-2 text-sm text-muted-foreground">
                  {search ? "Sonuc bulunamadi" : "Henuz musteri eklenmemis"}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCustomer ? "Musteri Duzenle" : "Yeni Musteri"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Ad Soyad *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ahmet Yilmaz"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Telefon</Label>
                <Input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="0532 xxx xx xx"
                />
              </div>
              <div className="space-y-2">
                <Label>E-posta</Label>
                <Input
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="ornek@email.com"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Cinsiyet</Label>
                <Select value={form.gender} onValueChange={(v) => setForm({ ...form, gender: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seciniz" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MALE">Erkek</SelectItem>
                    <SelectItem value="FEMALE">Kadin</SelectItem>
                    <SelectItem value="OTHER">Diger</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Dogum Tarihi</Label>
                <Input
                  type="date"
                  value={form.birthDate}
                  onChange={(e) => setForm({ ...form, birthDate: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Notlar</Label>
              <Textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Musteri hakkinda notlar..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Iptal
            </Button>
            <Button onClick={handleSubmit} disabled={isLoading || !form.name}>
              {editingCustomer ? "Guncelle" : "Ekle"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
