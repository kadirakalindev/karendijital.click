"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Plus, FileText, CreditCard, Eye } from "lucide-react";
import { useBusiness } from "@/providers/business-provider";
import { getInvoices, createManualInvoice, addPayment } from "@/actions/invoices";
import { getCustomers } from "@/actions/customers";
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

interface Payment {
  id: string;
  amount: number;
  method: string;
  paidAt: string;
}

interface InvoiceItem {
  id: string;
  invoiceNo: string;
  subtotal: number;
  discount: number;
  total: number;
  status: string;
  notes: string | null;
  createdAt: string;
  customer: { id: string; name: string; phone: string | null } | null;
  appointment: { id: string; startTime: string; member: { user: { name: string } } } | null;
  payments: Payment[];
}

interface CustomerItem {
  id: string;
  name: string;
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Odenmedi",
  PARTIAL: "Kismi Odendi",
  PAID: "Odendi",
};

const STATUS_COLORS: Record<string, "destructive" | "secondary" | "default"> = {
  PENDING: "destructive",
  PARTIAL: "secondary",
  PAID: "default",
};

const METHOD_LABELS: Record<string, string> = {
  CASH: "Nakit",
  CREDIT_CARD: "Kredi Karti",
  BANK_TRANSFER: "Havale/EFT",
  OTHER: "Diger",
};

export default function InvoicesPage() {
  const { currentBusiness } = useBusiness();
  const [invoices, setInvoices] = useState<InvoiceItem[]>([]);
  const [customers, setCustomers] = useState<CustomerItem[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isPayOpen, setIsPayOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceItem | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [form, setForm] = useState({ customerId: "", subtotal: "0", discount: "0", notes: "" });
  const [payForm, setPayForm] = useState({ amount: "0", method: "CASH", note: "" });

  const load = useCallback(async () => {
    if (!currentBusiness) return;
    const [inv, cst] = await Promise.all([
      getInvoices(currentBusiness.businessId, selectedMonth),
      getCustomers(currentBusiness.businessId),
    ]);
    setInvoices(inv as any);
    setCustomers(cst as any);
  }, [currentBusiness, selectedMonth]);

  useEffect(() => { load(); }, [load]);

  const totalRevenue = invoices.reduce((sum, i) => sum + i.total, 0);
  const totalPaid = invoices.reduce(
    (sum, i) => sum + i.payments.reduce((ps, p) => ps + p.amount, 0), 0
  );

  const handleCreateInvoice = async () => {
    if (!currentBusiness) return;
    setIsLoading(true);
    const result = await createManualInvoice(currentBusiness.businessId, {
      customerId: form.customerId || undefined,
      subtotal: Number(form.subtotal),
      discount: Number(form.discount),
      notes: form.notes || undefined,
    });
    if (result.error) toast.error(result.error);
    else { toast.success("Fatura olusturuldu"); setIsCreateOpen(false); load(); }
    setIsLoading(false);
  };

  const openPayment = (invoice: InvoiceItem) => {
    setSelectedInvoice(invoice);
    const paid = invoice.payments.reduce((sum, p) => sum + p.amount, 0);
    setPayForm({ amount: String(invoice.total - paid), method: "CASH", note: "" });
    setIsPayOpen(true);
  };

  const handlePayment = async () => {
    if (!currentBusiness || !selectedInvoice) return;
    setIsLoading(true);
    const result = await addPayment(currentBusiness.businessId, selectedInvoice.id, {
      amount: Number(payForm.amount),
      method: payForm.method,
      note: payForm.note || undefined,
    });
    if (result.error) toast.error(result.error);
    else { toast.success("Odeme kaydedildi"); setIsPayOpen(false); load(); }
    setIsLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Faturalar</h1>
          <p className="text-muted-foreground">
            Toplam: {totalRevenue.toFixed(0)} TL | Tahsil: {totalPaid.toFixed(0)} TL
          </p>
        </div>
        <div className="flex gap-2">
          <Input type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="w-44" />
          <Button onClick={() => {
            setForm({ customerId: "", subtotal: "0", discount: "0", notes: "" });
            setIsCreateOpen(true);
          }}>
            <Plus className="mr-2 h-4 w-4" />
            Yeni Fatura
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          {invoices.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fatura No</TableHead>
                  <TableHead>Musteri</TableHead>
                  <TableHead>Tarih</TableHead>
                  <TableHead>Tutar</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead className="w-28">Islemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((inv) => {
                  const paidAmount = inv.payments.reduce((s, p) => s + p.amount, 0);
                  return (
                    <TableRow key={inv.id}>
                      <TableCell className="font-mono text-sm">{inv.invoiceNo}</TableCell>
                      <TableCell>{inv.customer?.name || "-"}</TableCell>
                      <TableCell className="text-sm">
                        {new Date(inv.createdAt).toLocaleDateString("tr-TR")}
                      </TableCell>
                      <TableCell>
                        <div>
                          <span className="font-medium">{inv.total} TL</span>
                          {inv.discount > 0 && (
                            <span className="text-xs text-muted-foreground ml-1">(-{inv.discount})</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={STATUS_COLORS[inv.status]}>
                          {STATUS_LABELS[inv.status]}
                          {inv.status === "PARTIAL" && ` (${paidAmount}/${inv.total})`}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => { setSelectedInvoice(inv); setIsDetailOpen(true); }}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          {inv.status !== "PAID" && (
                            <Button variant="ghost" size="icon" onClick={() => openPayment(inv)}>
                              <CreditCard className="h-4 w-4 text-green-600" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="flex h-32 items-center justify-center">
              <div className="text-center">
                <FileText className="mx-auto h-8 w-8 text-muted-foreground" />
                <p className="mt-2 text-sm text-muted-foreground">Bu ay fatura kaydi yok</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Invoice Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Yeni Fatura</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Musteri</Label>
              <Select value={form.customerId} onValueChange={(v) => setForm({ ...form, customerId: v })}>
                <SelectTrigger><SelectValue placeholder="Musteri seciniz (opsiyonel)" /></SelectTrigger>
                <SelectContent>
                  {customers.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tutar (TL) *</Label>
                <Input type="number" value={form.subtotal} onChange={(e) => setForm({ ...form, subtotal: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Indirim (TL)</Label>
                <Input type="number" value={form.discount} onChange={(e) => setForm({ ...form, discount: e.target.value })} />
              </div>
            </div>
            {Number(form.subtotal) > 0 && (
              <p className="text-sm font-medium">
                Toplam: {Math.max(0, Number(form.subtotal) - Number(form.discount))} TL
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Iptal</Button>
            <Button onClick={handleCreateInvoice} disabled={isLoading || Number(form.subtotal) <= 0}>Olustur</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog open={isPayOpen} onOpenChange={setIsPayOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Odeme Kaydet</DialogTitle></DialogHeader>
          {selectedInvoice && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Fatura: {selectedInvoice.invoiceNo} | Kalan: {(selectedInvoice.total - selectedInvoice.payments.reduce((s, p) => s + p.amount, 0)).toFixed(0)} TL
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tutar (TL) *</Label>
                  <Input type="number" value={payForm.amount} onChange={(e) => setPayForm({ ...payForm, amount: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Odeme Yontemi</Label>
                  <Select value={payForm.method} onValueChange={(v) => setPayForm({ ...payForm, method: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CASH">Nakit</SelectItem>
                      <SelectItem value="CREDIT_CARD">Kredi Karti</SelectItem>
                      <SelectItem value="BANK_TRANSFER">Havale/EFT</SelectItem>
                      <SelectItem value="OTHER">Diger</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Not</Label>
                <Input value={payForm.note} onChange={(e) => setPayForm({ ...payForm, note: e.target.value })} placeholder="Odeme notu..." />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPayOpen(false)}>Iptal</Button>
            <Button onClick={handlePayment} disabled={isLoading || Number(payForm.amount) <= 0}>Kaydet</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Fatura Detayi</DialogTitle></DialogHeader>
          {selectedInvoice && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-y-2 text-sm">
                <span className="text-muted-foreground">Fatura No:</span>
                <span className="font-mono">{selectedInvoice.invoiceNo}</span>
                <span className="text-muted-foreground">Musteri:</span>
                <span>{selectedInvoice.customer?.name || "-"}</span>
                <span className="text-muted-foreground">Tarih:</span>
                <span>{new Date(selectedInvoice.createdAt).toLocaleDateString("tr-TR")}</span>
                <span className="text-muted-foreground">Ara Toplam:</span>
                <span>{selectedInvoice.subtotal} TL</span>
                {selectedInvoice.discount > 0 && (
                  <>
                    <span className="text-muted-foreground">Indirim:</span>
                    <span>-{selectedInvoice.discount} TL</span>
                  </>
                )}
                <span className="text-muted-foreground font-medium">Toplam:</span>
                <span className="font-medium">{selectedInvoice.total} TL</span>
              </div>

              {selectedInvoice.payments.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">Odemeler</p>
                  <div className="space-y-1">
                    {selectedInvoice.payments.map((p) => (
                      <div key={p.id} className="flex justify-between text-sm border-b pb-1">
                        <span>
                          {new Date(p.paidAt).toLocaleDateString("tr-TR")} - {METHOD_LABELS[p.method]}
                        </span>
                        <span className="font-medium text-green-600">{p.amount} TL</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Badge variant={STATUS_COLORS[selectedInvoice.status]}>
                {STATUS_LABELS[selectedInvoice.status]}
              </Badge>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailOpen(false)}>Kapat</Button>
            {selectedInvoice && selectedInvoice.status !== "PAID" && (
              <Button onClick={() => { setIsDetailOpen(false); openPayment(selectedInvoice); }}>
                <CreditCard className="mr-2 h-4 w-4" /> Odeme Kaydet
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
