import type { ReactNode } from "react";
import { Link } from "react-router";

export function AuthLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link to={to} className="font-semibold underline underline-offset-4">
      {children}
    </Link>
  );
}
