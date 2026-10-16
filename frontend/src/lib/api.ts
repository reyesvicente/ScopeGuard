/** Thin client for the Django API. Unwraps the {data, message, errors} envelope. */

export interface Envelope<T> {
  data: T;
  message: string;
  errors: unknown;
}

export interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export type FieldErrors = Record<string, string[]>;

const NON_FIELD_KEYS = new Set(["detail", "non_field_errors"]);

export class ApiError extends Error {
  readonly status: number;
  readonly errors: unknown;

  constructor(message: string, status: number, errors: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.errors = errors;
  }

  /**
   * DRF validation errors keyed by field. `detail` (auth, permission, CSRF) and
   * `non_field_errors` aren't about a field, so they're left to `message`.
   */
  get fieldErrors(): FieldErrors {
    if (!this.errors || typeof this.errors !== "object" || Array.isArray(this.errors)) return {};
    const fields: FieldErrors = {};
    for (const [key, value] of Object.entries(this.errors)) {
      if (NON_FIELD_KEYS.has(key) || !Array.isArray(value)) continue;
      fields[key] = value.map(String);
    }
    return fields;
  }
}

function getCookie(name: string): string | undefined {
  return document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${name}=`))
    ?.split("=")[1];
}

/** Django's CSRF token. Production uses the __Secure- prefixed name (see CSRF_COOKIE_NAME). */
export function csrfToken(): string | undefined {
  return getCookie("__Secure-csrftoken") ?? getCookie("csrftoken");
}

type Method = "GET" | "POST" | "PATCH" | "PUT" | "DELETE";

function isCsrfFailure(status: number, envelope: Envelope<unknown>): boolean {
  return status === 403 && envelope.message.startsWith("CSRF Failed");
}

export async function api<T>(
  path: string,
  { method = "GET", body }: { method?: Method; body?: unknown } = {},
  retried = false,
): Promise<T> {
  const isForm = body instanceof FormData;
  const headers: Record<string, string> = { Accept: "application/json" };
  // The browser sets the multipart boundary itself for FormData.
  if (body !== undefined && !isForm) headers["Content-Type"] = "application/json";
  if (method !== "GET") headers["X-CSRFToken"] = csrfToken() ?? "";

  const response = await fetch(`/api${path}`, {
    method,
    headers,
    credentials: "same-origin",
    body: body === undefined ? undefined : isForm ? body : JSON.stringify(body),
  });

  if (response.status === 204) return undefined as T;

  let envelope: Envelope<T>;
  try {
    envelope = (await response.json()) as Envelope<T>;
  } catch {
    throw new ApiError(`Unexpected response (${response.status})`, response.status, null);
  }

  if (!response.ok && !retried && isCsrfFailure(response.status, envelope)) {
    // The CSRF cookie was missing or stale. /users/me/ reissues it; try once more.
    await fetch("/api/users/me/", { credentials: "same-origin" });
    return api<T>(path, { method, body }, true);
  }
  if (!response.ok) {
    throw new ApiError(errorMessage(response.status, envelope), response.status, envelope.errors);
  }
  return envelope.data;
}

function errorMessage(status: number, envelope: Envelope<unknown>): string {
  if (isCsrfFailure(status, envelope)) {
    return "Your session expired. Reload the page and try again.";
  }
  const errors = envelope.errors as { non_field_errors?: unknown } | null;
  if (Array.isArray(errors?.non_field_errors) && errors.non_field_errors.length > 0) {
    return String(errors.non_field_errors[0]);
  }
  return envelope.message || `Request failed (${status}).`;
}

export function toQuery(params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") search.set(key, String(value));
  }
  const query = search.toString();
  return query ? `?${query}` : "";
}
