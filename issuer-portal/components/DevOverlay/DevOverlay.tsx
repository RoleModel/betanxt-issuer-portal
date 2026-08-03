"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { useClient } from "@/contexts/ClientContext";

import type { ComponentFrame } from "./inspect";

import { devOverlayCss } from "./dev-overlay-css";
import {
  describeElement,
  getComponentStack,
  getDomPath,
  getMuiComponentName,
  markKnownComponents,
  readComputedStyles,
} from "./inspect";
import { ThemePanel } from "./ThemePanel";
import { TokensPanel } from "./TokensPanel";
import { useDevMode } from "./useDevMode";

interface Inspection {
  readonly computed: readonly [string, string][];
  readonly domPath: string;
  readonly element: string;
  readonly muiName: string | null;
  readonly rect: DOMRect;
  readonly stack: readonly ComponentFrame[];
}

interface SourceResult {
  readonly line: number;
  readonly path: string;
  readonly source: string;
}

const isSourceResult = (value: unknown): value is SourceResult =>
  typeof value === "object" &&
  value !== null &&
  typeof Reflect.get(value, "source") === "string" &&
  typeof Reflect.get(value, "path") === "string";

/** Enough of the file to read the component, anchored on its declaration. */
const LINES_BEFORE = 6;
const LINES_AFTER = 90;

const excerpt = (source: string, line: number): string => {
  const lines = source.split("\n");
  const start = Math.max(0, line - 1 - LINES_BEFORE);
  const end = Math.min(lines.length, line - 1 + LINES_AFTER);

  return lines
    .slice(start, end)
    .map((text, index) => `${`${start + index + 1}`.padStart(4)}  ${text}`)
    .join("\n");
};

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
        Array.isArray(known) ? known.filter((n): n is string => typeof n === "string") : []
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

  return new Set(names.filter((name) => knownComponentCache.get(name) === true));
};

/**
 * Hover-to-inspect overlay for local development.
 *
 * @remarks
 * Reachable at `?dev` and driven from the keyboard: `alt` toggles inspection,
 * `t` opens the resolved CSS variables, `c` opens the client-theme explainer,
 * `escape` closes whatever is open. Inspection is a toggle rather than
 * hold-to-show so the card can be reached, selected and copied from — the
 * earlier hold behaviour made the snippet impossible to pick up.
 *
 * Mounted only when `NODE_ENV` is development, so none of this — including the
 * source-reading route it calls — exists in a production build.
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
  const [openPanel, setOpenPanel] = useState<"theme" | "tokens" | null>(null);
  const [knownNames, setKnownNames] = useState<ReadonlySet<string>>(
    () => new Set()
  );
  // Shadows `isInspecting` for the window listeners, which are registered once.
  const inspectingRef = useRef(false);
  const autoLoadedKey = useRef<string | null>(null);
  const pinnedRef = useRef(false);

  const loadSource = useCallback(async (name: string): Promise<void> => {
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
  }, []);

  useEffect(() => {
    if (!enabled) {
      inspectingRef.current = false;
      return;
    }

    let frame = 0;

    /** `null` when the event came from the overlay's own chrome. */
    const inspectableTarget = (event: MouseEvent): Element | null => {
      const { target } = event;

      // Element, not HTMLElement: everything inside a chart is SVG, and
      // SVGElement does not extend HTMLElement — testing for HTMLElement meant
      // no chart was ever inspectable.
      if (
        !(target instanceof Element) ||
        target.closest(".ipdev-card") !== null ||
        target.closest(".ipdev-panel") !== null ||
        target.closest(".ipdev-hint") !== null
      ) {
        return null;
      }

      return target;
    };

    const inspect = (target: Element): void => {
      setInspection({
        computed: readComputedStyles(target),
        domPath: getDomPath(target),
        element: describeElement(target),
        muiName: getMuiComponentName(target),
        rect: target.getBoundingClientRect(),
        stack: getComponentStack(target),
      });
    };

    const onPointerMove = (event: MouseEvent): void => {
      // A pinned inspection stops following the pointer, which is the whole
      // point of pinning: the card can be read and copied from without the
      // target changing on the way to it.
      if (!inspectingRef.current || pinnedRef.current) {
        return;
      }

      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const target = inspectableTarget(event);
        if (target !== null) {
          inspect(target);
        }
      });
    };

    /**
     * Click pins whatever is under the pointer; clicking again releases it.
     *
     * @remarks
     * Capturing and suppressing the click matters — while inspecting, the
     * pointer is over real controls, and pinning a row in a table must not also
     * navigate away from the page being inspected.
     */
    const onClick = (event: MouseEvent): void => {
      if (!inspectingRef.current) {
        return;
      }

      const target = inspectableTarget(event);
      if (target === null) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      if (pinnedRef.current) {
        pinnedRef.current = false;
        setIsPinned(false);
        inspect(target);
        return;
      }

      pinnedRef.current = true;
      setIsPinned(true);
      inspect(target);
    };

    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Alt") {
        inspectingRef.current = !inspectingRef.current;
        setIsInspecting(inspectingRef.current);

        if (!inspectingRef.current) {
          pinnedRef.current = false;
          setIsPinned(false);
          setInspection(null);
        }
        return;
      }

      if (event.key === "Escape") {
        inspectingRef.current = false;
        pinnedRef.current = false;
        setIsInspecting(false);
        setIsPinned(false);
        setInspection(null);
        setOpenPanel(null);
        return;
      }

      if (event.key === "t" || event.key === "T") {
        setOpenPanel((current) => (current === "tokens" ? null : "tokens"));
        return;
      }

      if (event.key === "c" || event.key === "C") {
        setOpenPanel((current) => (current === "theme" ? null : "theme"));
      }
    };

    window.addEventListener("mousemove", onPointerMove, true);
    window.addEventListener("click", onClick, true);
    window.addEventListener("keydown", onKeyDown);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("mousemove", onPointerMove, true);
      window.removeEventListener("click", onClick, true);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [enabled]);

  // Ask the repo which of these names it actually defines, then classify from
  // the answer rather than from the shape of the name.
  useEffect(() => {
    if (inspection === null) {
      return;
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
  }, [inspection, loadSource, suggested]);

  if (!enabled) {
    return null;
  }

  const selectedFrame = stack.find(
    (frame) => frame.name === selectedComponent
  );

  return (
    <>
      <style>{devOverlayCss}</style>

      {inspection === null ? null : (
        <div
          className={`ipdev-highlight${isPinned ? " is-pinned" : ""}`}
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
          className="ipdev-btn"
          onClick={toggle}
          title="Leave dev mode"
          type="button"
        >
          ✕
        </button>
      </div>

      {inspection === null ? null : (
        <div className="ipdev-card">
          <div className="ipdev-card-head">
            <span className="ipdev-card-name">
              {suggested?.name ?? inspection.muiName ?? "Element"}
            </span>
            <span className="ipdev-mono">{inspection.element}</span>
            <span className="ipdev-tag">
              {inspection.muiName === null
                ? "React"
                : `MUI ${inspection.muiName}`}
            </span>
          </div>

          <div className="ipdev-section">
            <h4>Component tree — innermost first</h4>
            <div className="ipdev-chain">
              {stack.map((frame, index) => (
                <span key={frame.name}>
                  {index === 0 ? null : (
                    <span className="ipdev-chain-sep"> ‹ </span>
                  )}
                  <button
                    className={[
                      "ipdev-chain-item",
                      frame.isAppComponent ? "is-app" : "",
                      frame.name === selectedComponent ? "is-active" : "",
                    ]
                      .filter((part) => part.length > 0)
                      .join(" ")}
                    onClick={() => {
                      void loadSource(frame.name);
                    }}
                    type="button"
                  >
                    {frame.name}
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div className="ipdev-section">
            <h4>DOM path</h4>
            <div className="ipdev-mono">{inspection.domPath}</div>
          </div>

          {selectedFrame === undefined ||
          selectedFrame.props.length === 0 ? null : (
            <div className="ipdev-section">
              <h4>{selectedFrame.name} props</h4>
              <dl className="ipdev-kv">
                {selectedFrame.props.map(([name, value]) => (
                  <div key={name} style={{ display: "contents" }}>
                    <dt>{name}</dt>
                    <dd>{value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}

          <div className="ipdev-section">
            <h4>
              {source === null ? (selectedComponent ?? "Source") : source.path}
            </h4>
            {sourceError === null ? null : (
              <div className="ipdev-mono">{sourceError}</div>
            )}
            {source === null ? null : (
              <pre className="ipdev-code">
                {excerpt(source.source, source.line)}
              </pre>
            )}
          </div>

          <div className="ipdev-section">
            <h4>Computed</h4>
            <dl className="ipdev-kv">
              {inspection.computed.map(([property, value]) => (
                <div key={property} style={{ display: "contents" }}>
                  <dt>{property}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
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
    </>
  );
};

export default DevOverlay;
