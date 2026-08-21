import { Router, Request, Response } from "express";
import { getUserId, requireAuth } from "../middleware/requireAuth";
import { confirmBooking, findBookingsByUser } from "../store/bookingStore";
import {
  BookingNotFoundError,
  BookingAlreadyConfirmedError,
  BookingExpiredError,
} from "../errors";

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

      return res.status(200).send(booking);
    } catch (error) {
      if (error instanceof BookingNotFoundError) {
        return res.status(404).send({ error: error.message });
      }
      if (error instanceof BookingAlreadyConfirmedError) {
        return res.status(400).send({ error: error.message });
      }
      if (error instanceof BookingExpiredError) {
        return res.status(410).send({ error: error.message });
      }
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
