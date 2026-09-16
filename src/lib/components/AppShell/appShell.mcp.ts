export const appShellDescription = `
# AppShell Component

Convenience wrapper for the common application layout: Sidebar owns navigation,
responsive drawer behavior, the application wall, and variant surfaces, while PageShell
owns the page header, document-flow content, footer, and route-level injection. AppShell
forwards one shared variant to Sidebar and composes PageShell inside it.
AppShell establishes a dynamic viewport-height minimum while letting the document own
vertical scrolling. The desktop sidebar remains sticky independently of page content.

Use AppShell when every route follows the same sidebar + page shell structure. Use
Sidebar and PageShell directly when the frame needs custom composition.

## Basic Usage

\`\`\`svelte
<script lang="ts">
	import { AppShell, type AppShellSidebarProps } from 'svelai/app-shell';
	import { houseIcon } from 'svelai/icons/house';

	const sidebar: AppShellSidebarProps = {
		collapsible: 'icon',
		rail: true,
		items: [
			{
				label: 'Workspace',
				items: [{ label: 'Home', href: '/', icon: houseIcon, isActive: true }]
			}
		]
	};
</script>

<AppShell variant="framed" {sidebar} title="Dashboard" subtitle="Operational overview">
	{#snippet children({ sidebar })}
		<button type="button" onclick={sidebar.toggle}>Toggle sidebar</button>
	{/snippet}
</AppShell>
\`\`\`

## Route-Level Injection

AppShell renders PageShell internally, so child pages can use the PageShell context API:

\`\`\`svelte
<script lang="ts">
	import { setPageShell } from 'svelai/page-shell';

	setPageShell({
		title: 'Insights',
		subtitle: 'Revenue and retention',
		footer: pageFooter
	});
</script>

{#snippet pageFooter()}
	<span>Synced just now</span>
{/snippet}
\`\`\`

## Props

- **variant**: 'admin' | 'floating' | 'inset' | 'split' | 'framed' - Shared shell treatment forwarded to Sidebar and PageShell chrome. Admin chrome uses the Sidebar canvas surface; floating chrome uses detached raised, rounded surfaces. \`framed\` draws one rounded card (\`rounded-xl\` + \`raised-1\`, so the border and elevation come from the elevation engine) around both the sidebar and the page; the Sidebar's own \`framed\` variant paints its navigation well as \`surface-recessed\`, an inset of that card, and the page header sits on the page surface.
- **sidebar**: AppShellSidebarProps - Sidebar props except \`children\`, \`mode\`, \`frame\`, and \`variant\`.
  Configure Sidebar \`size\` and \`density\` independently inside this object.
- **eyebrow**: string | Snippet<[PageShellApi]> - Small metadata above the PageShell title.
- **breadcrumbs**: BreadcrumbItem[] | Snippet<[AppShellApi]> - PageShell breadcrumbs.
- **breadcrumbsMaxItems**: number - Maximum visible breadcrumb items before ellipsis. Defaults to 4.
- **back**: PageShellAction | Snippet<[AppShellApi]> - Back affordance before breadcrumbs or eyebrow.
- **title**: string | Snippet<[PageShellApi]> - Default PageShell title.
- **subtitle**: string | Snippet<[PageShellApi]> - Default PageShell subtitle.
- **header**: Snippet<[PageShellApi]> - Custom PageShell header.
- **headerActions**: Snippet<[AppShellApi]> | PageShellAction[] - Actions in the default PageShell header. Use an array for standard Button props, or a snippet when the action needs sidebar/page-shell API access.
- **footer**: Snippet<[PageShellApi]> - PageShell footer.
- **footerActions**: Snippet<[AppShellApi]> | PageShellAction[] - PageShell footer actions.
- **children**: Snippet<[AppShellApi]> - Main content, with \`pageShell\` and \`sidebar\` APIs.
- **contentPadding**: 'none' | 'small' | 'normal' | 'large' - PageShell content padding preset.
- **contentWidth**: 'full' | 'narrow' | 'normal' | 'wide' | 'prose' - PageShell content width preset.
- **pageShellTheme**: PageShellThemeProps - PageShell theme overrides.
- **theme**: AppShellThemeProps - AppShell \`root\`, \`frame\` and \`page\` surface-token overrides. Sidebar owns the wall and shell geometry.

## Accessibility

AppShell delegates navigation semantics to Sidebar and page landmarks to PageShell.
Use string \`title\` for the default \`h1\`, or preserve heading semantics when replacing
the PageShell header with a custom snippet.
`;
