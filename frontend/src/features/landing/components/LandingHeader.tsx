import { Link } from "react-router";

import { ButtonLink } from "../../../components/ButtonLink";
import { Logo } from "../../../components/Logo";

export function LandingHeader() {
  return (
    <header className="border-b-4 border-neo-black bg-neo-yellow">
      <div className="mx-auto flex w-full max-w-6xl items-center gap-2 px-3 py-3 sm:gap-4 sm:px-4">
        <Link to="/" className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <Logo size={32} fill="#fffdf5" className="h-7 w-7 sm:h-8 sm:w-8" />
          <span className="font-display text-lg font-bold sm:text-xl">ScopeGuard</span>
        </Link>
        <nav className="ml-auto flex items-center gap-3 whitespace-nowrap sm:gap-4">
          <a href="#how-it-works" className="hidden font-semibold sm:inline">
            How it works
          </a>
          <Link to="/login" className="text-sm font-semibold sm:text-base">
            Log in
          </Link>
          <ButtonLink to="/signup" size="sm" variant="inverse" className="whitespace-nowrap">
            Get started
          </ButtonLink>
        </nav>
      </div>
    </header>
  );
}
