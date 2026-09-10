export const tagGroupDescription = `
# TagGroup Component

TagGroup renders a finite set of selectable tags as chips. It is a form input for compact category, filter, or preference selection.

## Basic Usage

\`\`\`svelte
<script lang="ts">
	import { TagGroup } from 'svelai/tag-group';

	let value = $state('news');
</script>

<TagGroup
	label="Category"
	bind:value
	items={[
		{ value: 'news', label: 'News' },
		{ value: 'travel', label: 'Travel' },
		{ value: 'gaming', label: 'Gaming' }
	]}
/>
\`\`\`

## Multiple Selection

\`\`\`svelte
<script lang="ts">
	let selected = $state(['news', 'gaming']);
</script>

<TagGroup
	multiple
	label="Topics"
	bind:value={selected}
	items={[
		{ value: 'news', label: 'News' },
		{ value: 'travel', label: 'Travel' },
		{ value: 'gaming', label: 'Gaming' }
	]}
/>
\`\`\`

## Props

### Core Props
- **items**: TagGroupOption[] - Options rendered as selectable chips.
- **value**: string | string[] | null - Bindable selection. Single mode writes string|null; multiple mode writes string[].
- **multiple**: boolean (default: false) - Enables selecting multiple tags.
- **label**: Slot - Field label.
- **name**: string - Form field name.
- **required**: boolean (default: false) - Marks selection as required.
- **disabled**: boolean (default: false) - Disables all tag buttons.

### Option Props
- **value**: string - Unique selection value.
- **label**: string | Snippet - Visible chip label.
- **icon**: string | Snippet - Optional icon rendered before the label.
- **disabled**: boolean - Disables one option.
- **color**: Colors - Per-option chip color override.
- **variant**: 'solid' | 'outline' | 'soft' - Per-option chip variant override.

### Style Props
- **size**: 'small' | 'normal' | 'large' (default: 'normal') - Controls chip density.
- **color**: Colors (default: 'primary') - Selected chip color.
- **unselectedColor**: Colors (default: 'neutral') - Unselected chip color.
- **selectedVariant**: 'solid' | 'outline' | 'soft' (default: 'solid') - Selected chip variant.
- **unselectedVariant**: 'solid' | 'outline' | 'soft' (default: 'soft') - Unselected chip variant.
- **theme**: TagGroupThemeProps - Theme overrides for TagGroup and Field parts.
- **chipTheme**: ChipThemeProps - Theme overrides forwarded to each Chip.

### Events
- **onValueChange**: (value: string | string[] | null) => void - Called when normalized selection changes.
- **onValidate**: (value: string | string[] | null) => string[] | boolean - Custom validation.

## Accessibility

- Uses native button controls for each selectable chip.
- Buttons expose aria-pressed for selected state.
- The field is rendered as a fieldset through the shared Field wrapper.
- Hidden inputs mirror selected values for native form submission.

## State contract

- **value**: current bindable editable value.
- **defaultValue**: initial value used only when \`value\` is omitted.
- **onValueChange**: called with the new value when the component changes it.

`;
