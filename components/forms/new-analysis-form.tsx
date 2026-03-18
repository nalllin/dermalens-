"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { ArrowRight, UploadCloud } from "lucide-react";

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

function buildInitialState(selectedCase?: DashboardCase | null): IntakeFormState {
  return {
    caseId: selectedCase?.case.id,
    title: selectedCase?.case.title ?? "",
    concernType: selectedCase?.case.concern_type ?? "acne",
    area: selectedCase?.case.area ?? "face",
    duration: selectedCase?.latest_entry?.duration_text ?? "About 1 week",
    symptoms: selectedCase?.latest_entry?.symptoms_json ?? ["redness"],
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
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [formState, setFormState] = useState<IntakeFormState>(
    buildInitialState(selectedCase),
  );
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

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

    startTransition(async () => {
      setError("");
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

      router.push(data.redirectTo);
      router.refresh();
    });
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
              The result will be saved automatically and weekly tracking will stay attached to the case.
            </p>
          </div>
          <Button onClick={submit} variant="teal" size="lg" disabled={isPending}>
            <UploadCloud className="h-4 w-4" />
            Run analysis
            <ArrowRight className="h-4 w-4" />
          </Button>
        </CardContent>
      </Card>

      {error ? (
        <div className="rounded-[26px] border border-rose-100 bg-rose-50 px-5 py-4 text-sm text-rose-700">
          {error}
        </div>
      ) : null}
    </div>
  );
}
