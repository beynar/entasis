# Build an interface with entasis

The order below is the order of the work: set the app up once, find the components, compose
them, wire state and forms, then adjust the theme. Read the Markdown page of every component you
use (`node_modules/entasis/docs/components/<name>.md`) before you write its props.

## 1. Set up

Skip this when the app already has the plugin and a `<Theme>`.

The Tailwind plugin generates the palette and the engine utilities. The `@source` line lets
Tailwind see the classes used inside the packaged components. Declare one `@plugin` block per
theme; the `default: true` one also bootstraps the engine.

```css
/* app.css */
@import 'tailwindcss';
@source '../node_modules/entasis/dist';

@plugin 'entasis/tailwind-plugin/theme' {
	name: light;
	default: true;
	colorscheme: light;
	surface: #fafafa;
	neutral: #18181b;
	primary: #5f62ef;
	secondary: #e4e4e7;
	danger: #dc2626;
	success: #15803d;
	warning: #f59e0b;
	info: #2563eb;
}
@plugin 'entasis/tailwind-plugin/theme' {
	name: dark;
	colorscheme: dark;
	surface: #09090b;
	surface-floating: #27272a;
	neutral: #fafafa;
	primary: #5f62ef;
	secondary: #27272a;
	danger: #dc2626;
	success: #15803d;
	warning: #f59e0b;
	info: #2563eb;
}
```

Wrap the app once, in the root layout. `<Theme>` applies `html[data-theme="<name>"]`, follows the
system preference, persists the choice, and hosts the shared overlays (toasts, `confirmation()`,
`ask()`).

```svelte
<!-- src/routes/+layout.svelte -->
<script>
	import { Theme } from 'entasis/theme';

	let { children } = $props();
</script>

<Theme>{@render children()}</Theme>
```

Everything else about the plugin (every option, the generated tokens, dark mode) is in
[theming.md](theming.md).

## 2. Find the components

1. Name each piece of the interface by what it does: "a table people can sort and filter", "a
   confirmation before delete", "a date range".
2. Look each one up in [components.md](components.md) (or `docs/llms.txt` in the package). Prefer
   the most specific component: `DataTable` over `Table` plus your own sorting, `DateInput` over a
   text field with a pattern, `confirmation()` over a hand-made Dialog.
3. Read that component's page. Its _Props_ section is the contract; its examples are checked
   against the package on every release.

Families worth knowing before you start: Stack and Grid lay out; AppShell, Sidebar and PageShell
frame an application; Card groups content; Form and Field own every value a person types; Dialog,
Popover, Menu and PopupMenu are the overlays; `toast`, `confirmation()` and `ask()` are called
from code, not placed in markup.

## 3. Compose

Components take data, not children trees: a Select takes `items`, Tabs take `items`, a Menu takes
`items`, a Form takes `inputs`. Parts you want to replace are snippets, usually `prefix` /
`suffix` (an icon) or a named part such as Card's `title`, `description` and `footer`.

```svelte
<script>
	import { Button } from 'entasis/button';
	import { plusIcon } from 'entasis/icons/plus';
</script>

<Button color="primary">
	{#snippet prefix()}{@render plusIcon()}{/snippet}
	Add item
</Button>
```

`Slot` (`entasis/slot`) renders a string, a number, a snippet or a component the same way, for
props that accept any of them: `<Slot render={content} />`.

Lay out with Stack (one axis) and Grid (two). Their `gap` and `padding` take semantic steps
(`none | xs | sm | md | lg | xl`), and their responsive props measure the container, not the
viewport:

```svelte
<script>
	import { Card } from 'entasis/card';
	import { Stack } from 'entasis/stack';
</script>

<Stack gap="lg">
	<Card density="comfortable">
		{#snippet title()}Billing{/snippet}
		{#snippet description()}Your plan renews on the first of the month.{/snippet}
		{#snippet children()}
			<Stack orientation={{ md: 'horizontal' }} gap="md">
				<span>Plan: Team</span>
				<span>Seats: 12</span>
			</Stack>
		{/snippet}
	</Card>
</Stack>
```

Card `density` spaces the card's own header, content and footer. It does not space what you put
inside the content: use a Stack or Grid with a `gap` there.

## 4. State and callbacks

The same word means the same thing on every component, and a build check holds the package to it:

- `value` always ships with `defaultValue` and `onValueChange`; `open` with `defaultOpen` and
  `onOpenChange`. Bind one, or drive it with the pair. Rating, Meter, ProgressCircle and QRCode
  show a value they never edit.
- Give bound state a starting value (`$state('')`, `$state(false)`), not `$state()`: a component
  writes its default into a bound value left `undefined`, and on the server that write renders the
  parent twice.
- `onOpenChange(open, details)` runs before the state changes. `details` (`OpenChangeDetails` from
  `entasis/types`) carries `reason` (`'trigger-press'`, `'outside-press'`, `'escape-key'`,
  `'item-press'`, …), `event`, `trigger` and `cancel()`. Every other change callback takes one
  payload object.
- `onAfterOpen` / `onAfterClose` fire once per open and close, also when no animation plays.
- `bind:api` on Tabs, Stepper, DataTable, Tree, AIChat and AIConversation gives the instance
  handle (`TabsApi`, `DataTableApi`, …), published in the browser only: read it in handlers and
  effects. Popover and Dialog snippets receive the narrow `PopoverApi` / `DialogApi`.
- Style states with the data attributes overlays and lists write (`data-open`, `data-closed`,
  `data-highlighted`, `data-selected`, `data-disabled`, `data-side`, …) and Tailwind's `data-*`
  variants, never by reading component state into classes.

## 5. Forms

Describe the fields as data. Form renders them, validates them with messages from the i18n
catalog, and calls `onSubmit` with the validated value:

```svelte
<script lang="ts">
	import { Form } from 'entasis/form';
	import { toast } from 'entasis/toast';

	let { saveProfile }: { saveProfile: (value: { name: string; email: string }) => Promise<void> } =
		$props();

	const inputs = {
		name: { type: 'text', label: 'Name', required: true },
		email: { type: 'email', label: 'Email', required: true }
	} as const;
</script>

<Form
	title="Profile"
	description="Shown to your teammates."
	variant="card"
	{inputs}
	actions={[{ children: 'Save', color: 'primary', onAction: (form) => form.submit() }]}
	onSubmit={async (value) => {
		await saveProfile(value);
		toast.success({ title: 'Profile saved' });
	}}
/>
```

- Groups (`type: 'group'`) arrange fields in sections and columns; `visible` hides an entry and
  keeps its value aside; `errors` shows server errors (a SvelteKit `ActionData`) under their
  fields.
- A custom control Form must own is `{ type: 'field', fieldType: 'text', label, snippet }`: the
  snippet receives the `FieldState` and spreads `field.controlAttrs` and
  `{@attach field.control}` on the control. `type: 'custom'` only displays something.
- An input type the app reuses is registered once with `registerFormInputs` and typed by
  augmenting `FormInputRegistry` (`entasis/form`); entries then use it by name, in Form and in
  `ask()`.
- Outside a Form, a custom control composes `Field` and `createFieldState` (`entasis/field`).
- For a plain `<form>` posting to a SvelteKit action, use the controls directly: each submits its
  `name` through hidden inputs.
- A field that is disabled (directly or through its group or Form) is not validated and not
  submitted. `readOnly` keeps it focusable and submitted.

Ask for a decision or a few values from code, without placing a component:

```typescript
import { confirmation } from 'entasis/confirmation';

declare function deleteItem(): Promise<void>;

const { confirmed } = await confirmation({
	title: 'Delete item?',
	description: 'This cannot be undone.',
	confirm: 'Delete',
	cancel: 'Cancel',
	onConfirm: async () => {
		await deleteItem();
	}
});
```

```typescript
import { toast } from 'entasis/toast';

declare function upload(): Promise<void>;

const pending = toast.info({ title: 'Uploading…', loading: true, duration: false });
await upload();
pending.remove();
toast.success({ title: 'Done' });
```

`ask()` (`entasis/ask`) opens a dialog with Form `inputs` and resolves with the validated value.

## 6. Accessibility

The component writes ARIA from what you mean. Never pass an `aria-*` attribute to an entasis
component, and never set `aria-haspopup` / `aria-expanded` / `aria-controls` on a trigger by hand:
the overlay wires the trigger it owns.

| You pass                                             | The component renders                              |
| ---------------------------------------------------- | -------------------------------------------------- |
| `<Button pressed={bold} />`                          | `aria-pressed`                                     |
| `<Button expanded={open} haspopup="menu" />`         | `aria-expanded`, `aria-haspopup`                   |
| `<Chip selected={filter === group} />`               | `aria-pressed`, or `aria-current` on a link chip   |
| `<Tabbar label="Sections" orientation="vertical" />` | `role="tablist"`, `aria-label`, `aria-orientation` |
| `<PageShell label="Invoice detail" />`               | `aria-label` on the `<main>` landmark              |

An accessible name is always `label`. An icon-only Button still takes `label`, which it speaks
instead of painting. Leave `label` out where the component has a default from the i18n catalog.

## 7. Theme

- Runtime tokens go on the one `<Theme>`, keyed by theme name: `radius`, `spacing`, `typeScale`,
  `elevation`, `motion`, `defaultColor` and the state colors. The list and their values are in
  [theming.md](theming.md#design-tokens).

```svelte
<script lang="ts">
	import { Theme, type ThemeDesignTokenMap } from 'entasis/theme';

	let { children } = $props();
	const designTokens: ThemeDesignTokenMap = {
		light: { radius: 'large', defaultColor: 'primary' },
		dark: { radius: 'large', defaultColor: 'primary' }
	};
</script>

<Theme {designTokens}>{@render children()}</Theme>
```

- To restyle a part, find it in `theme-parts/<name>.md` at the root of this skill, then override
  it on one instance with the `theme` prop, or for the whole app with `set<Name>Theme()` (in a
  layout) or `<Theme components>`. Overrides are appended to the defaults, so a plain Tailwind
  class wins; `override: true` drops the defaults.

```svelte
<script>
	import { Button, setButtonTheme } from 'entasis/button';

	setButtonTheme({ root: { variant: { solid: 'shadow-md' } } });
</script>

<Button theme={{ root: { base: 'tracking-wide' } }}>Custom</Button>
```

- Use the generated tokens in your own markup: `bg-surface`, `bg-surface-raised`,
  `text-neutral`, `text-primary-readable`, `border-neutral-muted`, `rounded-md`, `h-control-md`.
  Surfaces climb `surface-recessed`, `surface-canvas`, `surface`, `surface-raised`,
  `surface-floating`; hover and press use the `state-layer` utility.

## 8. Next

Make the interface agent-ready ([agent-ready.md](agent-ready.md)), test it
([testing.md](testing.md)), then go through _When you're done_ in [SKILL.md](../SKILL.md).
