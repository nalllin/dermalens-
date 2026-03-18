import Link from "next/link";
import { ArrowRight, BellRing, CheckCircle2, ScanFace, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getViewer } from "@/lib/auth";
import { getRuntimeFlags } from "@/lib/env";

const featureCards = [
  {
    title: "Upload once, scan fast",
    description:
      "Preview a skin, scalp, beard, hairline, or body-patch photo and submit a short intake in one flow.",
  },
  {
    title: "Short AI output",
    description:
      "Get likely issue, severity, confidence, routines, and treatment options in a card that scans in seconds.",
  },
  {
    title: "Weekly follow-up",
    description:
      "Track before/after changes, compare progress, and keep reminder settings tied to each case.",
  },
];

const steps = [
  "Upload photo",
  "Answer 5 quick questions",
  "Review concise result card",
  "Save case and track weekly",
];

export default async function Home() {
  const viewer = await getViewer();
  const flags = getRuntimeFlags();

  return (
    <div className="space-y-8 pb-6 pt-2">
      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="overflow-hidden bg-hero-grid">
          <CardContent className="grid gap-10 px-6 py-8 sm:px-8 sm:py-10">
            <div className="space-y-5">
              <div className="flex flex-wrap gap-2">
                <Badge variant="teal">Internal testing MVP</Badge>
                {flags.demoData ? <Badge variant="blue">Demo data ready</Badge> : null}
                {flags.mockAI ? <Badge variant="amber">Mock AI fallback active</Badge> : null}
              </div>
              <div className="max-w-2xl space-y-4">
                <h1 className="text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
                  Track skin progress with AI-assisted analysis
                </h1>
                <p className="max-w-xl text-base leading-7 text-slate-600 sm:text-lg">
                  Upload a photo, get concise treatment suggestions, and follow weekly progress updates.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg" variant="teal">
                  <Link href={viewer.user ? "/dashboard" : "/sign-up"}>
                    {viewer.user ? "Open dashboard" : "Start DermaLens"}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="secondary">
                  <Link href="/analysis/new">Try new analysis</Link>
                </Button>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-4">
              {steps.map((step, index) => (
                <div
                  key={step}
                  className="rounded-3xl border border-white/80 bg-white/75 px-4 py-4 backdrop-blur"
                >
                  <p className="text-xs uppercase tracking-[0.22em] text-teal-700">
                    Step {index + 1}
                  </p>
                  <p className="mt-2 text-sm font-medium text-slate-800">{step}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2 text-teal-700">
              <Sparkles className="h-4 w-4" />
              <span className="text-sm font-medium">Sample output</span>
            </div>
            <CardTitle>Mild inflammatory acne</CardTitle>
            <CardDescription>
              Small inflamed bumps and comedone-like lesions visible on cheek and forehead.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Badge variant="teal">Confidence 86%</Badge>
              <Badge variant="blue">Severity mild</Badge>
              <Badge variant="default">Observation 2 to 4 weeks</Badge>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-3xl bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                  Suggested options
                </p>
                <ul className="mt-3 space-y-2 text-sm text-slate-700">
                  <li>benzoyl peroxide 2.5% gel</li>
                  <li>adapalene at night</li>
                  <li>non-comedogenic moisturizer</li>
                </ul>
              </div>
              <div className="rounded-3xl bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">AM routine</p>
                <ul className="mt-3 space-y-2 text-sm text-slate-700">
                  <li>gentle cleanser</li>
                  <li>benzoyl peroxide</li>
                  <li>moisturizer</li>
                  <li>sunscreen</li>
                </ul>
              </div>
            </div>
            <div className="rounded-3xl border border-teal-100 bg-teal-50/70 p-4 text-sm text-teal-900">
              If worsening after 3 weeks, seek dermatologist review.
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        {featureCards.map((feature, index) => (
          <Card key={feature.title}>
            <CardContent className="space-y-4 px-6 py-6">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-teal-50 text-teal-700">
                  {index === 0 ? <ScanFace className="h-5 w-5" /> : null}
                  {index === 1 ? <CheckCircle2 className="h-5 w-5" /> : null}
                  {index === 2 ? <BellRing className="h-5 w-5" /> : null}
                </div>
                <h2 className="text-lg font-semibold text-slate-950">{feature.title}</h2>
              </div>
              <p className="text-sm leading-6 text-slate-600">{feature.description}</p>
            </CardContent>
          </Card>
        ))}
      </section>
    </div>
  );
}
