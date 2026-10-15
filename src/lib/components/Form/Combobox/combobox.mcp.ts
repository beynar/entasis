export const comboboxDescription = `
# Combobox Component

A searchable dropdown component that supports both static arrays and async option loading. Provides keyboard navigation, debounced search, and full ARIA accessibility. Use it when users need to search and select from a large list of options.

## Basic Usage

\`\`\`svelte
<script>
	import { Combobox } from 'entasis/combobox';
	let value = $state(null);
	const items = [
		{ value: 'us', label: 'United States', description: 'North America' },
		{ value: 'uk', label: 'United Kingdom', description: 'Europe' }
	];
</script>

<Combobox
	placeholder="Search countries..."
	items={items}
	bind:value={value}
/>
\`\`\`

## Props

### Core Props

- **items**: \`ComboboxItems | ((searchValue: string | undefined, request: { signal: AbortSignal }) => MaybePromise<ComboboxItems>)\` (required)
  - Array of options (and groups) or a function that returns them for the search text
  - \`ComboboxItems\` is \`(ComboboxOption | { label?: string; items: ComboboxOption[] })[]\`; flat options and groups can be mixed. \`ComboboxOption\` is \`{ value; label; description?; disabled?; data? }\`
  - For arrays: filtered client-side with a case- and accent-insensitive match on the label, in the active I18n locale ("eclair" finds "Éclair")
  - For functions: called (after a 100ms pause in typing) with the search text and \`{ signal }\`. The signal is aborted when a newer search replaces the request, and a response that is not the latest is ignored, so a slow answer never overwrites a newer list. The last results stay visible, marked busy, while the next request loads

- **value**: \`string | null\` (bindable)
  - Selected option value
- **defaultValue**: \`string | null\` (default: \`null\`)
  - Initial selected value when \`value\` is omitted

- **searchValue**: \`string\` (default: \`''\`, bindable)
  - Current search input value (a draft: it is never submitted by a native form)

- **open**: \`boolean\` (bindable) / **defaultOpen**: \`boolean\` (default: \`false\`)
  - Whether the options list is open. The list only renders while there is something to show (options, a loading or error message, or the "no options" message for the typed text)
  - **onOpenChange**: \`(open, details) => void\` runs before the list opens or closes. \`details\` carries \`reason\` (\`'input-change'\`, \`'escape-key'\`, \`'item-press'\`, \`'list-navigation'\`, \`'trigger-press'\`, \`'trigger-focus'\`, \`'focus-out'\`), \`event\`, \`interaction\` and \`cancel()\`; a cancelled change leaves the list as it was
  - **onAfterOpen** / **onAfterClose**: \`() => void\` fire once after the open or close transition

- **loading**: \`boolean\` (default: \`false\`, bindable)
  - Loading state (managed automatically for async options)

### Behavior Props

- **openOnFocus**: \`boolean\` (default: \`false\`)
  - Open the list when the input receives focus, even before typing: static arrays list every option, \`items\` functions are called with an empty search
- **showAllOnFocus**: \`boolean\` (deprecated alias of \`openOnFocus\`, kept for one minor)

- **filter**: \`(option, searchValue) => boolean\` - Custom match for static arrays (functions filter themselves)
- **limit**: \`number\` - Show at most this many matches; matching stops once the limit is reached, across groups

- **autoHighlight**: \`boolean | 'always'\` (default: \`'always'\`)
  - \`'always'\` keeps the first match (or the selected option while the text is empty) highlighted; \`true\` only while text is typed; \`false\` highlights nothing until an arrow key or the pointer moves it
- **loop**: \`'wrap' | 'input' | false\` (default: \`'wrap'\`) - Past either end of the list: continue at the other end, land on no highlight first (focus stays in the input), or stop
- **separators**: \`boolean\` (default: \`true\`) - Separators between consecutive groups
- **item**: \`Snippet<[ComboboxOption]>\` - Custom row renderer, replaces the title and description layout
- **readOnly**: \`boolean\` - The list opens and can be browsed, but the value cannot change: choosing does nothing, the clear button is hidden, the input is natively \`readonly\`. The value still submits

- **getValueOption**: \`(value: string) => MaybePromise<ComboboxOption | null | undefined>\`
  - Function to get option data for a value when not in loaded options
  - Useful for async options with pre-selected values

- **placeholder**: \`string\` (default: \`''\`)
  - Input placeholder text

- **loadingText**: \`string\` (default: \`'Loading...'\`)
  - Text displayed while loading options

- **noOptionsText**: \`string\` (default: \`'No options found'\`)
  - Text displayed when no options match

### Field Props

- **required**: \`boolean\` (default: \`false\`)
- **disabled**: \`boolean\`
- **size**: \`'small' | 'normal' | 'large'\` (default: \`'normal'\`)
- **density**: \`'compact' | 'normal' | 'comfortable'\` (default: \`'normal'\`) - Spacing density forwarded to the dropdown option rows (paddings, gaps, min-height)
- **name**: \`string\`
- **errors**: \`string[] | boolean\` (bindable)
- **focused**: \`boolean\` (bindable)
- **description**: \`string\`

### Event Props

- **onValueChange**: \`({ value, option }: { value: string | null; option: ComboboxOption | null }) => void\`
  - Called when selection changes
  - Receives a named payload with both the value and full option object

- **onHighlightChange**: \`({ value, reason, event }) => void\`
  - Called when the highlighted option changes. \`value\` is the option's value or \`undefined\`; \`reason\` is \`'keyboard'\`, \`'pointer'\` or \`'list'\` (results changed, or the list opened); \`event\` is the KeyboardEvent or pointer event, absent for \`'list'\`

- **onValidate**: \`(value: string) => string[] | boolean\`
  - Custom validation function

### Slot Props

- **prefix**: \`Snippet | false\` (default: magnifying glass icon)
  - Prefix content. Set to \`false\` to hide default icon

- **suffix**: \`Snippet\`
  - Suffix content (clear button shown automatically when value exists)

### Theme Props

- **theme**: \`ComboboxThemeProps\`
  - Customize styling for: input, inputContainer, loading, error, noOptions
  - Option rows are \`MenuOption\` components: style them globally with \`setMenuOptionTheme\` from \`entasis/menu-option\`

## Examples

### Array Options (Client-side Filtering)

\`\`\`svelte
<script>
	let value = $state(null);
	const countries = [
		{ value: 'us', label: 'United States' },
		{ value: 'uk', label: 'United Kingdom' }
	];
</script>

<Combobox
	items={countries}
	bind:value={value}
	placeholder="Search countries..."
/>
\`\`\`

### Async Options (API Call)

\`\`\`svelte
<script lang="ts">
	let value = $state(null);
	const getOptions = async (searchValue?: string) => {
		const response = await fetch(\`/api/search?q=\${searchValue}\`);
		return response.json();
	};
</script>

<Combobox
	items={getOptions}
	bind:value={value}
	placeholder="Search async..."
/>
\`\`\`

### Open on Focus

\`\`\`svelte
<Combobox
	items={countries}
	openOnFocus
	bind:value={value}
/>
\`\`\`

### Pre-selected Value with Async Options

\`\`\`svelte
<script lang="ts">
	import type { ComboboxOption } from 'entasis/combobox';
	let value = $state<string | null>('us');
	const getValueOption = async (value: string): Promise<ComboboxOption> => {
		return { value, label: 'United States' };
	};
	const getOptions = async (searchValue?: string): Promise<ComboboxOption[]> => {
		const response = await fetch(\`/api/countries?q=\${searchValue ?? ''}\`);
		return response.json();
	};
</script>

<Combobox
	items={getOptions}
	bind:value={value}
	getValueOption={getValueOption}
/>
\`\`\`

### Groups, Disabled Options and Custom Rows

\`\`\`svelte
<Combobox
	openOnFocus
	items={[
		{ label: 'Europe', items: [{ value: 'fr', label: 'France' }, { value: 'de', label: 'Germany' }] },
		{ label: 'Asia', items: [{ value: 'cn', label: 'China', disabled: true }] }
	]}
	bind:value={value}
>
	{#snippet item(option)}
		<span>{option.label}</span>
	{/snippet}
</Combobox>
\`\`\`

### Abortable Async Options

\`\`\`svelte
<script lang="ts">
	const getOptions = async (searchValue: string | undefined, { signal }: { signal: AbortSignal }) => {
		const response = await fetch(\`/api/countries?q=\${searchValue ?? ''}\`, { signal });
		return response.json();
	};
</script>

<Combobox items={getOptions} bind:value={value} />
\`\`\`

## State Management

- **value**: Bindable string (option value) or null
- **searchValue**: Bindable string for search input
- **loading**: Bindable boolean, automatically managed for async options
- **open**: Bindable boolean for the list
- **errors**: Bindable array or boolean for validation errors
- **focused**: Bindable boolean for focus state

## Styling hooks

The input, the field container, the list panel and every option carry state attributes. \`data-highlighted\` and \`data-selected\` are written as \`"true"\`; match them by presence.

Attributes are presence attributes (set while the state holds, omitted otherwise) unless they carry a value.

**Data attributes**
- \`data-popup-open\`: On the input and the field container around it: present while the list (or its empty, loading or error status) shows.
- \`data-popup-side\`: On the field container: the side of the field the list sits on.
- \`data-disabled\`: On the input: present while disabled. On an option: present while it is disabled.
- \`data-highlighted\`: On an option: present while the keyboard or the pointer highlights it.
- \`data-selected\`: On an option: present while it is the value.
- \`data-open\`: On the list panel: present while open.
- \`data-closed\`: On the list panel: present while its exit transition plays.
- \`data-entering\`: On the list panel: present while the enter transition plays.
- \`data-exiting\`: On the list panel: present while the exit transition plays.
- \`data-side\`: On the list panel: the side of the field it sits on after flipping.
- \`data-align\`: On the list panel: \`start\`, \`center\` or \`end\`.

**CSS variables** (set on the list panel's positioned wrapper and inherited by the list)
- \`--available-width\`: The width in px the panel can take before it reaches the viewport edges, minus 20px.
- \`--available-height\`: The room in px between the trigger and the viewport edge on the panel's side, minus 20px. Cap a scrolling list with \`max-height: min(240px, var(--available-height))\`.
- \`--anchor-width\`: The trigger's width in px, snapped to the device pixel grid.
- \`--anchor-height\`: The trigger's height in px, snapped to the device pixel grid.
- \`--transform-origin\`: The panel corner facing the trigger, mirrored in right-to-left documents; the point the panel scales from.

The typed maps \`comboboxDataAttributes\` and \`comboboxCssVariables\` (from \`entasis/combobox\`) list each name with its meaning.

## Accessibility

- Full ARIA combobox pattern implementation
- **role="combobox"** on input
- **role="listbox"** on options container
- **role="option"** on each option
- **aria-expanded**, **aria-controls**, **aria-activedescendant** for state
- **aria-autocomplete="list"** for search behavior
- Keyboard navigation: ArrowDown/ArrowUp open a closed list (with every option) and then move the highlight, Enter selects, Escape closes the list and keeps focus in the input (a second Escape clears the typed text), Home/End jump to the first/last option
- Clicking the already-focused input toggles the list; choosing an option, Clear and Escape all keep focus in the input
- The listbox owns only options and groups; the loading, error and "no options" messages sit beside it, and \`aria-expanded\` is true while options are listed
- One persistent visually hidden live region (\`role="status"\`) next to the input announces result counts ("3 results available"), the empty state, loading and errors after typing settles
- The highlight follows the selected option when the list opens and when the text is cleared

## Notes

- **Debouncing**: Search is debounced by 100ms to reduce API calls
- **Race Conditions**: Handled automatically - older requests are aborted and only the latest response updates state
- **Native forms**: The search box carries no \`name\`. A hidden input beside it submits the selected value under \`name\` (nothing when there is no name or the field is disabled); \`required\` blocks a native submit while nothing is selected
- **Closing**: Escape, choosing an option, or focus leaving the field closes the list; the rows stay on screen through the exit transition
- **Option Format**: Options must have \`value\` (string) and \`label\` (string). Optional \`description\` displays below label
- **Keyboard Navigation**: Wraps around by default - ArrowDown at bottom goes to top, ArrowUp at top goes to bottom (see \`loop\`)
- **Groups and disabled options**: Disabled options are dimmed and skipped by the keyboard; groups render like Select's (\`role="group"\` with a hidden label, presentational separators)
- **Empty States**: Shows loading text, error message, or no options text appropriately
- **Clear Button**: Automatically shown when value exists, uses the shared field action button hitbox
- **Default Prefix**: Magnifying glass icon shown by default unless \`prefix={false}\` or custom snippet provided
- **List height**: The option list scrolls beyond 200px, or beyond the room left between the field and the viewport edge (the Popover's \`--available-height\`), so it shrinks above an on-screen keyboard instead of running under it
- **Styling hooks**: While the list is open, the field it is anchored to carries \`data-popup-side\` (\`bottom\` or \`top\`) and the panel \`data-side\`

## Theme Customization

The Combobox component uses a theme object that can be customized using the \`theme\` prop or by setting a global theme.

### Theme Structure

The theme object contains the following parts:
- **input**: Input element styles
- **inputContainer**: Input container wrapper styles
- **loading**: Loading state indicator styles
- **error**: Error message styles
- **noOptions**: No options found message styles
- **group**, **groupLabel**, **separator**: Group container, group label and the divider between groups

Option rows are rendered with the shared \`MenuOption\` component (parts: root, title, description, prefix, suffix, content) and are themed through \`setMenuOptionTheme\` from \`entasis/menu-option\`, not through the Combobox theme.

### Available Variants

**input**:
- base: Base classes applied to the input element
- Variants:
  - size: 'small' | 'normal' | 'large' - Text size
  - disabled: boolean - Disabled state styling

**inputContainer**:
- base: Base classes for the input container
- Variants:
  - size: 'small' | 'normal' | 'large' - Size-based styling
  - disabled: boolean - Disabled state styling

**loading**:
- base: Base classes for loading indicator

**error**:
- base: Base classes for error message

**noOptions**:
- base: Base classes for no options message

**group**, **groupLabel**, **separator**:
- base: Base classes for a labelled group, its label and the divider between groups

### Usage Examples

**Basic Theme Override**:
\`\`\`svelte
<Combobox
  items={items}
  bind:value={value}
  theme={{
    inputContainer: {
      base: 'border-2 rounded-lg',
      size: {
        normal: 'px-4 py-2'
      }
    },
    noOptions: {
      base: 'italic'
    }
  }}
/>
\`\`\`

**Custom Option Styling** (option rows use the shared MenuOption theme):
\`\`\`svelte
<script lang="ts">
  import { setMenuOptionTheme } from 'entasis/menu-option';

  let value = $state<string | null>(null);
  const items = [
    { value: 'us', label: 'United States', description: 'North America' },
    { value: 'uk', label: 'United Kingdom', description: 'Europe' }
  ];

  setMenuOptionTheme({
    root: {
      base: 'rounded-md transition-colors'
    },
    title: {
      base: 'font-semibold'
    },
    description: {
      base: 'text-sm text-neutral/70'
    }
  });
</script>

<Combobox items={items} bind:value={value} />
\`\`\`

**Global Theme Setting**:
\`\`\`svelte
<script>
  import { setComboboxTheme } from 'entasis/combobox';
  
  setComboboxTheme({
    inputContainer: {
      base: 'rounded-lg border-2 transition-all',
      size: {
        normal: 'px-4 py-2'
      }
    },
    loading: {
      base: 'italic'
    }
  });
</script>
\`\`\`
`;
