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
