import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, Clock, CalendarOff, Bell, CreditCard, ImageIcon } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Ayarlar</h1>
        <p className="text-muted-foreground">
          Isletme ayarlarinizi yapilandirin.
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList>
          <TabsTrigger value="profile">
            <Settings className="mr-2 h-4 w-4" />
            Profil
          </TabsTrigger>
          <TabsTrigger value="hours">
            <Clock className="mr-2 h-4 w-4" />
            Calisma Saatleri
          </TabsTrigger>
          <TabsTrigger value="holidays">
            <CalendarOff className="mr-2 h-4 w-4" />
            Tatil Gunleri
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="mr-2 h-4 w-4" />
            Bildirimler
          </TabsTrigger>
          <TabsTrigger value="subscription">
            <CreditCard className="mr-2 h-4 w-4" />
            Abonelik
          </TabsTrigger>
          <TabsTrigger value="gallery">
            <ImageIcon className="mr-2 h-4 w-4" />
            Galeri
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Isletme Profili</CardTitle>
              <CardDescription>
                Isletmenizin temel bilgilerini duzenleyin.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex h-48 items-center justify-center rounded-lg border border-dashed">
                <p className="text-muted-foreground">
                  Profil formu burada yer alacak (Faz 2)
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="hours">
          <Card>
            <CardHeader>
              <CardTitle>Calisma Saatleri</CardTitle>
              <CardDescription>
                Isletmenizin calisma gun ve saatlerini belirleyin.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex h-48 items-center justify-center rounded-lg border border-dashed">
                <p className="text-muted-foreground">
                  Calisma saatleri formu burada yer alacak (Faz 2)
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="holidays">
          <Card>
            <CardHeader>
              <CardTitle>Tatil Gunleri</CardTitle>
              <CardDescription>
                Isletmenizin kapali oldugu ozel gunleri belirleyin.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex h-48 items-center justify-center rounded-lg border border-dashed">
                <p className="text-muted-foreground">
                  Tatil gunleri formu burada yer alacak (Faz 2)
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Bildirim Ayarlari</CardTitle>
              <CardDescription>
                SMS ve WhatsApp bildirim ayarlarini yapilandirin.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex h-48 items-center justify-center rounded-lg border border-dashed">
                <p className="text-muted-foreground">
                  Bildirim ayarlari burada yer alacak (Faz 7)
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subscription">
          <Card>
            <CardHeader>
              <CardTitle>Abonelik</CardTitle>
              <CardDescription>
                Abonelik planini goruntuleyip degistirin.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex h-48 items-center justify-center rounded-lg border border-dashed">
                <p className="text-muted-foreground">
                  Abonelik yonetimi burada yer alacak (Faz 8)
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="gallery">
          <Card>
            <CardHeader>
              <CardTitle>Galeri</CardTitle>
              <CardDescription>
                Isletmenizin fotograf galerisini yonetin.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex h-48 items-center justify-center rounded-lg border border-dashed">
                <p className="text-muted-foreground">
                  Galeri yonetimi burada yer alacak (Faz 7)
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
