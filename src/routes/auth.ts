import { Router, Request, Response } from "express";
import {
  createUser,
  findUserById,
  findUserByUsername,
} from "../store/userStore";
import bcrypt from "bcrypt";
import { logger } from "../logger";

export const router = Router();

/**
 * @openapi
 * /register:
 *   post:
 *     summary: Register a new user account
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [username, password]
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       201:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 username:
 *                   type: string
 *       400:
 *         description: Missing username or password
 *       409:
 *         description: Username already taken
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
  logger.info(
    { userId: newUser.id, username: newUser.username },
    "User registered",
  );
  return res.status(201).send({ id: newUser.id, username: newUser.username });
});

/**
 * @openapi
 * /login:
 *   post:
 *     summary: Log in and start a session
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [username, password]
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Logged in successfully, session cookie set
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 username:
 *                   type: string
 *       401:
 *         description: Invalid username or password
 */
router.post("/login", async (req: Request, res: Response) => {
  const { username, password } = req.body;
  const user = await findUserByUsername(username);
  if (!user) {
    return res.status(401).send({ error: "Invalid login credentials." });
  }

  if (await bcrypt.compare(password, user.passwordHash)) {
    req.session.userId = user.id;
    logger.info({ userId: user.id }, "User logged in");
    return res.status(200).send({ id: user.id, username: user.username });
  }

  logger.warn({ userId: user.id }, "Failed login attempt");
  return res.status(401).send({ error: "Invalid login credentials." });
});

/**
 * @openapi
 * /me:
 *   get:
 *     summary: Get the currently authenticated user
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: The current user
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 username:
 *                   type: string
 *       401:
 *         description: Not authenticated
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
 * @openapi
 * /logout:
 *   post:
 *     summary: Log out and destroy the current session
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Successfully logged out
 *       400:
 *         description: No user is currently logged in
 *       500:
 *         description: Session could not be destroyed
 */
router.post("/logout", (req: Request, res: Response) => {
  if (!req.session.userId) {
    return res.status(400).send({ error: "No user is logged in." });
  }

  req.session.destroy((err: Error) => {
    if (err) {
      logger.error({ err }, "Unexpected error occurred");
      return res.status(500).send({ error: "Something went wrong." });
    }

    logger.info("User logged out");
    return res.status(200).send({ message: "Successfully logged out." });
  });
});
