export class EventNotFoundError extends Error {
  constructor() {
    super("Event not found");
    this.name = "EventNotFoundError";
  }
}

export class SoldOutError extends Error {
  constructor() {
    super("No available seats");
    this.name = "SoldOutError";
  }
}

export class BookingNotFoundError extends Error {
  constructor() {
    super("Booking not found");
    this.name = "BookingNotFoundError";
  }
}

export class BookingAlreadyConfirmedError extends Error {
  constructor() {
    super("Booking already confirmed");
    this.name = "BookingAlreadyConfirmedError";
  }
}

export class BookingExpiredError extends Error {
  constructor() {
    super("Booking is expired");
    this.name = "BookingExpiredError";
  }
}
