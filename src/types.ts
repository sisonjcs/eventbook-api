export interface User {
  id: string;
  username: string;
  hashedPassword: string;
}

export interface SafeUser {
  id: string;
  username: string;
}
