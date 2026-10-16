import { Link } from "react-router";

import { ButtonLink } from "../../../components/ButtonLink";
import { Logo } from "../../../components/Logo";

export function LandingHeader() {
  return (
    <header className="border-b-4 border-neo-black bg-neo-yellow">
      <div className="mx-auto flex w-full max-w-6xl items-center gap-4 px-4 py-3">
        <Link to="/" className="flex items-center gap-2">
          <Logo size={32} fill="#fffdf5" />
          <span className="font-display text-xl font-bold">ScopeGuard</span>
        </Link>
        <nav className="ml-auto flex items-center gap-2 sm:gap-4">
          <a href="#how-it-works" className="hidden font-semibold sm:inline">
            How it works
          </a>
          <Link to="/login" className="font-semibold">
            Log in
          </Link>
          <ButtonLink to="/signup" size="sm" variant="inverse">
            Get started
          </ButtonLink>
        </nav>
      </div>
    </header>
  );
}
