import { redirect } from "next/navigation";

import { AuthForm } from "@/components/forms/auth-form";
import { getViewer } from "@/lib/auth";
import { getRuntimeFlags } from "@/lib/env";

export default async function SignInPage() {
  const viewer = await getViewer();

  if (viewer.user) {
    redirect("/dashboard");
  }

  return (
    <div className="mx-auto grid max-w-md gap-6 py-8">
      <div className="space-y-2 text-center">
        <p className="text-xs uppercase tracking-[0.24em] text-teal-700">Welcome back</p>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
          Sign in to continue your check-ins
        </h1>
        <p className="text-sm leading-6 text-slate-600">
          View saved cases, upload a fresh photo, and keep reminders in one place.
        </p>
      </div>
      <div>
        <AuthForm mode="sign-in" demoMode={getRuntimeFlags().demoData} />
      </div>
    </div>
  );
}
