import { useQuery } from "@tanstack/react-query";

import { api } from "../../lib/api";

export interface CurrentUser {
  name: string;
  url: string;
}

export function useCurrentUser() {
  return useQuery({
    queryKey: ["auth", "me"],
    queryFn: () => api<CurrentUser>("/users/me/"),
    staleTime: 5 * 60_000,
  });
}

export const LOGIN_URL = "/accounts/login/?next=/";
export const SIGNUP_URL = "/accounts/signup/?next=/";
export const LOGOUT_URL = "/accounts/logout/";
