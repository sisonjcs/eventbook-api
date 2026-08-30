/**
 * Test to verify GET /events is actually served from cache,
 * not hitting Postgres on every request.
 *
 * Set CACHE_TTL_SECONDS in config.ts to something small (e.g. 5)
 * before running, so the wait step below doesn't take a full minute.
 *
 * Usage:
 *   npm test:cache          -> runs against local dev
 *   npm test:cache -- --prod   -> runs against production
 */

import { CACHE_TTL_SECONDS } from "../config";

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

async function createEvent(cookie: string, title: string) {
  const res = await fetch(`${BASE_URL}/events`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({ title, description: "cache test", totalSeats: 5 }),
  });
  return res.json();
}

async function getEvents() {
  const res = await fetch(`${BASE_URL}/events`);
  return res.json();
}

async function main() {
  console.log(`Running against: ${BASE_URL}`);

  await register("cacheuser", "password123");
  const cookie = await login("cacheuser", "password123");

  const before = await getEvents();
  console.log("Event count before:", before.length);

  await createEvent(cookie, "Newly Created Event");

  const immediatelyAfter = await getEvents();
  console.log(
    "Event count immediately after (should MATCH before, if cached):",
    immediatelyAfter.length,
  );

  console.log("Waiting past cache TTL...");
  await new Promise((r) => setTimeout(r, CACHE_TTL_SECONDS * 1000 + 5000)); // adjust to match your test TTL + buffer

  const afterTTL = await getEvents();
  console.log(
    "Event count after TTL expiry (should be +1 from before):",
    afterTTL.length,
  );
}

main();
