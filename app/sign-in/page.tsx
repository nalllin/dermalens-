import { redirect } from "next/navigation";

import { AuthForm } from "@/components/forms/auth-form";
import { Card, CardContent } from "@/components/ui/card";
import { getViewer } from "@/lib/auth";
import { getRuntimeFlags } from "@/lib/env";

export default async function SignInPage() {
  const viewer = await getViewer();

  if (viewer.user) {
    redirect("/dashboard");
  }

  return (
    <div className="grid gap-6 py-6 lg:grid-cols-[0.9fr_1.1fr]">
      <Card className="order-2 lg:order-1">
        <CardContent className="space-y-4 px-6 py-8 text-sm leading-7 text-slate-600">
          <p className="text-xs uppercase tracking-[0.24em] text-teal-700">DermaLens access</p>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
            Sign in to review cases, results, and weekly reminders
          </h1>
          <p>
            If live keys are not configured, demo mode is available and seeded with example cases.
          </p>
          <div className="rounded-[28px] bg-slate-50 p-5">
            <p className="font-medium text-slate-900">What you get</p>
            <ul className="mt-3 space-y-2">
              <li>Short result cards with severity and confidence badges</li>
              <li>Saved case history and progress timeline</li>
              <li>Reminder settings and cron-ready reminder endpoint</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <div className="order-1 lg:order-2">
        <AuthForm mode="sign-in" demoMode={getRuntimeFlags().demoData} />
      </div>
    </div>
  );
}

