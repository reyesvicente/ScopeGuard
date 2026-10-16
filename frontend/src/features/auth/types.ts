/** Shapes returned by allauth's headless browser API (/_allauth/browser/v1/). */

export interface HeadlessError {
  message: string;
  code: string;
  param?: string;
}

export interface Flow {
  id: string;
  is_pending?: boolean;
}

export interface HeadlessUser {
  id: number;
  email: string;
  display: string;
}

export interface HeadlessResponse {
  status: number;
  data?: {
    user?: HeadlessUser;
    flows?: Flow[];
  };
  meta?: { is_authenticated?: boolean };
  errors?: HeadlessError[];
}

/** Where a login or signup attempt ended up. */
export type AuthOutcome = "authenticated" | "verify_email";

export interface Credentials {
  email: string;
  password: string;
}
