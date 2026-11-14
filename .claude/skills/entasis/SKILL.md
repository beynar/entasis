---
name: building-with-entasis
description: Builds SvelteKit interfaces with the entasis component library, makes them usable by browser agents with <Theme webmcp>, and tests them. Covers choosing and composing its components, forms and validation, layout, theming with its Tailwind plugin and <Theme>, WebMCP tool props, and Vitest tests. Use whenever a project has entasis installed or the user mentions entasis.
---

# Build with entasis

entasis is a Svelte 5 component library for SvelteKit, built on configuration over markup: a
component takes data and semantic props (`color`, `size`, `density`, `variant`) and draws its own
structure, accessibility and states. One Tailwind CSS plugin generates the palette, and one
`<Theme>` at the root sets color roles, radius, spacing and motion for every component.

## Read first

The docs for the installed version ship in the package, as Markdown:

- `node_modules/entasis/docs/llms.txt` is the index: one line per component and entrypoint. Read
  it first, then only the pages your task needs, such as `docs/components/data-table.md`. Each
  page is the component's full reference (props, data model, theme parts, accessibility).
- This skill ships there too, in `node_modules/entasis/skills/entasis/`. When it differs from a
  copy elsewhere, the installed one matches the code you run.
- Don't read the compiled `dist/**/*.js`. The docs and the `.d.ts` types are the API; when they
  don't answer, write a small test that tries it.

Online, the same pages are at https://entasis.beynar.workers.dev/llms.txt and
`https://entasis.beynar.workers.dev/components/<name>.md` (latest release), and the MCP server at
https://entasis.beynar.workers.dev/mcp returns them from its `components` tool.

If entasis is not installed yet, install `entasis` and `tailwindcss` (v4) with the project's
package manager, then follow _Set up_ in [references/build-interface.md](references/build-interface.md#1-set-up).

## Pick your path

1. **Build an interface**, such as a settings page, a dashboard or a checkout form:
   [references/build-interface.md](references/build-interface.md).
2. **Make it agent-ready**, so an AI agent in the browser can use it through WebMCP:
   [references/agent-ready.md](references/agent-ready.md). Every interface goes through this
   step, even when WebMCP stays off: what makes it work for an agent (names, refusals, danger
   colors) is what makes it right for a person.
3. **Test it**: [references/testing.md](references/testing.md).

Every path ends with [When you're done](#when-youre-done).

## Rules for every task

- **Public imports only.** Import each component from its kebab-case subpath with its PascalCase
  name: `import { DataTable } from 'entasis/data-table'`. There is no root `entasis` import, and
  never import from `entasis/dist/...` or a source path. Icons are snippets from
  `entasis/icons/<name>`: `import { plusIcon } from 'entasis/icons/plus'`, rendered with
  `{@render plusIcon()}` or passed as a `prefix` / `suffix` snippet.
- **Use what ships before writing markup.** Look the need up in
  [references/components.md](references/components.md) first. A `<button>`, `<input>` or a `div`
  with `role="dialog"`, `"menu"`, `"listbox"`, `"tablist"` or `"switch"` next to an installed
  entasis is almost always a bug: it loses keyboard support, i18n, validation and agent tools.
- **Semantic props, not classes.**
  - `color` is a role, `'primary'`, `'secondary'`, `'success'`, `'warning'`, `'danger'`, `'info'`
    or `'neutral'`; left out, it follows the theme's `defaultColor`.
  - `size` is `'small'`, `'normal'` or `'large'`: geometry and type.
  - `density` is `'compact'`, `'normal'` or `'comfortable'`: inner spacing. The two vocabularies
    differ on purpose: never pass a `size` value to `density`, or `sm` / `md` / `lg` to either.
  - Buttons and similar controls take `variant`: `'solid'`, `'outline'`, `'soft'`, `'ghost'` or
    `'link'`.
- **State comes in threes.** Editable state is `value` / `defaultValue` / `onValueChange`;
  disclosure is `open` / `defaultOpen` / `onOpenChange(open, details)`, where
  `details.cancel()` keeps the component as it was. Bind one (`bind:value`, `bind:open`) or drive
  it with the pair, and give bound state a starting value: `$state('')`, `$state(false)`, never a
  bare `$state()`. Callbacks take one payload object and name the change, never `onChange` or
  `onClick`. Native DOM handlers are lowercase Svelte 5 names (`onclick`).
- **`label` names a component; never pass `aria-*`.** The component paints `label` where it has a
  visible label and speaks it where it has none (an icon-only Button). It writes `aria-pressed`,
  `aria-expanded`, `aria-controls` and the rest from semantic props (`pressed`, `selected`,
  `expanded`). Value controls take `readOnly` (never `readonly`).
- **Forms go through Form and Field.** Describe fields as data in `<Form inputs={...}>`; Form owns
  values, validation, submission and the error messages (from the i18n catalog, in every locale).
  A custom control inside a Form is an entry with `type: 'field'`, a `fieldType` and a `snippet`
  receiving the `FieldState`; outside a Form, wrap it in `Field` from `entasis/field`. A reusable
  input type is registered once with `registerFormInputs` and typed by augmenting
  `FormInputRegistry` from `entasis/form`. Never build a second validation path. Disabled fields
  are not submitted; use `readOnly` for a value that must still submit.
- **Lay out with Stack and Grid.** Space groups with their semantic `gap` (`none`, `xs`, `sm`,
  `md`, `lg`, `xl`), not margin classes. Card `density` spaces its header, content and footer
  only: stack several groups inside the content with a Stack.
- **Theme once, restyle through themes.** Wrap the app in one `<Theme>` (`entasis/theme`). Change
  a part with the component's `theme` prop, its `set<Name>Theme()` setter or
  `<Theme components>`, using the parts listed in `theme-parts/<name>.md`; use the generated
  tokens (`bg-surface-raised`, `text-primary-readable`, `rounded-md`, `h-control-md`), never
  arbitrary colors or a bigger radius than the theme's.
- **Key lists by identity**, never by index, in `{#each}` and in the items you pass.
- **Comments are rare.** Write one only when a reader would get the code wrong without it.

## When you're done

1. **Typecheck.** Run `npx svelte-kit sync` once, then
   `npx svelte-check --tsconfig ./tsconfig.json --threshold error`. Zero errors; a type error in a
   prop is an API misuse, not something to cast away.
2. **Test.** Write and run tests as [references/testing.md](references/testing.md) says
   (`npx vitest run <your files>`). Every interface gets at least the component tests for what you
   built and the agent test from [references/agent-ready.md](references/agent-ready.md#prove-it-with-a-test).
   If a test finds a bug in code you were only asked to test, mark it `test.fails` with a one-line
   reason, report it, and leave the suite green.
3. **Lint and format** with the project's own commands (`npx eslint <files>`,
   `npx prettier --check <files>`) when it has them.
4. **Read your diff once more**: no `aria-*` props, no deep imports, no hand-rolled controls, no
   index keys, no arbitrary color classes, no comment that restates the code.
5. **Report** each command you ran with its exit code, anything you could not check (such as a
   real browser for WebMCP or color contrast), and anything the docs or types got wrong or left
   out.

## Reference

- [references/components.md](references/components.md): every component and entrypoint, by
  category, with its import and its Markdown page (generated).
- [references/theming.md](references/theming.md): the Tailwind plugin, color tokens, design
  tokens, motion, responsive props, dark mode and theme overrides.
- [references/form-inputs.md](references/form-inputs.md), [references/display.md](references/display.md),
  [references/layout.md](references/layout.md), [references/overlays.md](references/overlays.md),
  [references/data-utility.md](references/data-utility.md): worked notes per component family.
- `theme-parts/<name>.md`: every themeable part of a component, the element it lands on, its
  variants and their exact classes (generated, one file per component, such as
  [theme-parts/button.md](theme-parts/button.md)).
