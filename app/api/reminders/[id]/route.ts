import { NextResponse } from "next/server";

import { getViewer } from "@/lib/auth";
import { updateReminder } from "@/lib/data/repository";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const viewer = await getViewer();

    if (!viewer.user) {
      return NextResponse.json(
        { success: false, message: "Sign in to update reminders." },
        { status: 401 },
      );
    }

    const { user } = viewer;
    const body = await request.json();
    const reminder = await updateReminder({
      userId: user.id,
      reminderId: params.id,
      enabled: Boolean(body.enabled),
      frequencyDays: Number(body.frequencyDays ?? 7),
    });

    return NextResponse.json({ success: true, reminder });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Unable to update reminder.",
      },
      { status: 500 },
    );
  }
}
