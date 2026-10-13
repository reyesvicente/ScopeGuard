import { Button, Navbar, NavbarActions, NavbarBrand, NavbarContainer, NavbarLink, NavbarNav } from "ice-ds";
import type { MouseEvent, ReactNode } from "react";
import { Outlet, useLocation, useNavigate } from "react-router";

import { LOGOUT_URL, useCurrentUser } from "../features/auth/api";

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

  return (
    <div className="min-h-screen">
      <Navbar variant="yellow" sticky>
        <NavbarContainer>
          <NavbarBrand {...link("/")}>
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
              <a href={LOGOUT_URL}>
                <Button size="sm" variant="inverse" type="button">
                  Log out
                </Button>
              </a>
            </NavbarActions>
          )}
        </NavbarContainer>
      </Navbar>
      <main className="mx-auto w-full max-w-6xl px-4 py-8">{children ?? <Outlet />}</main>
    </div>
  );
}
