/* eslint-disable react-doctor/no-fetch-in-effect -- reading the GlossaryText source is the whole purpose of this dev panel */
"use client";

import { useEffect, useState } from "react";

/** The canonical way to wire the auto-linking component into a piece of copy. */
const usageSnippet = `import { GlossaryText } from "@/components/ui/GlossaryText";

// Every glossary term inside the text links itself; the rest stays plain.
<Typography>
  <GlossaryText>Votes represented for quorum</GlossaryText>
</Typography>`;

const flashDurationMs = 1600;

/** Repo-relative path the source route resolves for the component. */
const sourcePath = "components/ui/GlossaryText.tsx";

/** The shape the dev source route returns for a resolved file. */
interface SourceFile {
  readonly path: string;
  readonly source: string;
}

const isSourceFile = (value: unknown): value is SourceFile =>
  typeof value === "object" &&
  value !== null &&
  typeof Reflect.get(value, "source") === "string" &&
  typeof Reflect.get(value, "path") === "string";

/**
 * Shows the `GlossaryText` component — how to use it and its live source — so a
 * developer can adopt the auto-linking pattern without leaving the running app.
 *
 * @remarks
 * The source is read through the dev overlay's `/api/dev/source` route, the same
 * one the inspector uses, so it is always the code that actually ships rather
 * than a snippet that drifts. The glossary vocabulary itself is deliberately not
 * repeated here — this panel is about the component and its pattern, not the
 * list of terms, which the app already surfaces elsewhere.
 */
export const GlossaryPanel = ({
  onClose,
}: {
  readonly onClose: () => void;
}) => {
  const [file, setFile] = useState<SourceFile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async (): Promise<void> => {
      try {
        const response = await fetch("/api/dev/source?component=GlossaryText");

        if (!response.ok) {
          if (!cancelled) {
            setError("GlossaryText source could not be found");
          }
          return;
        }

        const data: unknown = await response.json();
        if (!cancelled && isSourceFile(data)) {
          setFile(data);
        }
      } catch {
        if (!cancelled) {
          setError("Could not reach the dev source route");
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (flash === null) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      setFlash(null);
    }, flashDurationMs);

    return () => {
      window.clearTimeout(timer);
    };
  }, [flash]);

  const copy = (text: string, message: string): void => {
    void navigator.clipboard.writeText(text);
    setFlash(message);
  };

  return (
    <div className="ipdev-panel">
      <div className="ipdev-panel-head">
        <strong>GlossaryText</strong>
        <span className="ipdev-mono">{file?.path ?? sourcePath}</span>
        <button
          aria-label="Close"
          className="ipdev-close"
          onClick={onClose}
          type="button"
        >
          ✕
        </button>
      </div>

      <div className="ipdev-panel-bar">
        <button
          className="ipdev-btn"
          onClick={() => {
            copy(usageSnippet, "usage copied");
          }}
          type="button"
        >
          copy usage
        </button>
        {file === null ? null : (
          <button
            className="ipdev-btn"
            onClick={() => {
              copy(file.source, "source copied");
            }}
            type="button"
          >
            copy source
          </button>
        )}
        {flash === null ? null : <span className="ipdev-mono">{flash}</span>}
      </div>

      <div className="ipdev-panel-body">
        <section>
          <h4>How to use it</h4>
          <pre className="ipdev-code ipdev-glossary-usage">{usageSnippet}</pre>
          <p className="ipdev-glossary-note">
            Wrap prose in <code>GlossaryText</code> and any glossary term inside
            links itself with a definition tooltip; the rest stays plain. Do not
            wrap interactive controls (buttons, inputs, tabs) — the tooltip and
            the control would compete for the same click.
          </p>
        </section>

        <section>
          <h4>Source</h4>
          {error === null ? null : (
            <p className="ipdev-glossary-note">{error}</p>
          )}
          {file === null ? (
            error === null ? (
              <p className="ipdev-glossary-note">Loading…</p>
            ) : null
          ) : (
            <pre className="ipdev-code">{file.source}</pre>
          )}
        </section>
      </div>
    </div>
  );
};

export default GlossaryPanel;
