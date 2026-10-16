import { Card, CardDescription, CardTitle } from "ice-ds";
import type { ReactNode } from "react";
import { Link } from "react-router";

import { Logo } from "../../../components/Logo";

interface AuthLayoutProps {
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
}

/** Pitch on the left, auth card on the right; stacks on small screens. */
export function AuthLayout({ title, description, children, footer }: AuthLayoutProps) {
  return (
    <div className="mx-auto grid min-h-screen w-full max-w-5xl items-center gap-10 px-4 py-12 md:grid-cols-2">
      <div className="flex flex-col gap-6">
        <Link to="/" className="flex items-center gap-3 self-start">
          <Logo size={56} />
          <span className="font-display text-2xl font-bold">ScopeGuard</span>
        </Link>
        <h1 className="font-display text-5xl font-bold leading-none">Stop doing free work.</h1>
        <p className="text-lg">
          ScopeGuard checks client requests against your statement of work and drafts the change order
          for you — using an open-weight model.
        </p>
        <p className="text-sm">Your contracts and client messages are never used for training.</p>
      </div>
      <Card className="flex flex-col gap-5 p-6">
        <div className="flex flex-col gap-1">
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </div>
        {children}
        {footer && <div className="flex flex-col gap-2 text-sm">{footer}</div>}
      </Card>
    </div>
  );
}
