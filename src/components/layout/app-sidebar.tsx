"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Calendar,
  Users,
  Scissors,
  Package,
  ShoppingBag,
  UserCog,
  FileText,
  BarChart3,
  Wallet,
  Settings,
  LayoutDashboard,
  Building2,
  ChevronsUpDown,
  LogOut,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { useBusiness } from "@/providers/business-provider";
import { cn } from "@/lib/utils";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const mainNavItems = [
  { title: "Panel", href: "/dashboard", icon: LayoutDashboard },
  { title: "Randevular", href: "/appointments", icon: Calendar },
  { title: "Musteriler", href: "/customers", icon: Users },
];

const managementNavItems = [
  { title: "Hizmetler", href: "/services", icon: Scissors },
  { title: "Urunler", href: "/products", icon: ShoppingBag },
  { title: "Paketler", href: "/packages", icon: Package },
  { title: "Personel", href: "/staff", icon: UserCog },
];

const financeNavItems = [
  { title: "Faturalar", href: "/invoices", icon: FileText },
  { title: "Masraflar", href: "/expenses", icon: Wallet },
  { title: "Raporlar", href: "/reports", icon: BarChart3 },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { currentBusiness, businesses, switchBusiness } = useBusiness();

  return (
    <Sidebar>
      <SidebarHeader className="border-b px-4 py-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex w-full items-center gap-3 rounded-md p-1 text-left hover:bg-accent">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                  {currentBusiness?.businessName?.charAt(0) || "K"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {currentBusiness?.businessName || "Isletme Sec"}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {currentBusiness?.role || ""}
                </p>
              </div>
              <ChevronsUpDown className="h-4 w-4 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            {businesses.map((b) => (
              <DropdownMenuItem
                key={b.businessId}
                onClick={() => switchBusiness(b.businessId)}
                className={cn(
                  currentBusiness?.businessId === b.businessId && "bg-accent"
                )}
              >
                <Building2 className="mr-2 h-4 w-4" />
                <span className="truncate">{b.businessName}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Ana Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.href}
                  >
                    <Link href={item.href}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Yonetim</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {managementNavItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.href}
                  >
                    <Link href={item.href}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Finans</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {financeNavItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.href}
                  >
                    <Link href={item.href}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname.startsWith("/settings")}>
              <Link href="/settings">
                <Settings className="h-4 w-4" />
                <span>Ayarlar</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="text-destructive hover:text-destructive"
            >
              <LogOut className="h-4 w-4" />
              <span>Cikis Yap</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
