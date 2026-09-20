export const paginationDescription = `
# Pagination Component

Pagination renders accessible page navigation for long lists, tables, and server-routed result pages. It is controlled through a one-based \`value\`, sized by either an explicit \`totalPages\` count or \`totalItems\` plus \`pageSize\`, and supports numbered, count, compact, dots, or navigation-only layouts.

## Basic Usage

\`\`\`svelte
<script lang="ts">
	import { Pagination } from 'entasis/pagination';

	let value = $state(1);
</script>

<Pagination bind:value totalPages={12} />
\`\`\`

## Props

### Core Props
- **value**: number (default: 1)
  - One-based current page. Bind it with \`bind:value\` for local state.
- **defaultValue**: number (default: 1)
  - Initial one-based page when \`value\` is omitted.
- **totalPages**: number (optional)
  - Total page count. Values below 1 render no pagination.
- **totalItems**: number (optional)
  - Total item count. With \`pageSize\`, derives \`totalPages\` when \`totalPages\` is omitted, and feeds the summary slot.
- **pageSize**: number (optional)
  - Items per page. Pair it with \`totalItems\` to derive the page count, to render the summary, and for the \`count\` variant.
- **siblingCount**: number (default: 1)
  - Number of pages shown on each side of the current page.
- **boundaryCount**: number (default: 1)
  - Number of pages always shown at the start and end.

Sizing: \`totalPages\`, \`totalItems\`, and \`pageSize\` are plain optional props — there is no discriminated union. Pass \`totalPages\`, or pass \`totalItems\` and \`pageSize\` together; \`totalPages\` wins when both are given. With neither, the page count is 0, nothing renders, and the component logs a one-time console warning.

### Control Props
- **showFirstLast**: boolean (default: false)
  - Shows first and last page icon controls.
- **showPrevNext**: boolean (default: true)
  - Shows previous and next page icon controls.
- **showSummary**: boolean (default: false)
  - Renders the summary slot, or the default item range, when \`totalItems\` and \`pageSize\` are set.
- **disabled**: boolean (default: false)
  - Disables all controls.
- **getHref**: (page: number) => string
  - When provided, controls render as anchors instead of buttons.
- **getItemLabel**: (item: PaginationItemLabel) => string
  - Returns localized aria labels for first, previous, page, next, and last controls.
- **onValueChange**: (value: number) => void
  - Called once after an enabled control selects a different page. External \`value\` updates stay silent.

### Style Props
- **size**: 'small' | 'normal' | 'large' (default: 'normal')
- **color**: 'primary' | 'secondary' | 'danger' | 'success' | 'warning' | 'info' | 'neutral' (default: 'primary')
- **variant**: 'pages' | 'count' | 'compact' | 'dots' | 'none' (default: 'pages')
  - Controls what appears between previous and next. \`count\` requires \`totalItems\` and \`pageSize\`.
- **controlVariant**: 'solid' | 'outline' | 'soft' | 'ghost' (default: 'ghost')
  - Visual appearance applied to page and navigation controls.
- **class**: string
- **theme**: PaginationThemeProps

### Accessibility Props
- **label**: string (default: 'Pagination')
  - Accessible label for the root navigation landmark.

### Slot Props
- **first**: Snippet | string
- **previous**: Snippet | string
- **next**: Snippet | string
- **last**: Snippet | string
- **ellipsis**: Snippet | string
- **children**: Snippet<[PaginationState]>
  - Full custom renderer. Receives the pagination state instance and replaces the built-in controls.
- **pageItem**: Snippet<{ page, active, disabled, totalPages }>
  - Custom content rendered inside page number controls.
- **summary**: Snippet<{ page, totalPages, totalItems, pageSize, startItem, endItem }>
  - Custom item range content rendered before the controls, or between them for the \`count\` variant.

### Pagination State
The default child snippet receives a \`PaginationState\` instance. State is backed by the bindable \`value\` prop, so calling \`pagination.next()\`, \`pagination.previous()\`, or \`pagination.setPage(page)\` updates \`bind:value\` and fires \`onValueChange\`.

Useful state fields and methods:
- **currentPage**: clamped active page.
- **pageCount**: derived from \`totalPages\` or \`totalItems / pageSize\`.
- **items**: page numbers and ellipsis tokens used by the built-in renderer.
- **summary**: item range payload when \`totalItems\` and \`pageSize\` are set.
- **isPreviousDisabled** / **isNextDisabled**: bounded navigation state.
- **first()**, **previous()**, **next()**, **last()**, **setPage(page)**: navigation methods.

## Examples

### Controlled Pagination
\`\`\`svelte
<script lang="ts">
	let value = $state(6);
</script>

<Pagination bind:value totalPages={20} />
\`\`\`

### Layout Variants

\`pages\` renders numbered controls with ellipsis:

\`\`\`svelte
<Pagination variant="pages" bind:value totalPages={40} />
\`\`\`

\`count\` renders the current item range:

\`\`\`svelte
<Pagination variant="count" bind:value totalItems={100} pageSize={10} />
\`\`\`

\`compact\`, \`dots\`, and \`none\` reduce the visible navigation chrome:

\`\`\`svelte
<Pagination variant="compact" bind:value totalPages={10} />
<Pagination variant="dots" bind:value totalPages={10} />
<Pagination variant="none" bind:value totalPages={10} />
\`\`\`

Dot controls keep their compact visual marker while the shared \`Hitbox\` utility expands each pointer target. The list reserves the same dimensions, so adjacent page targets never overlap.

### Windowed Page Buttons
\`\`\`svelte
<Pagination bind:value totalPages={40} siblingCount={0} boundaryCount={1} size="small" />
\`\`\`

### Full Controls
\`\`\`svelte
<Pagination value={12} totalPages={80} showFirstLast />
\`\`\`

### Item Count Summary
\`\`\`svelte
<Pagination bind:value totalItems={96} pageSize={10} showSummary>
	{#snippet summary(range)}
		{range.startItem}-{range.endItem} of {range.totalItems}
	{/snippet}
</Pagination>
\`\`\`

### Link Pagination
\`\`\`svelte
<Pagination
	value={3}
	totalPages={10}
	getHref={(page) => \`/invoices?page=\${page}\`}
/>
\`\`\`

### Custom Labels
\`\`\`svelte
<Pagination bind:value totalPages={8} previous="Prev" next="Next">
	{#snippet pageItem(item)}
		<span>{item.active ? 'p.' : ''}{item.page}</span>
	{/snippet}
</Pagination>
\`\`\`

### Custom Renderer With State
\`\`\`svelte
<Pagination bind:value totalPages={10}>
	{#snippet children(pagination)}
		<button disabled={pagination.isPreviousDisabled} onclick={pagination.previous}>
			Previous
		</button>
		<span>Page {pagination.currentPage} of {pagination.pageCount}</span>
		<button disabled={pagination.isNextDisabled} onclick={pagination.next}>
			Next
		</button>
	{/snippet}
</Pagination>
\`\`\`

### Localized Aria Labels
\`\`\`svelte
<script lang="ts">
	import type { PaginationItemLabel } from 'entasis/pagination';

	const getItemLabel = (item: PaginationItemLabel) => {
		if (item.type === 'page') {
			return item.active ? \`Page \${item.page}, page courante\` : \`Aller a la page \${item.page}\`;
		}

		return {
			first: 'Aller a la premiere page',
			previous: 'Aller a la page precedente',
			next: 'Aller a la page suivante',
			last: 'Aller a la derniere page'
		}[item.type];
	};
</script>

<Pagination label="Pagination des factures" totalPages={8} {getItemLabel} />
\`\`\`

## Accessibility

- Renders a \`nav\` landmark with configurable \`aria-label\`.
- The active page sets \`aria-current="page"\`.
- Disabled controls set \`aria-disabled\`; button controls also use the native \`disabled\` attribute.
- First, previous, page, next, and last controls include descriptive aria labels.
- \`getItemLabel\` localizes all control labels without changing visible content.

## Theme Customization

The theme object contains:
- **root**: root navigation element
- **list**: list of controls
- **item**: list item wrapper
- **control**: page and icon controls
- **dot**: visual dot controls used by the \`dots\` variant; pointer target sizing belongs to \`Hitbox\`
- **icon**: icon wrapper inside icon controls
- **ellipsis**: gap indicator
- **summary**: item range summary

\`\`\`svelte
<script>
	import { setPaginationTheme } from 'entasis/pagination';

	setPaginationTheme({
		control: {
			base: 'rounded-full'
		}
	});
</script>
\`\`\`
`;
