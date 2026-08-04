"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * Dev-overlay activation, held in the URL rather than in storage.
 *
 * @remarks
 * `?dev` (or `?dev=1`) turns the inspector on, so a state worth showing someone
 * is a link they can open. Nothing is persisted: a page should never come up in
 * inspect mode because it was left on days ago.
 */
const DEV_PARAM = "dev";
const DEV_EVENT = "issuer-devmode-changed";

const readFromUrl = (): boolean =>
  new URLSearchParams(window.location.search).has(DEV_PARAM);

const writeToUrl = (enabled: boolean): void => {
  const url = new URL(window.location.href);

  if (enabled) {
    url.searchParams.set(DEV_PARAM, "1");
  } else {
    url.searchParams.delete(DEV_PARAM);
  }

  // replaceState, so toggling doesn't stack history entries.
  window.history.replaceState({}, "", url);
  window.dispatchEvent(new CustomEvent(DEV_EVENT));
};

export interface DevMode {
  readonly enabled: boolean;
  readonly toggle: () => void;
}

export const useDevMode = (): DevMode => {
  // Starts false so the server and first client render agree; the effect below
  // reads the real value immediately after hydration.
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const resolve = (): void => {
      setEnabled(readFromUrl());
    };

    resolve();
    window.addEventListener(DEV_EVENT, resolve);
    window.addEventListener("popstate", resolve);

    return () => {
      window.removeEventListener(DEV_EVENT, resolve);
      window.removeEventListener("popstate", resolve);
    };
  }, []);

  // Stable, so callers can hold it in a dependency list — the avatar menu
  // rebuilds its items from this.
  const toggle = useCallback((): void => {
    writeToUrl(!readFromUrl());
  }, []);

  return { enabled, toggle };
};
