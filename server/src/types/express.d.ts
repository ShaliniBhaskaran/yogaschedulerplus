export interface AuthUser {
  email: string;
  role: 'manager' | 'instructor';
  instructorId?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export {};
