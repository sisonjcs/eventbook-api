import { Router, Request, Response } from "express";
import { createEvent, findEventById, listEvents } from "../store/eventStore";
import { bookSeat, findBookingsByEvent } from "../store/bookingStore";
import { getUserId, requireAuth } from "../middleware/requireAuth";
import { EventNotFoundError, SoldOutError } from "../errors";
import { bookingRateLimiter } from "../middleware/bookingRateLimiter";
import { getCachedEvents, setCachedEvents } from "../cache/eventCache";

export const router = Router();

/**
 * POST /events
 *
 * Authenticated
 * Creates a new event given that the user creating the event is authenticated and has given all the details required
 */
router.post("/events", requireAuth, async (req: Request, res: Response) => {
  const { title, description, totalSeats } = req.body;

  if (!title || !description || !totalSeats) {
    return res.status(400).send({ error: "Missing event details" });
  }

  const event = await createEvent(
    getUserId(req),
    title,
    description,
    totalSeats,
  );

  return res.status(201).send(event);
});

/**
 * GET /events
 *
 * Public
 * Returns a list of events found in the Redis' cache or from the database and cache it
 */
router.get("/events", async (req: Request, res: Response) => {
  const cached = await getCachedEvents();
  if (cached) {
    return res.status(200).send(cached);
  }

  const events = await listEvents();
  await setCachedEvents(events);
  return res.status(200).send(events);
});

/**
 * GET /events/:id
 *
 * Public
 * Returns the event associated with the given id
 */
router.get("/events/:id", async (req: Request, res: Response) => {
  const event = await findEventById(req.params.id as string);

  if (event === undefined) {
    return res.status(404).send({ error: "Event not found" });
  }

  return res.status(200).send(event);
});

/**
 * POST /events/:id/book
 *
 * Authenticated
 * Creates a booking for the specified event
 */
router.post(
  "/events/:id/book",
  requireAuth,
  bookingRateLimiter,
  async (req: Request, res: Response) => {
    try {
      const eventId = req.params.id as string;
      const booking = await bookSeat(eventId, getUserId(req));

      return res.status(201).send(booking);
    } catch (error) {
      if (error instanceof EventNotFoundError) {
        return res.status(404).send({ error: error.message });
      }
      if (error instanceof SoldOutError) {
        return res.status(409).send({ error: error.message });
      }

      console.error(error);

      return res.status(500).send({ error: "Something went wrong" });
    }
  },
);

/**
 * GET /events/:id/bookings
 *
 * Authenticated, Organizer-only
 * Returns a list of bookings of a specific event
 */
router.get(
  "/events/:id/bookings",
  requireAuth,
  async (req: Request, res: Response) => {
    const eventId = req.params.id as string;
    const event = await findEventById(eventId);

    if (event === undefined) {
      return res.status(404).send({ error: "Event not found" });
    }

    if (event.userId !== req.session.userId) {
      return res.status(403).send({ error: "Organizer-only" });
    }

    const bookings = await findBookingsByEvent(eventId);

    return res.status(200).send(bookings);
  },
);
