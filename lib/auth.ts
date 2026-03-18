import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { shouldUseDemoData } from "@/lib/env";
import { findDemoUserById } from "@/lib/data/demo-store";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { AppUser, AuthSession } from "@/lib/types";
import { ensureDemoUser, getUserProfile, upsertUserProfile } from "@/lib/data/repository";

const DEMO_COOKIE = "dermalens-demo-user";

function sessionCookie() {
  return cookies();
}

function setDemoSession(userId: string) {
  sessionCookie().set(DEMO_COOKIE, userId, {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    path: "/",
  });
}

export async function clearSession() {
  const cookieStore = sessionCookie();

  if (shouldUseDemoData()) {
    cookieStore.delete(DEMO_COOKIE);
    return;
  }

  const supabase = createSupabaseServerClient();
  await supabase.auth.signOut();
  cookieStore.delete(DEMO_COOKIE);
}

export async function getViewer(): Promise<AuthSession> {
  if (shouldUseDemoData()) {
    const userId = sessionCookie().get(DEMO_COOKIE)?.value;

    if (!userId) {
      return { user: null, mode: "demo" };
    }

    const user = await findDemoUserById(userId);
    return { user, mode: "demo" };
  }

  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { user: null, mode: "supabase" };
  }

  const profile =
    (await getUserProfile(user.id)) ??
    ({
      id: user.id,
      email: user.email ?? "",
      name:
        user.user_metadata?.name ??
        user.email?.split("@")[0] ??
        "DermaLens user",
      created_at: new Date().toISOString(),
    } satisfies AppUser);

  return { user: profile, mode: "supabase" };
}

export async function requireViewer() {
  const viewer = await getViewer();

  if (!viewer.user) {
    redirect("/sign-in");
  }

  return viewer as { user: AppUser; mode: "demo" | "supabase" };
}

export async function signIn({
  email,
  password,
}: {
  email: string;
  password?: string;
}) {
  if (shouldUseDemoData()) {
    const user = await ensureDemoUser(email);
    setDemoSession(user.id);
    return {
      success: true,
      redirectTo: "/dashboard",
      message: "Signed in with demo data mode.",
    };
  }

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password: password ?? "",
  });

  if (error || !data.user) {
    return { success: false, message: error?.message ?? "Unable to sign in." };
  }

  await upsertUserProfile({
    id: data.user.id,
    email: data.user.email ?? email,
    name:
      data.user.user_metadata?.name ??
      data.user.email?.split("@")[0] ??
      "DermaLens user",
    created_at: new Date().toISOString(),
  });

  return {
    success: true,
    redirectTo: "/dashboard",
    message: "Signed in.",
  };
}

export async function signUp({
  email,
  password,
  name,
}: {
  email: string;
  password?: string;
  name?: string;
}) {
  if (shouldUseDemoData()) {
    const user = await ensureDemoUser(email, name);
    setDemoSession(user.id);
    return {
      success: true,
      redirectTo: "/dashboard",
      message: "Demo account created.",
    };
  }

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password: password ?? "",
    options: {
      data: { name },
    },
  });

  if (error || !data.user) {
    return { success: false, message: error?.message ?? "Unable to sign up." };
  }

  await upsertUserProfile({
    id: data.user.id,
    email: data.user.email ?? email,
    name: name?.trim() || data.user.email?.split("@")[0] || "DermaLens user",
    created_at: new Date().toISOString(),
  });

  return {
    success: true,
    redirectTo: data.session ? "/dashboard" : "/sign-in",
    message: data.session
      ? "Account created."
      : "Account created. Complete email verification, then sign in.",
  };
}

export async function continueInDemo() {
  if (!shouldUseDemoData()) {
    return {
      success: false,
      redirectTo: "/sign-in",
      message: "Demo mode is disabled for this deployment.",
    };
  }

  const user = await ensureDemoUser("demo@dermalens.local", "Demo User");
  setDemoSession(user.id);
  return {
    success: true,
    redirectTo: "/dashboard",
    message: "Demo workspace ready.",
  };
}
