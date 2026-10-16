import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router";

import { api } from "../../lib/api";
import { authOutcome, headless } from "./headless";
import type { AuthOutcome, Credentials } from "./types";

export interface CurrentUser {
  name: string;
  url: string;
}

export const authKeys = {
  me: ["auth", "me"] as const,
};

export function useCurrentUser() {
  return useQuery({
    queryKey: authKeys.me,
    queryFn: () => api<CurrentUser>("/users/me/"),
    staleTime: 5 * 60_000,
  });
}

/** `?next=` from the URL, limited to paths on this site. */
export function useNextPath(): string {
  const [params] = useSearchParams();
  const next = params.get("next");
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/";
}

/** Login and signup both end by reloading the current user so AuthGate lets them in. */
function useSessionMutation(path: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (credentials: Credentials): Promise<AuthOutcome> =>
      authOutcome(await headless(path, { method: "POST", body: credentials })),
    onSuccess: async (outcome) => {
      if (outcome === "authenticated") await queryClient.resetQueries({ queryKey: authKeys.me });
    },
  });
}

export function useLogin() {
  return useSessionMutation("/auth/login");
}

export function useSignup() {
  return useSessionMutation("/auth/signup");
}

export function useLogout() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  return useMutation({
    mutationFn: () => headless("/auth/session", { method: "DELETE" }),
    onSuccess: () => {
      queryClient.clear();
      navigate("/login", { replace: true });
    },
  });
}

/** Confirms the key from a verification email. Signs the user in when allauth allows it. */
export function useVerifyEmail() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (key: string) => {
      const response = await headless("/auth/email/verify", { method: "POST", body: { key } });
      return Boolean(response.meta?.is_authenticated);
    },
    onSuccess: async (signedIn) => {
      if (signedIn) await queryClient.resetQueries({ queryKey: authKeys.me });
    },
  });
}

export function useRequestPasswordReset() {
  return useMutation({
    mutationFn: (email: string) =>
      headless("/auth/password/request", { method: "POST", body: { email } }),
  });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: (input: { key: string; password: string }) =>
      headless("/auth/password/reset", { method: "POST", body: input }),
  });
}
