import { NextResponse } from "next/server";

import {
  analyzeConcern,
  compareProgress,
  generateTreatmentSuggestion,
} from "@/lib/ai/service";
import { getViewer } from "@/lib/auth";
import { getCaseDetails, saveAnalysis } from "@/lib/data/repository";
import {
  concernTypes,
  skinTypes,
  supportedAreas,
  symptomOptions,
  type ConcernType,
  type SkinType,
  type SupportedArea,
  type SymptomOption,
} from "@/lib/types";
import { readStoredImage, storeUploadedImage } from "@/lib/storage";

export const runtime = "nodejs";

function pickEnum<T extends readonly string[]>(
  source: FormDataEntryValue | null,
  values: T,
  fallback: T[number],
) {
  return source && values.includes(String(source) as T[number])
    ? (String(source) as T[number])
    : fallback;
}

export async function POST(request: Request) {
  try {
    const viewer = await getViewer();

    if (!viewer.user) {
      return NextResponse.json(
        { message: "Sign in to run analysis." },
        { status: 401 },
      );
    }

    const { user } = viewer;
    const formData = await request.formData();
    const image = formData.get("image");

    if (!(image instanceof File) || !image.size) {
      return NextResponse.json(
        { message: "Image upload is required." },
        { status: 400 },
      );
    }

    const concernType = pickEnum(
      formData.get("concernType"),
      concernTypes,
      "other",
    ) as ConcernType;
    const area = pickEnum(formData.get("area"), supportedAreas, "face") as SupportedArea;
    const skinType = pickEnum(
      formData.get("skinType"),
      skinTypes,
      "unknown",
    ) as SkinType;
    const symptoms = formData
      .getAll("symptoms")
      .map((item) => String(item))
      .filter((item): item is SymptomOption =>
        symptomOptions.includes(item as SymptomOption),
      );

    const durationValue = String(formData.get("duration") ?? "").trim();
    const currentProductsValue = String(formData.get("currentProducts") ?? "").trim();
    const notesValue = String(formData.get("notes") ?? "").trim();

    const intake = {
      concernType,
      area,
      duration: durationValue || "Recent change",
      symptoms,
      skinType,
      currentProducts: currentProductsValue,
      notes: notesValue,
    };

    const caseId = String(formData.get("caseId") ?? "") || undefined;
    const title = String(formData.get("title") ?? "") || undefined;
    const buffer = Buffer.from(await image.arrayBuffer());
    const mimeType = image.type || "image/jpeg";
    const existingCase = caseId ? await getCaseDetails(user.id, caseId) : null;
    const previousEntry = existingCase?.entries[0] ?? null;

    const baseAnalysis = await analyzeConcern({
      intake,
      imageBuffer: buffer,
      mimeType,
    });
    const treatment = await generateTreatmentSuggestion({
      concernType,
      analysis: baseAnalysis,
      intake,
    });
    const storedImage = await storeUploadedImage({
      userId: user.id,
      caseId,
      buffer,
      contentType: mimeType,
    });

    let comparison:
      | {
          previous_entry_id: string;
          trend: "improved" | "stable" | "worse";
          change_summary: string;
          recommendation: string;
        }
      | undefined;

    if (previousEntry?.assessment) {
      const previousImage = previousEntry.image
        ? await readStoredImage(previousEntry.image.image_url)
        : null;
      const progress = await compareProgress({
        previousAssessment: previousEntry.assessment,
        currentAssessment: baseAnalysis,
        previousImageBuffer: previousImage?.buffer ?? null,
        previousMimeType: previousImage?.mimeType ?? null,
        currentImageBuffer: buffer,
        currentMimeType: mimeType,
      });

      comparison = {
        previous_entry_id: previousEntry.entry.id,
        ...progress,
      };
    }

    const saved = await saveAnalysis({
      user_id: user.id,
      case_id: caseId,
      title,
      concern_type: concernType,
      area,
      duration_text: intake.duration,
      symptoms_json: intake.symptoms,
      skin_type: skinType,
      current_products_text: intake.currentProducts,
      notes: intake.notes,
      image_url: storedImage.image_url,
      image_quality_score: storedImage.image_quality_score,
      assessment: {
        ...baseAnalysis,
        ...treatment,
      },
      progress: comparison,
    });

    return NextResponse.json({
      success: true,
      redirectTo: `/cases/${saved.case.id}/results/${saved.entry.id}`,
    });
  } catch (error) {
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : "Analysis failed.",
      },
      { status: 500 },
    );
  }
}
