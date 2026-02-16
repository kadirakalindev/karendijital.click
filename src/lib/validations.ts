import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Geçerli bir e-posta adresi girin"),
  password: z.string().min(6, "Şifre en az 6 karakter olmalı"),
});

export const registerSchema = z
  .object({
    name: z.string().min(2, "İsim en az 2 karakter olmalı"),
    email: z.string().email("Geçerli bir e-posta adresi girin"),
    password: z.string().min(6, "Şifre en az 6 karakter olmalı"),
    confirmPassword: z.string(),
    businessName: z.string().min(2, "İşletme adı en az 2 karakter olmalı"),
    businessSlug: z
      .string()
      .min(3, "Subdomain en az 3 karakter olmalı")
      .max(30, "Subdomain en fazla 30 karakter olmalı")
      .regex(
        /^[a-z0-9-]+$/,
        "Sadece küçük harf, rakam ve tire kullanılabilir"
      ),
    phone: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Şifreler eşleşmiyor",
    path: ["confirmPassword"],
  });

export const customerSchema = z.object({
  name: z.string().min(2, "İsim en az 2 karakter olmalı"),
  phone: z.string().optional(),
  email: z.string().email("Geçerli bir e-posta adresi girin").optional().or(z.literal("")),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]).optional(),
  birthDate: z.string().optional(),
  notes: z.string().optional(),
});

export const serviceSchema = z.object({
  name: z.string().min(2, "Hizmet adı en az 2 karakter olmalı"),
  categoryId: z.string().optional(),
  description: z.string().optional(),
  duration: z.number().min(5, "Süre en az 5 dakika olmalı"),
  price: z.number().min(0, "Fiyat 0'dan küçük olamaz"),
});

export const appointmentSchema = z.object({
  customerId: z.string().optional(),
  customerName: z.string().optional(),
  customerPhone: z.string().optional(),
  memberId: z.string().min(1, "Personel seçilmeli"),
  startTime: z.string().min(1, "Başlangıç zamanı gerekli"),
  services: z
    .array(
      z.object({
        serviceId: z.string(),
        price: z.number(),
        duration: z.number(),
      })
    )
    .min(1, "En az bir hizmet seçilmeli"),
  notes: z.string().optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type CustomerInput = z.infer<typeof customerSchema>;
export type ServiceInput = z.infer<typeof serviceSchema>;
export type AppointmentInput = z.infer<typeof appointmentSchema>;
