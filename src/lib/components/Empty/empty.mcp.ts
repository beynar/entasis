export const emptyDescription = `
# Empty Component

The Empty component displays an empty state: a centered composition of media (icon or illustration), title, description, action area, and optional note/footer. Use it for empty lists, no-results screens, first-run states, or error placeholders.

## Basic Usage

\`\`\`svelte
<script>
	import { Empty } from 'entasis/empty';
	import { folderIcon } from 'entasis/icons/folder';
</script>

<Empty
	mediaVariant="icon"
	media={folderIcon}
	title="No projects yet"
	description="Get started by creating your first project."
/>
\`\`\`

## Props

### Core Props
- **mediaVariant**: 'default' | 'icon' (default: 'default')
  - default: Renders the media bare (transparent background), for illustrations or custom visuals
  - icon: Wraps the media in a small muted rounded square, sized to the empty state size

- **mode**: 'normal' | 'card' (default: 'normal')
  - normal: Transparent placeholder (current behavior)
  - card: Renders on a raised surface (bg-surface + raised-sm), matching the Card component

- **bordered**: boolean (default: false)
  - Wraps the whole empty state in a dashed border (rounded-xl)

- **size**: 'small' | 'normal' | 'large' (default: 'normal')
  - Scales paddings, gaps, media box, and typography

### Actions
- **actions**: array of (ButtonProps + content) - Buttons rendered as a centered, wrapping row below the description. Each entry is Button props plus a "content" string for the label. Convenience alternative to the content slot.

### Content Props (Slots)
All slots accept a string or a snippet.
- **media**: Slot - Icon, image, or illustration shown above the title
- **title**: Slot - Main heading of the empty state
- **description**: Slot - Muted supporting text; anchor tags inside get underline styling and primary hover color
- **content**: Slot - Action area, typically buttons; rendered below the header
- **note**: Slot - Description-styled note rendered after the content (e.g. a help link)
- **footer**: Slot - Trailing content rendered as a sibling of header/content, unwrapped

### Advanced Props
- **children**: Snippet - Custom content that replaces the default composition entirely when set
- **class**: string - Additional CSS classes on the root
- **theme**: EmptyThemeProps - Theme overrides

## Structure

\`\`\`
<Empty>                    <!-- root: centered flex column -->
	<header>                 <!-- only when media/title/description is set -->
		<media />
		<title />
		<description />
	</header>
	<content>                <!-- only when content/note is set -->
		<content />
		<note />
	</content>
	<footer />               <!-- unwrapped trailing slot -->
</Empty>
\`\`\`

## Examples

### Icon empty state with action
\`\`\`svelte
<Empty
	bordered
	mediaVariant="icon"
	media={folderIcon}
	title="No projects yet"
	description="You haven't created any projects yet."
>
	{#snippet content()}
		<Button size="small">Create project</Button>
	{/snippet}
</Empty>
\`\`\`

### Custom media snippet (default variant)
\`\`\`svelte
<Empty title="No results" description="Try adjusting your search filters.">
	{#snippet media()}
		{@render magnifyingGlassIcon({ class: 'size-10 text-neutral/70' })}
	{/snippet}
</Empty>
\`\`\`

### With a note and footer
\`\`\`svelte
<Empty mediaVariant="icon" media={trayIcon} title="Inbox empty">
	{#snippet content()}
		<Button size="small" variant="outline">Refresh</Button>
	{/snippet}
	{#snippet note()}
		Need help? <a href="/support">Contact support</a>
	{/snippet}
</Empty>
\`\`\`

### Fully custom composition
\`\`\`svelte
<Empty bordered>
	<p>Anything goes here — children replaces the default layout.</p>
</Empty>
\`\`\`

## Accessibility

- The component renders plain, semantically neutral divs; provide meaningful text in title/description
- Action buttons placed in the content slot keep their own focus and keyboard behavior
- Links inside the description are visually distinguished by an underline

## Notes

- The header wrapper only renders when media, title, or description is provided; the content wrapper only renders when content or note is provided
- The note slot reuses the description styling
- The media sizing selector \`[&_svg:not([class*=size-])]:size-*\` only applies in the icon variant; pass your own size class on the svg to override it

## Theme Customization

The Empty component uses a theme object that can be customized using the \`theme\` prop or by setting a global theme.

### Theme Structure

- **root**: Root container (layout, padding, gap, dashed border)
- **header**: Header wrapper around media/title/description
- **media**: Media box (mediaVariant + size variants)
- **title**: Title text
- **description**: Description and note text
- **content**: Action area wrapper

### Available Variants

**root**: size ('small' | 'normal' | 'large'), bordered (boolean)
**header**: size
**media**: size, mediaVariant ('default' | 'icon')
**title**: size
**description**: size
**content**: size

### Usage Examples

**Local override**:
\`\`\`svelte
<Empty
	theme={{
		root: { base: 'min-h-64' },
		media: { mediaVariant: { icon: 'bg-primary-muted text-primary rounded-full' } }
	}}
	mediaVariant="icon"
	media={folderIcon}
	title="Themed empty state"
/>
\`\`\`

**Global theme setting**:
\`\`\`svelte
<script>
	import { setEmptyTheme } from 'entasis/empty';

	setEmptyTheme({
		title: { base: 'font-semibold' },
		root: { bordered: { true: 'border-2 border-dotted' } }
	});
</script>
\`\`\`
`;
