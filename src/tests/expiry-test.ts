/**
 * Test to check if booking expiration works
 */
const BASE = "http://localhost:3000";

async function register(username: string, password: string) {
  await fetch(`${BASE}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
}

async function login(username: string, password: string) {
  const res = await fetch(`${BASE}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  return res.headers.get("set-cookie")!.split(";")[0];
}

async function createEvent(cookie: string, title: string, totalSeats: number) {
  const res = await fetch(`${BASE}/events`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({ title, description: "test event", totalSeats }),
  });
  return res.json();
}

async function bookSeat(cookie: string, eventId: string) {
  const res = await fetch(`${BASE}/events/${eventId}/book`, {
    method: "POST",
    headers: { Cookie: cookie },
  });
  return { status: res.status, body: await res.json() };
}

async function confirmBooking(cookie: string, bookingId: string) {
  const res = await fetch(`${BASE}/bookings/${bookingId}/confirm`, {
    method: "POST",
    headers: { Cookie: cookie },
  });
  return { status: res.status, body: await res.json() };
}

async function main() {
  await register("expiryuser", "password123");
  const cookie = await login("expiryuser", "password123");

  // --- Test 1: confirm before expiry should succeed ---
  const event1 = await createEvent(cookie, "Confirm Before Expiry", 1);
  const booking1 = await bookSeat(cookie, event1.id);
  console.log(
    "Book (should be 201, PENDING):",
    booking1.status,
    booking1.body.status,
  );

  const confirm1 = await confirmBooking(cookie, booking1.body.id);
  console.log(
    "Confirm immediately (should be 200, CONFIRMED):",
    confirm1.status,
    confirm1.body.status,
  );

  // --- Test 2: confirm after expiry should fail with 410, and seat should release ---
  const event2 = await createEvent(cookie, "Confirm After Expiry", 1);
  const booking2 = await bookSeat(cookie, event2.id);
  console.log(
    "Book (should be 201, PENDING):",
    booking2.status,
    booking2.body.status,
  );

  console.log("Waiting past hold window...");
  await new Promise((r) => setTimeout(r, 8000)); // wait longer than your test hold duration

  const confirm2 = await confirmBooking(cookie, booking2.body.id);
  console.log(
    "Confirm after expiry (should be 410):",
    confirm2.status,
    confirm2.body,
  );

  // Seat should now be free again — try booking event2 a second time
  const booking3 = await bookSeat(cookie, event2.id);
  console.log(
    "Re-book same event after expiry (should be 201, seat released):",
    booking3.status,
    booking3.body.status,
  );
}

main();
