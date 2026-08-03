"use client";

import { useEffect, useMemo, useState } from "react";

import type { Token } from "./tokens";

import {
  collectTokens,
  getCurrentScheme,
  groupTitleFor,
  toCssBlock,
  tokenGroups,
} from "./tokens";

/**
 * Every CSS variable the page resolved, grouped, filterable and exportable.
 *
 * @remarks
 * Sits alongside the theme panel rather than inside it: this one answers "what
 * value did this token end up with", while the theme panel answers "why".
 */
export const TokensPanel = ({ onClose }: { readonly onClose: () => void }) => {
  const [filter, setFilter] = useState("");
  const [flash, setFlash] = useState<string | null>(null);
  // Collected once per opening — see collectTokens for why not during render.
  const tokens = useMemo<readonly Token[]>(() => collectTokens(), []);
  const scheme = useMemo(() => getCurrentScheme(), []);

  useEffect(() => {
    if (flash === null) {
      return;
    }

    const timer = window.setTimeout(() => {
      setFlash(null);
    }, 1600);

    return () => {
      window.clearTimeout(timer);
    };
  }, [flash]);

  const needle = filter.trim().toLowerCase();
  const matching =
    needle.length === 0
      ? tokens
      : tokens.filter(
          (token) =>
            token.name.toLowerCase().includes(needle) ||
            token.raw.toLowerCase().includes(needle) ||
            token.hex.toLowerCase().includes(needle)
        );

  const grouped = tokenGroups
    .map((group) => ({
      title: group.title,
      tokens: matching.filter(
        (token) => groupTitleFor(token.name) === group.title
      ),
    }))
    .filter((group) => group.tokens.length > 0);

  const copy = (text: string, message: string): void => {
    void navigator.clipboard?.writeText(text);
    setFlash(message);
  };

  return (
    <div className="ipdev-panel">
      <div className="ipdev-panel-head">
        <strong>CSS variables</strong>
        <span className="ipdev-mono">
          {matching.length} of {tokens.length} · {scheme}
        </span>
        <input
          className="ipdev-filter"
          onChange={(event) => {
            setFilter(event.target.value);
          }}
          // The overlay listens for single-key shortcuts on window; typing here
          // must not toggle a panel out from under the field.
          onKeyDown={(event) => {
            event.stopPropagation();
          }}
          placeholder="filter…"
          value={filter}
        />
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
            copy(
              toCssBlock(matching, scheme),
              `${matching.length} tokens copied as CSS`
            );
          }}
          type="button"
        >
          copy CSS block
        </button>
        <button
          className="ipdev-btn"
          onClick={() => {
            copy(
              matching.map((token) => `var(${token.name})`).join("\n"),
              `${matching.length} var() references copied`
            );
          }}
          type="button"
        >
          copy var() list
        </button>
        {flash === null ? null : <span className="ipdev-mono">{flash}</span>}
      </div>
      <div className="ipdev-panel-body">
        {grouped.map((group) => (
          <section key={group.title}>
            <h4>{group.title}</h4>
            {group.tokens.map((token) => (
              <button
                className="ipdev-row"
                key={token.name}
                onClick={() => {
                  copy(`var(${token.name})`, `${token.name} copied`);
                }}
                title={`${token.raw}${token.hex.length > 0 ? ` → ${token.hex}` : ""}`}
                type="button"
              >
                <span
                  className={`ipdev-swatch${token.hex.length === 0 ? "is-empty" : ""}`}
                  style={
                    token.hex.length === 0
                      ? undefined
                      : { background: token.hex }
                  }
                />
                <code>{token.name}</code>
                <span>{token.hex.length > 0 ? token.hex : token.raw}</span>
              </button>
            ))}
          </section>
        ))}
        {grouped.length === 0 ? (
          <p className="ipdev-empty">Nothing matches “{filter}”.</p>
        ) : null}
      </div>
    </div>
  );
};
