import express, { Application } from "express";
import session from "express-session";
import "dotenv/config";
import { connectRedis } from "./redis";
import { router as authRouter } from "./routes/auth";
import { router as eventsRouter } from "./routes/events";
import { router as bookingsRouter } from "./routes/bookings";

const app: Application = express();

app.use(express.json());
app.use(
  session({
    secret: process.env.SESSION_SECRET!,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      /**
       * Will revisit for deployment, false for now since this is for local dev only
       */
      secure: false,
    },
  }),
);

app.use(authRouter);
app.use(eventsRouter);
app.use(bookingsRouter);

async function main() {
  await connectRedis();
  app.listen(3000, () => {
    console.log("Listening on port 3000");
  });
}

main();
