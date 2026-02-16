"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Wallet, FolderPlus } from "lucide-react";
import { useBusiness } from "@/providers/business-provider";
import {
  getExpenses, getExpenseCategories, createExpense, updateExpense, deleteExpense, createExpenseCategory,
} from "@/actions/expenses";
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

interface Expense {
  id: string;
  description: string;
  amount: number;
  date: string;
  category: { id: string; name: string } | null;
}

interface Category {
  id: string;
  name: string;
}

export default function ExpensesPage() {
  const { currentBusiness } = useBusiness();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCatDialogOpen, setIsCatDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [newCatName, setNewCatName] = useState("");

  const [form, setForm] = useState({
    description: "", amount: "0", categoryId: "",
    date: new Date().toISOString().split("T")[0],
  });

  const load = useCallback(async () => {
    if (!currentBusiness) return;
    const [e, c] = await Promise.all([
      getExpenses(currentBusiness.businessId, selectedMonth),
      getExpenseCategories(currentBusiness.businessId),
    ]);
    setExpenses(e as any);
    setCategories(c as any);
  }, [currentBusiness, selectedMonth]);

  useEffect(() => { load(); }, [load]);

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

  const openNew = () => {
    setEditingExpense(null);
    setForm({ description: "", amount: "0", categoryId: "", date: new Date().toISOString().split("T")[0] });
    setIsDialogOpen(true);
  };

  const openEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setForm({
      description: expense.description,
      amount: String(expense.amount),
      categoryId: expense.category?.id || "",
      date: new Date(expense.date).toISOString().split("T")[0],
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!currentBusiness) return;
    setIsLoading(true);

    const payload = {
      description: form.description,
      amount: Number(form.amount),
      categoryId: form.categoryId || undefined,
      date: form.date,
    };

    const result = editingExpense
      ? await updateExpense(currentBusiness.businessId, editingExpense.id, payload)
      : await createExpense(currentBusiness.businessId, payload);

    if (result.error) toast.error(result.error);
    else {
      toast.success(editingExpense ? "Masraf guncellendi" : "Masraf eklendi");
      setIsDialogOpen(false);
      load();
    }
    setIsLoading(false);
  };

  const handleDelete = async (expense: Expense) => {
    if (!currentBusiness) return;
    if (!confirm("Bu masraf silinecek, emin misiniz?")) return;

    const result = await deleteExpense(currentBusiness.businessId, expense.id);
    if (result.error) toast.error(result.error);
    else { toast.success("Masraf silindi"); load(); }
  };

  const handleAddCategory = async () => {
    if (!currentBusiness) return;
    const result = await createExpenseCategory(currentBusiness.businessId, newCatName);
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
          <h1 className="text-3xl font-bold tracking-tight">Masraflar</h1>
          <p className="text-muted-foreground">
            Toplam: {totalExpenses.toFixed(2)} TL ({expenses.length} kayit)
          </p>
        </div>
        <div className="flex gap-2">
          <Input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="w-44"
          />
          <Button variant="outline" onClick={() => setIsCatDialogOpen(true)}>
            <FolderPlus className="mr-2 h-4 w-4" />
            Kategori
          </Button>
          <Button onClick={openNew}>
            <Plus className="mr-2 h-4 w-4" />
            Yeni Masraf
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          {expenses.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tarih</TableHead>
                  <TableHead>Aciklama</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead>Tutar</TableHead>
                  <TableHead className="w-24">Islemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses.map((expense) => (
                  <TableRow key={expense.id}>
                    <TableCell className="text-sm">
                      {new Date(expense.date).toLocaleDateString("tr-TR")}
                    </TableCell>
                    <TableCell className="font-medium">{expense.description}</TableCell>
                    <TableCell>
                      {expense.category ? (
                        <Badge variant="outline">{expense.category.name}</Badge>
                      ) : "-"}
                    </TableCell>
                    <TableCell className="font-medium text-destructive">{expense.amount} TL</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(expense)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(expense)}>
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
                <Wallet className="mx-auto h-8 w-8 text-muted-foreground" />
                <p className="mt-2 text-sm text-muted-foreground">Bu ay masraf kaydi yok</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Masraf Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingExpense ? "Masraf Duzenle" : "Yeni Masraf"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Aciklama *</Label>
              <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Elektrik faturasi" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tutar (TL) *</Label>
                <Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Tarih *</Label>
                <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
              </div>
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Iptal</Button>
            <Button onClick={handleSubmit} disabled={isLoading || !form.description || Number(form.amount) <= 0}>
              {editingExpense ? "Guncelle" : "Ekle"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Kategori Dialog */}
      <Dialog open={isCatDialogOpen} onOpenChange={setIsCatDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Yeni Masraf Kategorisi</DialogTitle></DialogHeader>
          <div className="space-y-2">
            <Label>Kategori Adi</Label>
            <Input value={newCatName} onChange={(e) => setNewCatName(e.target.value)} placeholder="Kira, Fatura, vb." />
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
