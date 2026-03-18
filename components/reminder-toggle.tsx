"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Switch } from "@/components/ui/switch";
import { formatDateLabel } from "@/lib/utils";
import type { ReminderRecord } from "@/lib/types";

export function ReminderToggle({
  reminder,
  title,
}: {
  reminder: ReminderRecord;
  title: string;
}) {
  const router = useRouter();
  const [enabled, setEnabled] = useState(reminder.enabled);
  const [frequencyDays, setFrequencyDays] = useState(reminder.frequency_days);
  const [status, setStatus] = useState("");
  const [isPending, startTransition] = useTransition();

  const save = (nextEnabled: boolean, nextFrequency: number) => {
    startTransition(async () => {
      setStatus("");

      const response = await fetch(`/api/reminders/${reminder.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enabled: nextEnabled,
          frequencyDays: nextFrequency,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setStatus(data.message || "Unable to update reminder.");
        return;
      }

      setStatus("Reminder updated.");
      router.refresh();
    });
  };

  return (
    <div className="rounded-[26px] border border-slate-200 bg-white p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <p className="text-base font-semibold text-slate-950">{title}</p>
          <p className="text-sm text-slate-500">
            Next send: {enabled ? formatDateLabel(reminder.next_send_at) : "Paused"}
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <label className="flex items-center gap-3 rounded-full bg-slate-50 px-4 py-2 text-sm text-slate-600">
            Frequency
            <select
              className="bg-transparent outline-none"
              value={frequencyDays}
              onChange={(event) => {
                const nextFrequency = Number(event.target.value);
                setFrequencyDays(nextFrequency);
                save(enabled, nextFrequency);
              }}
              disabled={isPending}
            >
              <option value={7}>Every 7 days</option>
              <option value={14}>Every 14 days</option>
            </select>
          </label>

          <div className="flex items-center gap-3 rounded-full bg-slate-50 px-4 py-2">
            <Switch
              checked={enabled}
              onCheckedChange={(checked) => {
                setEnabled(checked);
                save(checked, frequencyDays);
              }}
              disabled={isPending}
            />
            <span className="text-sm font-medium text-slate-700">
              {enabled ? "Enabled" : "Paused"}
            </span>
          </div>
        </div>
      </div>

      {status ? <p className="mt-3 text-sm text-teal-700">{status}</p> : null}
    </div>
  );
}

