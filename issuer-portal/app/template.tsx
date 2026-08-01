"use client";

import type { ReactNode } from "react";

import { ViewTransition } from "react";

interface TemplateProps {
  readonly children: ReactNode;
}

/**
 * Wraps page content in a named view transition so route changes cross-fade.
 *
 * A `template` re-mounts on every navigation (unlike `layout`), which is what
 * gives React a new subtree to transition between. It sits *inside* the root
 * layout, so the persistent chrome rendered by `Layout` — the app bar, the
 * event tabs, and the footer — is outside this boundary and never re-mounts.
 *
 * The explicit `page-content` name is what keeps that chrome still: naming
 * this subtree lifts it out of the document-wide `root` snapshot, and
 * GlobalStyles then animates only `page-content` while pinning `root` to no
 * animation. Renaming it here means renaming it there too.
 */
export default function Template({ children }: TemplateProps) {
  return <ViewTransition name="page-content">{children}</ViewTransition>;
}
