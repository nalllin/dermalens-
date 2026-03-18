const baseUrl = (
  process.env.DERMALENS_URL ??
  process.env.NEXT_PUBLIC_APP_URL ??
  ""
).replace(/\/$/, "");
const cronSecret = process.env.CRON_SECRET ?? "";

if (!baseUrl) {
  console.error(
    "Set DERMALENS_URL or NEXT_PUBLIC_APP_URL before running smoke:hosted.",
  );
  process.exit(1);
}

async function checkPage(pathname, expectedStatus = 200) {
  const response = await fetch(`${baseUrl}${pathname}`, {
    redirect: "manual",
  });

  if (response.status !== expectedStatus) {
    throw new Error(
      `${pathname} returned ${response.status}, expected ${expectedStatus}.`,
    );
  }

  console.log(`ok ${pathname} -> ${response.status}`);
}

async function checkCronUnauthorized() {
  const response = await fetch(`${baseUrl}/api/cron/reminders`);

  if (cronSecret) {
    if (response.status !== 401) {
      throw new Error(
        `/api/cron/reminders should return 401 without Authorization when CRON_SECRET is set; got ${response.status}.`,
      );
    }

    console.log("ok /api/cron/reminders unauthorized guard -> 401");
    return;
  }

  if (!response.ok) {
    throw new Error(
      `/api/cron/reminders returned ${response.status} without CRON_SECRET configured.`,
    );
  }

  console.log(`ok /api/cron/reminders open -> ${response.status}`);
}

async function checkCronAuthorized() {
  if (!cronSecret) {
    console.log("skip authorized cron check: CRON_SECRET not set locally.");
    return;
  }

  const response = await fetch(`${baseUrl}/api/cron/reminders`, {
    headers: {
      Authorization: `Bearer ${cronSecret}`,
    },
  });

  if (!response.ok) {
    throw new Error(
      `/api/cron/reminders authorized call returned ${response.status}.`,
    );
  }

  const data = await response.json();
  console.log("ok /api/cron/reminders authorized ->", JSON.stringify(data));
}

await checkPage("/");
await checkPage("/sign-in");
await checkPage("/sign-up");
await checkCronUnauthorized();
await checkCronAuthorized();

console.log("Hosted smoke checks passed.");
