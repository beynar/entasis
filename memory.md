# Albert procedural memory

- For a simplification review, derive a replacement model from required behavior before treating
  existing owners as fixed. Compare local cleanup with structural redesign, trace concrete
  cross-cutting scenarios through each, and budget the complete replacement, including new
  adapters. Do not infer a ceiling on LOC reduction from cleanup opportunities alone.
- Before promising behavior parity in a redesign plan, trace each public hook through its
  callers, not just its helper contract. Separate reusable pure work from observable callback
  execution, error translation, generation checks, and DOM-dependent observations. Verify
  proposed invariants against source and explicit trace witnesses; label stronger guarantees
  as corrections or hypotheses rather than existing behavior.
- For a dependency migration, compare the installed package with the published release, not
  unreleased website examples. Replace both the gesture layer and its semantic state contract;
  test repeated interactions, cancellation, reset, and hover across the integration boundary.
- Keep third-party mounts and updates outside implicit Svelte tracking. Track the accepted
  options explicitly, and verify host identity across interactions so state changes do not
  remount controls or interrupt their gestures and transitions.
- When replacing rendering primitives, preserve geometry ownership until native visibility
  filtering has run, then remove decorative interaction metadata. Test hiding one group and
  all groups, including its annotations and derived layers, without changing inferred axes.

- After changing a generator or generated-file migration, run generation twice and then run its drift check. A first successful write does not prove that the transformation is idempotent.
- Before formatting existing documentation, inspect the formatter diff. A file that fails the
  current formatter may contain intentional legacy formatting; do not rewrite unrelated sections.
- Do not report a delegated implementation as complete when agents are only running. Integrate
  their changes and run the repository-wide acceptance checks before giving a completion report.
- For a component-library showcase, assess the code needed by the consumer as well as the
  rendered result. Prefer component defaults and layout props, remove unused sample code and
  styling, and verify the same composition at desktop and mobile widths.
- Rendering and overflow checks do not establish good spacing. For layout regressions, measure
  the visible distance between content groups and inspect every requested example at desktop
  and mobile widths. Verify that gaps belong to the actual parent of those groups; a component's
  outer gap may only separate slots and leave the slot's children touching. A Field
  `fieldset > legend` does not take grid `gap` (`legendToContainer` stays 0 even when
  `float` is set — grid items ignore float). Measure legend bottom to the input container,
  not option title to description. Density-matched `[&>legend]:mb-*` on the Field root is
  the owner. `p-0` does not override Dialog `px-xl py-md` through cnfast; Command must
  set `!px-0 !py-0` and must not paint `bg-surface` on a `bg-surface-floating` dialog.
  A white Command dialog with a pale selected row is the MenuOption `state-layer`
  (`::before` at `--state-hover-opacity` 0.05), not a leftover panel fill. Measure the
  highlighted option's `background-color` and `::before` opacity. Command owns a solid
  `bg-color` / `text-color-contrast` item recipe so the row is not a grey stain.
- A successful package command can still omit declaration files. Inspect declaration warnings
  and compile a consumer installed from the actual tarball before reporting a package as
  validated. Import resolution and syntax parsing alone do not prove component prop contracts.
- Component CVA files must use semantic spacing tokens (`p-micro`, `px-md`, `h-control-*`).
  Numeric utilities such as `p-0.5` fail `check:semantic-theme-tokens`.
- When validating a showcase during concurrent library edits, use an isolated source snapshot
  and a separate Vite cache. Check computed styles and representative interactions as well as
  rendering; emitted attributes and successful hydration do not prove that visual props or
  form actions work.
- When consolidating controlled state, test an actual edit followed by a parent prop spread and
  changed defaults. Mount-only tests miss lost uncontrolled state. Check that parent updates stay
  silent and each accepted local transition invokes its callback once.
- Verify public controller names and snippet signatures against their exported types before
  writing migration instructions. Similar concepts in neighboring controls can use different
  contracts; names inferred from memory are not evidence.
- Keep commands that write SvelteKit generated state sequential within one checkout. Concurrent
  sync, check, package, or build processes can give server and client different version IDs and
  break hydration despite a successful build. Use an isolated source copy for release validation
  when another task needs the shared checkout, and verify browser hydration before reporting it.
- A docs-app navigation crash that logs `Failed to fetch dynamically imported module:
.svelte-kit/generated/client/nodes/*.js` after `optimized dependencies changed. reloading` is
  a missing `optimizeDeps.include` entry, not a Svelte runtime bug. Search the Vite log for
  `dependency optimized:` to find the subpath. Prefer loading heavy optional libraries from a
  CDN at runtime (MapLibre, intl-tel-input) so they never enter the module graph. `state_referenced_locally` warnings
  are a separate compiler issue: wrap the capture in `$derived` or a getter, do not treat them
  as the crash cause.
