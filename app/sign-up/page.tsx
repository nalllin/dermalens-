import { redirect } from "next/navigation";

import { AuthForm } from "@/components/forms/auth-form";
import { getViewer } from "@/lib/auth";
import { getRuntimeFlags } from "@/lib/env";

export default async function SignUpPage() {
  const viewer = await getViewer();

  if (viewer.user) {
    redirect("/dashboard");
  }

  return (
    <div className="mx-auto grid max-w-md gap-6 py-8">
      <div className="space-y-2 text-center">
        <p className="text-xs uppercase tracking-[0.24em] text-teal-700">Get started</p>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
          Create your account
        </h1>
        <p className="text-sm leading-6 text-slate-600">
          Save each result, return next week with another photo, and keep every update in one timeline.
        </p>
      </div>
      <AuthForm mode="sign-up" demoMode={getRuntimeFlags().demoData} />
    </div>
  );
}
