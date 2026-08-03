/* eslint-disable @typescript-eslint/no-unsafe-type-assertion */
/* eslint-disable react-doctor/no-fetch-in-effect -- this dev-only inspector fetches source on the interaction that requests it; there is no server component to move it to. */
"use client";

import { useEffect, useRef, useState } from "react";

import { useClient } from "@/contexts/ClientContext";

import type { ComponentFrame } from "./inspect";

import { devOverlayCss } from "./dev-overlay-css";
import { GlossaryPanel } from "./GlossaryPanel";
import { markKnownComponents } from "./inspect";
import { InspectionCard } from "./InspectionCard";
import { ThemePanel } from "./ThemePanel";
import { TokensPanel } from "./TokensPanel";
import { useDevMode } from "./useDevMode";
import { useInspectionListeners } from "./useInspectionListeners";

export interface Inspection {
  readonly computed: readonly [string, string][];
  readonly domPath: string;
  readonly element: string;
  readonly muiName: string | null;
  readonly rect: DOMRect;
  readonly stack: readonly ComponentFrame[];
}

export interface SourceResult {
  readonly line: number;
  readonly path: string;
  readonly source: string;
}

const isSourceResult = (value: unknown): value is SourceResult =>
  typeof value === "object" &&
  value !== null &&
  typeof Reflect.get(value, "source") === "string" &&
  typeof Reflect.get(value, "path") === "string";

/**
 * Names already confirmed against the repo, so hovering does not re-ask.
 *
 * @remarks
 * Module-level rather than component state: the answer for a given name cannot
 * change while the dev server is running, and the map has to survive the
 * overlay being toggled off and on.
 */
const knownComponentCache = new Map<string, boolean>();

const confirmAppComponents = async (
  names: readonly string[]
): Promise<ReadonlySet<string>> => {
  const unasked = names.filter((name) => !knownComponentCache.has(name));

  if (unasked.length > 0) {
    try {
      const response = await fetch(
        `/api/dev/source?components=${encodeURIComponent(unasked.join(","))}`
      );
      const data: unknown = await response.json();
      const known = Reflect.get(data as object, "known");
      const found = new Set(
        Array.isArray(known)
          ? known.filter((n): n is string => typeof n === "string")
          : []
      );

      for (const name of unasked) {
        knownComponentCache.set(name, found.has(name));
      }
    } catch {
      // Leave them unresolved; the name heuristic already picked a default.
      for (const name of unasked) {
        knownComponentCache.set(name, false);
      }
    }
  }

  return new Set(
    names.filter((name) => knownComponentCache.get(name) === true)
  );
};

/**
 * Hover-to-inspect overlay for local development.
 *
 * @remarks
 * Reachable at `?dev` and driven from the keyboard: `alt` toggles inspection,
 * `t` opens the resolved CSS variables, `c` opens the client-theme explainer,
 * `g` opens the glossary reference, `escape` closes whatever is open. Inspection
 * is a toggle rather than hold-to-show so the card can be reached, selected and
 * copied from — the earlier hold behaviour made the snippet impossible to pick
 * up.
 *
 * Gated by {@link isDevOverlayEnabled}: it renders in local development and on
 * deployments that opt in via `NEXT_PUBLIC_ENABLE_DEV_OVERLAY`, so remote
 * developers on a Vercel preview get the same tooling without cloning the repo.
 * When the flag is unset in production, neither the overlay nor the
 * source-reading route it calls is reachable.
 */
export const DevOverlay = () => {
  const { enabled, toggle } = useDevMode();
  const { currentClient } = useClient();
  const [inspection, setInspection] = useState<Inspection | null>(null);
  const [isInspecting, setIsInspecting] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [selectedComponent, setSelectedComponent] = useState<string | null>(
    null
  );
  const [source, setSource] = useState<SourceResult | null>(null);
  const [sourceError, setSourceError] = useState<string | null>(null);
  const [openPanel, setOpenPanel] = useState<
    "glossary" | "theme" | "tokens" | null
  >(null);
  const [knownNames, setKnownNames] = useState<ReadonlySet<string>>(
    () => new Set()
  );
  // Shadows `isInspecting` for the window listeners, which are registered once.
  const inspectingRef = useRef(false);
  const autoLoadedKey = useRef<string | null>(null);
  const pinnedRef = useRef(false);

  const loadSource = async (name: string): Promise<void> => {
    setSelectedComponent(name);
    setSource(null);
    setSourceError(null);

    try {
      const response = await fetch(
        `/api/dev/source?component=${encodeURIComponent(name)}`
      );

      if (!response.ok) {
        setSourceError(`No source file found for ${name}`);
        return;
      }

      const data: unknown = await response.json();
      if (isSourceResult(data)) {
        setSource(data);
      }
    } catch {
      setSourceError("Could not reach the dev source route");
    }
  };

  useInspectionListeners({
    enabled,
    inspectingRef,
    pinnedRef,
    setInspection,
    setIsInspecting,
    setIsPinned,
    setOpenPanel,
  });

  // Ask the repo which of these names it actually defines, then classify from
  // the answer rather than from the shape of the name.
  useEffect(() => {
    if (inspection === null) {
      return undefined;
    }

    let cancelled = false;
    const names = inspection.stack.map((frame) => frame.name);

    void confirmAppComponents(names).then((known) => {
      if (!cancelled) {
        setKnownNames(known);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [inspection]);

  const stack =
    inspection === null
      ? []
      : markKnownComponents(inspection.stack, knownNames);

  // The first app component in the stack is the one worth opening by default.
  const suggested = stack.find((frame) => frame.isAppComponent);

  // Keyed on the element, not on the selection: picking a different component
  // out of the chain must survive the next re-render rather than snapping back
  // to the suggested one.
  useEffect(() => {
    if (inspection === null || suggested === undefined) {
      return;
    }

    const key = `${inspection.domPath}|${suggested.name}`;
    if (autoLoadedKey.current === key) {
      return;
    }

    autoLoadedKey.current = key;
    void loadSource(suggested.name);
    // `loadSource` only closes over stable state setters and React Compiler keeps
    // it stable, so it is intentionally omitted to keep this effect from
    // re-running on every render.
  }, [inspection, suggested]);

  if (!enabled) {
    return null;
  }

  const selectedFrame = stack.find((frame) => frame.name === selectedComponent);

  return (
    <>
      <style>{devOverlayCss}</style>

      {inspection === null ? null : (
        <div
          className={`ipdev-highlight${isPinned ? "is-pinned" : ""}`}
          style={{
            height: inspection.rect.height + 6,
            left: inspection.rect.left - 3,
            top: inspection.rect.top - 3,
            width: inspection.rect.width + 6,
          }}
        />
      )}

      <div className="ipdev-hint">
        <span>
          {isInspecting
            ? isPinned
              ? "pinned — click to release · esc to stop"
              : "inspecting — click to pin · ⌥ or esc to stop"
            : "⌥ inspect"}
        </span>
        <button
          aria-pressed={openPanel === "tokens"}
          className="ipdev-btn"
          onClick={() => {
            setOpenPanel((current) => (current === "tokens" ? null : "tokens"));
          }}
          type="button"
        >
          tokens (T)
        </button>
        <button
          aria-pressed={openPanel === "theme"}
          className="ipdev-btn"
          onClick={() => {
            setOpenPanel((current) => (current === "theme" ? null : "theme"));
          }}
          type="button"
        >
          colors (C)
        </button>
        <button
          aria-pressed={openPanel === "glossary"}
          className="ipdev-btn"
          onClick={() => {
            setOpenPanel((current) =>
              current === "glossary" ? null : "glossary"
            );
          }}
          type="button"
        >
          glossary (G)
        </button>
        <button
          className="ipdev-btn"
          onClick={toggle}
          title="Leave dev mode"
          type="button"
        >
          ✕
        </button>
      </div>

      {inspection === null ? null : (
        <InspectionCard
          inspection={inspection}
          onSelectComponent={(name) => {
            void loadSource(name);
          }}
          selectedComponent={selectedComponent}
          selectedFrame={selectedFrame}
          source={source}
          sourceError={sourceError}
          stack={stack}
          suggestedName={suggested?.name}
        />
      )}

      {openPanel === "tokens" ? (
        <TokensPanel
          onClose={() => {
            setOpenPanel(null);
          }}
        />
      ) : null}
      {openPanel === "theme" ? (
        <ThemePanel
          activeTicker={currentClient?.ticker ?? "DFIN"}
          onClose={() => {
            setOpenPanel(null);
          }}
        />
      ) : null}
      {openPanel === "glossary" ? (
        <GlossaryPanel
          onClose={() => {
            setOpenPanel(null);
          }}
        />
      ) : null}
    </>
  );
};

export default DevOverlay;
