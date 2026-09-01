import { Router, Request, Response } from "express";
import { createEvent, findEventById, listEvents } from "../store/eventStore";
import { bookSeat, findBookingsByEvent } from "../store/bookingStore";
import { getUserId, requireAuth } from "../middleware/requireAuth";
import { EventNotFoundError, SoldOutError } from "../errors";
import { bookingRateLimiter } from "../middleware/bookingRateLimiter";
import { getCachedEvents, setCachedEvents } from "../cache/eventCache";
import { logger } from "../logger";

export const router = Router();

/**
 * @openapi
 * /events:
 *   post:
 *     summary: Create a new event
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, description, totalSeats]
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               totalSeats:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Event created
 *       400:
 *         description: Missing event details
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

  logger.info("Successfully created a new event");
  return res.status(201).send(event);
});

/**
/**
 * @openapi
 * /events:
 *   get:
 *     summary: List all events with live seat availability
 *     description: Served from a short-lived Redis cache when available; falls back to the database on a cache miss.
 *     responses:
 *       200:
 *         description: A list of events
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   title:
 *                     type: string
 *                   description:
 *                     type: string
 *                   totalSeats:
 *                     type: integer
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
 * @openapi
 * /events/{id}:
 *   get:
 *     summary: Get a single event by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: The requested event
 *       404:
 *         description: Event not found
 */
router.get("/events/:id", async (req: Request, res: Response) => {
  const event = await findEventById(req.params.id as string);

  if (event === undefined) {
    return res.status(404).send({ error: "Event not found" });
  }

  return res.status(200).send(event);
});

/**
 * @openapi
 * /events/{id}/book:
 *   post:
 *     summary: Reserve a seat on an event
 *     description: Creates a PENDING booking with a time-limited hold. Rate-limited to prevent abuse.
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       201:
 *         description: Booking created with PENDING status
 *       404:
 *         description: Event not found
 *       409:
 *         description: Event is sold out
 *       429:
 *         description: Too many booking attempts, rate limit exceeded
 *       500:
 *         description: Unexpected server error
 */
router.post(
  "/events/:id/book",
  requireAuth,
  bookingRateLimiter,
  async (req: Request, res: Response) => {
    try {
      const eventId = req.params.id as string;
      const userId = getUserId(req);
      const booking = await bookSeat(eventId, userId);

      logger.info({ eventId, userId }, "Successfully created a new booking");
      return res.status(201).send(booking);
    } catch (error) {
      if (error instanceof EventNotFoundError) {
        logger.warn("Booking attempt on an event that cannot be found");
        return res.status(404).send({ error: error.message });
      }
      if (error instanceof SoldOutError) {
        logger.warn("Booking attempt on a sold-out event");
        return res.status(409).send({ error: error.message });
      }

      logger.error({ err: error }, "Unexpected error during booking");
      return res.status(500).send({ error: "Something went wrong" });
    }
  },
);

/**
 * @openapi
 * /events/{id}/bookings:
 *   get:
 *     summary: List all bookings for an event (organizer only)
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: A list of bookings for the event
 *       403:
 *         description: Only the event's organizer can view its bookings
 *       404:
 *         description: Event not found
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
