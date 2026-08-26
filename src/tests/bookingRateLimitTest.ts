/**
 * Test to check rate limiting on the booking endpoint.
 * Sends more requests than the configured limit and confirms
 * the excess ones are rejected with 429.
 * Usage:
 *   node bookingRateLimitTest.ts              -> runs against local dev
 *   node bookingRateLimitTest.ts --prod       -> runs against production
 */

const DEV_URL = "http://localhost:3000";
const PRODUCTION_URL = "https://eventbook-api-il5s.onrender.com";

const BASE_URL = process.argv.includes("--prod") ? PRODUCTION_URL : DEV_URL;

async function register(username: string, password: string) {
  await fetch(`${BASE_URL}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
}

async function login(username: string, password: string) {
  const res = await fetch(`${BASE_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  return res.headers.get("set-cookie")!.split(";")[0];
}

async function createEvent(cookie: string, totalSeats: number) {
  const res = await fetch(`${BASE_URL}/events`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({
      title: "Rate Limit Test",
      description: "test",
      totalSeats,
    }),
  });
  return res.json();
}

async function attemptBook(
  cookie: string,
  eventId: string,
  attemptNum: number,
) {
  const res = await fetch(`${BASE_URL}/events/${eventId}/book`, {
    method: "POST",
    headers: { Cookie: cookie },
  });
  console.log(`Attempt ${attemptNum}: ${res.status}`);
  return res.status;
}

async function main() {
  await register("ratelimituser", "password123");
  const cookie = await login("ratelimituser", "password123");

  // High seat count so we're testing rate limiting, not sold-out behavior
  const event = await createEvent(cookie, 100);

  // Fire more requests than your limit allows, sequentially (not Promise.all —
  // you want to see exactly which attempt number starts getting rejected)
  for (let i = 1; i <= 15; i++) {
    await attemptBook(cookie, event.id, i);
  }
}

main();
