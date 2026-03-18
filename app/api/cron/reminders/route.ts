import { NextResponse } from "next/server";

import { getCronSecret } from "@/lib/env";
import { runReminderJobs } from "@/lib/data/repository";

export async function GET(request: Request) {
  const secret = getCronSecret();

  if (secret) {
    const authHeader = request.headers.get("authorization");

    if (authHeader !== `Bearer ${secret}`) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
  }

  const result = await runReminderJobs();
  return NextResponse.json(result);
}
