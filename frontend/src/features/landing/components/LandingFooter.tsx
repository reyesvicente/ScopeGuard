import { Logo } from "../../../components/Logo";

export function LandingFooter() {
  return (
    <footer className="mx-auto flex w-full max-w-6xl items-center gap-2 px-4 py-10 text-sm">
      <Logo size={24} />
      <span className="font-display font-bold">ScopeGuard</span>
    </footer>
  );
}
