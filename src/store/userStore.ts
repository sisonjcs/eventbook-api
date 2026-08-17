import { User } from "../generated/prisma/client";
import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
export const prisma = new PrismaClient({
  adapter: adapter,
});

/**
 * Creates a new user and adds it to the in-memory user list.
 *
 * @param username      The username set by the user
 * @param passwordHash  The hashed value of the user's password
 * @returns newUser     The generated new user entry
 */
export async function createUser(
  username: string,
  passwordHash: string,
): Promise<User> {
  return await prisma.user.create({ data: { username, passwordHash } });
}

/**
 * Returns the user associated with the provided username, undefined if not found.
 *
 * @param username              The provided username for searching
 * @returns User | undefined    The matching user is returned if found, else undefined
 */
export async function findUserByUsername(
  username: string,
): Promise<User | undefined> {
  const user = await prisma.user.findUnique({ where: { username } });
  return user ?? undefined;
}

/**
 * Returns the user associated with the provided id, undefined if not found.
 *
 * @param id                    The provided id for searching
 * @returns User | undefined    The matching user is returned if found, else undefined
 */
export async function findUserById(id: string): Promise<User | undefined> {
  const user = await prisma.user.findUnique({ where: { id } });
  return user ?? undefined;
}
