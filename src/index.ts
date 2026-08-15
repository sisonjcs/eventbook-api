import express, { Application } from "express";
import session from "express-session";
import { router as authRouter } from "./auth";

const app: Application = express();

app.use(express.json());
app.use(
  session({
    secret: "sessionsecret0",
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

app.listen(3000, () => {
  console.log("Listening on port 3000");
});
