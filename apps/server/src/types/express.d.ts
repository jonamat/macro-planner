declare namespace Express {
  interface UserClaims {
    id: string;
  }

  interface Request {
    user?: UserClaims;
  }
}
