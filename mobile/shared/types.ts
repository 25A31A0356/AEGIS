export interface User {
  id: string;
  name?: string;
  phone?: string;
  email?: string;
  role?: string;
  createdAt?: string;
}

export type InsertUser = Partial<User>;
