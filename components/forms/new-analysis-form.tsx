"use client";

import { useEffect, useState } from "react";
import { ArrowRight, Bell, LoaderCircle, UploadCloud } from "lucide-react";

import { ImageUploader } from "@/components/image-uploader";
import { IntakeForm, type IntakeFormState } from "@/components/intake-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { DashboardCase } from "@/lib/types";

const steps = [
  { id: "01", title: "Upload", description: "Preview the current photo" },
  { id: "02", title: "Intake", description: "Capture quick context" },
  { id: "03", title: "Analyze", description: "Save case + AI result" },
];

const analysisStages = [
  "Checking image quality and intake details",
  "Reviewing visible skin patterns",
  "Building a short routine and care summary",
  "Saving the result and reminder schedule",
];

function buildInitialState(selectedCase?: DashboardCase | null): IntakeFormState {
  return {
    caseId: selectedCase?.case.id,
    title: selectedCase?.case.title ?? "",
    concernType: selectedCase?.case.concern_type ?? "other",
    area: selectedCase?.case.area ?? "face",
    duration: selectedCase?.latest_entry?.duration_text ?? "",
    symptoms: selectedCase?.latest_entry?.symptoms_json ?? [],
    skinType: selectedCase?.latest_entry?.skin_type ?? "unknown",
    currentProducts: selectedCase?.latest_entry?.current_products_text ?? "",
    notes: selectedCase?.latest_entry?.notes ?? "",
  };
}

export function NewAnalysisForm({
  cases,
  selectedCase,
}: {
  cases: DashboardCase[];
  selectedCase?: DashboardCase | null;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [formState, setFormState] = useState<IntakeFormState>(
    buildInitialState(selectedCase),
  );
  const [error, setError] = useState("");
  const [analysisStageIndex, setAnalysisStageIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  useEffect(() => {
    if (!isSubmitting) {
      setAnalysisStageIndex(0);
      return;
    }

    const interval = window.setInterval(() => {
      setAnalysisStageIndex((current) =>
        current >= analysisStages.length - 1 ? current : current + 1,
      );
    }, 1400);

    return () => window.clearInterval(interval);
  }, [isSubmitting]);

  const handleFileChange = (nextFile: File | null) => {
    setFile(nextFile);
    setError("");

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setPreviewUrl(nextFile ? URL.createObjectURL(nextFile) : null);
  };

  const submit = () => {
    if (!file) {
      setError("Upload a photo before running analysis.");
      return;
    }

    void (async () => {
      setIsSubmitting(true);
      setError("");
      try {
        const payload = new FormData();
        payload.append("image", file);
        payload.append("caseId", formState.caseId ?? "");
        payload.append("title", formState.title);
        payload.append("concernType", formState.concernType);
        payload.append("area", formState.area);
        payload.append("duration", formState.duration);
        payload.append("skinType", formState.skinType);
        payload.append("currentProducts", formState.currentProducts);
        payload.append("notes", formState.notes);
        formState.symptoms.forEach((symptom) => payload.append("symptoms", symptom));

        const response = await fetch("/api/analysis", {
          method: "POST",
          body: payload,
        });
        const contentType = response.headers.get("content-type") ?? "";
        const data = contentType.includes("application/json")
          ? await response.json()
          : {
              message:
                response.status === 401
                  ? "Sign in again before uploading."
                  : "Unexpected server response during analysis.",
            };

        if (!response.ok) {
          setError(data.message || "Unable to complete analysis.");
          return;
        }

        if (!data.redirectTo) {
          setError("Analysis finished, but the results page could not be opened automatically.");
          return;
        }

        // Full-page navigation is more reliable here than a client transition after a long upload.
        window.location.assign(data.redirectTo);
      } catch (submissionError) {
        setError(
          submissionError instanceof Error
            ? submissionError.message
            : "Analysis finished with a client-side error. Refresh to check saved results.",
        );
      } finally {
        setIsSubmitting(false);
      }
    })();
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-3">
        {steps.map((step) => (
          <div key={step.id} className="rounded-[28px] border border-slate-200 bg-white p-5">
            <p className="text-xs uppercase tracking-[0.22em] text-teal-700">{step.id}</p>
            <p className="mt-2 text-base font-semibold text-slate-950">{step.title}</p>
            <p className="mt-1 text-sm text-slate-500">{step.description}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>Photo upload</CardTitle>
            <CardDescription>
              Use a clear, well-lit image. Weekly follow-ups work best with a similar angle.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ImageUploader previewUrl={previewUrl} onFileChange={handleFileChange} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick intake</CardTitle>
            <CardDescription>
              Short context improves likely issue classification and routine suggestions.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <IntakeForm value={formState} onChange={setFormState} cases={cases} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-4 px-6 py-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <p className="text-base font-semibold text-slate-950">Ready to analyze</p>
            <p className="text-sm text-slate-500">
              The result will be saved automatically and a weekly reminder will be attached to the case.
            </p>
            <p className="text-sm text-slate-400">Most analyses finish in about 10 to 20 seconds.</p>
          </div>
          <Button onClick={submit} variant="teal" size="lg" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <LoaderCircle className="h-4 w-4 animate-spin" />
                Analyzing
              </>
            ) : (
              <>
                <UploadCloud className="h-4 w-4" />
                Run analysis
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {isSubmitting ? (
        <Card className="border-teal-100 bg-teal-50/60">
          <CardContent className="grid gap-5 px-6 py-6 lg:grid-cols-[1fr_220px] lg:items-center">
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-teal-800">
                <LoaderCircle className="h-5 w-5 animate-spin" />
                <p className="text-base font-semibold">Analyzing your photo</p>
              </div>
              <p className="text-sm text-teal-900">
                {analysisStages[analysisStageIndex]}
              </p>
              <div className="h-2 overflow-hidden rounded-full bg-white/70">
                <div
                  className="h-full rounded-full bg-teal-600 transition-all duration-500"
                  style={{
                    width: `${((analysisStageIndex + 1) / analysisStages.length) * 100}%`,
                  }}
                />
              </div>
              <p className="text-xs uppercase tracking-[0.18em] text-teal-700">
                Usually finishes in 10 to 20 seconds
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                {analysisStages.map((stage, index) => (
                  <div
                    key={stage}
                    className={`rounded-2xl px-3 py-3 text-sm transition ${
                      index <= analysisStageIndex
                        ? "bg-white text-slate-900"
                        : "bg-white/60 text-slate-500"
                    }`}
                  >
                    {stage}
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-[26px] bg-white/90 p-5">
              <div className="flex items-center gap-3 text-slate-900">
                <Bell className="h-5 w-5 text-teal-700" />
                <p className="text-sm font-semibold">Weekly update reminder</p>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                DermaLens will keep a 7-day reminder attached so the next progress photo is easy to add.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {error ? (
        <div className="rounded-[26px] border border-rose-100 bg-rose-50 px-5 py-4 text-sm text-rose-700">
          {error}
        </div>
      ) : null}
    </div>
  );
}
