# FinCredit — editorial research workspace

## Direction

An ivory and forest-green research workspace replaces the dark navy interface. The design aims for the clarity of a financial publication: confident typography, quiet surfaces, compact data and explicit evidence. The public home page introduces the product through a typographic research-note illustration rather than a fabricated chart or performance metric.

## Foundations

| Element | Specification |
| --- | --- |
| Canvas | Warm ivory `#f4f3ee` |
| Panels | White, thin `#dedfd6` borders, 9px corners |
| Primary text | Charcoal green `#202c29` |
| Primary actions | Forest `#245544` with white text |
| Secondary text | Muted olive; darker shades for financial content |
| Typography | Existing Inter/Geist; Georgia italic used sparingly for editorial emphasis |
| Tables | Tabular numerals, compact uppercase labels, quiet row separators |
| States | Green for supported/completed, amber for limitations, red for failure/loss |
| Motion | Minimal; loading indicators respect reduced-motion preference |

## Screen changes

- New public home: editorial headline, original CSS research illustration, linked workflow explanation, sign-in and account creation.
- New overview: committee entry point, actual saved-record counts, task shortcuts, recent personal reviews and the shared report library. Loading, empty and partial failure states are distinct. Development reset is retained in an expandable section.
- New shell: compact sidebar, active route markers, route breadcrumb, ticker search, profile access, sign-out, skip link and full mobile navigation with Escape/backdrop dismissal.
- Committee: light evidence panels, olive history selection, opposing neutral debate surfaces, calmer composer and status treatments, readable source snapshot and scenario tables.
- Portfolio, watchlist, Ask, stock/company research, reports, governance, admin, profile and settings: migrated source classes plus shared component styling align panels, forms, buttons, badges and tables. Existing handlers and endpoints remain in place.
- Charts: light grid/tooltip surfaces, readable labels and subdued green/olive/red data colors. Values remain sourced from the existing APIs.
- Authentication: matching light surfaces, visible label associations, autocomplete, required inputs and explicit demo-credential filling. Login starts empty. Relative return paths are checked before navigation.

## Implementation

`frontend/app/editorial.css` defines the design layer and responsive rules. Layout imports it after the base styles. Existing component primitives remain available. No new runtime dependency or paid template is introduced. No backend or model changes are included.

## Verification

Production Next.js build, TypeScript checking and static generation passed. Source review covered dark backgrounds, tooltip colors, primary button contrast and form labels. Browser visual verification is incomplete: the managed preview service supplies `--host`/`--strictPort` flags that this Next.js dev command does not accept. No alternative browser infrastructure was substituted. The included old screenshots are not evidence of the redesigned appearance.

Before approval, inspect home/login, populated and empty overview, committee tabs, portfolio dialogs and stock charts at desktop and mobile sizes. Exercise keyboard navigation, cancellation, sign-in and ticker search with a running backend. Full application acceptance remains separate from a successful build.
