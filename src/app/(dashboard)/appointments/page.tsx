import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Calendar } from "lucide-react";

export default function AppointmentsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Randevular</h1>
          <p className="text-muted-foreground">
            Randevularinizi takvim uzerinden yonetin.
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Yeni Randevu
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Takvim
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-96 items-center justify-center rounded-lg border border-dashed">
            <p className="text-muted-foreground">
              Takvim gorunumu burada yer alacak (FullCalendar entegrasyonu - Faz 4)
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
