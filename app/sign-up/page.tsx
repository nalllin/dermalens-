import { redirect } from "next/navigation";

import { AuthForm } from "@/components/forms/auth-form";
import { Card, CardContent } from "@/components/ui/card";
import { getViewer } from "@/lib/auth";
import { getRuntimeFlags } from "@/lib/env";

export default async function SignUpPage() {
  const viewer = await getViewer();

  if (viewer.user) {
    redirect("/dashboard");
  }

  return (
    <div className="grid gap-6 py-6 lg:grid-cols-[0.95fr_1.05fr]">
      <Card>
        <CardContent className="space-y-4 px-6 py-8 text-sm leading-7 text-slate-600">
          <p className="text-xs uppercase tracking-[0.24em] text-teal-700">New workspace</p>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
            Create a DermaLens account for case tracking and weekly follow-up
          </h1>
          <div className="grid gap-3">
            <div className="rounded-[26px] bg-slate-50 p-5">
              <p className="font-medium text-slate-900">1. Upload a first photo</p>
              <p className="mt-1">Start a case with a concise AI assessment and routine.</p>
            </div>
            <div className="rounded-[26px] bg-slate-50 p-5">
              <p className="font-medium text-slate-900">2. Save the case automatically</p>
              <p className="mt-1">Every result stays in the timeline with reminders attached.</p>
            </div>
            <div className="rounded-[26px] bg-slate-50 p-5">
              <p className="font-medium text-slate-900">3. Compare next week’s upload</p>
              <p className="mt-1">Get improved, stable, or worse with a short action note.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <AuthForm mode="sign-up" demoMode={getRuntimeFlags().demoData} />
    </div>
  );
}

