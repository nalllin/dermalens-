/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { ArrowRight, Bell, CalendarDays, Upload } from "lucide-react";

import { ConfidenceBadge } from "@/components/confidence-badge";
import { SeverityBadge } from "@/components/severity-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { requireViewer } from "@/lib/auth";
import { getDashboardCases } from "@/lib/data/repository";
import { formatDateLabel } from "@/lib/utils";

export default async function DashboardPage() {
  const { user } = await requireViewer();
  const cases = await getDashboardCases(user.id);
  const improvedCount = cases.filter((item) => item.latest_progress?.trend === "improved").length;
  const nextReminder = cases
    .map((item) => item.reminder?.next_send_at)
    .filter(Boolean)
    .sort()[0];

  return (
    <div className="space-y-6">
      <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardContent className="space-y-5 px-6 py-7 sm:px-8">
            <Badge variant="teal">Dashboard</Badge>
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
                Welcome back, {user.name}
              </h1>
              <p className="max-w-2xl text-sm leading-6 text-slate-600">
                Review saved cases, upload weekly progress photos, and keep reminder timing visible in one place.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild variant="teal">
                <Link href="/analysis/new">
                  Start new analysis
                  <Upload className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="secondary">
                <Link href="/reminders">
                  Manage reminders
                  <Bell className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
          <Card>
            <CardContent className="space-y-2 px-6 py-6">
              <p className="text-sm text-slate-500">Active cases</p>
              <p className="text-3xl font-semibold text-slate-950">{cases.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="space-y-2 px-6 py-6">
              <p className="text-sm text-slate-500">Cases improving</p>
              <p className="text-3xl font-semibold text-slate-950">{improvedCount}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="space-y-2 px-6 py-6">
              <p className="text-sm text-slate-500">Next reminder</p>
              <p className="text-lg font-semibold text-slate-950">
                {nextReminder ? formatDateLabel(nextReminder) : "Not scheduled"}
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-950">Your cases</h2>
            <p className="text-sm text-slate-500">
              Clean snapshot of latest severity, trend, and reminder timing.
            </p>
          </div>
        </div>

        {cases.length ? (
          <div className="grid gap-4 xl:grid-cols-2">
            {cases.map((item) => (
              <Card key={item.case.id}>
                <CardContent className="space-y-5 px-6 py-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <p className="text-lg font-semibold text-slate-950">{item.case.title}</p>
                      <p className="text-sm text-slate-500">
                        {item.case.concern_type.replaceAll("_", " ")} on{" "}
                        {item.case.area.replaceAll("_", " ")}
                      </p>
                    </div>
                    {item.latest_progress ? (
                      <Badge
                        variant={
                          item.latest_progress.trend === "improved"
                            ? "teal"
                            : item.latest_progress.trend === "worse"
                              ? "rose"
                              : "blue"
                        }
                      >
                        {item.latest_progress.trend}
                      </Badge>
                    ) : (
                      <Badge variant="default">Baseline</Badge>
                    )}
                  </div>

                  {item.latest_assessment ? (
                    <div className="flex flex-wrap gap-2">
                      <SeverityBadge severity={item.latest_assessment.severity} />
                      <ConfidenceBadge confidence={item.latest_assessment.confidence} />
                    </div>
                  ) : null}

                  <div className="grid gap-4 sm:grid-cols-[120px_1fr]">
                    {item.latest_image ? (
                      <img
                        src={item.latest_image.image_url}
                        alt={item.case.title}
                        className="aspect-[4/3] w-full rounded-[22px] object-cover"
                      />
                    ) : (
                      <div className="flex aspect-[4/3] items-center justify-center rounded-[22px] bg-slate-100 text-sm text-slate-400">
                        No image
                      </div>
                    )}
                    <div className="space-y-3">
                      <p className="text-sm text-slate-600">
                        {item.latest_assessment?.reason_summary ?? "No assessment yet."}
                      </p>
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <CalendarDays className="h-4 w-4" />
                        Next reminder:{" "}
                        {item.reminder?.enabled
                          ? formatDateLabel(item.reminder.next_send_at)
                          : "Paused"}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Button asChild variant="teal">
                      <Link href={`/analysis/new?caseId=${item.case.id}`}>
                        Upload weekly update
                        <Upload className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button asChild variant="secondary">
                      <Link href={`/cases/${item.case.id}/timeline`}>
                        Open timeline
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="space-y-4 px-6 py-10 text-center">
              <p className="text-lg font-semibold text-slate-950">No cases yet</p>
              <p className="text-sm text-slate-500">
                Start with a baseline upload to generate the first concise assessment.
              </p>
              <Button asChild variant="teal">
                <Link href="/analysis/new">Create first case</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  );
}
