# Glossary auto-linking system

> **Dev-team callout — reuse this, don't reinvent it.** Any plain string rendered in the app can automatically get glossary terms underlined and explained on hover/click, sourced from **one** definition file. You almost never need to hand-mark a term. Wrap copy in `<GlossaryText>` and add the term once to [`lib/termsDefinitions.ts`](../../lib/termsDefinitions.ts).

## What it does

Given copy like `"Votes represented for quorum"`, it finds every glossary term inside the string (`quorum`) and wraps just that term in a tooltip, leaving the rest as plain text. Terms are matched from the glossary itself, so a term added to `termsDefinitions` becomes linked **everywhere** `GlossaryText` is already used — no per-call-site edits.

## The four pieces

| File | Role |
| --- | --- |
| [`lib/termsDefinitions.ts`](../../lib/termsDefinitions.ts) | Single source of truth: `id → { term, category, definition }`. |
| [`contexts/GlossaryContext.tsx`](../../contexts/GlossaryContext.tsx) | `GlossaryTermId = keyof typeof termsDefinitions`; opens the glossary panel. |
| [`GlossaryText.tsx`](./GlossaryText.tsx) | Scans a string, derives a matcher from the glossary, wraps matched terms. |
| [`GlossaryToolTip.tsx`](./GlossaryToolTip.tsx) | `GlossaryTooltip` (click opens glossary) and `GlossaryHint` (hover-only). |

## Usage

```tsx
import GlossaryText from "@/components/ui/GlossaryText";

// Prose / labels — terms become interactive (hover shows definition, click opens glossary)
<Typography>
  <GlossaryText>Shares represented for quorum</GlossaryText>
</Typography>

// Inside a control that already owns the click (still shows definition on hover)
<GlossaryText interactive={false}>{columnLabel}</GlossaryText>
```

- `children`: the plain string to scan (nullable — renders nothing for empty).
- `interactive` (default `true`): `true` → `GlossaryTooltip` (click-through); `false` → `GlossaryHint` (hover definition, no click).

### When NOT to use it

Do **not** wrap the label of a navigation tab, menu item, or other interactive control — even with `interactive={false}`, the hover tooltip sits over the control and gets in the way of clicking. (This is exactly why the meeting nav tabs render plain `tab.label`, not `<GlossaryText>`.) Rule of thumb: use it in **copy the user reads**, not in **controls the user operates**.

## Extending it (add a term)

Add one entry to `termsDefinitions` — that's the whole job:

```ts
quorum: {
  category: "Meetings & Events",
  term: "Quorum",
  definition: "The minimum number of shares that must be represented …",
},
```

Matching spellings are derived automatically:

- **Parentheticals** become extra aliases: `"Notice and Access (NAA)"` matches both `Notice and Access` and `NAA`; `"Cede and Company (aka Cede and Co. or Cede & Co.)"` matches all three spellings.
- **Shorthand** the UI actually uses (a legend says `Beneficial`, not `Beneficial Owner`) is listed explicitly in `shorthandAliases` inside `GlossaryText.tsx`. Add a row there when the interface term differs from the formal glossary title.

## The reusable pattern (to implement the same thing elsewhere)

This is a general "annotate matches in text without splitting strings by hand" recipe. To build the same behavior for a different vocabulary:

1. **One source of truth.** A typed record keyed by id; derive the union type with `keyof typeof source`, never a hand-maintained parallel list.
2. **Derive one matcher.** Build a single module-level `RegExp` from the source, alternation ordered **longest-first** so `Proxy Statement` wins over `Proxy`. Use letter-based boundaries (`(?<![A-Za-z])…(?![A-Za-z])`) instead of `\b` so terms ending in punctuation (`Cede & Co.`, `NCOALink®`) don't match mid-word.
3. **Wrap, preserve the rest.** Walk `matchAll`, push plain slices between matches and a wrapped node for each match, so untouched text is untouched.

### Gotchas (baked into `GlossaryText`, keep them if you copy it)

- Reset `pattern.lastIndex = 0` each render — a module-level `/g` regex is stateful and will skip matches otherwise.
- Link only the **first** mention of a term per string (`linked` Set) — one underline makes the point; repeats are noise.
- Keep a trailing plural `s` visually with the term but out of its **id**.
