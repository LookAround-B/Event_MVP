// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  errors?: Record<string, string[]>;
  statusCode?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Authentication Types
export interface LoginPayload {
  email: string;
  password: string;
}

export interface AuthToken {
  token: string;
  expiresIn: number;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    eId: string;
  };
}

export interface DecodedToken {
  id: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

// Filter Types
export interface ListFilters {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  [key: string]: any;
}

export interface EventFilters extends ListFilters {
  status?: 'published' | 'unpublished';
  eventType?: string;
  startDate?: string;
  endDate?: string;
}

export interface RegistrationFilters extends ListFilters {
  eventId?: string;
  paymentStatus?: string;
  categoryId?: string;
  riderId?: string;
  clubId?: string;
}

// Error Response
export interface ErrorResponse {
  code: string;
  message: string;
  details?: any;
}
