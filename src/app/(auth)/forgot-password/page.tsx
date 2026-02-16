"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [email, setEmail] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    // TODO: Implement password reset email
    await new Promise((r) => setTimeout(r, 1000));
    setIsSent(true);
    setIsLoading(false);
    toast.success("Sifre sifirlama baglantisi gonderildi");
  };

  if (isSent) {
    return (
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">E-posta Gonderildi</CardTitle>
          <CardDescription>
            Sifre sifirlama baglantisi {email} adresine gonderildi.
            Lutfen e-postanizi kontrol edin.
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Link href="/login" className="w-full">
            <Button variant="outline" className="w-full">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Giris sayfasina don
            </Button>
          </Link>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Sifremi Unuttum</CardTitle>
        <CardDescription>
          E-posta adresinizi girin, size sifre sifirlama baglantisi gonderelim.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">E-posta</Label>
            <Input
              id="email"
              type="email"
              placeholder="ornek@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Sifirlama Baglantisi Gonder
          </Button>
          <Link
            href="/login"
            className="text-sm text-muted-foreground hover:text-primary"
          >
            <ArrowLeft className="mr-1 inline h-3 w-3" />
            Giris sayfasina don
          </Link>
        </CardFooter>
      </form>
    </Card>
  );
}
