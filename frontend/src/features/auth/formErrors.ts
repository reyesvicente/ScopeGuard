import { AuthError } from "./headless";

/**
 * Copies allauth field errors onto the form and returns the message to show as
 * a banner when nothing could be pinned to a field.
 */
export function applyAuthError<Field extends string>(
  error: unknown,
  fields: readonly Field[],
  setError: (field: Field, error: { message: string }) => void,
): string {
  if (!(error instanceof AuthError)) {
    return "Couldn't reach the server. Check your connection and try again.";
  }
  let pinned = false;
  for (const [param, message] of Object.entries(error.fieldErrors)) {
    if ((fields as readonly string[]).includes(param)) {
      setError(param as Field, { message });
      pinned = true;
    }
  }
  return pinned ? "" : error.message;
}
