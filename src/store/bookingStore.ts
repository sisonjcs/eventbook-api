import { prisma } from "../prisma";
import { Booking, Event } from "../generated/prisma/client";
import {
  BookingAlreadyConfirmedError,
  BookingExpiredError,
  BookingForbiddenError,
  BookingNotFoundError,
  EventNotFoundError,
  SoldOutError,
} from "../errors";
import { DEFAULT_HOLD_MINUTES } from "../config";

/**
 * Books a seat on an event if there is an available seat.
 * Transaction is locked to handle race condition.
 * Transaction is dropped as a whole if an error is encountered.
 *
 * @param eventId          Id of the event being booked
 * @param userId           Id of the user booking the event
 * @returns Booking        Created booking
 */
export async function bookSeat(
  eventId: string,
  userId: string,
): Promise<Booking> {
  return await prisma.$transaction(async (tx) => {
    const events = await tx.$queryRaw<
      Event[]
    >`SELECT * FROM "Event" WHERE id = ${eventId} FOR UPDATE`;

    const event = events[0];

    if (!event) {
      throw new EventNotFoundError();
    }

    const confirmedBookings: number = await tx.booking.count({
      where: {
        eventId: eventId,
        status: { in: ["CONFIRMED", "PENDING"] },
      },
    });

    if (event.totalSeats - confirmedBookings <= 0) {
      throw new SoldOutError();
    }

    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + DEFAULT_HOLD_MINUTES);

    return await tx.booking.create({
      data: {
        event: { connect: { id: eventId } },
        bookedBy: { connect: { id: userId } },
        expiresAt,
      },
    });
  });
}

/**
 * Finds every booking present in a given event
 *
 * @param eventId       Id of the event
 * @returns Booking[]   List of bookings
 */
export async function findBookingsByEvent(eventId: string): Promise<Booking[]> {
  return await prisma.booking.findMany({ where: { eventId: eventId } });
}

/**
 * Confirms a booking as long as the ownership is verified and the booking hasn't expired yet.
 * If booking is past expiry, status is updated.
 *
 * @param bookingId     Id of the booking to be confirmed
 * @param userId        Id of the user who owns the booking
 * @returns Booking     Confirmed booking
 */
export async function confirmBooking(
  bookingId: string,
  userId: string,
): Promise<Booking> {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
  });

  if (!booking) {
    throw new BookingNotFoundError();
  }

  if (booking.userId !== userId) {
    throw new BookingForbiddenError();
  }

  if (booking.status === "CONFIRMED") {
    throw new BookingAlreadyConfirmedError();
  }

  if (booking.status === "EXPIRED") {
    throw new BookingExpiredError();
  }

  if (booking!.expiresAt!.getTime() < Date.now()) {
    await prisma.booking.update({
      where: {
        id: bookingId,
      },
      data: {
        status: "EXPIRED",
        expiresAt: null,
      },
    });
    throw new BookingExpiredError();
  }

  return await prisma.booking.update({
    where: {
      id: bookingId,
    },
    data: {
      status: "CONFIRMED",
      expiresAt: null,
    },
  });
}

/**
 * Returns all the bookings of a specific user
 *
 * @param userId        Id of the user
 * @returns Booking[]   List of bookings
 */
export async function findBookingsByUser(userId: string): Promise<Booking[]> {
  return await prisma.booking.findMany({ where: { userId } });
}
