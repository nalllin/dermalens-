const supabaseReady =
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) &&
  Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);

const openAiReady = Boolean(process.env.OPENAI_API_KEY);
const resendReady =
  Boolean(process.env.RESEND_API_KEY) &&
  Boolean(process.env.REMINDER_FROM_EMAIL);

export function shouldForceDemoMode() {
  return process.env.NEXT_PUBLIC_DEMO_MODE === "true";
}

export function isSupabaseConfigured() {
  return supabaseReady;
}

export function isOpenAIConfigured() {
  return openAiReady;
}

export function isResendConfigured() {
  return resendReady;
}

export function shouldUseDemoData() {
  return shouldForceDemoMode() || !isSupabaseConfigured();
}

export function shouldUseMockAI() {
  return shouldForceDemoMode() || !isOpenAIConfigured();
}

export function shouldUseMockEmail() {
  return shouldForceDemoMode() || !isResendConfigured();
}

export function getOpenAIModel() {
  return process.env.OPENAI_MODEL ?? "gpt-4.1-mini";
}

export function getAppUrl() {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

export function getStorageBucket() {
  return process.env.SUPABASE_STORAGE_BUCKET ?? "case-images";
}

export function getCronSecret() {
  return process.env.CRON_SECRET;
}

export function getRuntimeFlags() {
  return {
    demoData: shouldUseDemoData(),
    mockAI: shouldUseMockAI(),
    mockEmail: shouldUseMockEmail(),
  };
}
