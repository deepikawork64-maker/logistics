---
name: Fieldnote Editorial Ops
colors:
  surface: '#fef9ef'
  surface-dim: '#dedad0'
  surface-bright: '#fef9ef'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f8f3ea'
  surface-container: '#f2ede4'
  surface-container-high: '#ece8de'
  surface-container-highest: '#e6e2d9'
  on-surface: '#1d1c16'
  on-surface-variant: '#424844'
  inverse-surface: '#32302a'
  inverse-on-surface: '#f5f0e7'
  outline: '#727974'
  outline-variant: '#c1c8c3'
  surface-tint: '#486458'
  primary: '#07241a'
  on-primary: '#ffffff'
  primary-container: '#1e3a2f'
  on-primary-container: '#86a496'
  inverse-primary: '#aecebe'
  secondary: '#186c42'
  on-secondary: '#ffffff'
  secondary-container: '#a4f4bf'
  on-secondary-container: '#217248'
  tertiary: '#2e1c00'
  on-tertiary: '#ffffff'
  tertiary-container: '#4a2f00'
  on-tertiary-container: '#cc9239'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#caeada'
  primary-fixed-dim: '#aecebe'
  on-primary-fixed: '#032017'
  on-primary-fixed-variant: '#304c41'
  secondary-fixed: '#a4f4bf'
  secondary-fixed-dim: '#88d7a5'
  on-secondary-fixed: '#002110'
  on-secondary-fixed-variant: '#00522f'
  tertiary-fixed: '#ffddb2'
  tertiary-fixed-dim: '#fabb5d'
  on-tertiary-fixed: '#291800'
  on-tertiary-fixed-variant: '#624000'
  background: '#fef9ef'
  on-background: '#1d1c16'
  surface-variant: '#e6e2d9'
typography:
  headline-xl:
    fontFamily: Playfair Display
    fontSize: 38px
    fontWeight: '600'
    lineHeight: 44px
    letterSpacing: -0.02em
  headline-xl-mobile:
    fontFamily: Playfair Display
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 34px
    letterSpacing: -0.01em
  headline-lg:
    fontFamily: Playfair Display
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 34px
    letterSpacing: -0.015em
  headline-lg-mobile:
    fontFamily: Playfair Display
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Playfair Display
    fontSize: 20px
    fontWeight: '500'
    lineHeight: 26px
  headline-sm:
    fontFamily: Playfair Display
    fontSize: 16px
    fontWeight: '500'
    lineHeight: 22px
  title-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: -0.005em
  body-lg:
    fontFamily: Inter
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 18px
  label-md:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.06em
  label-sm:
    fontFamily: Inter
    fontSize: 10px
    fontWeight: '600'
    lineHeight: 12px
    letterSpacing: 0.08em
  code-sm:
    fontFamily: JetBrains Mono
    fontSize: 11px
    fontWeight: '400'
    lineHeight: 16px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-desktop: 1.5rem
  margin: 1rem
  margin-desktop: 2rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.75rem
  space-lg: 1.25rem
  space-xl: 2rem
---

## Brand & Style

This design system drives **fieldnote.**, an operational review console tailored for high-stakes event coordination, specifically dialed for the multi-venue Bhopal January 2027 summit operations.

### Personality & Emotional Response
The aesthetic merges the archival precision of a botanical or geological field journal with the exacting performance of an air-traffic command console. It balances stillness, deliberate authority, and absolute legibility. Interactions should evoke composure under operational pressure: no visual screaming, no gratuitous glow or motion, and zero ambiguity regarding data freshness or telemetry states.

### Design Movement: Restrained Editorial Utility
The interface synthesizes classical literary typography with architectural, high-density dashboard layouts:
- **Quiet Foundations:** Deep forest green navigational architecture anchors the left, grounding the field operative in a persistent control frame.
- **Paper & Ink Tactility:** The main work surface relies on warm, fibrous off-whites (`#FBFBFA`, `#F5F4F0`) and calibrated warm-gray hairline boundaries rather than clinical stark whites or cold synthetic slates.
- **Typographic Dialectic:** High-contrast, stately serifs designate venues, workspace contexts, and dossier titles; ultra-precise, compact sans-serif typography enforces mechanical clarity across micro-data, logs, and telemetry badges.
- **Unflinching State Integrity:** Empty states, disconnected webhooks, and unconfigured radio relays are surfaced with explicit, honest notation rather than hidden behind generic placeholders.

## Colors

The palette is tuned around deep botanical reserves, archival paper stocks, and muted status signals designed to resist cognitive fatigue over extended field shifts.

### Core Architecture
- **Primary Canvas & Sidebar Chrome (`#152A20`, `#1E3A2F`):** Deep spruce and forest greens reserved for the persistent left rail, modal caps, and critical command buttons.
- **Work Surface (`#FBFBFA` Base Canvas, `#F5F4F0` Surface Raised):** Warm bone-tinted parchment tones that insulate operatives from harsh monitor glare during prolonged log reviews.
- **Structural Hairstyle Grays (`#EBE8E1` Border Base, `#E2DFD7` Border Strong, `#8F8C84` Neutral Ink):** Low-contrast dividers echoing linen threads and ruling lines in an archival ledger.

### Status Tonal Matrices
Status tokens always pair a desaturated pastel container ground with a high-contrast pigment foreground:
- **Operational Mint (Active / Resolved):** Background `#D8EEDF`, Text/Border `#2E7D52`. Indicates live connections, synced dispatch queues, and cleared safety checklists.
- **Archival Amber (Pending / Warning):** Background `#F4E7C5`, Text/Border `#976508`. Marks delayed transport manifests, unacknowledged audio feeds, or network jitter.
- **Signal Rose (Urgent / Critical Outage):** Background `#FBE3DE`, Text/Border `#B83A2C`. Exclusively deployed for blocked medical access, power grid drops, or unassigned emergency escalations.

## Typography

The typographic hierarchy establishes clear contextual division:
- **The Editorial Serif (`Playfair Display`):** Reserved for the canonical identity wordmark (`fieldnote.`), workspace titles (`Bhopal · January 2027`), stage names, and lead narrative summaries. It conveys curatorial prestige.
- **The Utilitarian Sans (`Inter`):** Applied systematically to all data displays, interactive inputs, drawer telemetry, and operational timestamps. Tabular numerals (`font-variant-numeric: tabular-nums`) are mandatory for table cells, time stamps, and counters to guarantee vertical alignment.
- **Micro Section Notation:** Category headers, breadcrumb markers, and drawer section dividers are styled with `label-md` or `label-sm`: strict uppercase treatment with tracked letter spacing (`0.06em` to `0.08em`) to act as architectural framing.

## Layout & Spacing

### Master Architecture
- **Sidebar (Fixed):** 240px wide on desktop, styled in `#152A20`. Collapses into an icon-only dock (64px) at screen widths under 1200px. Features top tenant branding, intermediate event switchers, and a pinned bottom tray displaying active relay sync status.
- **Top Command Bar (Sticky):** 52px height, pinned to the top of the content viewport. Floats over `#FBFBFA` with a subtle hairline base border (`#EBE8E1`). Contains live connectivity status indicators, quick command filters, and user session profiles.
- **Primary Content Viewport:** Fluid grid container bounded to a maximum width of `1680px` to maintain line-length integrity. Incorporates 12 standard columns with dynamic gutters (`1.5rem` on desktop, `1rem` on compact displays).
- **Inspection Detail Drawer (Slide-Over):** Anchored to the right margin, taking 420px (or 520px for multi-tab message logs). Slides over the canvas with an overlay scrim or docks adjacently on wide monitors (`> 1600px`).

### Spacing Philosophy
Rhythm is ruled by 4px baseline increments. Micro-spacing within interactive cells and list items is kept compact (`space-xs` to `space-sm`), while negative space around section headings and container cards expands (`space-lg` to `space-xl`) to preserve the feeling of an editorial broadsheet.

## Elevation & Depth

This system intentionally rejects ambient blur dropshadows and luminous multi-colored halos in favor of **structural lineation and tactile tonal shifts**.

### 1. Hairline Layering
Depth is produced primarily through border demarcations rather than shadows. Card structures use `1px solid #EBE8E1` upon the `#FBFBFA` canvas. Raised states (hovered table rows, active accordion segments) switch their background fill to `#F5F4F0` and reinforce borders to `#E2DFD7`.

### 2. Tonal Inset Surfaces
Deeply embedded elements—such as payload inspectors, code logs, and filter badge wells—use sunken tonal grounds (`#EFECE5` or `#122219` within dark contexts) with an inset micro-shadow:
`box-shadow: inset 0 1px 2px rgba(21, 42, 32, 0.05)`.

### 3. Drawer & Modal Floating States
Floating overlays (such as the right-side message detail drawer and dropdown popovers) employ an architectural, low-diffusion shadow tinted with deep forest tone rather than synthetic black:
`box-shadow: -8px 0 24px -4px rgba(21, 42, 32, 0.08), -2px 0 6px -1px rgba(21, 42, 32, 0.04)`.

## Shapes

The geometric signature is controlled and restrained:
- **Base Geometry:** Standard components (cards, text fields, menu containers, table row highlights) feature uniform **6px corners** (`roundedness: 1`, with custom boundary at 6px). This prevents the UI from appearing aggressively sharp or toy-like.
- **Pill Badges:** Dynamic status chips, attendee count markers, and telemetry tags retain a full capsule radius (`9999px`), contrasting against the precise architectural rectangles of the data grid.
- **Dividers & Connectors:** Horizontal rules and tree lines in the log viewer must render at `1px` stroke, crisp and un-aliased.

## Components

### Wordmark & Workspace Lockup
- **Wordmark:** Lowercase `fieldnote.` set in italicized editorial serif (`Playfair Display`, weight 600, color `#FBFBFA`), followed by a small mint terminal dot (`#D8EEDF`).
- **Context Badge:** Pinned beneath the mark: an uppercase tag (`Bhopal · January 2027`) set in `label-sm` with a translucent dark-mint backdrop (`rgba(216, 238, 223, 0.12)`).

### Buttons
- **Primary:** Background `#1E3A2F`, text `#FBFBFA`, hairline border `1px solid #152A20`. On hover, color transitions to `#2E7D52`.
- **Secondary / Ghost:** Background transparent, text `#1E3A2F`, border `1px solid #E2DFD7`. On hover, surface changes to `#F5F4F0`.
- **Destructive:** Background `#FBE3DE`, text `#B83A2C`, border `1px solid rgba(184, 58, 44, 0.2)`.

### Badges & Telemetry Chips
Compact height (20px), padding `0 8px`, typography `label-sm`.
- **Operational:** Mint background (`#D8EEDF`), forest green label (`#2E7D52`), micro green dot indicator (`4px`).
- **Warning / Review:** Honey background (`#F4E7C5`), dark amber label (`#976508`).
- **Critical:** Rose background (`#FBE3DE`), red label (`#B83A2C`).
- **Disconnected / Null:** Ash gray background (`#EBE8E1`), muted ink label (`#8F8C84`).

### Data Tables
- Header row features an uppercase `label-md` baseline with bottom border `1px solid #E2DFD7`, background `#F5F4F0`.
- Cells are padded with `space-sm` vertically and `space-md` horizontally, utilizing tabular figures for dates, venue capacity, and communication channel latency.
- Row hover triggers an immediate switch to `#F5F4F0` and provides a 2px left-accent border in `#1E3A2F`.

### Message Inspection Drawer
- Slides in from the right edge with a width of 440px. Header carries the incident ID in `code-sm`, the incident title in `headline-sm`, and an immediate status capsule.
- Tabulated sub-sections (Audit Log, Raw Payload, Assigned Team) separated by uppercase tags with line-clamp previews.

### Honest Empty & Unconfigured States
- Displays must never show empty blank white blocks. Unlinked integrations (e.g., VHF Radio Relay, WhatsApp Gateways) must feature dashed perimeter boxes (`1px dashed #E2DFD7`), an unconfigured notice in `body-sm`, and a primary secondary micro-action to establish connection.