import { NextResponse } from "next/server";

import { clearSession, continueInDemo, signIn, signUp } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (body.mode === "demo") {
      return NextResponse.json(await continueInDemo());
    }

    if (body.mode === "sign-in") {
      const result = await signIn({
        email: String(body.email ?? ""),
        password: String(body.password ?? ""),
      });

      return NextResponse.json(result, {
        status: result.success ? 200 : 400,
      });
    }

    if (body.mode === "sign-up") {
      const result = await signUp({
        email: String(body.email ?? ""),
        password: String(body.password ?? ""),
        name: String(body.name ?? ""),
      });

      return NextResponse.json(result, {
        status: result.success ? 200 : 400,
      });
    }

    return NextResponse.json(
      { success: false, message: "Unsupported auth mode." },
      { status: 400 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Authentication failed.",
      },
      { status: 500 },
    );
  }
}

export async function DELETE() {
  await clearSession();
  return NextResponse.json({ success: true });
}

