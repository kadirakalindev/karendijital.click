import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Phone, Mail, Clock, Instagram, Globe } from "lucide-react";

export default async function BusinessPublicPage({
  params,
}: {
  params: Promise<{ domain: string }>;
}) {
  const { domain } = await params;

  const business = await prisma.business.findUnique({
    where: { slug: domain },
    include: {
      workingHours: { orderBy: { dayOfWeek: "asc" } },
      services: {
        where: { isActive: true },
        include: { category: true },
        orderBy: { sortOrder: "asc" },
      },
      gallery: { orderBy: { sortOrder: "asc" } },
      members: {
        where: { isActive: true },
        include: { user: { select: { name: true, image: true } } },
      },
    },
  });

  if (!business || !business.isActive) {
    notFound();
  }

  const dayNames = ["Pazar", "Pazartesi", "Sali", "Carsamba", "Persembe", "Cuma", "Cumartesi"];

  return (
    <div className="min-h-screen bg-muted/50">
      {/* Header */}
      <div className="bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 py-12 text-center">
          <h1 className="text-3xl font-bold">{business.name}</h1>
          {business.description && (
            <p className="mt-2 text-primary-foreground/80">
              {business.description}
            </p>
          )}
          {business.address && (
            <p className="mt-2 flex items-center justify-center gap-1 text-sm text-primary-foreground/70">
              <MapPin className="h-4 w-4" />
              {business.address}
              {business.district && `, ${business.district}`}
              {business.city && ` / ${business.city}`}
            </p>
          )}
          <div className="mt-4 flex items-center justify-center gap-4">
            {business.phone && (
              <a href={`tel:${business.phone}`} className="flex items-center gap-1 text-sm hover:underline">
                <Phone className="h-4 w-4" />
                {business.phone}
              </a>
            )}
            {business.instagram && (
              <a
                href={`https://instagram.com/${business.instagram}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-sm hover:underline"
              >
                <Instagram className="h-4 w-4" />
                @{business.instagram}
              </a>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto grid gap-6 px-4 py-8 md:grid-cols-3">
        {/* Services */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Hizmetlerimiz</CardTitle>
            </CardHeader>
            <CardContent>
              {business.services.length > 0 ? (
                <div className="space-y-3">
                  {business.services.map((service) => (
                    <div
                      key={service.id}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div>
                        <p className="font-medium">{service.name}</p>
                        {service.description && (
                          <p className="text-sm text-muted-foreground">
                            {service.description}
                          </p>
                        )}
                        <div className="mt-1 flex gap-2">
                          <Badge variant="secondary">{service.duration} dk</Badge>
                          {service.category && (
                            <Badge variant="outline">{service.category.name}</Badge>
                          )}
                        </div>
                      </div>
                      <p className="text-lg font-semibold">{service.price} TL</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">
                  Henuz hizmet eklenmemis.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Team */}
          {business.members.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Ekibimiz</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 sm:grid-cols-2">
                  {business.members.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center gap-3 rounded-lg border p-3"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                        {member.user.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium">{member.user.name}</p>
                        {member.title && (
                          <p className="text-sm text-muted-foreground">
                            {member.title}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar - Working Hours & Contact */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Calisma Saatleri
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {business.workingHours.map((wh) => (
                  <div
                    key={wh.id}
                    className="flex items-center justify-between text-sm"
                  >
                    <span>{dayNames[wh.dayOfWeek]}</span>
                    <span className={wh.isOpen ? "" : "text-muted-foreground"}>
                      {wh.isOpen
                        ? `${wh.openTime} - ${wh.closeTime}`
                        : "Kapali"}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Iletisim</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {business.phone && (
                <a
                  href={`tel:${business.phone}`}
                  className="flex items-center gap-2 text-sm hover:text-primary"
                >
                  <Phone className="h-4 w-4" />
                  {business.phone}
                </a>
              )}
              {business.email && (
                <a
                  href={`mailto:${business.email}`}
                  className="flex items-center gap-2 text-sm hover:text-primary"
                >
                  <Mail className="h-4 w-4" />
                  {business.email}
                </a>
              )}
              {business.website && (
                <a
                  href={business.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm hover:text-primary"
                >
                  <Globe className="h-4 w-4" />
                  {business.website}
                </a>
              )}
              {business.address && (
                <p className="flex items-start gap-2 text-sm">
                  <MapPin className="h-4 w-4 mt-0.5" />
                  {business.address}
                  {business.district && `, ${business.district}`}
                  {business.city && ` / ${business.city}`}
                </p>
              )}
            </CardContent>
          </Card>

          <Button className="w-full" size="lg" asChild>
            <a href={`/${domain}/randevu`}>Online Randevu Al</a>
          </Button>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t bg-background px-4 py-6 text-center text-sm text-muted-foreground">
        <p>
          Powered by{" "}
          <a href="https://karendijital.click" className="font-medium text-primary hover:underline">
            Karen Dijital
          </a>
        </p>
      </footer>
    </div>
  );
}
