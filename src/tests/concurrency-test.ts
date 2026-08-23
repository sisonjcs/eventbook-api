/**
 * Test to check concurrency for booking a seat
 */

async function register(username: string, password: string) {
  // Ignore failures here
  await fetch("http://localhost:3000/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
}

async function login(username: string, password: string) {
  const res = await fetch("http://localhost:3000/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  const setCookie = res.headers.get("set-cookie");
  return setCookie?.split(";")[0];
}

async function createEvent(cookie: string) {
  const res = await fetch("http://localhost:3000/events", {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({
      title: "Concurrency Test Event",
      description: "single-seat event for race condition testing",
      totalSeats: 1,
    }),
  });
  const event = await res.json();
  return event.id;
}

async function book(eventId: string, cookie: string) {
  const res = await fetch(`http://localhost:3000/events/${eventId}/book`, {
    method: "POST",
    headers: { Cookie: cookie },
  });
  console.log(res.status, await res.json());
}

async function main() {
  await register("userA", "password123");
  await register("userB", "password123");

  const cookieA = await login("userA", "password123");
  const cookieB = await login("userB", "password123");

  if (!cookieA || !cookieB) {
    throw new Error("Login failed — check credentials or server logs");
  }

  const organizerCookie = cookieA; // reuse userA as the organizer, doesn't matter who
  const eventId = await createEvent(organizerCookie);
  console.log("Created test event:", eventId);

  await Promise.all([book(eventId, cookieA), book(eventId, cookieB)]);
}

main();
