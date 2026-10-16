/**
 * Client for allauth's headless browser API. It shares the Django session
 * cookie with /api/, so a successful login here authenticates the SPA's API calls.
 */
import { csrfToken } from "../../lib/api";
import type { AuthOutcome, HeadlessError, HeadlessResponse } from "./types";

const BASE = "/_allauth/browser/v1";

const STATUS_MESSAGES: Record<number, string> = {
  403: "Your session expired. Reload the page and try again.",
  409: "You're already signed in.",
  429: "Too many attempts. Wait a minute and try again.",
};

export class AuthError extends Error {
  readonly status: number;
  readonly errors: HeadlessError[];

  constructor(message: string, status: number, errors: HeadlessError[] = []) {
    super(message);
    this.name = "AuthError";
    this.status = status;
    this.errors = errors;
  }

  /** First message per form field; errors without a field are left to `message`. */
  get fieldErrors(): Record<string, string> {
    const fields: Record<string, string> = {};
    for (const error of this.errors) {
      if (error.param && !(error.param in fields)) fields[error.param] = error.message;
    }
    return fields;
  }
}

type Method = "GET" | "POST" | "DELETE";

/** GET /auth/session sets the CSRF cookie that writes need. */
async function ensureCsrfCookie(): Promise<void> {
  if (!csrfToken()) await fetch(`${BASE}/auth/session`, { credentials: "same-origin" });
}

/**
 * Calls a headless endpoint. 401 is returned, not thrown: allauth uses it for
 * "not signed in (yet)", including after a signup that still needs email verification.
 */
export async function headless(
  path: string,
  { method = "GET", body }: { method?: Method; body?: unknown } = {},
  retried = false,
): Promise<HeadlessResponse> {
  if (method !== "GET") await ensureCsrfCookie();
  const headers: Record<string, string> = { Accept: "application/json" };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (method !== "GET") headers["X-CSRFToken"] = csrfToken() ?? "";

  const response = await fetch(`${BASE}${path}`, {
    method,
    headers,
    credentials: "same-origin",
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  let payload: HeadlessResponse;
  try {
    payload = (await response.json()) as HeadlessResponse;
  } catch {
    // Django's CSRF failure page is HTML. Refresh the cookie and try once more.
    if (response.status === 403 && !retried) {
      await fetch(`${BASE}/auth/session`, { credentials: "same-origin" });
      return headless(path, { method, body }, true);
    }
    throw new AuthError(
      STATUS_MESSAGES[response.status] ?? `Unexpected response (${response.status}).`,
      response.status,
    );
  }

  if (response.ok || response.status === 401) return payload;

  const errors = payload.errors ?? [];
  const general = errors.find((error) => !error.param)?.message;
  throw new AuthError(
    general ?? STATUS_MESSAGES[response.status] ?? errors[0]?.message ?? `Request failed (${response.status}).`,
    response.status,
    errors,
  );
}

export function authOutcome(response: HeadlessResponse): AuthOutcome {
  if (response.meta?.is_authenticated) return "authenticated";
  const flows = response.data?.flows ?? [];
  if (flows.some((flow) => flow.id === "verify_email" && flow.is_pending)) return "verify_email";
  throw new AuthError("Couldn't finish signing you in. Try again.", response.status);
}
