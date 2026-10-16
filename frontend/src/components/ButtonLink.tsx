import { buttonVariants, type ButtonProps } from "ice-ds";
import type { ReactNode } from "react";
import { Link } from "react-router";

interface ButtonLinkProps {
  to: string;
  variant?: ButtonProps["variant"];
  size?: ButtonProps["size"];
  className?: string;
  children: ReactNode;
}

/** A router link styled as an ice-ds button (no <button> nested in an <a>). */
export function ButtonLink({ to, variant, size, className, children }: ButtonLinkProps) {
  const classes = [buttonVariants({ variant, size }), className].filter(Boolean).join(" ");
  return (
    <Link to={to} className={classes}>
      {children}
    </Link>
  );
}
