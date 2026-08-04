"use client";

import type { Inspection, SourceResult } from "./DevOverlay";
import type { ComponentFrame } from "./inspect";

/** Enough of the file to read the component, anchored on its declaration. */
const LinesBefore = 6;
const LinesAfter = 90;

/** A numbered slice of the file around the component's declaration line. */
const excerpt = (source: string, line: number): string => {
  const lines = source.split("\n");
  const start = Math.max(0, line - 1 - LinesBefore);
  const end = Math.min(lines.length, line - 1 + LinesAfter);

  return lines
    .slice(start, end)
    .map((text, index) => `${`${start + index + 1}`.padStart(4)}  ${text}`)
    .join("\n");
};

interface InspectionCardProps {
  readonly inspection: Inspection;
  readonly stack: readonly ComponentFrame[];
  /** Name of the first app component in the stack, opened by default. */
  readonly suggestedName: string | undefined;
  readonly selectedComponent: string | null;
  readonly selectedFrame: ComponentFrame | undefined;
  readonly source: SourceResult | null;
  readonly sourceError: string | null;
  /** Loads and shows the source for the clicked component in the chain. */
  readonly onSelectComponent: (name: string) => void;
}

/**
 * The inspection read-out: the component chain, DOM path, props, source excerpt,
 * and computed styles for whatever the overlay is pointing at.
 *
 * @remarks
 * Split out of {@link DevOverlay} purely to keep that component small; it holds
 * no state and renders entirely from the inspection props it is handed.
 */
export const InspectionCard = ({
  inspection,
  stack,
  suggestedName,
  selectedComponent,
  selectedFrame,
  source,
  sourceError,
  onSelectComponent,
}: InspectionCardProps) => (
  <div className="ipdev-card">
    <div className="ipdev-card-head">
      <span className="ipdev-card-name">
        {suggestedName ?? inspection.muiName ?? "Element"}
      </span>
      <span className="ipdev-mono">{inspection.element}</span>
      <span className="ipdev-tag">
        {inspection.muiName === null ? "React" : `MUI ${inspection.muiName}`}
      </span>
    </div>

    <div className="ipdev-section">
      <h4>Component tree — innermost first</h4>
      <div className="ipdev-chain">
        {stack.map((frame, index) => (
          <span key={frame.name}>
            {index === 0 ? null : <span className="ipdev-chain-sep"> ‹ </span>}
            <button
              className={[
                "ipdev-chain-item",
                frame.isAppComponent ? "is-app" : "",
                frame.name === selectedComponent ? "is-active" : "",
              ]
                .filter((part) => part.length > 0)
                .join(" ")}
              onClick={() => {
                onSelectComponent(frame.name);
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

    {selectedFrame === undefined || selectedFrame.props.length === 0 ? null : (
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
      <h4>{source === null ? (selectedComponent ?? "Source") : source.path}</h4>
      {sourceError === null ? null : (
        <div className="ipdev-mono">{sourceError}</div>
      )}
      {source === null ? null : (
        <pre className="ipdev-code">{excerpt(source.source, source.line)}</pre>
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
);

export default InspectionCard;
