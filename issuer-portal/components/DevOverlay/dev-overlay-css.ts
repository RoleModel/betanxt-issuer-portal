/**
 * Self-contained styling for the dev overlay.
 *
 * @remarks
 * Deliberately plain CSS with its own prefix rather than MUI's `sx`: the
 * overlay sits on top of six different client themes in both color schemes, and
 * it has to stay legible over all of them. Inheriting the theme it exists to
 * inspect would also mean the inspector changes appearance depending on what it
 * is inspecting.
 */
export const devOverlayCss = `
.ipdev-highlight {
  position: fixed;
  z-index: 2147483000;
  pointer-events: none;
  border: 2px solid #7c4dff;
  border-radius: 4px;
  box-shadow: 0 0 0 4px rgba(124, 77, 255, 0.18);
  transition: all 60ms linear;
}

/* A pinned target no longer tracks the pointer, so the outline has to say so
   on its own — otherwise a stationary highlight looks like a stuck one. */
.ipdev-highlight.is-pinned {
  border-style: dashed;
  border-color: #ffb300;
  box-shadow: 0 0 0 4px rgba(255, 179, 0, 0.2);
}

.ipdev-hint {
  position: fixed;
  bottom: 14px;
  left: 14px;
  z-index: 2147483001;
  display: flex;
  align-items: center;
  gap: 6px;
  background: #16121f;
  color: #cfc6e6;
  font: 500 11px/1.4 ui-monospace, SFMono-Regular, Menlo, monospace;
  letter-spacing: 0.02em;
  padding: 6px 10px;
  border-radius: 999px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
}

.ipdev-btn {
  background: rgba(255, 255, 255, 0.12);
  color: inherit;
  border: 0;
  border-radius: 999px;
  font: inherit;
  padding: 3px 9px;
  cursor: pointer;
}
.ipdev-btn:hover { background: rgba(255, 255, 255, 0.24); }
.ipdev-btn[aria-pressed="true"] { background: #7c4dff; color: #fff; }

.ipdev-card {
  position: fixed;
  left: 14px;
  bottom: 52px;
  z-index: 2147483001;
  width: 480px;
  max-width: calc(100vw - 28px);
  max-height: min(64vh, 660px);
  overflow-y: auto;
  background: #16121f;
  color: #ede8f7;
  border-radius: 10px;
  padding: 12px 14px;
  box-shadow: 0 18px 50px rgba(8, 4, 24, 0.55);
  font: 12.5px/1.5 ui-sans-serif, system-ui, sans-serif;
  user-select: text;
}

.ipdev-card-head {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 8px;
}
.ipdev-card-name { font-weight: 700; font-size: 13.5px; }
.ipdev-mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 10.5px;
  color: #b6a9d6;
}
.ipdev-tag {
  margin-left: auto;
  background: #7c4dff;
  color: #fff;
  font-size: 9.5px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  padding: 2px 8px;
  border-radius: 999px;
}

.ipdev-section { margin-top: 10px; }
.ipdev-section > h4 {
  margin: 0 0 4px;
  font-size: 9.5px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #9b8dc0;
}

.ipdev-chain { display: flex; flex-wrap: wrap; gap: 4px; align-items: center; }
.ipdev-chain-item {
  background: rgba(255, 255, 255, 0.08);
  border: 0;
  border-radius: 5px;
  color: inherit;
  cursor: pointer;
  font: inherit;
  font-size: 11px;
  padding: 2px 7px;
}
.ipdev-chain-item:hover { background: rgba(255, 255, 255, 0.18); }
.ipdev-chain-item.is-app { background: rgba(124, 77, 255, 0.28); font-weight: 600; }
.ipdev-chain-item.is-active { outline: 1.5px solid #7c4dff; }
.ipdev-chain-sep { color: #6f6291; font-size: 10px; }

.ipdev-code {
  margin: 0;
  padding: 10px;
  background: rgba(0, 0, 0, 0.32);
  border-radius: 6px;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 10.5px;
  line-height: 1.55;
  white-space: pre;
  overflow: auto;
  max-height: 300px;
  tab-size: 2;
}

.ipdev-kv {
  display: grid;
  grid-template-columns: minmax(0, auto) minmax(0, 1fr);
  gap: 1px 10px;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 10.5px;
}
.ipdev-kv dt { color: #9b8dc0; }
.ipdev-kv dd { margin: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.ipdev-panel {
  position: fixed;
  top: 14px;
  right: 14px;
  bottom: 14px;
  width: 440px;
  max-width: calc(100vw - 28px);
  z-index: 2147483002;
  display: flex;
  flex-direction: column;
  background: #16121f;
  color: #ede8f7;
  border-radius: 10px;
  box-shadow: 0 18px 48px rgba(0, 0, 0, 0.5);
  font: 11.5px/1.5 ui-sans-serif, system-ui, sans-serif;
}
.ipdev-panel-head {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.12);
}
.ipdev-panel-head strong { font-size: 13px; }
.ipdev-panel-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: 8px 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}
.ipdev-panel-body { overflow: auto; padding: 4px 0 16px; }
.ipdev-panel-body h4 {
  margin: 14px 12px 6px;
  font-size: 9.5px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #9b8dc0;
}
.ipdev-filter {
  flex: 1;
  min-width: 0;
  background: rgba(255, 255, 255, 0.1);
  border: 0;
  border-radius: 4px;
  color: inherit;
  font: inherit;
  padding: 4px 7px;
}
.ipdev-close {
  background: none;
  border: 0;
  color: inherit;
  cursor: pointer;
  font-size: 14px;
  line-height: 1;
  padding: 2px 4px;
}

.ipdev-row {
  display: grid;
  grid-template-columns: 15px minmax(0, 1.5fr) minmax(0, 1fr);
  align-items: center;
  gap: 8px;
  width: 100%;
  background: none;
  border: 0;
  color: inherit;
  font: inherit;
  text-align: left;
  padding: 3px 12px;
  cursor: copy;
}
.ipdev-row:hover { background: rgba(255, 255, 255, 0.08); }
.ipdev-row code {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 10.5px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.ipdev-row > span:last-child {
  color: #b6a9d6;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 10px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.ipdev-swatch {
  width: 15px;
  height: 15px;
  border-radius: 3px;
  border: 1px solid rgba(255, 255, 255, 0.28);
}
.ipdev-swatch.is-empty { border-style: dashed; opacity: 0.4; }

.ipdev-step {
  margin: 0 12px 10px;
  padding-left: 10px;
  border-left: 2px solid rgba(124, 77, 255, 0.5);
}
.ipdev-step-title { font-weight: 700; font-size: 11.5px; }
.ipdev-step-file {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 10px;
  color: #8f7fbb;
}
.ipdev-step-detail { color: #cfc6e6; margin-top: 3px; }

.ipdev-swatch-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: 0 12px 6px;
}
.ipdev-chip {
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(255, 255, 255, 0.07);
  border: 0;
  border-radius: 6px;
  color: inherit;
  cursor: copy;
  font: inherit;
  font-size: 10.5px;
  padding: 4px 8px 4px 4px;
}
.ipdev-chip:hover { background: rgba(255, 255, 255, 0.16); }
.ipdev-chip-swatch {
  width: 20px;
  height: 20px;
  border-radius: 4px;
  border: 1px solid rgba(255, 255, 255, 0.25);
}
.ipdev-chip-hex {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 9.5px;
  color: #b6a9d6;
}
.ipdev-note {
  margin: 0 12px 8px;
  color: #b6a9d6;
  font-size: 10.5px;
}
.ipdev-flag {
  display: inline-block;
  background: rgba(255, 193, 7, 0.2);
  color: #ffd54f;
  border-radius: 4px;
  font-size: 9.5px;
  padding: 1px 5px;
  margin-left: 6px;
}
.ipdev-tickers { display: flex; flex-wrap: wrap; gap: 4px; padding: 0 12px 8px; }
.ipdev-empty { margin: 16px 12px; color: #9b8dc0; }

.ipdev-glossary-usage { margin: 0 12px; }
.ipdev-glossary-note {
  margin: 8px 12px 0;
  color: #9b8dc0;
  font-size: 10.5px;
  line-height: 1.5;
}
.ipdev-glossary-note code {
  background: rgba(124, 77, 255, 0.28);
  border-radius: 3px;
  padding: 0 3px;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
}
.ipdev-glossary-entry {
  display: block;
  width: calc(100% - 24px);
  margin: 2px 12px;
  padding: 6px 8px;
  text-align: left;
  background: rgba(255, 255, 255, 0.04);
  border: 0;
  border-radius: 6px;
  color: inherit;
  cursor: pointer;
  font: inherit;
}
.ipdev-glossary-entry:hover { background: rgba(124, 77, 255, 0.22); }
.ipdev-glossary-term { display: block; font-weight: 600; }
.ipdev-glossary-def {
  display: block;
  margin-top: 2px;
  color: #b7abd6;
  font-size: 10.5px;
  line-height: 1.45;
}
`;
