"use client";

import type { DashboardCase, IntakeFormPayload, SkinType, SupportedArea, SymptomOption } from "@/lib/types";
import { concernTypes, skinTypes, supportedAreas, symptomOptions } from "@/lib/types";
import { titleCase } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export interface IntakeFormState extends IntakeFormPayload {
  title: string;
}

export function IntakeForm({
  value,
  onChange,
  cases,
}: {
  value: IntakeFormState;
  onChange: (next: IntakeFormState) => void;
  cases: DashboardCase[];
}) {
  const update = <K extends keyof IntakeFormState>(key: K, nextValue: IntakeFormState[K]) =>
    onChange({ ...value, [key]: nextValue });

  const updateSymptoms = (symptom: SymptomOption) => {
    const nextSymptoms = value.symptoms.includes(symptom)
      ? value.symptoms.filter((item) => item !== symptom)
      : [...value.symptoms, symptom];
    update("symptoms", nextSymptoms);
  };

  const selectCase = (caseId: string) => {
    const selected = cases.find((item) => item.case.id === caseId);

    if (!selected) {
      onChange({ ...value, caseId: undefined, title: "" });
      return;
    }

    onChange({
      ...value,
      caseId: selected.case.id,
      title: selected.case.title,
      concernType: selected.case.concern_type,
      area: selected.case.area,
      duration: selected.latest_entry?.duration_text ?? value.duration,
      skinType: selected.latest_entry?.skin_type ?? value.skinType,
      currentProducts: selected.latest_entry?.current_products_text ?? value.currentProducts,
      notes: selected.latest_entry?.notes ?? value.notes,
      symptoms: selected.latest_entry?.symptoms_json ?? value.symptoms,
    });
  };

  return (
    <div className="grid gap-5">
      <div className="space-y-2">
        <Label htmlFor="caseId">Case</Label>
        <select
          id="caseId"
          className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-950 outline-none focus:border-teal-300 focus:ring-2 focus:ring-teal-100"
          value={value.caseId ?? ""}
          onChange={(event) => selectCase(event.target.value)}
        >
          <option value="">Create a new case</option>
          {cases.map((item) => (
            <option key={item.case.id} value={item.case.id}>
              {item.case.title}
            </option>
          ))}
        </select>
      </div>

      {!value.caseId ? (
        <div className="space-y-2">
          <Label htmlFor="title">Case title</Label>
          <Input
            id="title"
            value={value.title}
            placeholder="Weekly skin update"
            onChange={(event) => update("title", event.target.value)}
          />
        </div>
      ) : null}

      <div className="space-y-3">
        <Label>Concern type</Label>
        <div className="flex flex-wrap gap-2">
          {concernTypes.map((type) => (
            <button
              key={type}
              type="button"
              className={`rounded-full px-4 py-2 text-sm transition ${
                value.concernType === type
                  ? "bg-slate-950 text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
              onClick={() => update("concernType", type)}
            >
              {titleCase(type.replaceAll("_", " "))}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <Label>Area</Label>
        <div className="flex flex-wrap gap-2">
          {supportedAreas.map((area) => (
            <button
              key={area}
              type="button"
              className={`rounded-full px-4 py-2 text-sm transition ${
                value.area === area
                  ? "bg-teal-600 text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
              onClick={() => update("area", area as SupportedArea)}
            >
              {titleCase(area.replaceAll("_", " "))}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="duration">Duration</Label>
          <Input
            id="duration"
            value={value.duration}
            placeholder="About 2 weeks"
            onChange={(event) => update("duration", event.target.value)}
          />
        </div>
        <div className="space-y-3">
          <Label>Skin type</Label>
          <div className="flex flex-wrap gap-2">
            {skinTypes.map((type) => (
              <button
                key={type}
                type="button"
                className={`rounded-full px-4 py-2 text-sm transition ${
                  value.skinType === type
                    ? "bg-slate-950 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
                onClick={() => update("skinType", type as SkinType)}
              >
                {titleCase(type)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <Label>Symptoms</Label>
        <div className="flex flex-wrap gap-2">
          {symptomOptions.map((symptom) => (
            <button
              key={symptom}
              type="button"
              className={`rounded-full px-4 py-2 text-sm transition ${
                value.symptoms.includes(symptom)
                  ? "bg-teal-600 text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
              onClick={() => updateSymptoms(symptom)}
            >
              {titleCase(symptom.replaceAll("_", " "))}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="products">Current products used</Label>
        <Textarea
          id="products"
          value={value.currentProducts}
          placeholder="Gentle cleanser, moisturizer, ketoconazole shampoo..."
          onChange={(event) => update("currentProducts", event.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Optional notes</Label>
        <Textarea
          id="notes"
          value={value.notes}
          placeholder="Burning after new serum, more flaking on left scalp, shedding in shower..."
          onChange={(event) => update("notes", event.target.value)}
        />
      </div>
    </div>
  );
}
