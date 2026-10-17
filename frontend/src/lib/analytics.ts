import type { createBrowserRouter } from "react-router";

const MEASUREMENT_ID = "G-YTNX4K4L73";
const PRODUCTION_HOST = "scopeguard.icvn.tech";
const CONSENT_KEY = "scopeguard.analytics-consent";

// These paths end in one-time keys from allauth emails; never send them to Google.
const SECRET_PATHS = [/^(\/password\/reset\/)[^/]+/, /^(\/verify-email\/)[^/]+/];

export type AnalyticsConsent = "granted" | "denied";

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
  }
}

function isEnabled(): boolean {
  return location.hostname === PRODUCTION_HOST;
}

export function getStoredConsent(): AnalyticsConsent | null {
  try {
    const value = localStorage.getItem(CONSENT_KEY);
    return value === "granted" || value === "denied" ? value : null;
  } catch {
    return null;
  }
}

/** Saves the visitor's choice and tells gtag, which starts or stops setting cookies. */
export function setAnalyticsConsent(consent: AnalyticsConsent) {
  try {
    localStorage.setItem(CONSENT_KEY, consent);
  } catch {
    // Storage blocked: the choice still applies for this visit.
  }
  if (isEnabled()) window.gtag("consent", "update", { analytics_storage: consent });
}

function redact(pathname: string): string {
  return SECRET_PATHS.reduce((path, pattern) => path.replace(pattern, "$1:key"), pathname);
}

function sendPageView(pathname: string) {
  window.gtag("event", "page_view", {
    page_location: `${location.origin}${redact(pathname)}`,
    page_title: document.title,
  });
}

/**
 * Loads gtag.js on the production host only (not localhost or preview hosts),
 * using Consent Mode v2: until the visitor accepts, Google gets cookieless pings only.
 * Sends one page_view for every route in the router, since the SPA never reloads.
 */
export function initAnalytics(router: ReturnType<typeof createBrowserRouter>) {
  if (!isEnabled()) return;

  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {
    // gtag.js expects the arguments object itself, not an array.
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer.push(arguments);
  };
  window.gtag("consent", "default", {
    analytics_storage: getStoredConsent() ?? "denied",
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
  });
  window.gtag("js", new Date());
  window.gtag("config", MEASUREMENT_ID, { send_page_view: false });

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`;
  document.head.appendChild(script);

  let lastPathname = router.state.location.pathname;
  sendPageView(lastPathname);

  router.subscribe((state) => {
    if (state.navigation.state !== "idle" || state.location.pathname === lastPathname) return;
    lastPathname = state.location.pathname;
    sendPageView(lastPathname);
  });
}
