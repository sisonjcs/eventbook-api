import { prisma } from "../prisma";
import { Booking, Event } from "../generated/prisma/client";
import { EventNotFoundError, SoldOutError } from "../errors";

/**
 * Books a seat on an event if there is an available seat.
 * Transaction is locked to handle race condition.
 * Transaction is dropped as a whole if an error is encountered.
 *
 * @param eventId          Id of the event being booked
 * @param userId           Id of the user booking the event
 * @param expiryInMinutes  How many minutes from the current time will the booking expire
 * @returns Booking        Created booking
 */
export async function bookSeat(
  eventId: string,
  userId: string,
  expiryInMinutes: number,
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
      where: { eventId: eventId, status: "CONFIRMED" },
    });

    if (event.totalSeats - confirmedBookings <= 0) {
      throw new SoldOutError();
    }

    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + expiryInMinutes);

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
