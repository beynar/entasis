# Svelai project guide

Svelai is one Svelte 5 package with public subpath exports. Components live under
`src/lib/components`; the documentation application lives under `src/routes`.

## Public contract

`tooling/component-contract/manifest.ts` is the public-surface source of truth. Run
`npm run generate:component-contract` after adding, removing, moving, or documenting a public
entrypoint. Do not hand-edit generated navigation, MCP registry, component inventory, package
exports, or generated skill inventories. Verify them with `npm run check:component-contract`.
The same manifest generates the source aliases used by SvelteKit and Vite; keep those aliases
out of hand-written configuration. Manifest symbols include non-component modules and icons.

Public examples and Blocks import `svelai/<subpath>`, never source files. Icons are Svelte snippets
imported from `svelai/icons/<name>`. The local documentation build resolves those public imports to
source; the package-consumer check resolves them through the built package.

Component and utility Usage cards bind a `createComponentControls` menu on the first
`ComponentCard` after `DocPage`. Cover that component's public visual variant props
(`size`, `density`, `variant`, `color`, `labelPosition`, and similar chrome). Do not invent
props. Interpolate the live values into the Usage `code` string. AI component pages are
exempt until they get the same treatment.

## Component laws

- Semantic color props use the shared `Colors` roles.
- Component geometry uses `size: 'small' | 'normal' | 'large'`.
- Control height uses `h-control-sm/md/lg` (28 / 32 / 36). Button, ToggleButton, Pagination, and form field containers share that scale and `rounded-md`. Chip, Switch, and Avatar stay `rounded-full` on their own scales.
- Internal whitespace uses `density: 'small' | 'normal' | 'large'`.
- Editable state uses `value`, `defaultValue`, and `onValueChange`.
- Disclosure state uses `open`, `defaultOpen`, and `onOpenChange`.
- Post-transition lifecycle uses `onAfterOpen` and `onAfterClose`.
- Native DOM handlers use lowercase Svelte 5 names and receive native events.
- Domain callbacks use explicit verbs and one object payload when several values are required.

Form is a programmatic state and validation component rendered with a `div`. Field and Form own
validation; custom controls compose their public controllers instead of creating another
validation path.
Value-bearing Form entries use `type: 'field'`, `fieldType`, and a `snippet` receiving `FieldState`.
`type: 'custom'` remains display-only. Use `field.setValue` for accepted control edits; parent
updates remain silent. Defaults initialize state once and must survive parent prop spreads.

## Theme ownership

Component CVA definitions live in `<owner>.theme.ts`. Consumer-specific theme presets use
`<consumer>.<role>.theme.ts`, geometry maps use `<owner>.geometry.ts`, and third-party adapters use
explicit names such as `<owner>.lexicalTheme.ts`. Generated interfaces use semantic spacing
tokens; `micro`, `layout-*`, and arbitrary spacing are internal implementation vocabulary.

Documentation fonts are declared in `vite.config.ts`. Keep font auto-detection disabled: its
full source scan on each hot update stalls large batches of component edits.
Do not run `svelte-kit sync` (including `check` and `prepack`) during a Vite build in the same
checkout. Both use `.svelte-kit/generated`; concurrent writes can mismatch server and client
bootstrap versions. Use an isolated source copy when another task needs the shared checkout.
Heavy optional libraries reached from the docs layout (MapLibre, intl-tel-input) load from a
CDN at runtime and must not be bundled. Dynamic package subpaths that remain in the module
graph must stay in `vite.config.ts` `optimizeDeps.include`, or Vite re-optimizes mid-navigation
and SvelteKit's `.svelte-kit/generated/client/nodes` imports fail.

## Blocks

The Blocks catalog lives in `src/routes/blocks/catalog`. Its marketing, application, and
commerce/content metadata shards describe standalone Svelte files and their visual references.
`src/routes/blocks/catalog.ts` combines those shards for browsing and navigation. Each block must
render without required props and use public package imports so its source can be copied into a
consumer project. The package-consumer check includes every catalog component.

Use Svelai component defaults, semantic props, and Stack/Grid composition before custom classes
or theme overrides. Keep custom styling for necessary responsive structure and media. The goal is
a polished interface with little consumer customization.

Card density spaces its header, content, and footer slots. It does not arrange arbitrary children
inside the content slot. Compose multiple content groups with Stack/Grid and an explicit semantic
gap; adding gap classes to the Card root does not space those children.

Category and individual block pages use `/blocks/[category]` and `/blocks/[category]/[block]`.
Isolated previews use `/previews/blocks/[category]/[block]`, giving responsive controls a real
viewport and keeping overlays inside their example. Thumbnails load as they enter the viewport.
The ten original workflow routes remain separate from the category catalog.

## Chart integration

Chart keeps TanStack behind its public Svelai props. Its viewport state owns the accepted zoom
window; TanStack owns brush gestures, scale inversion, animation, and tooltip hit-testing.
Continuous zoom sets the native axis `viewport` and the brush scale domain to the same window:
the viewport excludes off-window points, while the scale drives native brush inversion.
Category zoom slices the scale domain. The published
native brush supports x only. Hover is forwarded through the native interaction controller;
point click/keyboard activation and tooltip pinning stay disabled.

Chart delegates hexbin aggregation, histogram bins, rolling windows, normalized stacks, and
regression fits to TanStack. Local prediction intervals expand the native Student-t fitted-mean
bounds. Legend visibility stays in ChartState; native legends own buttons, layout, and filtering
after domain inference. Mark-owned decorative layers retain point ownership until that filtering
finishes, then native `decorative` removes interaction. Numeric legends stay static. Interactive
legends cover compatible Cartesian series; they do not recompute stack totals or facet layouts.
Legend placement is top/bottom, alignment is left/center/right, and categorical entry orientation
is horizontal/vertical. Numeric color ramps remain horizontal. Native layout reserves legend height.

## Checks

- `npm run check`
- `npm run lint`
- `npm run test:unit -- --run`
- `npm run test:e2e`
- `npm run build`
- `npm run check:component-contract`
- `npm run check:semantic-theme-tokens`
- `npm run check:public-api-contract`
- `npm run check:package-consumer`
- `npm run check:packed-library`
- `npm run test:contracts`

The packed-library check installs an actual tarball in a temporary consumer with no source
aliases. It checks export targets, all manifest symbols, native event/attribute typing, Field
composition, the license, and the Tailwind entrypoint. Run `svelte-package` first. Tailwind 4 is
an optional peer for consumers using the Tailwind plugins. Contract CI runs on Node 24.
