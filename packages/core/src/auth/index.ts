export interface LoginRequest {
  email: string;
  password: string;
}

export interface SessionToken {
  accessToken: string;
  refreshToken: string;
}

export interface AuthService {
  login(payload: LoginRequest): Promise<SessionToken>;
}
