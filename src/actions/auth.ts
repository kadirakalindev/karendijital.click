"use server";

import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signIn } from "@/lib/auth";
import { loginSchema, registerSchema } from "@/lib/validations";
import { slugify } from "@/lib/utils";

export async function login(formData: { email: string; password: string }) {
  const validated = loginSchema.safeParse(formData);
  if (!validated.success) {
    return { error: validated.error.issues[0].message };
  }

  try {
    await signIn("credentials", {
      email: validated.data.email,
      password: validated.data.password,
      redirect: false,
    });
    return { success: true };
  } catch {
    return { error: "E-posta veya sifre hatali" };
  }
}

export async function register(formData: {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  businessName: string;
  businessSlug: string;
  phone?: string;
}) {
  const validated = registerSchema.safeParse(formData);
  if (!validated.success) {
    return { error: validated.error.issues[0].message };
  }

  const { name, email, password, businessName, businessSlug, phone } =
    validated.data;

  // Check if email already exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });
  if (existingUser) {
    return { error: "Bu e-posta adresi zaten kayitli" };
  }

  // Check if slug already exists
  const slug = slugify(businessSlug);
  const existingBusiness = await prisma.business.findUnique({
    where: { slug },
  });
  if (existingBusiness) {
    return { error: "Bu subdomain zaten kullaniliyor" };
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  // Create user + business + membership in a transaction
  await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        phone,
      },
    });

    const business = await tx.business.create({
      data: {
        name: businessName,
        slug,
        email,
        phone,
      },
    });

    await tx.businessMember.create({
      data: {
        businessId: business.id,
        userId: user.id,
        role: "OWNER",
        title: "Isletme Sahibi",
      },
    });

    // Create default working hours (Mon-Sat 09:00-19:00)
    const defaultHours = [1, 2, 3, 4, 5, 6].map((day) => ({
      businessId: business.id,
      dayOfWeek: day,
      isOpen: true,
      openTime: "09:00",
      closeTime: "19:00",
    }));

    // Sunday closed
    defaultHours.push({
      businessId: business.id,
      dayOfWeek: 0,
      isOpen: false,
      openTime: "09:00",
      closeTime: "19:00",
    });

    await tx.businessWorkingHour.createMany({ data: defaultHours });
  });

  // Auto login
  try {
    await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    return { success: true };
  } catch {
    return { success: true, redirect: "/login" };
  }
}
