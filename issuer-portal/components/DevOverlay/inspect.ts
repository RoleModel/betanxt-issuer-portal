"use client";

/**
 * Resolves a DOM node back to the React components that rendered it.
 *
 * @remarks
 * Everything here reads React's development-only internals, so the module is
 * only ever loaded behind the dev-mode gate. Each read is guarded rather than
 * cast: the shape of a fiber is not part of React's public API and can change
 * between releases, and a wrong assumption should degrade to "unknown" instead
 * of throwing inside a mousemove handler.
 */

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

interface FiberLike {
  readonly elementType: unknown;
  readonly memoizedProps: unknown;
  readonly return: FiberLike | null;
  readonly stateNode: unknown;
}

const isFiberLike = (value: unknown): value is FiberLike =>
  isRecord(value) && "elementType" in value && "return" in value;

/** React attaches its fiber to the DOM node under a randomised key. */
const getFiber = (node: Element): FiberLike | null => {
  for (const key of Object.keys(node)) {
    if (!key.startsWith("__reactFiber$")) {
      continue;
    }

    const value = Reflect.get(node, key);
    if (isFiberLike(value)) {
      return value;
    }
  }

  return null;
};

const readStringProperty = (
  value: Record<string, unknown>,
  key: string
): string | null => {
  const property = value[key];
  return typeof property === "string" && property.length > 0 ? property : null;
};

/**
 * The display name for one fiber's component.
 *
 * @param elementType - A fiber's `elementType`: a string for host elements, a
 * function for ordinary components, or a wrapper object for `memo`/`forwardRef`.
 * @returns The component name, or `null` for host elements and anonymous nodes.
 */
const getComponentName = (elementType: unknown): string | null => {
  if (typeof elementType === "string") {
    return null;
  }

  if (typeof elementType === "function") {
    const displayName = Reflect.get(elementType, "displayName");
    if (typeof displayName === "string" && displayName.length > 0) {
      return displayName;
    }

    return elementType.name.length > 0 ? elementType.name : null;
  }

  if (isRecord(elementType)) {
    // memo(Component) / forwardRef(render) keep the real component one level in.
    return (
      readStringProperty(elementType, "displayName") ??
      getComponentName(elementType.type) ??
      getComponentName(elementType.render)
    );
  }

  return null;
};

/** Wrappers that say nothing about the page being inspected. */
const noiseNames = new Set([
  "Anonymous",
  "ForwardRef",
  "Memo",
  "Provider",
  "Consumer",
  "Suspense",
  "Fragment",
]);

const isUsefulName = (name: string): boolean =>
  !noiseNames.has(name) && !name.startsWith("_") && !name.includes("(");

export interface ComponentFrame {
  /** `true` when the name looks like an app component rather than a library one. */
  readonly isAppComponent: boolean;
  readonly name: string;
  /** Own props of that component, already reduced to printable values. */
  readonly props: readonly [string, string][];
}

/**
 * Vendor components, which are never what a reader is looking for.
 *
 * @remarks
 * Prefix matching alone is not enough. `Mui` and `BN` are reliable, but MUI X
 * charts render through a deep stack of internals — `PiePlot`, `ChartsSurface`,
 * `DrawingProvider` — whose names collide with the app's own (`PieChartCenterLabel`,
 * `ChartToggle`). Charts were the case that exposed it: every frame in a donut
 * matched a naive prefix list, so no chart ever offered an app component to
 * open. Only names that cannot be the app's are matched here; anything else is
 * confirmed against the repo by {@link markKnownComponents}.
 */
const vendorPrefixes = ["Mui", "BN", "Emotion", "Styled"];
const vendorPattern =
  /^(?:Charts?[A-Z]|Pie(?:Arc|Plot|Chart$)|Bar(?:Plot|Element)|Line(?:Plot|Element)|Gauge[A-Z]|Axis|Drawing|Animated|Highlighted|Responsive|Localization|Transition|Portal|Popper|Modal|Backdrop|Grow|Fade|Slide|Collapse|NoSsr|Router|Link$|Image$)/u;

const looksLikeAppComponent = (name: string): boolean =>
  vendorPrefixes.every((prefix) => !name.startsWith(prefix)) &&
  !vendorPattern.test(name);

const MAX_PROP_LENGTH = 80;

/** Renders a prop value as one short line — enough to recognise, not to dump. */
const describeValue = (value: unknown): string => {
  if (value === null) {
    return "null";
  }

  switch (typeof value) {
    case "function": {
      return `ƒ ${value.name.length > 0 ? value.name : "anonymous"}()`;
    }
    case "string": {
      return value.length > MAX_PROP_LENGTH
        ? `"${value.slice(0, MAX_PROP_LENGTH)}…"`
        : `"${value}"`;
    }
    case "undefined": {
      return "undefined";
    }
    case "object": {
      if (Array.isArray(value)) {
        return `Array(${value.length})`;
      }
      if (value instanceof Date) {
        return value.toISOString();
      }
      // React elements are the common case here and never read well inlined.
      if (isRecord(value) && "$$typeof" in value) {
        return "<element>";
      }
      // Next's `params` and `searchParams` are promises behind a proxy that
      // warns the moment anything enumerates them. Describing a value must
      // never provoke the thing being described, so thenables are named and
      // left alone, and any other exotic object is caught rather than trusted.
      if (isRecord(value) && typeof value.then === "function") {
        return "Promise";
      }

      try {
        const keys = Object.keys(value);
        return `{ ${keys.slice(0, 4).join(", ")}${keys.length > 4 ? ", …" : ""} }`;
      } catch {
        return "{ … }";
      }
    }
    default: {
      return String(value);
    }
  }
};

const describeProperties = (
  properties: unknown
): readonly [string, string][] => {
  if (!isRecord(properties)) {
    return [];
  }

  try {
    return Object.entries(properties)
      .filter(([key]) => key !== "children")
      .slice(0, 12)
      .map(([key, value]): [string, string] => [key, describeValue(value)]);
  } catch {
    return [];
  }
};

/**
 * Walks up the fiber tree collecting the components that produced this node.
 *
 * @param element - The hovered DOM element.
 * @returns Innermost component first, so the first app component in the list is
 * the one whose file the reader most likely wants.
 */
export const getComponentStack = (
  element: Element
): readonly ComponentFrame[] => {
  const frames: ComponentFrame[] = [];
  let fiber = getFiber(element);
  const seen = new Set<string>();

  while (fiber !== null && frames.length < 12) {
    const name = getComponentName(fiber.elementType);

    if (name !== null && isUsefulName(name) && !seen.has(name)) {
      seen.add(name);
      frames.push({
        isAppComponent: looksLikeAppComponent(name),
        name,
        props: describeProperties(fiber.memoizedProps),
      });
    }

    fiber = fiber.return;
  }

  return frames;
};

/**
 * Re-marks a stack against the components the repo actually contains.
 *
 * @param stack - Frames as read from the fiber tree.
 * @param known - Names the dev source route resolved to a file.
 * @returns The same frames, with `isAppComponent` decided by the file system
 * rather than by guessing at a name.
 *
 * @remarks
 * The name heuristic has to run first — it decides which names are worth asking
 * about — but it cannot be the final word, because a vendor component and an app
 * component can be named alike. Whether a file exists is not a guess.
 */
export const markKnownComponents = (
  stack: readonly ComponentFrame[],
  known: ReadonlySet<string>
): readonly ComponentFrame[] =>
  stack.map((frame) => ({
    ...frame,
    isAppComponent: known.has(frame.name),
  }));

/** `MuiCard-root` → `Card`, so the nearest design-system component is named. */
export const getMuiComponentName = (element: Element): string | null => {
  for (const className of element.classList) {
    const match = /^Mui(?<name>[A-Za-z]+)-root$/u.exec(className);
    if (match?.groups?.name !== undefined) {
      return match.groups.name;
    }
  }

  return null;
};

/** `<div>` plus the classes that identify it, for the "what am I on" line. */
export const describeElement = (element: Element): string => {
  const meaningful = [...element.classList]
    .filter((className) => className.startsWith("Mui"))
    .slice(0, 2);
  const testId = element.getAttribute("data-testid");

  return [
    `<${element.tagName.toLowerCase()}>`,
    testId === null ? "" : ` [${testId}]`,
    meaningful.length === 0 ? "" : ` .${meaningful.join(".")}`,
  ].join("");
};

/** The DOM path from the nearest landmark down to the element. */
export const getDomPath = (element: Element): string => {
  const parts: string[] = [];
  let node: Element | null = element;

  while (node !== null && node !== document.body && parts.length < 6) {
    parts.unshift(getMuiComponentName(node) ?? node.tagName.toLowerCase());
    node = node.parentElement;
  }

  return parts.join(" › ");
};

const COMPUTED_PROPERTIES = [
  "display",
  "width",
  "height",
  "padding",
  "margin",
  "gap",
  "background-color",
  "color",
  "font-size",
  "font-weight",
  "border-radius",
  "box-shadow",
] as const;

const uninformativeValues = new Set([
  "",
  "0px",
  "none",
  "normal",
  "auto",
  "rgba(0, 0, 0, 0)",
]);

export const readComputedStyles = (
  element: Element
): readonly [string, string][] => {
  const styles = getComputedStyle(element);

  return COMPUTED_PROPERTIES.map((property): [string, string] => [
    property,
    styles.getPropertyValue(property).trim(),
  ]).filter(([, value]) => !uninformativeValues.has(value));
};
