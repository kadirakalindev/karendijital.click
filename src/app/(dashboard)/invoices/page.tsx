import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText } from "lucide-react";

export default function InvoicesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Faturalar</h1>
        <p className="text-muted-foreground">
          Fatura ve tahsilat kayitlarini yonetin.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Fatura Listesi
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-64 items-center justify-center rounded-lg border border-dashed">
            <p className="text-muted-foreground">
              Fatura listesi burada yer alacak (Faz 5)
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
