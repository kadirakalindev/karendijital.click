import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function getCurrentMembership(businessId: string) {
  const session = await auth();
  if (!session?.user?.id) return null;

  const membership = await prisma.businessMember.findUnique({
    where: {
      businessId_userId: {
        businessId,
        userId: session.user.id,
      },
    },
    include: {
      business: true,
    },
  });

  if (!membership || !membership.isActive) return null;

  return membership;
}
