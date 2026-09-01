import express from "express";
import session from "express-session";
import { router as healthRouter } from "./routes/health";
import { router as authRouter } from "./routes/auth";
import { router as eventsRouter } from "./routes/events";
import { router as bookingsRouter } from "./routes/bookings";

export function createApp() {
  const app = express();
  app.use(express.json());
  app.set("trust proxy", 1);
  app.use(
    session({
      secret: process.env.SESSION_SECRET!,
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
      },
    }),
  );
  app.use(healthRouter);
  app.use(authRouter);
  app.use(eventsRouter);
  app.use(bookingsRouter);

  return app;
}
