"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Activity, FlaskConical, LogOut, ScanSearch } from "lucide-react";
import { useTransition } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { AppUser } from "@/lib/types";

const links = [
  { href: "/", label: "Home" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/analysis/new", label: "New Analysis" },
  { href: "/reminders", label: "Reminders" },
];

export function SiteHeader({
  user,
}: {
  user: AppUser | null;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const signOut = () => {
    startTransition(async () => {
      await fetch("/api/auth", { method: "DELETE" });
      router.push("/");
      router.refresh();
    });
  };

  return (
    <header className="border-b border-slate-200/80 bg-white">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-teal-600 text-white">
              <ScanSearch className="h-5 w-5" />
            </div>
            <div>
              <Link href="/" className="text-lg font-semibold tracking-tight text-slate-950">
                DermaLens
              </Link>
              <p className="text-sm text-slate-500">
                AI-assisted dermatology analysis and follow-up tracking
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            {user ? (
              <div className="flex items-center gap-2">
                <div className="rounded-full bg-teal-50 px-3 py-1 text-sm font-medium text-teal-700">
                  {user.name}
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={signOut}
                  disabled={isPending}
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Button asChild size="sm" variant="secondary">
                  <Link href="/sign-in">Sign in</Link>
                </Button>
                <Button asChild size="sm" variant="teal">
                  <Link href="/sign-up">Sign up</Link>
                </Button>
              </div>
            )}
          </div>
        </div>

        <nav className="flex flex-wrap items-center gap-2">
          {links.map((link) => {
            const active =
              link.href === "/"
                ? pathname === "/"
                : pathname.startsWith(link.href);

            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "rounded-full px-4 py-2 text-sm font-medium transition",
                  active
                    ? "bg-slate-950 text-white"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-950",
                )}
              >
                {link.href === "/dashboard" ? (
                  <Activity className="mr-2 inline h-4 w-4" />
                ) : null}
                {link.href === "/analysis/new" ? (
                  <FlaskConical className="mr-2 inline h-4 w-4" />
                ) : null}
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
