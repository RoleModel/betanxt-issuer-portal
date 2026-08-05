/**
 * What to build, for the three requested UI enhancements.
 *
 * @remarks
 * Written as finished behaviour: a developer should be able to build from this
 * without knowing which parts already exist. Where a file is named, it is named
 * so they can find the thing.
 *
 * Content lives in a typed module because it is the deliverable — the page
 * renders it and the download serialises it, so the two cannot drift.
 */

export interface Requirement {
  /** Stable id for tickets, e.g. `PCT-04`. Never renumber. */
  readonly id: string;
  /** Given/When/Then lines that can become tests. */
  readonly acceptance: readonly string[];
  /** Where this lives in the codebase. */
  readonly evidence?: readonly string[];
  /** Why it behaves this way. Omitted when obvious. */
  readonly rationale?: string;
  /** Screens where this is visible in the running app. */
  readonly screens: readonly ScreenLink[];
  /** The behaviour, in one testable sentence. */
  readonly statement: string;
  readonly title: string;
}

/** A scope question and its short answer. */
export interface Topic {
  readonly answer: readonly string[];
  /**
   * Introduces the run of questions this one starts, when it starts one.
   *
   * @remarks
   * Section 2 was asked as two requests — the tooltip experience, then
   * click-through to the glossary — so its questions need two introductions
   * rather than one. Sections asked as a single request leave this unset and
   * use the section summary.
   */
  readonly lead?: string;
  readonly question: string;
  readonly requirementIds: readonly string[];
}

export interface SpecTable {
  readonly caption?: string;
  readonly headers: readonly string[];
  readonly rows: readonly (readonly string[])[];
  readonly title: string;
}

/** A screen in the running app. */
export interface ScreenLink {
  readonly href: string;
  readonly label: string;
}

export interface SpecSection {
  readonly id: string;
  /** Short paragraphs describing the feature. */
  readonly background: readonly string[];
  /** Supporting structure, shown after the three requested sections. */
  readonly isAppendix?: boolean;
  readonly requirements: readonly Requirement[];
  readonly summary: string;
  readonly tables?: readonly SpecTable[];
  readonly title: string;
  readonly topics?: readonly Topic[];
}

/* -------------------------------------------------------------------------- */
/* 1. Percentage vs. Count Toggle Feature                                     */
/* -------------------------------------------------------------------------- */

const percentageToggle: SpecSection = {
  id: "percentage-count-toggle",
  title: "1. Percentage vs. Count Toggle Feature",
  summary:
    "Requirements for the proposed ability to toggle between Percentage and Count views within the Meeting Dashboard, the Tabulation Dashboard, and Tabulation Detail Views (if applicable). Specifically, we'd like to understand:",
  background: [
    "A single control, labelled `Display as: Percentage | Count`, sits in the page header and governs every figure on screen. Switching it changes share quantities and position counts everywhere at once; dates, statuses and names are untouched.",
    "Each figure that can be shown as a percentage has one agreed base it divides by, listed in the bases table. The base is named in the figure's tooltip, so a reader can always tell what a percentage is a percentage of.",
    "Both readings stay within reach: whichever format is showing, hovering a figure reveals the other.",
  ],
  topics: [
    {
      question:
        "Which widgets, charts, tables, and metrics should support the toggle functionality.",
      answer: [
        "Every figure that is a share quantity or a position count, across all three areas. The tables list them one by one with the base each uses.",
      ],
      requirementIds: ["PCT-01", "PCT-02"],
    },
    {
      question: "The underlying values and calculations included in each view.",
      answer: [
        "Count shows the raw quantity with thousands separators. Percentage is the value divided by its base, to two decimal places.",
        "Charts that enlarge small slices so they stay visible still label them with the true value, so percentages add up to 100.",
      ],
      requirementIds: ["PCT-03", "PCT-07", "PCT-08"],
    },
    {
      question:
        "Any metrics that should remain unchanged regardless of the selected display option.",
      answer: [
        "Dates, statuses, names, ID numbers, ratios, counts of documents, and number fields in forms.",
        "Named examples: Record Date, Broker Search, Meeting Date, Days to Meeting, Vote Status, Management Recommendation, the quorum chip, CUSIP, and the share multiplier.",
      ],
      requirementIds: ["PCT-05"],
    },
    {
      question: "Expected default state (Percentage or Count).",
      answer: [
        "Percentage. It answers the question people open the portal with: are we at quorum.",
      ],
      requirementIds: ["PCT-04"],
    },
    {
      question:
        "Whether the user's selection should persist across sessions or page navigation.",
      answer: [
        "Both. The choice is remembered per user and survives moving between pages, reloading, and returning in a new session.",
        "A link ending `?display=count` shows that format without changing the reader's own saved choice.",
      ],
      requirementIds: ["PCT-06"],
    },
    {
      question:
        "Any reporting, export, or downstream impacts associated with this feature.",
      answer: [
        "Exports contain raw counts whatever the screen shows, because they are archived and reconciled. Templates carrying percentage columns state their base.",
        "Affected: the tabulation PDF, positions PDF and Excel, the broker breakout report, and the meeting reports list.",
      ],
      requirementIds: ["PCT-09"],
    },
  ],
  requirements: [
    {
      id: "PCT-01",
      screens: [
        {
          href: "/WEN/meeting/wen-special-meeting-2026/dashboard",
          label: "Meeting Dashboard",
        },
        {
          href: "/WEN/meeting/wen-special-meeting-2026/tabulation",
          label: "Tabulation",
        },
      ],
      title: "One control governs every figure",
      statement:
        "A single display setting drives the format of every convertible figure on the page. No widget carries its own percentage/count switch.",
      rationale:
        "A chart and the table beside it must never disagree about which format they are in.",
      evidence: [
        "contexts/TabulationDisplayContext.tsx",
        "utils/tabulation-display.ts",
      ],
      acceptance: [
        "Given a user picks Count, when they scroll the page, then every convertible figure shows a count.",
        "Given a user picks Percentage, when they scroll the page, then every convertible figure shows a percentage.",
      ],
    },
    {
      id: "PCT-02",
      screens: [
        {
          href: "/WEN/meeting/wen-special-meeting-2026/dashboard",
          label: "Meeting Dashboard",
        },
        {
          href: "/WEN/meeting/wen-special-meeting-2026/tabulation",
          label: "Tabulation",
        },
        { href: "/WEN/reporting", label: "Reporting" },
        { href: "/WEN/past-meetings", label: "Past Meetings" },
      ],
      title: "Available wherever figures appear",
      statement:
        "The control appears on the Meeting Dashboard, Tabulation Dashboard, Tabulation detail views, Reporting, and Past Meetings, and governs the figures on each.",
      evidence: [
        "app/[clientTicker]/meeting/layout.tsx",
        "app/[clientTicker]/reporting/layout.tsx",
      ],
      acceptance: [
        "Given a user opens any of those areas, when the page loads, then the control is in the header.",
        "Given a user sets Count in one area, when they move to another, then Count is still set.",
      ],
    },
    {
      id: "PCT-03",
      screens: [
        {
          href: "/WEN/meeting/wen-special-meeting-2026/tabulation",
          label: "Tabulation — hover any figure",
        },
      ],
      title: "Each figure divides by one named base",
      statement:
        "Each convertible figure uses exactly one base from the bases table, and names that base in its tooltip.",
      rationale:
        "45.2% means nothing on its own. Naming the base lets a reader reconcile a figure against a tabulation certificate.",
      evidence: ["utils/quorum.ts", "utils/exportTabulationPdf.tsx"],
      acceptance: [
        "Given Percentage is showing, when a user hovers a figure, then the tooltip reads like `1,204,336 of 2,664,000 shares outstanding`.",
        "Given a figure whose base is zero, when it renders, then it reads 0.00% rather than an error.",
      ],
    },
    {
      id: "PCT-04",
      screens: [
        {
          href: "/WEN/meeting/wen-special-meeting-2026/dashboard",
          label: "Meeting Dashboard",
        },
      ],
      title: "Percentage is the default",
      statement: "A user with no saved choice sees percentages.",
      evidence: ["contexts/TabulationDisplayContext.tsx"],
      acceptance: [
        "Given a new user, when they open any tabulation screen, then Percentage is selected.",
      ],
    },
    {
      id: "PCT-05",
      screens: [
        {
          href: "/WEN/meeting/wen-special-meeting-2026/dashboard",
          label: "Meeting Dashboard — Key Dates",
        },
        {
          href: "/WEN/meeting/wen-special-meeting-2026/tabulation",
          label: "Tabulation — Positions tab",
        },
      ],
      title: "Non-numeric figures are unaffected",
      statement:
        "Dates, statuses, names, ID numbers, ratios, counts of documents, and number fields in forms render identically in both formats.",
      evidence: ["components/Meeting/KeyDatesCard.tsx"],
      acceptance: [
        "Given either format, when a user views Record Date, Vote Status, CUSIP, Days to Meeting, or the quorum chip, then each is unchanged.",
        "Given either format, when a user types into a number field in an upload form, then it takes a plain number.",
      ],
    },
    {
      id: "PCT-06",
      screens: [
        {
          href: "/WEN/meeting/wen-special-meeting-2026/tabulation",
          label: "Tabulation — the toggle",
        },
      ],
      title: "The choice is remembered",
      statement:
        "The chosen format is stored per user and survives page changes, reloads, and new sessions. A `?display=` link overrides the view for that visit without changing the stored choice.",
      evidence: ["contexts/TabulationDisplayContext.tsx"],
      acceptance: [
        "Given a user picks Count, when they reload, then Count is still selected.",
        "Given a user picks Count on one meeting, when they open another, then Count is still selected.",
        "Given a link ending `?display=percentages`, when it opens, then percentages show and the stored choice is unchanged.",
        "Given storage is unavailable, when the page loads, then the default applies and no error surfaces.",
      ],
    },
    {
      id: "PCT-07",
      screens: [
        {
          href: "/WEN/meeting/wen-special-meeting-2026/dashboard",
          label: "Meeting Dashboard — tracker",
        },
      ],
      title: "Both readings stay available",
      statement:
        "Hovering or focusing any converted figure reveals the other reading, and screen readers announce both.",
      evidence: [
        "components/Meeting/tabulation-tracker/HistoricalShareCard.tsx",
      ],
      acceptance: [
        "Given any converted figure, when a user hovers or focuses it, then the other reading appears.",
      ],
    },
    {
      id: "PCT-08",
      screens: [
        {
          href: "/WEN/meeting/wen-special-meeting-2026/tabulation",
          label: "Tabulation — donuts",
        },
        {
          href: "/WEN/meeting/wen-special-meeting-2026/reports",
          label: "Reports — vote distribution",
        },
      ],
      title: "Rounding, and honest chart labels",
      statement:
        "Percentages show two decimal places; counts show thousands separators and no decimals. Charts that enlarge small slices for legibility label them with the true value.",
      rationale:
        "Two decimals matches the tabulation certificate. Reading a label off a drawn size is how percentages stop adding up to 100.",
      evidence: [
        "utils/tabulation-display.ts",
        "components/Charts/HolderOutcome/HolderOutcomeChartCard.tsx",
      ],
      acceptance: [
        "Given 45.2358%, when it renders, then it reads 45.24%.",
        "Given a chart with an enlarged slice, when Percentage is showing, then the labels add up to 100.00%.",
      ],
    },
    {
      id: "PCT-09",
      screens: [
        {
          href: "/WEN/meeting/wen-special-meeting-2026/reports",
          label: "Reports — downloads",
        },
        {
          href: "/WEN/meeting/wen-special-meeting-2026/tabulation",
          label: "Tabulation — Positions tab export",
        },
      ],
      title: "Exports contain counts",
      statement:
        "CSV, Excel, and PDF exports contain raw counts whatever the screen shows. Any percentage column in an export states its base.",
      rationale:
        "Exports are archived and reconciled. A file whose contents depend on a screen setting cannot be audited.",
      evidence: [
        "utils/exportTabulationPdf.tsx",
        "utils/exportPositionsXlsx.ts",
      ],
      acceptance: [
        "Given Percentage is showing, when a user exports to Excel, then the file contains counts.",
        "Given any export with a percentage column, when it opens, then it states the base used.",
      ],
    },
    {
      id: "PCT-10",
      screens: [
        {
          href: "/WEN/meeting/wen-special-meeting-2026/tabulation",
          label: "Tabulation — page header",
        },
      ],
      title: "The control itself",
      statement:
        "The control reads `Display as: Percentage | Count`, appears once per page, and is operable by keyboard with both options readable at phone width.",
      evidence: ["components/Navigation/EventTabs/MeetingNavigationBar.tsx"],
      acceptance: [
        "Given a keyboard user reaches the control, when they press arrow keys, then the choice changes and is announced.",
        "Given a phone-width screen, when the header renders, then both options are readable.",
      ],
    },
  ],
  tables: [
    {
      title: "Bases",
      caption:
        "Each figure divides by exactly one of these, and names it in the tooltip.",
      headers: ["Base", "Used by"],
      rows: [
        [
          "Shares outstanding",
          "Quorum gauge, Total Shares Voted, BNV, Shares Voted centre",
        ],
        ["Shares voted (whole meeting)", "Vote distribution, holder charts"],
        [
          "Shares voted (one proposal)",
          "For / Against / Abstain columns and slices",
        ],
        [
          "Total positions",
          "Positions Voted, positions charts, voting activity",
        ],
        [
          "Mailing positions",
          "Mail positions, suppressed positions, extra mailings",
        ],
        ["That broker's votes", "Broker voting by proposal"],
      ],
    },
    {
      title: "Meeting Dashboard",
      headers: ["Widget", "Figures", "Base"],
      rows: [
        [
          "Tabulation tracker",
          "Positions Voted, Total Positions",
          "Total positions",
        ],
        [
          "Tabulation tracker",
          "Shares Voted, Shares Not Voted, prior year",
          "Shares outstanding",
        ],
        ["Vote progress bar", "Voted, Not Voted", "Shares outstanding"],
        [
          "Quorum gauge",
          "Shares represented, quorum requirement",
          "Shares outstanding",
        ],
        [
          "Mailing cards",
          "Accounts, positions, mail and suppressed positions",
          "Mailing positions",
        ],
        [
          "Extra mailings",
          "Positions, Full Set, Electronic",
          "Mailing positions",
        ],
        ["Past meetings", "Participation", "Shares outstanding"],
        [
          "Key dates, roles, DSM card",
          "Dates and yes/no only",
          "Not converted",
        ],
      ],
    },
    {
      title: "Tabulation Dashboard",
      headers: ["Widget", "Figures", "Base"],
      rows: [
        ["Quorum gauge", "Shares represented", "Shares outstanding"],
        [
          "Voting activity by source",
          "Web, Print, IVR, Solicitor",
          "Shares voted (meeting)",
        ],
        [
          "Beneficial vs Registered",
          "Holder totals and outcomes",
          "Shares voted (meeting)",
        ],
        ["Vote matrix totals", "Bar totals", "Shares voted (meeting)"],
      ],
    },
    {
      title: "Tabulation Detail Views",
      headers: ["View", "Figures", "Base"],
      rows: [
        ["Overview tab", "For, Against, Abstain", "Shares voted (proposal)"],
        ["Overview tab", "Total Shares Voted, BNV", "Shares outstanding"],
        ["Positions tab", "Shares, Shares Voted", "Shares outstanding"],
        [
          "Positions tab",
          "CUSIP, name, status, dates, source",
          "Not converted",
        ],
        [
          "Shares voted donut",
          "For, Against, Abstain, centre",
          "Shares outstanding",
        ],
      ],
    },
    {
      title: "Reporting",
      headers: ["Widget", "Figures", "Base"],
      rows: [
        ["Quorum timeline", "Cumulative shares voted", "Shares outstanding"],
        [
          "Year over year",
          "Registered, Beneficial",
          "Shares outstanding (that year)",
        ],
        ["Broker voting", "For, Against, Abstain", "That broker's votes"],
        ["Voting performance", "Positions", "Total positions"],
        ["Voting performance", "Shares", "Shares outstanding"],
        [
          "Geographic map",
          "Shareholders, Shares Held",
          "Total across shown rows",
        ],
        ["Positions voted", "Voted, Unvoted", "Total positions"],
        [
          "Participation by year",
          "Participation",
          "Shares outstanding (that year)",
        ],
        ["Event summary", "Dates and names only", "Not converted"],
      ],
    },
  ],
};

/* -------------------------------------------------------------------------- */
/* 2. Tooltip and Glossary Navigation Enhancements                            */
/* -------------------------------------------------------------------------- */

const tooltipsAndNavigation: SpecSection = {
  id: "tooltips-glossary-navigation",
  title: "2. Tooltip and Glossary Navigation Enhancements",
  summary:
    "Requirements for updating the current tooltip experience for key terms and definitions throughout the portal. Specifically:",
  background: [
    "Glossary terms appearing in page text are underlined automatically. Hovering one shows its definition; clicking one opens the glossary at that term, over the page the reader was on.",
    "There are two kinds of marker. A dashed underline opens the glossary. A dotted underline explains on hover only, for terms inside a button, tab, or legend that already does something when clicked.",
    "Every term has its own address, so a definition can be bookmarked or pasted into an email.",
  ],
  topics: [
    {
      question: "Which terms should display tooltips.",
      answer: [
        "All 107 terms in the glossary, marked wherever they appear in page text — prose, card titles, chart legends, column headers, and empty states. Only the first mention in any one piece of text is marked.",
      ],
      requirementIds: ["TIP-02"],
    },
    {
      question: "The content and source of each definition.",
      answer: [
        "One file holds every definition, and the tooltip, the glossary, and search all read from it. Editing a definition updates all three.",
      ],
      requirementIds: ["TIP-01"],
    },
    {
      question: "Whether definitions should appear on hover, click, or both.",
      answer: [
        "Both, with different jobs. Hover or keyboard focus shows the definition; clicking opens the glossary at that term.",
        "Terms inside a control show on hover only, so the control keeps its click.",
      ],
      requirementIds: ["TIP-03"],
    },
    {
      question: "Accessibility and mobile experience considerations.",
      answer: [
        "Markers are buttons, reachable by keyboard, with a visible focus outline. No definition is reachable by hover alone.",
        "On touch, one tap shows the definition, and targets are at least 44 by 44 pixels.",
      ],
      requirementIds: ["TIP-06", "TIP-07"],
    },
    {
      question:
        "Any requirements for maintaining consistent terminology across the application.",
      answer: [
        "Consistency comes from the single definitions file rather than from review. A build check flags screen wording that uses a version of a term the file does not recognise.",
      ],
      requirementIds: ["TIP-01", "TIP-08"],
    },
    {
      lead: "Additionally, we would like requirements for enabling users to click a term and be redirected directly to the corresponding entry within the Glossary of Terms. Please include:",
      question: "Expected navigation behavior.",
      answer: [
        "Clicking a term opens the glossary over the current page, on that term. The page behind stays put.",
        "Closing returns focus to the word that was clicked, and Back returns the reader to where they were.",
      ],
      requirementIds: ["TIP-05"],
    },
    {
      question:
        "Whether glossary entries should support deep linking/bookmarking.",
      answer: [
        "Every term has an address that can be bookmarked or shared, and opening one goes straight to that definition.",
        "An address for a term that no longer exists explains itself rather than showing an error.",
      ],
      requirementIds: ["TIP-04"],
    },
    {
      question: "Any permissions or user-role considerations.",
      answer: [
        "None. Every signed-in role sees the same glossary, since definitions are reference material rather than client data.",
        "A signed-out visitor opening a term link lands on that term after logging in.",
      ],
      requirementIds: ["TIP-09"],
    },
  ],
  requirements: [
    {
      id: "TIP-01",
      screens: [
        {
          href: "/WEN/meeting/wen-special-meeting-2026/tabulation",
          label: "Tabulation — underlined terms",
        },
      ],
      title: "One source of definitions",
      statement:
        "Tooltips, the glossary, and glossary search all read from a single definitions file.",
      evidence: ["lib/termsDefinitions.ts", "components/ui/GLOSSARY.md"],
      acceptance: [
        "Given a definition is edited, when the app rebuilds, then the tooltip and the glossary both show the new wording.",
      ],
    },
    {
      id: "TIP-02",
      screens: [
        {
          href: "/WEN/meeting/wen-special-meeting-2026/tabulation",
          label: "Tabulation",
        },
        {
          href: "/WEN/meeting/wen-special-meeting-2026/dashboard",
          label: "Meeting Dashboard",
        },
        {
          href: "/WEN/meeting/wen-special-meeting-2026/mailing",
          label: "Mailing",
        },
        { href: "/WEN/reporting", label: "Reporting" },
      ],
      title: "Terms are marked automatically",
      statement:
        "Any glossary term appearing in page text is marked on its first mention, across the meeting, tabulation, mailing, and reporting screens. Repeat mentions in the same text are left plain.",
      evidence: ["components/ui/GlossaryText.tsx"],
      acceptance: [
        "Given a screen in scope, when it renders, then each glossary term is marked once.",
        "Given a term is added to the definitions file, when the app rebuilds, then it is marked everywhere it appears with no other change.",
      ],
    },
    {
      id: "TIP-03",
      screens: [
        {
          href: "/WEN/meeting/wen-special-meeting-2026/tabulation",
          label: "Tabulation — hover a term",
        },
      ],
      title: "Hover explains, click opens",
      statement:
        "Hover or keyboard focus reveals the definition. Clicking opens the glossary at that term. A term inside a control explains on hover only and leaves the click to the control.",
      evidence: ["components/ui/GlossaryToolTip.tsx"],
      acceptance: [
        "Given a dashed term, when a user hovers it, then the definition appears; when they click it, then the glossary opens there.",
        "Given a dotted term inside a legend, when a user clicks it, then only the legend reacts.",
      ],
    },
    {
      id: "TIP-04",
      screens: [
        {
          href: "/WEN/meeting/wen-special-meeting-2026/tabulation",
          label: "Tabulation — click a term",
        },
      ],
      title: "Every term has an address",
      statement:
        "Each term has its own shareable address that opens the glossary on that term. An unrecognised term id opens the glossary with an explanation.",
      evidence: ["contexts/GlossaryContext.tsx"],
      acceptance: [
        "Given a user opens a term's address, when the page loads, then the glossary opens on that term.",
        "Given a user clicks a term, when the glossary opens, then the address updates to that term.",
        "Given an address for a term that does not exist, when it opens, then the glossary explains rather than erroring.",
      ],
    },
    {
      id: "TIP-05",
      screens: [
        {
          href: "/WEN/meeting/wen-special-meeting-2026/tabulation",
          label: "Tabulation — click a term",
        },
      ],
      title: "The reader keeps their place",
      statement:
        "The glossary opens over the current page, which stays rendered behind it. Closing it returns focus to the word that opened it and leaves the reader where they were.",
      evidence: ["components/InfoDialog.tsx"],
      acceptance: [
        "Given a user clicks a term, when the glossary opens, then the page behind it is still there.",
        "Given the glossary is open, when the user presses Escape, then it closes and focus returns to the term.",
      ],
    },
    {
      id: "TIP-06",
      screens: [
        {
          href: "/WEN/meeting/wen-special-meeting-2026/tabulation",
          label: "Tabulation — tab to a term",
        },
      ],
      title: "Keyboard and screen readers",
      statement:
        "Markers are buttons with a visible focus outline, reachable by keyboard, and announced with the term and its purpose. No definition is available only by hovering.",
      evidence: ["components/ui/GlossaryToolTip.tsx"],
      acceptance: [
        "Given a keyboard user tabs to a marker, when it is focused, then the definition shows and the outline is visible.",
        "Given an accessibility scan of a screen with markers, when it finishes, then there are no serious problems.",
      ],
    },
    {
      id: "TIP-07",
      screens: [
        {
          href: "/WEN/meeting/wen-special-meeting-2026/tabulation",
          label: "Tabulation — on a phone",
        },
      ],
      title: "Touch screens",
      statement:
        "One tap reveals the definition, and touch targets are at least 44 by 44 pixels.",
      rationale: "There is no hover on a phone, so tapping does both jobs.",
      acceptance: [
        "Given a user taps a marker, when the definition appears, then tapping elsewhere dismisses it without navigating.",
      ],
    },
    {
      id: "TIP-08",
      screens: [{ href: "/WEN/reporting", label: "Reporting — chart legends" }],
      title: "Wording stays consistent",
      statement:
        "A build check flags screen wording that uses a version of a glossary term the definitions file does not recognise.",
      evidence: ["components/ui/GlossaryText.tsx"],
      acceptance: [
        "Given a screen says `Beneficial Holders` with no matching entry, when the check runs, then it reports it.",
      ],
    },
    {
      id: "TIP-09",
      screens: [
        {
          href: "/WEN/meeting/wen-special-meeting-2026/tabulation",
          label: "Tabulation — any role",
        },
      ],
      title: "Open to every signed-in role",
      statement:
        "The glossary is available to all signed-in roles with no filtering. A signed-out visitor opening a term link lands on that term after logging in.",
      evidence: ["auth.config.ts"],
      acceptance: [
        "Given any signed-in role, when they open any term, then it shows.",
      ],
    },
    {
      id: "TIP-10",
      screens: [
        {
          href: "/WEN/meeting/wen-special-meeting-2026/tabulation",
          label: "Tabulation — open a definition",
        },
      ],
      title: "Lookups are recorded",
      statement:
        "Opening a definition or running a glossary search records the term and the screen it came from.",
      rationale:
        "The most looked-up words are the ones whose on-screen labels are unclear — the cheapest signal for what to reword.",
      acceptance: [
        "Given a user opens a definition, when it is recorded, then the term and the screen are captured.",
      ],
    },
  ],
  tables: [
    {
      title: "The vocabulary",
      caption: "107 definitions in 12 groups.",
      headers: ["Group", "Count", "Examples"],
      rows: [
        ["Proxy & Voting", "23", "Ballot, Broker Non-vote, Tabulation"],
        ["Communications & Delivery", "12", "Notice and Access, Householding"],
        ["Market Infrastructure", "12", "Cede and Company, DTC, EDGAR"],
        ["Securities & Investment Vehicles", "11", "Common Stock, ETF, REIT"],
        ["Governance & Corporate Documents", "10", "Annual Report, By-laws"],
        ["Roles & Intermediaries", "9", "Broker, Custodian, Transfer Agent"],
        ["Shareholders & Ownership", "9", "Beneficial Owner, NOBO, OBO"],
        ["Meetings & Events", "7", "Annual Meeting, Quorum, Agenda"],
        ["Key Dates & Identifiers", "5", "CUSIP, Record Date, Mailing Date"],
        ["Corporate Actions", "4", "Dividend, Corporate Action"],
        ["Legal & Compliance", "4", "Class Action, NIGO, Rule 30e-3"],
        ["Payment & Settlement", "1", "Continuous Net Payment"],
      ],
    },
    {
      title: "Marker behaviour",
      headers: ["Where", "Hover", "Click", "Underline"],
      rows: [
        ["Body text, card text", "Definition", "Opens the glossary", "Dashed"],
        [
          "Chart legends, column headers",
          "Definition",
          "The control's own action",
          "Dotted",
        ],
        ["Tabs, menu items", "Nothing", "Navigates", "None"],
      ],
    },
  ],
};

/* -------------------------------------------------------------------------- */
/* 3. Glossary of Terms Formatting Updates                                    */
/* -------------------------------------------------------------------------- */

const glossaryFormatting: SpecSection = {
  id: "glossary-formatting",
  title: "3. Glossary of Terms Formatting Updates",
  summary:
    "Requirements for the planned enhancements to the formatting and presentation of the Glossary of Terms. Areas of interest include:",
  background: [
    "The glossary is a drawer that rises from the bottom of the screen, three quarters of the height, opened either from **Glossary of Terms** in the support menu at the bottom right or by clicking any underlined term.",
    "It is a two-pane browser: a search box and category list on the left, the selected definition on the right, with buttons to copy the definition, copy a link to it, and step to the previous or next term.",
    "Search matches the term, its short forms, and the words inside definitions. Terms mentioned inside a definition are themselves clickable.",
  ],
  topics: [
    {
      question: "Desired layout and organization of glossary entries.",
      answer: [
        "A bottom drawer with the category list on the left and the selected definition on the right, plus copy and previous/next buttons.",
        "Each entry shows the term, its short forms, its group, and the definition.",
      ],
      requirementIds: ["GLO-01", "GLO-02"],
    },
    {
      question: "Categorization, grouping, or filtering requirements.",
      answer: [
        "Terms are grouped into the 12 categories, sorted alphabetically within each.",
        "Filtering by category composes with search, and the category shown on an entry is itself a filter.",
      ],
      requirementIds: ["GLO-02", "GLO-03"],
    },
    {
      question: "Search capabilities.",
      answer: [
        "Search matches the term, its short forms such as NOBO or Cede & Co., and the words inside definitions, with matched text highlighted.",
      ],
      requirementIds: ["GLO-04", "GLO-05"],
    },
    {
      question: "UX/UI design expectations.",
      answer: [
        "Matched text highlighted in results, terms inside a definition clickable, copy-text and copy-link buttons on each entry, and previous/next to step through.",
      ],
      requirementIds: ["GLO-01", "GLO-05", "GLO-06", "GLO-07"],
    },
    {
      question: "Mobile responsiveness considerations.",
      answer: [
        "On narrow screens the category list becomes a scrollable row of chips, the search box stays visible while scrolling, and the panes stack.",
      ],
      requirementIds: ["GLO-08"],
    },
    {
      question:
        "Any visual updates intended to improve readability and navigation.",
      answer: [
        "Definitions are capped to a comfortable line length, the term is visibly heavier than its definition, and contrast passes in both light and dark themes.",
      ],
      requirementIds: ["GLO-09"],
    },
  ],
  requirements: [
    {
      id: "GLO-01",
      screens: [
        {
          href: "/WEN/meeting/wen-special-meeting-2026/tabulation",
          label: "Support menu, bottom right",
        },
      ],
      title: "Layout",
      statement:
        "The glossary is a bottom drawer at three quarters of screen height, with a search box and category list on the left and the selected definition on the right.",
      evidence: ["components/InfoDialog.tsx", "components/SpeedDial.tsx"],
      acceptance: [
        "Given a user opens the glossary, when it appears, then both panes are visible without scrolling the drawer itself.",
      ],
    },
    {
      id: "GLO-02",
      screens: [
        {
          href: "/WEN/meeting/wen-special-meeting-2026/tabulation",
          label: "Glossary — category list",
        },
      ],
      title: "Grouping",
      statement:
        "Terms are grouped into the 12 categories and sorted alphabetically within each. Selecting a category shows its terms.",
      evidence: ["lib/termsDefinitions.ts"],
      acceptance: [
        "Given the glossary opens, when the category list renders, then all 12 groups are listed.",
        "Given a user opens a group, when it expands, then its terms are in alphabetical order.",
      ],
    },
    {
      id: "GLO-03",
      screens: [
        {
          href: "/WEN/meeting/wen-special-meeting-2026/tabulation",
          label: "Glossary — category list",
        },
      ],
      title: "Filtering",
      statement:
        "Category filters compose with search, and the category shown on an entry filters to that category when clicked.",
      acceptance: [
        "Given a user filters to a category and types a query, when results render, then only that category's matching terms are listed with a result count.",
      ],
    },
    {
      id: "GLO-04",
      screens: [
        {
          href: "/WEN/meeting/wen-special-meeting-2026/tabulation",
          label: "Glossary — search box",
        },
      ],
      title: "Search",
      statement:
        "Search matches the term, its short forms and acronyms, and the words inside definitions.",
      rationale:
        "Readers arrive with the shorthand the interface used — NOBO, BNV, Cede & Co. — not the formal title.",
      evidence: ["components/ui/GlossaryText.tsx"],
      acceptance: [
        "Given a user types `nobo`, when results render, then Non-Objecting Beneficial Owner is first.",
        "Given a user types a word appearing only inside a definition, when results render, then that term is listed.",
        "Given nothing matches, when results render, then the glossary says so and offers to clear the search.",
      ],
    },
    {
      id: "GLO-05",
      screens: [
        {
          href: "/WEN/meeting/wen-special-meeting-2026/tabulation",
          label: "Glossary — search box",
        },
      ],
      title: "Matches are highlighted",
      statement: "The matching text is highlighted in each result.",
      acceptance: [
        "Given a search with results, when they render, then the matching part of each is highlighted.",
      ],
    },
    {
      id: "GLO-06",
      screens: [
        {
          href: "/WEN/meeting/wen-special-meeting-2026/tabulation",
          label: "Glossary — a definition",
        },
      ],
      title: "Definitions link to each other",
      statement:
        "A glossary term mentioned inside another definition is clickable and opens that entry. A term's own name inside its definition is not a link.",
      rationale:
        "These definitions refer to each other constantly — someone reading Broker Non-vote immediately needs Routine Proposal.",
      evidence: ["components/ui/GlossaryText.tsx"],
      acceptance: [
        "Given the Broker Non-vote definition, when it renders, then Routine Proposal inside it is a link.",
      ],
    },
    {
      id: "GLO-07",
      screens: [
        {
          href: "/WEN/meeting/wen-special-meeting-2026/tabulation",
          label: "Glossary — entry buttons",
        },
      ],
      title: "Entry actions",
      statement:
        "Each entry offers copy-text, copy-link, and previous/next. The glossary prints without its search box and controls.",
      acceptance: [
        "Given a user copies the link, when they paste it, then it opens that term.",
        "Given a user prints, when it renders, then definitions are not split across pages.",
      ],
    },
    {
      id: "GLO-08",
      screens: [
        {
          href: "/WEN/meeting/wen-special-meeting-2026/tabulation",
          label: "Glossary — on a phone",
        },
      ],
      title: "Phones",
      statement:
        "Below the medium breakpoint the panes stack, the category list becomes a scrollable chip row, and the search box stays visible while scrolling.",
      evidence: ["components/InfoDialog.tsx"],
      acceptance: [
        "Given a 375 pixel screen, when the glossary opens, then nothing scrolls sideways and search stays reachable.",
        "Given a shared link on a phone, when it opens, then the term is visible and not behind the search box.",
      ],
    },
    {
      id: "GLO-09",
      screens: [
        {
          href: "/WEN/meeting/wen-special-meeting-2026/tabulation",
          label: "Glossary — a long definition",
        },
      ],
      title: "Readability",
      statement:
        "Definitions are capped to a comfortable line length, terms are visibly heavier than their definitions, and text meets contrast requirements in both themes.",
      acceptance: [
        "Given the longest definition, when it renders, then no line runs the full width of the drawer.",
        "Given any text, when contrast is measured, then it passes in light and dark.",
      ],
    },
    {
      id: "GLO-10",
      screens: [
        {
          href: "/WEN/meeting/wen-special-meeting-2026/tabulation",
          label: "Glossary — search box",
        },
      ],
      title: "Search keeps up with typing",
      statement: "Results update without visible lag as the user types.",
      acceptance: [
        "Given a user types quickly, when results update, then there is no visible lag.",
      ],
    },
  ],
  tables: [
    {
      title: "How the glossary opens",
      headers: ["Entry point", "Behaviour"],
      rows: [
        ["Support menu, bottom right", "Opens at the first entry"],
        ["Any underlined term on a page", "Opens on that term"],
        ["A shared address", "Opens on that term"],
        ["A term inside another definition", "Opens on that term"],
      ],
    },
    {
      title: "What each entry shows",
      headers: ["Part", "Treatment"],
      rows: [
        ["Term", "Heavier text, and the anchor a link points to"],
        ["Short forms", "Smaller, lighter text under the term"],
        ["Group", "Small chip that filters to that group"],
        ["Definition", "Capped line length, other terms linked"],
        ["Buttons", "Copy text, copy link, previous, next"],
      ],
    },
  ],
};

/* -------------------------------------------------------------------------- */
/* Appendix — charts directory                                                */
/* -------------------------------------------------------------------------- */

const chartStructure: SpecSection = {
  id: "chart-structure",
  isAppendix: true,
  title: "Appendix — charts directory",
  summary: "Where chart code lives and how pages import it.",
  background: [
    "Charts live in one directory, `components/Charts`, grouped by chart rather than by the page that uses them. Pages import from a single entry point.",
    "Colour, legend, axis, empty-state and loading setup is shared, so a chart describes its data and inherits its appearance.",
  ],
  requirements: [
    {
      id: "CHT-01",
      screens: [
        {
          href: "/WEN/meeting/wen-special-meeting-2026/tabulation",
          label: "Tabulation charts",
        },
        { href: "/WEN/reporting", label: "Reporting charts" },
      ],
      title: "One directory",
      statement:
        "Chart components, their data builders, and their helpers live under `components/Charts`, one folder per chart.",
      evidence: ["components/Charts/index.ts"],
      acceptance: [
        "Given a developer looks for a chart, when they open components/Charts, then every chart is there.",
      ],
    },
    {
      id: "CHT-02",
      screens: [{ href: "/WEN/reporting", label: "Reporting charts" }],
      title: "One entry point",
      statement:
        "`components/Charts/index.ts` exports every chart, and pages import from it rather than reaching into files.",
      rationale:
        "Makes a chart's public surface obvious, and means renaming a file does not touch every page that uses it.",
      evidence: ["components/Charts/index.ts"],
      acceptance: [
        "Given a page needs a chart, when it imports one, then it imports from components/Charts.",
      ],
    },
    {
      id: "CHT-03",
      screens: [
        {
          href: "/WEN/meeting/wen-special-meeting-2026/tabulation",
          label: "Tabulation charts",
        },
        { href: "/WEN/reporting", label: "Reporting charts" },
      ],
      title: "Shared appearance",
      statement:
        "Colours, legends, axis formatting, empty states, and loading skeletons come from `components/Charts/config`.",
      evidence: ["components/Charts/config"],
      acceptance: [
        "Given a chart needs a series colour, when it renders, then the colour comes from the shared config.",
        "Given the shared legend, when a chart uses it, then it keeps no legend of its own.",
      ],
    },
  ],
  tables: [
    {
      title: "Structure",
      headers: ["Path", "Holds"],
      rows: [
        ["components/Charts/index.ts", "Everything a page may import"],
        [
          "components/Charts/config/",
          "Colours, legends, axes, empty and loading states",
        ],
        [
          "components/Charts/data/",
          "Builders turning positions and votes into series",
        ],
        [
          "components/Charts/<ChartName>/",
          "One folder per chart: component, hook, sub-parts",
        ],
      ],
    },
  ],
};

export const SPEC_SECTIONS: readonly SpecSection[] = [
  percentageToggle,
  tooltipsAndNavigation,
  glossaryFormatting,
  chartStructure,
];

export interface SpecMeta {
  readonly audience: string;
  readonly author: string;
  readonly repository: string;
  readonly status: string;
  readonly title: string;
  readonly version: string;
}

export const SPEC_META: SpecMeta = {
  audience: "Engineering",
  author: "Issuer Portal UX",
  repository: "betanxt-issuer-portal / issuer-portal",
  status: "For build",
  title: "Issuer Portal — UI Enhancement Requirements",
  version: "2.0",
};
