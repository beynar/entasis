export const pageShellDescription = `
# PageShell Component

Content shell for pages rendered inside an application frame. PageShell provides a
sticky header and footer, document-flow content, title/subtitle props, and a context
API for child routes to inject shell content. Scrolling stays on the document by default,
so browser navigation and scroll restoration keep their native behavior.

Use PageShell inside \`Sidebar.children\` when Sidebar owns navigation and responsive
drawer behavior.

## Basic Usage

\`\`\`svelte
<script lang="ts">
	import { PageShell, type PageShellAction } from 'entasis/page-shell';
	import { downloadSimpleIcon } from 'entasis/icons/downloadSimple';

	const headerActions = [
		{
			content: 'Export',
			color: 'primary',
			prefix: downloadSimpleIcon
		}
	] satisfies PageShellAction[];
</script>

<PageShell title="Insights" subtitle="Live account health" {headerActions}>
	{#snippet footer()}
		<span>Updated just now</span>
	{/snippet}

	{#snippet children()}
		<section class="p-6">Page content</section>
	{/snippet}
</PageShell>
\`\`\`

## Route-Level Injection

Child pages can set header and footer content through context. Use \`setPageShell\`
during component initialization for automatic cleanup.

\`\`\`svelte
<script lang="ts">
	import { setPageShell } from 'entasis/page-shell';

	setPageShell({
		title: 'Revenue',
		subtitle: 'Segment breakdown',
		headerActions: revenueActions,
		footer: revenueFooter
	});
</script>

{#snippet revenueActions()}
	<button type="button">Refresh</button>
{/snippet}

{#snippet revenueFooter()}
	<span>Synced 2 minutes ago</span>
{/snippet}
\`\`\`

## Props

- **eyebrow**: string | Snippet<[PageShellApi]> - Small metadata above the title. Ignored when breadcrumbs are set.
- **breadcrumbs**: BreadcrumbItem[] | Snippet<[PageShellApi]> - Default-header breadcrumbs.
- **breadcrumbsMaxItems**: number - Maximum visible breadcrumb items before ellipsis. Defaults to 4.
- **back**: PageShellAction | Snippet<[PageShellApi]> - Back affordance before breadcrumbs or eyebrow.
- **title**: string | Snippet<[PageShellApi]> - Default header title.
- **subtitle**: string | Snippet<[PageShellApi]> - Default header subtitle.
- **header**: Snippet<[PageShellApi]> - Custom sticky header content.
- **headerActions**: Snippet<[PageShellApi]> | PageShellAction[] - Actions on the right side of the default header. Use an array for standard Button props, or a snippet when the action needs shell API access.
- **footer**: Snippet<[PageShellApi]> - Custom sticky footer content.
- **footerActions**: Snippet<[PageShellApi]> | PageShellAction[] - Actions on the right side of the sticky footer.
	- **children**: Snippet<[PageShellApi]> - Page content rendered in normal document flow.
	- **contentPadding**: 'none' | 'small' | 'normal' | 'large' - Padding applied to the content inner wrapper.
	- **contentWidth**: 'full' | 'narrow' | 'normal' | 'wide' | 'prose' - Max-width preset for the content inner wrapper.
	- **actionOverflow**: 'auto' | 'never' - Mobile overflow behavior for action arrays.
	- **mobileActionCount**: 0 | 1 | 2 - Number of action-array buttons kept inline on mobile.
	- **label**: string - Accessible name for the page's \`main\` landmark, applied as aria-label.
	- **theme**: PageShellThemeProps - Per-instance theme overrides.

## API

- **usePageShell()** returns the current PageShell API and throws when no PageShell exists.
- **setPageShell(config)** registers a scoped config override and removes it on component destroy.
- **api.set(config)** pushes a manual override and returns a cleanup function.
- **api.setFooterActions(actions)** pushes scoped page footer actions.
- **api.reset()** clears all scoped overrides.

## Header Action Arrays

\`\`\`svelte
<script lang="ts">
	import { PageShell, type PageShellAction } from 'entasis/page-shell';
	import { arrowClockwiseIcon } from 'entasis/icons/arrowClockwise';

	const headerActions = [
		{
			label: 'Refresh',
			squared: true,
			variant: 'outline',
			prefix: arrowClockwiseIcon
		},
		{
			content: 'Create report',
			color: 'primary'
		}
	] satisfies PageShellAction[];
</script>

<PageShell title="Reports" {headerActions}>
	{#snippet children()}
		Page content
	{/snippet}
</PageShell>
\`\`\`

## Content Presets And Footer Actions

\`\`\`svelte
<PageShell
	eyebrow="Settings"
	title="Billing profile"
	contentPadding="normal"
	contentWidth="narrow"
	footerActions={[
		{ content: 'Cancel', variant: 'outline' },
		{ content: 'Save changes', color: 'primary' }
	]}
>
	{#snippet footer()}
		<span>2 unsaved changes</span>
	{/snippet}

	{#snippet children()}
		<form>...</form>
	{/snippet}
</PageShell>
\`\`\`

## Accessibility

PageShell renders semantic \`header\`, \`main\`, and \`footer\` regions. The title is an
\`h1\` when provided as a string. Custom snippets are responsible for preserving
equivalent semantics when replacing the default header.
`;
