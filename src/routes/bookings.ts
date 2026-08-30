import { Router, Request, Response } from "express";
import { getUserId, requireAuth } from "../middleware/requireAuth";
import { confirmBooking, findBookingsByUser } from "../store/bookingStore";
import {
  BookingNotFoundError,
  BookingAlreadyConfirmedError,
  BookingExpiredError,
  BookingForbiddenError,
} from "../errors";
import { logger } from "../logger";

export const router = Router();
/**
 * POST /bookings/:id/confirm
 *
 * Authenticated
 * Confirms a pending booking
 */
router.post(
  "/bookings/:id/confirm",
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      const bookingId = req.params.id as string;
      const userId = getUserId(req);

      const booking = await confirmBooking(bookingId, userId);

      logger.info({ userId, bookingId }, "Confirmed booking successfully");
      return res.status(200).send(booking);
    } catch (error) {
      if (error instanceof BookingNotFoundError) {
        logger.warn(
          { userId: getUserId(req) },
          "Booking confirmation attempt on a non-existent booking",
        );
        return res.status(404).send({ error: error.message });
      }
      if (error instanceof BookingAlreadyConfirmedError) {
        logger.warn(
          { bookingId: req.params.id, userId: getUserId(req) },
          "Booking confirmation attempt on an already confirmed booking",
        );
        return res.status(400).send({ error: error.message });
      }
      if (error instanceof BookingExpiredError) {
        return res.status(410).send({ error: error.message });
      }
      if (error instanceof BookingForbiddenError) {
        logger.warn(
          { bookingId: req.params.id, userId: getUserId(req) },
          "Booking confirmation attempt on an expired booking",
        );
        return res.status(403).send({ error: error.message });
      }

      logger.error({ userId: getUserId(req) }, "Unexpected error occurred");
      return res.status(500).send({ error: "Something went wrong" });
    }
  },
);

/**
 * GET /bookings/mine
 *
 * Public
 * Returns a list of all the bookings the current user has
 */
router.get(
  "/bookings/mine",
  requireAuth,
  async (req: Request, res: Response) => {
    const userId = getUserId(req);

    const bookings = await findBookingsByUser(userId);

    return res.status(200).send(bookings);
  },
);
