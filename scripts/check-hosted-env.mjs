import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

function loadEnvFile(fileName) {
  const filePath = path.join(process.cwd(), fileName);

  if (!existsSync(filePath)) {
    return;
  }

  const contents = readFileSync(filePath, "utf8");

  for (const rawLine of contents.split(/\r?\n/)) {
    const line = rawLine.trim();

    if (!line || line.startsWith("#")) {
      continue;
    }

    const separator = line.indexOf("=");

    if (separator < 0) {
      continue;
    }

    const key = line.slice(0, separator).trim();
    const value = line.slice(separator + 1).trim();

    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

loadEnvFile(".env.local");
loadEnvFile(".env");

const failures = [];
const mode = process.env.NEXT_PUBLIC_DEMO_MODE;

if (mode !== "false") {
  failures.push(
    "NEXT_PUBLIC_DEMO_MODE must be set to false for a hosted Supabase-backed deployment.",
  );
}

const required = [
  "NEXT_PUBLIC_APP_URL",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "SUPABASE_STORAGE_BUCKET",
  "CRON_SECRET",
];

for (const key of required) {
  if (!process.env[key]) {
    failures.push(`${key} is missing.`);
  }
}

const appUrl = process.env.NEXT_PUBLIC_APP_URL;

if (appUrl && !/^https?:\/\//.test(appUrl)) {
  failures.push("NEXT_PUBLIC_APP_URL must start with http:// or https://");
}

if (failures.length) {
  console.error("Hosted deployment env check failed:\n");

  for (const failure of failures) {
    console.error(`- ${failure}`);
  }

  process.exit(1);
}

console.log("Hosted deployment env check passed.");

if (!process.env.OPENAI_API_KEY) {
  console.log("- OPENAI_API_KEY not set: app will use mock AI.");
}

if (!process.env.RESEND_API_KEY) {
  console.log("- RESEND_API_KEY not set: reminders will use mock email.");
}
