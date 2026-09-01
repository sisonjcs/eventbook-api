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
 * @openapi
 * /bookings/{id}/confirm:
 *   post:
 *     summary: Confirm a pending booking before it expires
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Booking ID
 *     responses:
 *       200:
 *         description: Booking confirmed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 eventId:
 *                   type: string
 *                 userId:
 *                   type: string
 *                 status:
 *                   type: string
 *                   enum: [PENDING, CONFIRMED, EXPIRED]
 *       400:
 *         description: Booking is already confirmed
 *       403:
 *         description: This booking does not belong to the current user
 *       404:
 *         description: Booking not found
 *       410:
 *         description: Booking's hold window has expired
 *       500:
 *         description: Unexpected server error
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
          "Booking confirmation attempt by non-owner",
        );
        return res.status(403).send({ error: error.message });
      }

      logger.error({ userId: getUserId(req) }, "Unexpected error occurred");
      return res.status(500).send({ error: "Something went wrong" });
    }
  },
);

/**
 * @openapi
 * /bookings/mine:
 *   get:
 *     summary: List all bookings belonging to the current user
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: A list of the current user's bookings
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   eventId:
 *                     type: string
 *                   status:
 *                     type: string
 *                     enum: [PENDING, CONFIRMED, EXPIRED]
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
