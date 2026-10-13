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

export class ApiError extends Error {
  readonly status: number;
  readonly errors: unknown;

  constructor(message: string, status: number, errors: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.errors = errors;
  }

  /** DRF validation errors keyed by field, when the response has them. */
  get fieldErrors(): FieldErrors {
    if (this.errors && typeof this.errors === "object" && !Array.isArray(this.errors)) {
      return this.errors as FieldErrors;
    }
    return {};
  }
}

function getCookie(name: string): string | undefined {
  return document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${name}=`))
    ?.split("=")[1];
}

type Method = "GET" | "POST" | "PATCH" | "PUT" | "DELETE";

export async function api<T>(
  path: string,
  { method = "GET", body }: { method?: Method; body?: unknown } = {},
): Promise<T> {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (method !== "GET") {
    // Production uses the __Secure- prefixed cookie name (see CSRF_COOKIE_NAME).
    headers["X-CSRFToken"] = getCookie("__Secure-csrftoken") ?? getCookie("csrftoken") ?? "";
  }

  const response = await fetch(`/api${path}`, {
    method,
    headers,
    credentials: "same-origin",
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (response.status === 204) return undefined as T;

  let envelope: Envelope<T>;
  try {
    envelope = (await response.json()) as Envelope<T>;
  } catch {
    throw new ApiError(`Unexpected response (${response.status})`, response.status, null);
  }

  if (!response.ok) {
    throw new ApiError(envelope.message || "Request failed.", response.status, envelope.errors);
  }
  return envelope.data;
}

export function toQuery(params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") search.set(key, String(value));
  }
  const query = search.toString();
  return query ? `?${query}` : "";
}
