import { prisma } from "../prisma";
import { Event } from "../generated/prisma/client";
import { findUserById } from "./userStore";

/**
 * Creates a new event based on the given parameters.
 *
 * @param organizerId       User id of the organizer
 * @param title             Title of the event
 * @param description       Description of the event
 * @param totalSeats        Total seats for the event
 * @returns                 A newly created event
 */
export async function createEvent(
  organizerId: string,
  title: string,
  description: string,
  totalSeats: number,
): Promise<Event> {
  return prisma.event.create({
    data: {
      title,
      description,
      totalSeats,
      organizer: {
        connect: { id: organizerId },
      },
    },
  });
}

/**
 * Returns the event associated with the given id, undefined if not found
 *
 * @param id                    Id of the event being searched for
 * @returns Event | undefined   Returns either a matching event or undefined
 */
export async function findEventById(id: string): Promise<Event | undefined> {
  const event = await prisma.event.findUnique({ where: { id } });
  return event ?? undefined;
}

/**
 * Returns a list of all the events found in the database
 *
 * @returns Event[]     List of all the events
 */
export async function listEvents(): Promise<Event[]> {
  return await prisma.event.findMany();
}

/**
 * Counts how many confirmed/pending bookings exist for a specific event
 *
 * @param eventId       Id of the event
 * @returns Number      Count of confirmed bookings
 */
export async function countConfirmedBookings(eventId: string): Promise<number> {
  return await prisma.booking.count({
    where: {
      eventId: eventId,
      OR: [{ status: "CONFIRMED" }, { status: "PENDING" }],
    },
  });
}
