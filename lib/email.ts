import "server-only";

import { Resend } from "resend";

import { shouldUseMockEmail } from "@/lib/env";

export async function sendReminderEmail({
  to,
  caseTitle,
  uploadUrl,
}: {
  to: string;
  caseTitle: string;
  uploadUrl: string;
}) {
  if (shouldUseMockEmail()) {
    console.log(
      `[DermaLens reminder] ${to} should upload a weekly update for "${caseTitle}" at ${uploadUrl}`,
    );

    return { sent: true, mode: "mock" as const };
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  await resend.emails.send({
    from: process.env.REMINDER_FROM_EMAIL!,
    to,
    subject: `Weekly DermaLens check-in for ${caseTitle}`,
    text: `Time for your weekly progress photo. Upload your update here: ${uploadUrl}`,
    html: `<p>Time for your weekly progress photo.</p><p><a href="${uploadUrl}">Upload your update for ${caseTitle}</a></p>`,
  });

  return { sent: true, mode: "resend" as const };
}
