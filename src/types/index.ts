import { BusinessRole } from "@prisma/client";
import "next-auth";

export interface BusinessMembership {
  businessId: string;
  businessName: string;
  businessSlug: string;
  role: BusinessRole;
  memberId: string;
}

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      image?: string | null;
    };
    memberships: BusinessMembership[];
  }

  interface User {
    id: string;
  }

  interface JWT {
    id: string;
    memberships: BusinessMembership[];
  }
}
