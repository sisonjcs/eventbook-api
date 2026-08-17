import { Router, Request, Response } from "express";
import {
  createUser,
  findUserById,
  findUserByUsername,
} from "../store/userStore";
import bcrypt from "bcrypt";

export const router = Router();

/**
 * POST /register
 *
 * Creates a new user by registering their desired username and hashed password.
 * The system checks for any duplicate usernames before proceeding to hash the given password.
 * The new user is then created and added to the user list.
 */
router.post("/register", async (req: Request, res: Response) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).send({ error: "Missing details." });
  }

  if ((await findUserByUsername(username)) !== undefined) {
    return res.status(409).send({ error: "Username already taken." });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const newUser = await createUser(username, passwordHash);
  return res.status(201).send(newUser);
});

/**
 * POST /login
 *
 * Sets the session's user id to the logged in user.
 * Verifies the user's credentials before logging in the user.
 */
router.post("/login", async (req: Request, res: Response) => {
  const { username, password } = req.body;
  const user = await findUserByUsername(username);
  if (!user) {
    return res.status(401).send({ error: "Invalid login credentials." });
  }

  if (await bcrypt.compare(password, user.passwordHash)) {
    req.session.userId = user.id;
    return res.status(200).send({ id: user.id, username: user.username });
  }

  return res.status(401).send({ error: "Invalid login credentials." });
});

/**
 * GET /me
 *
 * Returns the user's safe credentials (username and id) if the user is in a session, else returns a status code of 401 Unauthorized.
 */
router.get("/me", async (req: Request, res: Response) => {
  if (req.session.userId) {
    const user = await findUserById(req.session.userId);

    if (user) {
      return res.status(200).send({ id: user.id, username: user.username });
    }
  }

  return res.status(401).send({ error: "Not authenticated." });
});

/**
 * POST /logout
 *
 * Logs out the user that is in a session. If no user is in session, send an error message.
 * Else, destroy the session.
 */
router.post("/logout", (req: Request, res: Response) => {
  if (!req.session.userId) {
    return res.status(400).send({ error: "No user is logged in." });
  }

  req.session.destroy((err: Error) => {
    if (err) {
      return res.status(500).send({ error: "Something went wrong." });
    }

    return res.status(200).send({ message: "Successfully logged out." });
  });
});
