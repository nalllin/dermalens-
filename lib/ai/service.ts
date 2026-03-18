import "server-only";

import OpenAI from "openai";

import {
  baseAnalysisSchema,
  progressComparisonSchema,
  treatmentSuggestionSchema,
  type BaseAnalysisOutput,
  type ProgressComparisonOutput,
  type TreatmentSuggestionOutput,
} from "@/lib/ai/schemas";
import { getOpenAIModel, shouldUseMockAI } from "@/lib/env";
import type { ConcernType, Severity, SymptomOption } from "@/lib/types";
import { titleCase } from "@/lib/utils";

interface IntakeAnalysisInput {
  concernType: ConcernType;
  area: string;
  duration: string;
  symptoms: SymptomOption[];
  skinType: string;
  currentProducts: string;
  notes: string;
}

interface AnalyzeConcernParams {
  intake: IntakeAnalysisInput;
  imageBuffer: Buffer;
  mimeType: string;
}

interface CompareProgressParams {
  previousAssessment: BaseAnalysisOutput;
  currentAssessment: BaseAnalysisOutput;
  previousImageBuffer?: Buffer | null;
  previousMimeType?: string | null;
  currentImageBuffer: Buffer;
  currentMimeType: string;
}

const treatmentLibrary: Record<
  ConcernType,
  Omit<TreatmentSuggestionOutput, "escalation_note"> & { escalation: string }
> = {
  acne: {
    suggested_medications: [
      "benzoyl peroxide 2.5% gel",
      "adapalene at night",
    ],
    suggested_creams: [
      "non-comedogenic moisturizer",
      "broad-spectrum sunscreen",
    ],
    am_routine: [
      "gentle cleanser",
      "benzoyl peroxide",
      "moisturizer",
      "sunscreen",
    ],
    pm_routine: ["gentle cleanser", "adapalene", "moisturizer"],
    observation_window: "2 to 4 weeks",
    escalation:
      "If breakouts deepen or worsen after 3 weeks, seek dermatologist review.",
  },
  rash: {
    suggested_medications: [
      "short-course 1% hydrocortisone",
      "non-drowsy antihistamine if itchy",
    ],
    suggested_creams: [
      "barrier repair cream",
      "fragrance-free moisturizer",
    ],
    am_routine: ["cool rinse", "barrier cream", "sunscreen if exposed"],
    pm_routine: ["gentle cleanse", "barrier cream", "avoid triggers"],
    observation_window: "5 to 10 days",
    escalation:
      "If the rash spreads, becomes painful, or oozes, arrange urgent review.",
  },
  pigmentation: {
    suggested_medications: ["azelaic acid", "topical niacinamide serum"],
    suggested_creams: [
      "ceramide moisturizer",
      "tinted broad-spectrum sunscreen",
    ],
    am_routine: ["gentle cleanser", "niacinamide", "moisturizer", "sunscreen"],
    pm_routine: ["gentle cleanser", "azelaic acid", "moisturizer"],
    observation_window: "6 to 8 weeks",
    escalation:
      "If spots darken rapidly or become irregular, get dermatologist review.",
  },
  dandruff: {
    suggested_medications: [
      "ketoconazole shampoo",
      "salicylic acid scalp treatment",
    ],
    suggested_creams: [
      "light scalp serum",
      "fragrance-free conditioner on lengths only",
    ],
    am_routine: ["targeted shampoo", "rinse thoroughly", "light scalp serum"],
    pm_routine: ["scalp check", "avoid heavy oils", "clean pillowcase"],
    observation_window: "2 to 3 weeks",
    escalation:
      "If flaking becomes thick, painful, or patchy, get a scalp exam.",
  },
  hair_fall: {
    suggested_medications: [
      "topical minoxidil if appropriate",
      "gentle anti-shedding shampoo",
    ],
    suggested_creams: [
      "lightweight scalp tonic",
      "protein-safe conditioner",
    ],
    am_routine: ["gentle wash as needed", "scalp tonic", "avoid tight styling"],
    pm_routine: ["minoxidil if using", "scalp massage", "silk pillowcase"],
    observation_window: "8 to 12 weeks",
    escalation:
      "If shedding accelerates or new gaps appear, seek dermatologist review.",
  },
  irritation: {
    suggested_medications: [
      "pause active ingredients",
      "short-course hydrocortisone if advised",
    ],
    suggested_creams: ["petrolatum balm", "ceramide moisturizer"],
    am_routine: ["lukewarm rinse", "ceramide moisturizer", "sunscreen"],
    pm_routine: ["gentle cleanser", "petrolatum balm", "avoid exfoliants"],
    observation_window: "3 to 7 days",
    escalation:
      "If burning persists or swelling develops, stop actives and get reviewed.",
  },
  other: {
    suggested_medications: ["supportive OTC care", "seek pharmacist guidance"],
    suggested_creams: ["gentle moisturizer", "broad-spectrum sunscreen"],
    am_routine: ["gentle cleanse", "moisturizer", "sunscreen"],
    pm_routine: ["gentle cleanse", "moisturizer"],
    observation_window: "1 to 2 weeks",
    escalation:
      "If symptoms intensify or remain unclear, seek dermatologist review.",
  },
};

function createClient() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

function severityRank(severity: Severity) {
  return { mild: 1, moderate: 2, severe: 3 }[severity];
}

function extractJson<T>(raw: string, parser: { parse: (value: unknown) => T }) {
  const fenced = raw.match(/```json\s*([\s\S]*?)```/i)?.[1];
  const candidate = fenced ?? raw;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  const jsonText =
    start >= 0 && end >= 0 ? candidate.slice(start, end + 1) : candidate;

  return parser.parse(JSON.parse(jsonText));
}

function toImageUrl(buffer: Buffer, mimeType: string) {
  return `data:${mimeType};base64,${buffer.toString("base64")}`;
}

function describeSymptoms(symptoms: SymptomOption[]) {
  if (!symptoms.length) {
    return "mild visible changes";
  }

  return symptoms
    .map((symptom) => symptom.replaceAll("_", " "))
    .slice(0, 3)
    .join(", ");
}

function severityFromSymptoms(symptoms: SymptomOption[]) {
  if (symptoms.includes("pus") || symptoms.length >= 5) {
    return "severe" as const;
  }

  if (
    symptoms.length >= 3 ||
    (symptoms.includes("pain") && symptoms.includes("redness"))
  ) {
    return "moderate" as const;
  }

  return "mild" as const;
}

function buildMockAnalysis(intake: IntakeAnalysisInput): BaseAnalysisOutput {
  const severity = severityFromSymptoms(intake.symptoms);
  const concern = intake.concernType;
  const confidenceBase = concern === "other" ? 0.61 : 0.78;
  const confidence = Math.min(
    0.94,
    Number(
      (confidenceBase + Math.min(intake.symptoms.length * 0.03, 0.12)).toFixed(2),
    ),
  );

  const likelyIssueMap: Record<ConcernType, string> = {
    acne: intake.symptoms.includes("pus")
      ? "Inflammatory acne flare"
      : "Mild inflammatory acne",
    rash: intake.symptoms.includes("flaking")
      ? "Eczematous rash"
      : "Irritant dermatitis",
    pigmentation: "Post-inflammatory hyperpigmentation",
    dandruff: "Seborrheic dermatitis / dandruff",
    hair_fall: "Diffuse hair shedding",
    irritation: "Barrier irritation",
    other: "Nonspecific skin concern",
  };

  return baseAnalysisSchema.parse({
    likely_issue: likelyIssueMap[concern],
    confidence,
    severity,
    reason_summary: `${titleCase(intake.area.replaceAll("_", " "))} photo and intake suggest ${describeSymptoms(
      intake.symptoms,
    )} over ${intake.duration.toLowerCase()}.`,
  });
}

function buildMockTreatment(
  concernType: ConcernType,
  analysis: BaseAnalysisOutput,
): TreatmentSuggestionOutput {
  const source = treatmentLibrary[concernType];

  return treatmentSuggestionSchema.parse({
    suggested_medications: source.suggested_medications,
    suggested_creams: source.suggested_creams,
    am_routine: source.am_routine,
    pm_routine: source.pm_routine,
    observation_window:
      analysis.severity === "severe"
        ? "1 to 2 weeks"
        : source.observation_window,
    escalation_note:
      analysis.severity === "severe"
        ? "Severity looks elevated. Seek dermatologist review sooner if possible."
        : source.escalation,
  });
}

function buildMockProgress(
  previousAssessment: BaseAnalysisOutput,
  currentAssessment: BaseAnalysisOutput,
): ProgressComparisonOutput {
  const previousRank = severityRank(previousAssessment.severity);
  const currentRank = severityRank(currentAssessment.severity);

  if (currentRank < previousRank) {
    return progressComparisonSchema.parse({
      trend: "improved",
      change_summary:
        "Visible inflammation appears lighter than the previous check-in.",
      recommendation: "Continue the current routine for 1 more week.",
    });
  }

  if (currentRank > previousRank) {
    return progressComparisonSchema.parse({
      trend: "worse",
      change_summary:
        "The current upload suggests more active irritation than the prior photo.",
      recommendation: "Adjust care and escalate if the trend continues.",
    });
  }

  return progressComparisonSchema.parse({
    trend: "stable",
    change_summary:
      "Overall appearance looks similar to the previous upload with no major shift.",
    recommendation: "Stay consistent and review again in 1 week.",
  });
}

async function runVisionPrompt<T>({
  systemPrompt,
  userPrompt,
  imageBuffer,
  mimeType,
  parser,
}: {
  systemPrompt: string;
  userPrompt: string;
  imageBuffer: Buffer;
  mimeType: string;
  parser: { parse: (value: unknown) => T };
}) {
  const client = createClient();
  const response = await client.responses.create({
    model: getOpenAIModel(),
    max_output_tokens: 700,
    input: [
      {
        role: "system",
        content: [{ type: "input_text", text: systemPrompt }],
      },
      {
        role: "user",
        content: [
          { type: "input_text", text: userPrompt },
          {
            type: "input_image",
            image_url: toImageUrl(imageBuffer, mimeType),
            detail: "auto",
          },
        ],
      },
    ],
  });

  return extractJson(response.output_text, parser);
}

export async function analyzeConcern({
  intake,
  imageBuffer,
  mimeType,
}: AnalyzeConcernParams): Promise<BaseAnalysisOutput> {
  if (shouldUseMockAI()) {
    return buildMockAnalysis(intake);
  }

  try {
    return await runVisionPrompt({
      systemPrompt:
        "You are assisting a skin progress tracking app. Return only concise JSON. Do not include markdown or medical disclaimers. Keep severity to mild, moderate, or severe.",
      userPrompt: `Analyze the uploaded dermatology image using this intake:
{
  "concern_type": "${intake.concernType}",
  "area": "${intake.area}",
  "duration": "${intake.duration}",
  "symptoms": ${JSON.stringify(intake.symptoms)},
  "skin_type": "${intake.skinType}",
  "current_products": "${intake.currentProducts}",
  "notes": "${intake.notes}"
}

Return JSON with exactly these keys:
{
  "likely_issue": "short label",
  "confidence": 0.0,
  "severity": "mild|moderate|severe",
  "reason_summary": "one concise sentence"
}`,
      imageBuffer,
      mimeType,
      parser: baseAnalysisSchema,
    });
  } catch {
    return buildMockAnalysis(intake);
  }
}

export async function generateTreatmentSuggestion({
  concernType,
  analysis,
  intake,
}: {
  concernType: ConcernType;
  analysis: BaseAnalysisOutput;
  intake: IntakeAnalysisInput;
}): Promise<TreatmentSuggestionOutput> {
  if (shouldUseMockAI()) {
    return buildMockTreatment(concernType, analysis);
  }

  try {
    const client = createClient();
    const response = await client.responses.create({
      model: getOpenAIModel(),
      max_output_tokens: 500,
      input: [
        {
          role: "system",
          content: [
            {
              type: "input_text",
              text: "You are assisting a skin progress tracking app. Return only concise JSON with short arrays. Avoid long explanations.",
            },
          ],
        },
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: `Given this concern summary:
{
  "concern_type": "${concernType}",
  "likely_issue": "${analysis.likely_issue}",
  "severity": "${analysis.severity}",
  "reason_summary": "${analysis.reason_summary}",
  "skin_type": "${intake.skinType}",
  "current_products": "${intake.currentProducts}",
  "notes": "${intake.notes}"
}

Return JSON with exactly these keys:
{
  "suggested_medications": ["short item"],
  "suggested_creams": ["short item"],
  "am_routine": ["short step"],
  "pm_routine": ["short step"],
  "observation_window": "short range",
  "escalation_note": "short sentence"
}`,
            },
          ],
        },
      ],
    });

    return extractJson(response.output_text, treatmentSuggestionSchema);
  } catch {
    return buildMockTreatment(concernType, analysis);
  }
}

export async function compareProgress({
  previousAssessment,
  currentAssessment,
  previousImageBuffer,
  previousMimeType,
  currentImageBuffer,
  currentMimeType,
}: CompareProgressParams): Promise<ProgressComparisonOutput> {
  if (shouldUseMockAI() || !previousImageBuffer || !previousMimeType) {
    return buildMockProgress(previousAssessment, currentAssessment);
  }

  try {
    const client = createClient();
    const response = await client.responses.create({
      model: getOpenAIModel(),
      max_output_tokens: 500,
      input: [
        {
          role: "system",
          content: [
            {
              type: "input_text",
              text: "You compare two dermatology follow-up images for a skin progress tracking app. Return only concise JSON. Use improved, stable, or worse.",
            },
          ],
        },
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: `Compare the current image against the previous image.
Previous assessment:
${JSON.stringify(previousAssessment)}

Current assessment:
${JSON.stringify(currentAssessment)}

Return JSON with exactly these keys:
{
  "trend": "improved|stable|worse",
  "change_summary": "one concise sentence",
  "recommendation": "one concise sentence"
}`,
            },
            {
              type: "input_image",
              image_url: toImageUrl(previousImageBuffer, previousMimeType),
              detail: "auto",
            },
            {
              type: "input_image",
              image_url: toImageUrl(currentImageBuffer, currentMimeType),
              detail: "auto",
            },
          ],
        },
      ],
    });

    return extractJson(response.output_text, progressComparisonSchema);
  } catch {
    return buildMockProgress(previousAssessment, currentAssessment);
  }
}
