import { ReminderToggle } from "@/components/reminder-toggle";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireViewer } from "@/lib/auth";
import { getDashboardCases } from "@/lib/data/repository";

export default async function RemindersPage() {
  const { user } = await requireViewer();
  const cases = await getDashboardCases(user.id);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap gap-2">
            <Badge variant="teal">Reminder Settings</Badge>
            <Badge variant="default">Cron-ready weekly flow</Badge>
          </div>
          <CardTitle className="text-3xl">Weekly reminder settings</CardTitle>
          <CardDescription>
            Keep progress-photo reminders enabled per case and adjust timing when needed.
          </CardDescription>
        </CardHeader>
        <CardContent />
      </Card>

      <div className="space-y-4">
        {cases.length ? (
          cases
            .filter((item) => item.reminder)
            .map((item) => (
              <ReminderToggle
                key={item.reminder!.id}
                reminder={item.reminder!}
                title={item.case.title}
              />
            ))
        ) : (
          <Card>
            <CardContent className="px-6 py-10 text-center text-sm text-slate-500">
              No reminders yet. Create a case first and a weekly reminder will be attached automatically.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

