/**
 * Test to check concurrency for bookin a seat
 */

// Make sure event id exists
const eventId = "5890e901-48c9-4d58-afa8-47c5d6c9585a";

async function getCookie(username: string, password: string) {
  const res = await fetch("http://localhost:3000/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  const setCookie = res.headers.get("set-cookie");
  return setCookie?.split(";")[0]; // just the "name=value" part
}

async function book(cookie: string) {
  const res = await fetch(`http://localhost:3000/events/${eventId}/book`, {
    method: "POST",
    headers: { Cookie: cookie },
  });
  console.log(res.status, await res.json());
}

async function main() {
  // Make sure users exist
  const cookieA = await getCookie("userA", "password123");
  const cookieB = await getCookie("userB", "password123");
  await Promise.all([book(cookieA!), book(cookieB!)]);
}

main();
