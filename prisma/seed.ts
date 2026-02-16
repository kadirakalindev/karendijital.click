import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Create subscription plans
  const freePlan = await prisma.subscriptionPlan.upsert({
    where: { name: "Ucretsiz" },
    update: {},
    create: {
      name: "Ucretsiz",
      description: "Kucuk isletmeler icin temel ozellikler",
      monthlyPrice: 0,
      yearlyPrice: 0,
      maxStaff: 2,
      maxCustomers: 50,
      features: ["appointments", "customers"],
    },
  });

  const proPlan = await prisma.subscriptionPlan.upsert({
    where: { name: "Profesyonel" },
    update: {},
    create: {
      name: "Profesyonel",
      description: "Buyuyen isletmeler icin gelismis ozellikler",
      monthlyPrice: 299,
      yearlyPrice: 2990,
      maxStaff: 10,
      maxCustomers: 1000,
      features: ["appointments", "customers", "reports", "sms", "packages"],
    },
  });

  await prisma.subscriptionPlan.upsert({
    where: { name: "Kurumsal" },
    update: {},
    create: {
      name: "Kurumsal",
      description: "Buyuk isletmeler icin tum ozellikler",
      monthlyPrice: 599,
      yearlyPrice: 5990,
      maxStaff: 50,
      maxCustomers: 10000,
      features: [
        "appointments",
        "customers",
        "reports",
        "sms",
        "whatsapp",
        "packages",
        "api",
      ],
    },
  });

  // Create demo user
  const hashedPassword = await bcrypt.hash("demo123", 10);

  const demoUser = await prisma.user.upsert({
    where: { email: "demo@karendijital.click" },
    update: {},
    create: {
      name: "Demo Kullanici",
      email: "demo@karendijital.click",
      password: hashedPassword,
      phone: "0532 000 00 00",
    },
  });

  const staffUser = await prisma.user.upsert({
    where: { email: "personel@karendijital.click" },
    update: {},
    create: {
      name: "Ahmet Usta",
      email: "personel@karendijital.click",
      password: hashedPassword,
      phone: "0533 000 00 00",
    },
  });

  // Create demo business
  const demoBusiness = await prisma.business.upsert({
    where: { slug: "demo-berber" },
    update: {},
    create: {
      name: "Demo Berber Salonu",
      slug: "demo-berber",
      description: "Profesyonel erkek kuaforu ve berber salonu",
      phone: "0212 000 00 00",
      email: "demo@karendijital.click",
      address: "Ornek Mah. Demo Cad. No:1",
      city: "Istanbul",
      district: "Kadikoy",
      instagram: "demoberber",
    },
  });

  // Create business memberships
  await prisma.businessMember.upsert({
    where: {
      businessId_userId: {
        businessId: demoBusiness.id,
        userId: demoUser.id,
      },
    },
    update: {},
    create: {
      businessId: demoBusiness.id,
      userId: demoUser.id,
      role: "OWNER",
      title: "Salon Sahibi",
      color: "#3B82F6",
    },
  });

  const staffMember = await prisma.businessMember.upsert({
    where: {
      businessId_userId: {
        businessId: demoBusiness.id,
        userId: staffUser.id,
      },
    },
    update: {},
    create: {
      businessId: demoBusiness.id,
      userId: staffUser.id,
      role: "STAFF",
      title: "Kuafor",
      color: "#10B981",
    },
  });

  // Create working hours (Mon-Sat 09:00-19:00)
  for (let day = 0; day <= 6; day++) {
    await prisma.businessWorkingHour.upsert({
      where: {
        businessId_dayOfWeek: {
          businessId: demoBusiness.id,
          dayOfWeek: day,
        },
      },
      update: {},
      create: {
        businessId: demoBusiness.id,
        dayOfWeek: day,
        isOpen: day !== 0, // Sunday closed
        openTime: "09:00",
        closeTime: "19:00",
        breakStart: "13:00",
        breakEnd: "14:00",
      },
    });
  }

  // Create service categories
  const sacKategori = await prisma.serviceCategory.upsert({
    where: {
      businessId_name: {
        businessId: demoBusiness.id,
        name: "Sac Bakimi",
      },
    },
    update: {},
    create: {
      businessId: demoBusiness.id,
      name: "Sac Bakimi",
      sortOrder: 0,
    },
  });

  const sakalKategori = await prisma.serviceCategory.upsert({
    where: {
      businessId_name: {
        businessId: demoBusiness.id,
        name: "Sakal & Tras",
      },
    },
    update: {},
    create: {
      businessId: demoBusiness.id,
      name: "Sakal & Tras",
      sortOrder: 1,
    },
  });

  // Create services
  const services = [
    {
      name: "Erkek Sac Kesimi",
      categoryId: sacKategori.id,
      duration: 30,
      price: 200,
      sortOrder: 0,
    },
    {
      name: "Sac Yikama & Fon",
      categoryId: sacKategori.id,
      duration: 20,
      price: 100,
      sortOrder: 1,
    },
    {
      name: "Sac Boyama",
      categoryId: sacKategori.id,
      duration: 60,
      price: 400,
      sortOrder: 2,
    },
    {
      name: "Sakal Kesimi",
      categoryId: sakalKategori.id,
      duration: 15,
      price: 100,
      sortOrder: 0,
    },
    {
      name: "Geleneksel Tras",
      categoryId: sakalKategori.id,
      duration: 20,
      price: 150,
      sortOrder: 1,
    },
  ];

  for (const service of services) {
    await prisma.service.create({
      data: {
        businessId: demoBusiness.id,
        ...service,
      },
    });
  }

  // Create customers
  const customers = [
    { name: "Mehmet Yilmaz", phone: "0531 111 11 11", gender: "MALE" as const },
    { name: "Ali Kaya", phone: "0532 222 22 22", gender: "MALE" as const },
    { name: "Hasan Demir", phone: "0533 333 33 33", gender: "MALE" as const },
    { name: "Emre Celik", phone: "0534 444 44 44", gender: "MALE" as const },
    { name: "Burak Ozturk", phone: "0535 555 55 55", gender: "MALE" as const },
  ];

  for (const customer of customers) {
    await prisma.customer.upsert({
      where: {
        businessId_phone: {
          businessId: demoBusiness.id,
          phone: customer.phone,
        },
      },
      update: {},
      create: {
        businessId: demoBusiness.id,
        ...customer,
      },
    });
  }

  // Create subscription for demo business
  await prisma.subscription.upsert({
    where: { businessId: demoBusiness.id },
    update: {},
    create: {
      businessId: demoBusiness.id,
      planId: proPlan.id,
      status: "ACTIVE",
      startDate: new Date(),
      endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    },
  });

  // Create expense categories
  const expenseCategories = ["Kira", "Fatura", "Malzeme", "Personel", "Diger"];
  for (const cat of expenseCategories) {
    await prisma.expenseCategory.upsert({
      where: {
        businessId_name: {
          businessId: demoBusiness.id,
          name: cat,
        },
      },
      update: {},
      create: {
        businessId: demoBusiness.id,
        name: cat,
      },
    });
  }

  console.log("Seed completed!");
  console.log("Demo login: demo@karendijital.click / demo123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
