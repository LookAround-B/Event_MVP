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
    isApproved?: boolean;
    profileComplete?: boolean;
  };
};

export interface ScheduleEntry {
  id: string;
  startPosition: number;
  riderId: string;
  horseId: string;
  rider: { firstName: string; lastName: string };
  horse: { name: string };
}

export type DecodedToken = {
  id: string;
  email: string;
  role?: string;
  isApproved?: boolean;
  profileComplete?: boolean;
  iat: number;
  exp: number;
};
