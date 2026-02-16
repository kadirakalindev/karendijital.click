"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, ShoppingBag } from "lucide-react";
import { useBusiness } from "@/providers/business-provider";
import { getProducts, createProduct, updateProduct, deleteProduct } from "@/actions/products";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  stock: number;
}

export default function ProductsPage() {
  const { currentBusiness } = useBusiness();
  const [products, setProducts] = useState<Product[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [form, setForm] = useState({
    name: "", description: "", price: "0", stock: "0",
  });

  const load = useCallback(async () => {
    if (!currentBusiness) return;
    const data = await getProducts(currentBusiness.businessId);
    setProducts(data as any);
  }, [currentBusiness]);

  useEffect(() => { load(); }, [load]);

  const openNew = () => {
    setEditingProduct(null);
    setForm({ name: "", description: "", price: "0", stock: "0" });
    setIsDialogOpen(true);
  };

  const openEdit = (product: Product) => {
    setEditingProduct(product);
    setForm({
      name: product.name,
      description: product.description || "",
      price: String(product.price),
      stock: String(product.stock),
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!currentBusiness) return;
    setIsLoading(true);

    const payload = {
      name: form.name,
      description: form.description || undefined,
      price: Number(form.price),
      stock: Number(form.stock),
    };

    const result = editingProduct
      ? await updateProduct(currentBusiness.businessId, editingProduct.id, payload)
      : await createProduct(currentBusiness.businessId, payload);

    if (result.error) toast.error(result.error);
    else {
      toast.success(editingProduct ? "Urun guncellendi" : "Urun eklendi");
      setIsDialogOpen(false);
      load();
    }
    setIsLoading(false);
  };

  const handleDelete = async (product: Product) => {
    if (!currentBusiness) return;
    if (!confirm(`${product.name} silinecek, emin misiniz?`)) return;

    const result = await deleteProduct(currentBusiness.businessId, product.id);
    if (result.error) toast.error(result.error);
    else { toast.success("Urun silindi"); load(); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Urunler</h1>
          <p className="text-muted-foreground">{products.length} aktif urun</p>
        </div>
        <Button onClick={openNew}>
          <Plus className="mr-2 h-4 w-4" />
          Yeni Urun
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          {products.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Urun Adi</TableHead>
                  <TableHead>Stok</TableHead>
                  <TableHead>Fiyat</TableHead>
                  <TableHead className="w-24">Islemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{product.name}</p>
                        {product.description && (
                          <p className="text-xs text-muted-foreground">{product.description}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={product.stock > 0 ? "secondary" : "destructive"}>
                        {product.stock} adet
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{product.price} TL</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(product)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(product)}>
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
                <ShoppingBag className="mx-auto h-8 w-8 text-muted-foreground" />
                <p className="mt-2 text-sm text-muted-foreground">Henuz urun eklenmemis</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingProduct ? "Urun Duzenle" : "Yeni Urun"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Urun Adi *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Sac Bakim Kremi" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Fiyat (TL) *</Label>
                <Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Stok Adedi</Label>
                <Input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Aciklama</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Urun aciklamasi..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Iptal</Button>
            <Button onClick={handleSubmit} disabled={isLoading || !form.name}>{editingProduct ? "Guncelle" : "Ekle"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
