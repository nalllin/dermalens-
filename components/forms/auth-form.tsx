"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function AuthForm({
  mode,
  demoMode,
}: {
  mode: "sign-in" | "sign-up";
  demoMode: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);

    startTransition(async () => {
      setError("");
      setMessage("");

      const response = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          email: form.get("email"),
          password: form.get("password"),
          name: form.get("name"),
        }),
      });

      const data = (await response.json()) as {
        success: boolean;
        message: string;
        redirectTo?: string;
      };

      if (!response.ok || !data.success) {
        setError(data.message || "Unable to continue.");
        return;
      }

      setMessage(data.message);
      router.push(data.redirectTo ?? "/dashboard");
      router.refresh();
    });
  };

  const continueDemo = () => {
    startTransition(async () => {
      setError("");
      const response = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "demo" }),
      });

      const data = (await response.json()) as {
        success: boolean;
        message: string;
        redirectTo?: string;
      };

      if (!response.ok || !data.success) {
        setError(data.message || "Unable to start demo.");
        return;
      }

      router.push(data.redirectTo ?? "/dashboard");
      router.refresh();
    });
  };

  return (
    <Card className="mx-auto w-full max-w-md">
      <CardHeader>
        <CardTitle>{mode === "sign-in" ? "Sign in" : "Create account"}</CardTitle>
        <CardDescription>
          {mode === "sign-in"
            ? "Access your saved cases and follow-up reminders."
            : "Set up your account to save results and return for the next update."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="space-y-4">
          {mode === "sign-up" ? (
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" placeholder="Alex Rivera" />
            </div>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required placeholder="you@example.com" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              required={!demoMode}
              placeholder={demoMode ? "Ignored in demo mode" : "Enter password"}
            />
          </div>

          {error ? (
            <div className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          ) : null}

          {message ? (
            <div className="rounded-2xl border border-teal-100 bg-teal-50 px-4 py-3 text-sm text-teal-700">
              {message}
            </div>
          ) : null}

          <div className="flex flex-col gap-3">
            <Button type="submit" variant="teal" disabled={isPending}>
              {mode === "sign-in" ? "Sign in" : "Create account"}
            </Button>

            {demoMode ? (
              <Button
                type="button"
                variant="secondary"
                disabled={isPending}
                onClick={continueDemo}
              >
                Continue in demo mode
              </Button>
            ) : null}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
