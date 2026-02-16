import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Calendar, Users, BarChart3, Smartphone, Shield, Zap } from "lucide-react";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="border-b bg-background">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">Karen Dijital</span>
          </div>
          <nav className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost">Giris Yap</Button>
            </Link>
            <Link href="/register">
              <Button>Ucretsiz Dene</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="flex flex-1 flex-col items-center justify-center px-4 py-24 text-center">
        <h1 className="max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
          Randevu Yonetimini
          <span className="text-primary"> Kolaylastirin</span>
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
          Kuafor, guzellik salonu, estetik merkezi ve diyetisyenler icin
          profesyonel randevu yonetim sistemi. Musterilerinizi, personelinizi
          ve finanslarinizi tek yerden yonetin.
        </p>
        <div className="mt-8 flex gap-4">
          <Link href="/register">
            <Button size="lg">Hemen Baslayin</Button>
          </Link>
          <Link href="#features">
            <Button size="lg" variant="outline">
              Ozellikler
            </Button>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-t bg-muted/50 px-4 py-24">
        <div className="container mx-auto">
          <h2 className="text-center text-3xl font-bold">Neler Sunuyoruz?</h2>
          <p className="mt-4 text-center text-muted-foreground">
            Isletmenizin ihtiyac duydugu tum araclar tek bir platformda.
          </p>

          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-lg border bg-card p-6">
              <Calendar className="h-10 w-10 text-primary" />
              <h3 className="mt-4 text-lg font-semibold">Randevu Yonetimi</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Takvim gorunumunde surukle-birak ile kolay randevu olusturma ve
                yonetme.
              </p>
            </div>

            <div className="rounded-lg border bg-card p-6">
              <Users className="h-10 w-10 text-primary" />
              <h3 className="mt-4 text-lg font-semibold">Musteri Takibi</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Musteri bilgileri, gecmis islemler, borc/alacak takibi ve
                hatirlatmalar.
              </p>
            </div>

            <div className="rounded-lg border bg-card p-6">
              <BarChart3 className="h-10 w-10 text-primary" />
              <h3 className="mt-4 text-lg font-semibold">Detayli Raporlar</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Ciro, masraf, personel performansi ve hizmet dagilimi raporlari.
              </p>
            </div>

            <div className="rounded-lg border bg-card p-6">
              <Smartphone className="h-10 w-10 text-primary" />
              <h3 className="mt-4 text-lg font-semibold">Online Randevu</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Musterileriniz kendi subdomain&apos;inizden 7/24 online randevu
                alabilir.
              </p>
            </div>

            <div className="rounded-lg border bg-card p-6">
              <Shield className="h-10 w-10 text-primary" />
              <h3 className="mt-4 text-lg font-semibold">Guvenli Altyapi</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                SSL korumasinda, gunluk yedekleme ve KVKK uyumlu veri yonetimi.
              </p>
            </div>

            <div className="rounded-lg border bg-card p-6">
              <Zap className="h-10 w-10 text-primary" />
              <h3 className="mt-4 text-lg font-semibold">SMS & WhatsApp</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Otomatik randevu hatirlatma, onay ve iptal bildirimleri.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-background px-4 py-8">
        <div className="container mx-auto flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            <span className="font-semibold">Karen Dijital</span>
          </div>
          <p className="text-sm text-muted-foreground">
            &copy; 2026 Karen Dijital. Tum haklari saklidir.
          </p>
        </div>
      </footer>
    </div>
  );
}
