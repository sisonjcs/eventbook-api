import { prisma } from "../prisma";
import { Booking, Event } from "../generated/prisma/client";
import { EventNotFoundError, SoldOutError } from "../errors";

/**
 * Books a seat on an event if there is an available seat.
 * Transaction is locked to handle race condition.
 * Transaction is dropped as a whole if an error is encountered.
 *
 * @param eventId     Id of the event being booked
 * @param userId      Id of the user booking the event
 * @returns Booking   Created booking
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
      where: { eventId: eventId, status: "CONFIRMED" },
    });

    if (event.totalSeats - confirmedBookings <= 0) {
      throw new SoldOutError();
    }

    return await tx.booking.create({
      data: {
        event: { connect: { id: eventId } },
        bookedBy: { connect: { id: userId } },
        status: "CONFIRMED",
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
