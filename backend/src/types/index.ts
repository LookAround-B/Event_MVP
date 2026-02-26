export type ApiResponse<T = any> = {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  errors?: Record<string, string[]>;
  statusCode: number;
};

export type AuthToken = {
  token: string;
  expiresIn: number;
  user: {
    id: string;
    email: string;
    name: string;
    role?: string;
  };
};

export type DecodedToken = {
  id: string;
  email: string;
  role?: string;
  iat: number;
  exp: number;
};
