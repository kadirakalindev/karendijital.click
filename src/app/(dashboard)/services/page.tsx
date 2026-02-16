import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Scissors } from "lucide-react";

export default function ServicesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Hizmetler</h1>
          <p className="text-muted-foreground">
            Sundugunuz hizmetleri ve fiyatlarini yonetin.
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Yeni Hizmet
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scissors className="h-5 w-5" />
            Hizmet Listesi
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-64 items-center justify-center rounded-lg border border-dashed">
            <p className="text-muted-foreground">
              Hizmet listesi burada yer alacak (Faz 3)
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
