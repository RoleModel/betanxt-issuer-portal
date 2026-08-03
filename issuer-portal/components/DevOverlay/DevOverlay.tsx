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
  const [selectedComponent, setSelectedComponent] = useState<string | null>(
    null
  );
  const [source, setSource] = useState<SourceResult | null>(null);
  const [sourceError, setSourceError] = useState<string | null>(null);
  const [openPanel, setOpenPanel] = useState<"theme" | "tokens" | null>(null);
  // Shadows `isInspecting` for the window listeners, which are registered once.
  const inspectingRef = useRef(false);
  const autoLoadedKey = useRef<string | null>(null);

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

    const onPointerMove = (event: MouseEvent): void => {
      if (!inspectingRef.current) {
        return;
      }

      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const { target } = event;

        if (
          !(target instanceof HTMLElement) ||
          target.closest(".ipdev-card") !== null ||
          target.closest(".ipdev-panel") !== null ||
          target.closest(".ipdev-hint") !== null
        ) {
          return;
        }

        setInspection({
          computed: readComputedStyles(target),
          domPath: getDomPath(target),
          element: describeElement(target),
          muiName: getMuiComponentName(target),
          rect: target.getBoundingClientRect(),
          stack: getComponentStack(target),
        });
      });
    };

    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Alt") {
        inspectingRef.current = !inspectingRef.current;
        setIsInspecting(inspectingRef.current);

        if (!inspectingRef.current) {
          setInspection(null);
        }
        return;
      }

      if (event.key === "Escape") {
        inspectingRef.current = false;
        setIsInspecting(false);
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
    window.addEventListener("keydown", onKeyDown);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("mousemove", onPointerMove, true);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [enabled]);

  // The first app component in the stack is the one worth opening by default.
  const suggested = inspection?.stack.find((frame) => frame.isAppComponent);

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

  const selectedFrame = inspection?.stack.find(
    (frame) => frame.name === selectedComponent
  );

  return (
    <>
      <style>{devOverlayCss}</style>

      {inspection === null ? null : (
        <div
          className="ipdev-highlight"
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
          {isInspecting ? "inspecting — ⌥ or esc to stop" : "⌥ inspect"}
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
              {inspection.stack.map((frame, index) => (
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
