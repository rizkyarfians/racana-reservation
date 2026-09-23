"use client";

import { CalendarDays, LayoutDashboard, LogOut, Menu, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { signOutAction } from "@/app/admin/actions";
import { Brand } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const links = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/admin/team", label: "Team", icon: Users, ownerOnly: true },
];

export function AdminNav({ userName, isOwner }: { userName: string; isOwner: boolean }) {
  const pathname = usePathname();
  const content = (
    <>
      <Brand className="px-2" />
      <nav className="mt-10 flex flex-1 flex-col gap-1">
        {links.filter((link) => !link.ownerOnly || isOwner).map((link) => {
          const active = link.href === "/admin" ? pathname === link.href : pathname.startsWith(link.href);
          return <Link key={link.href} href={link.href} className={cn("flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors", active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary hover:text-foreground")}><link.icon className="size-4" />{link.label}</Link>;
        })}
      </nav>
      <div className="border-t pt-4">
        <p className="px-3 text-sm font-semibold">{userName}</p>
        <p className="px-3 text-xs capitalize text-muted-foreground">{isOwner ? "Owner" : "Admin"}</p>
        <form action={signOutAction} className="mt-3"><Button type="submit" variant="ghost" className="w-full justify-start"><LogOut className="size-4" /> Sign out</Button></form>
      </div>
    </>
  );
  return <><aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r bg-card/80 p-5 backdrop-blur lg:flex">{content}</aside><div className="fixed left-4 top-4 z-40 lg:hidden"><Sheet><SheetTrigger render={<Button size="icon" variant="outline" className="bg-card" />}><Menu /></SheetTrigger><SheetContent side="left" className="flex w-72 flex-col p-5"><SheetTitle className="sr-only">Navigation</SheetTitle>{content}</SheetContent></Sheet></div></>;
}
