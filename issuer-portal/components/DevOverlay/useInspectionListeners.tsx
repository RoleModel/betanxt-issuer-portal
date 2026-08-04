"use client";

import {
  type Dispatch,
  type MutableRefObject,
  type SetStateAction,
  useEffect,
} from "react";

import type { Inspection } from "./DevOverlay";

import {
  describeElement,
  getComponentStack,
  getDomPath,
  getMuiComponentName,
  readComputedStyles,
} from "./inspect";

type PanelKey = "glossary" | "theme" | "tokens";

interface UseInspectionListenersOptions {
  /** Whether the overlay is active; listeners attach only when true. */
  readonly enabled: boolean;
  /** Mirrors `isInspecting` for listeners registered once, outside React state. */
  readonly inspectingRef: MutableRefObject<boolean>;
  /** Mirrors the pinned flag for the same reason. */
  readonly pinnedRef: MutableRefObject<boolean>;
  readonly setInspection: Dispatch<SetStateAction<Inspection | null>>;
  readonly setIsInspecting: Dispatch<SetStateAction<boolean>>;
  readonly setIsPinned: Dispatch<SetStateAction<boolean>>;
  readonly setOpenPanel: Dispatch<SetStateAction<PanelKey | null>>;
}

/**
 * Registers the window listeners that drive hover-to-inspect: pointer tracking,
 * click-to-pin, and the keyboard shortcuts.
 *
 * @remarks
 * Extracted from {@link DevOverlay} to keep that component small and to isolate
 * the imperative DOM wiring. Every dependency is a stable state setter or ref,
 * so the effect attaches once per `enabled` change rather than on every render.
 * Elements are read as `Element` (not `HTMLElement`) so SVG chart internals stay
 * inspectable.
 */
export const useInspectionListeners = ({
  enabled,
  inspectingRef,
  pinnedRef,
  setInspection,
  setIsInspecting,
  setIsPinned,
  setOpenPanel,
}: UseInspectionListenersOptions): void => {
  useEffect(() => {
    if (!enabled) {
      inspectingRef.current = false;
      // No listeners are attached while disabled; nothing to tear down.
      return () => {
        /* noop */
      };
    }

    let frame = 0;

    /** `null` when the event came from the overlay's own chrome. */
    const inspectableTarget = (event: MouseEvent): Element | null => {
      const { target } = event;

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
      // A pinned inspection stops following the pointer so the card can be read
      // and copied from without the target changing on the way to it.
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

    const onClick = (event: MouseEvent): void => {
      if (!inspectingRef.current) {
        return;
      }

      const target = inspectableTarget(event);
      if (target === null) {
        return;
      }

      // Suppress the click: while inspecting, the pointer is over real controls,
      // and pinning a row must not also navigate away from the page.
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
        return;
      }

      if (event.key === "g" || event.key === "G") {
        setOpenPanel((current) => (current === "glossary" ? null : "glossary"));
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
  }, [
    enabled,
    inspectingRef,
    pinnedRef,
    setInspection,
    setIsInspecting,
    setIsPinned,
    setOpenPanel,
  ]);
};
