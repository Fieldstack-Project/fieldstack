export interface LoginRequest {
  email: string;
  password: string;
}

export interface SessionToken {
  accessToken: string;
  refreshToken: string;
}

export interface JwtSessionPayload {
  userId: string;
  sessionId: string;
}

export interface JwtSessionManager {
  issueTokens(payload: JwtSessionPayload): Promise<SessionToken>;
  verifyAccessToken(token: string): Promise<JwtSessionPayload>;
  rotateRefreshToken(refreshToken: string): Promise<SessionToken>;
  revokeSession(sessionId: string): Promise<void>;
}

export interface WhitelistRule {
  id: string;
  type: "email" | "domain";
  value: string;
  enabled: boolean;
}

export interface WhitelistService {
  listRules(): Promise<WhitelistRule[]>;
  addRule(rule: Omit<WhitelistRule, "id">): Promise<WhitelistRule>;
  removeRule(ruleId: string): Promise<void>;
  isAllowed(email: string): Promise<boolean>;
}

export interface AdminPinService {
  setPin(rawPin: string): Promise<void>;
  verifyPin(rawPin: string): Promise<boolean>;
  rotatePin(currentPin: string, nextPin: string): Promise<void>;
}

export interface PasswordRecoveryRequest {
  email: string;
}

export interface PasswordResetConfirm {
  token: string;
  newPassword: string;
}

export interface AdminAssistedResetRequest {
  adminPin: string;
  userId: string;
  temporaryPassword: string;
}

export interface PasswordRecoveryService {
  requestSelfServiceReset(payload: PasswordRecoveryRequest): Promise<void>;
  confirmSelfServiceReset(payload: PasswordResetConfirm): Promise<void>;
  adminAssistedReset(payload: AdminAssistedResetRequest): Promise<void>;
}

export interface AuthService {
  login(payload: LoginRequest): Promise<SessionToken>;
}
