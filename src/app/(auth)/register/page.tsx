"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { registerSchema, type RegisterInput } from "@/lib/validations";
import { register as registerAction } from "@/actions/auth";
import { slugify } from "@/lib/utils";
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

export default function RegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  });

  const businessSlug = watch("businessSlug");

  const onSubmit = async (data: RegisterInput) => {
    setIsLoading(true);
    try {
      const result = await registerAction(data);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Kayit basarili!");
        router.push("/dashboard");
        router.refresh();
      }
    } catch {
      toast.error("Bir hata olustu");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Kayit Ol</CardTitle>
        <CardDescription>
          Yeni bir isletme hesabi olusturun
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Ad Soyad</Label>
            <Input
              id="name"
              placeholder="Ahmet Yilmaz"
              {...register("name")}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">E-posta</Label>
            <Input
              id="email"
              type="email"
              placeholder="ornek@email.com"
              {...register("email")}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Telefon (Opsiyonel)</Label>
            <Input
              id="phone"
              placeholder="0532 xxx xx xx"
              {...register("phone")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="businessName">Isletme Adi</Label>
            <Input
              id="businessName"
              placeholder="X Berber"
              {...register("businessName")}
              onChange={(e) => {
                register("businessName").onChange(e);
                setValue("businessSlug", slugify(e.target.value));
              }}
            />
            {errors.businessName && (
              <p className="text-sm text-destructive">
                {errors.businessName.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="businessSlug">Subdomain</Label>
            <div className="flex items-center gap-1">
              <Input
                id="businessSlug"
                placeholder="x-berber"
                {...register("businessSlug")}
              />
              <span className="whitespace-nowrap text-sm text-muted-foreground">
                .karendijital.click
              </span>
            </div>
            {businessSlug && (
              <p className="text-xs text-muted-foreground">
                Adresiniz: {businessSlug}.karendijital.click
              </p>
            )}
            {errors.businessSlug && (
              <p className="text-sm text-destructive">
                {errors.businessSlug.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Sifre</Label>
            <Input
              id="password"
              type="password"
              placeholder="******"
              {...register("password")}
            />
            {errors.password && (
              <p className="text-sm text-destructive">
                {errors.password.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Sifre Tekrari</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="******"
              {...register("confirmPassword")}
            />
            {errors.confirmPassword && (
              <p className="text-sm text-destructive">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Kayit Ol
          </Button>
          <p className="text-sm text-muted-foreground">
            Zaten hesabiniz var mi?{" "}
            <Link href="/login" className="text-primary hover:underline">
              Giris Yap
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
