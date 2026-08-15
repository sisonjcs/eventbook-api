import { User } from "./types";

/**
 * Users are stored in memory for now
 * Keyed by username
 */
const users = new Map<string, User>();

/**
 * Creates a new user and adds it to the in-memory user list.
 *
 * @param username      The username set by the user
 * @param passwordHash  The hashed value of the user's password
 * @returns newUser     The generated new user entry
 */
export function createUser(username: string, passwordHash: string): User {
  const newUser: User = {
    id: crypto.randomUUID(),
    username: username,
    hashedPassword: passwordHash,
  };

  users.set(username, newUser);

  return newUser;
}

/**
 * Returns the user associated with the provided username, undefined if not found.
 *
 * @param username              The provided username for searching
 * @returns User | undefined    The matching user is returned if found, else undefined
 */
export function findUserByUsername(username: string): User | undefined {
  return users.get(username) ?? undefined;
}

/**
 * Returns the user associated with the provided id, undefined if not found.
 *
 * @param id                    The provided id for searching
 * @returns User | undefined    The matching user is returned if found, else undefined
 */
export function findUserById(id: string): User | undefined {
  for (const user of users.values()) {
    if (user.id === id) {
      return user;
    }
  }

  return undefined;
}
