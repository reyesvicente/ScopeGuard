import { Button, Card } from "ice-ds";
import { useState } from "react";

import { getStoredConsent, setAnalyticsConsent, type AnalyticsConsent } from "../lib/analytics";

/** Asks once for analytics cookies; the choice is remembered in this browser. */
export function ConsentBanner() {
  const [open, setOpen] = useState(() => getStoredConsent() === null);

  if (!open) return null;

  function choose(consent: AnalyticsConsent) {
    setAnalyticsConsent(consent);
    setOpen(false);
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 p-4" role="region" aria-label="Cookie consent">
      <Card
        elevation="lg"
        className="mx-auto flex w-full max-w-3xl flex-col gap-4 p-5 sm:flex-row sm:items-center"
      >
        <p className="flex-1 text-sm">
          ScopeGuard uses Google Analytics cookies to see which pages people use. Your contracts and
          client requests are never sent to Google.
        </p>
        <div className="flex shrink-0 gap-2">
          <Button type="button" variant="inverse" size="sm" onClick={() => choose("denied")}>
            Decline
          </Button>
          <Button type="button" size="sm" onClick={() => choose("granted")}>
            Accept
          </Button>
        </div>
      </Card>
    </div>
  );
}
