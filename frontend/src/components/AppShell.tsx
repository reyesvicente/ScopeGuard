import { Button, Navbar, NavbarActions, NavbarBrand, NavbarContainer, NavbarLink, NavbarNav } from "ice-ds";
import type { MouseEvent, ReactNode } from "react";
import { Outlet, useLocation, useNavigate } from "react-router";

import { useCurrentUser, useLogout } from "../features/auth/api";
import { Logo } from "./Logo";

/** ice-ds nav items render plain anchors; route them client-side. */
function useSpaLink() {
  const navigate = useNavigate();
  return (to: string) => ({
    href: to,
    onClick: (event: MouseEvent<HTMLAnchorElement>) => {
      if (event.metaKey || event.ctrlKey || event.shiftKey) return;
      event.preventDefault();
      navigate(to);
    },
  });
}

export function AppShell({ children }: { children?: ReactNode }) {
  const link = useSpaLink();
  const { pathname } = useLocation();
  const { data: user } = useCurrentUser();
  const logout = useLogout();

  return (
    <div className="min-h-screen">
      <Navbar variant="yellow" sticky>
        <NavbarContainer>
          <NavbarBrand {...link("/")} className="flex items-center gap-2">
            <Logo size={32} fill="#fffdf5" />
            <span className="font-display text-xl font-bold">ScopeGuard</span>
          </NavbarBrand>
          <NavbarNav>
            <NavbarLink {...link("/")} active={pathname === "/"}>
              Contracts
            </NavbarLink>
            <NavbarLink {...link("/contracts/new")} active={pathname === "/contracts/new"}>
              New contract
            </NavbarLink>
          </NavbarNav>
          {user && (
            <NavbarActions>
              <Button
                size="sm"
                variant="inverse"
                type="button"
                loading={logout.isPending}
                onClick={() => logout.mutate()}
              >
                Log out
              </Button>
            </NavbarActions>
          )}
        </NavbarContainer>
      </Navbar>
      <main className="mx-auto w-full max-w-6xl px-4 py-8">{children ?? <Outlet />}</main>
    </div>
  );
}
