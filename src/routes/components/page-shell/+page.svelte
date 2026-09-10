<script lang="ts">
	import ComponentCard from '../../ComponentCard.svelte';
	import DocPage from '../../DocPage.svelte';
	import PageShellBasicDemo from './demos/PageShellBasicDemo.svelte';
	import PageShellFooterActionsDemo from './demos/PageShellFooterActionsDemo.svelte';
	import PageShellHeaderChromeDemo from './demos/PageShellHeaderChromeDemo.svelte';
	import PageShellInjectionDemo from './demos/PageShellInjectionDemo.svelte';
	import PageShellOverflowDemo from './demos/PageShellOverflowDemo.svelte';
	import ShellMentalModel from '../ShellMentalModel.svelte';
	import { createComponentControls } from '../../componentControls.svelte.js';

	const contentPaddings = ['none', 'small', 'normal', 'large'] as const;
	const contentWidths = ['full', 'narrow', 'normal', 'wide', 'prose'] as const;
	const controls = createComponentControls([
		{
			name: 'contentPadding',
			type: 'segmented',
			label: 'Padding',
			value: 'normal',
			options: contentPaddings
		},
		{
			name: 'contentWidth',
			type: 'segmented',
			label: 'Width',
			value: 'wide',
			options: contentWidths
		}
	]);
</script>

<DocPage
	title="Page shell"
	subtitle="A content shell for application pages: sticky header and footer, natural document scrolling, and route-level injection."
	component="PageShell"
	features={[
		'Natural document scrolling with sticky page chrome',
		'Sticky footer content and actions',
		'String or snippet title and subtitle props',
		'Header actions and custom header/footer snippets',
		'Context API for child routes to override shell regions',
		'Designed to live inside Sidebar children'
	]}
>
	<ShellMentalModel current="page-shell" />

	<ComponentCard
		{controls}
		description="Use PageShell when navigation is already owned by Sidebar and the page needs stable content chrome."
		class="!min-h-fit !items-start !p-4"
		code={`<script lang="ts">
	import { PageShell, type PageShellAction } from 'svelai/page-shell';
	import { arrowClockwiseIcon } from 'svelai/icons/arrowClockwise';
	import { downloadSimpleIcon } from 'svelai/icons/downloadSimple';

	const headerActions = [
		{
			label: 'Refresh insights',
			squared: true,
			variant: 'outline',
			prefix: arrowClockwiseIcon
		},
		{
			content: 'Export',
			color: 'primary',
			prefix: downloadSimpleIcon
		}
	] satisfies PageShellAction[];
${'</' + 'script>'}

<div class="h-[460px] w-full overflow-auto rounded-lg border border-neutral-muted">
<PageShell
		title="Insights"
		subtitle="Sticky header and footer with natural content flow"
		{headerActions}
		contentPadding="${controls.value.contentPadding}"
		contentWidth="${controls.value.contentWidth}"
	>
		{#snippet footer()}
			<span>Updated just now</span>
			<span>All systems healthy</span>
		{/snippet}

		{#snippet children()}
			<div class="grid gap-4 lg:grid-cols-3">
				<section>Revenue</section>
				<section>Activation</section>
				<section>Retention</section>
			</div>
		{/snippet}
	</PageShell>
</div>`}
	>
		<PageShellBasicDemo
			contentPadding={controls.value.contentPadding}
			contentWidth={controls.value.contentWidth}
		/>
	</ComponentCard>

	{#snippet examples()}
		<ComponentCard
			description="Default header chrome can combine a back button, collapsed breadcrumbs, title text, and action arrays."
			class="!min-h-fit !items-start !p-4"
			code={`<script lang="ts">
	import { PageShell, type PageShellAction } from 'svelai/page-shell';
	import type { BreadcrumbItem } from 'svelai/breadcrumbs';
	import { arrowClockwiseIcon } from 'svelai/icons/arrowClockwise';
	import { usersIcon } from 'svelai/icons/users';

	const breadcrumbs: BreadcrumbItem[] = [
		{ label: 'Customers', href: '#customers' },
		{ label: 'Accounts', href: '#accounts' },
		{ label: 'Acme Group', active: true }
	];

	const headerActions = [
		{ content: 'Refresh', variant: 'outline', prefix: arrowClockwiseIcon },
		{ content: 'Invite', color: 'primary', prefix: usersIcon }
	] satisfies PageShellAction[];
${'</' + 'script>'}

<PageShell
	title="Acme Group"
	subtitle="Enterprise account"
	{breadcrumbs}
	back={{ href: '#accounts' }}
	{headerActions}
	contentPadding="normal"
	contentWidth="normal"
>
	{#snippet children()}
		<section>Account content</section>
	{/snippet}
</PageShell>`}
		>
			<PageShellHeaderChromeDemo />
		</ComponentCard>

		<ComponentCard
			description="Footer actions stay available without creating a nested scroll container."
			class="!min-h-fit !items-start !p-4"
			code={`<script lang="ts">
	import { PageShell, type PageShellAction } from 'svelai/page-shell';
	import { checkIcon } from 'svelai/icons/check';
	import { xIcon } from 'svelai/icons/x';

	const footerActions = [
		{ content: 'Cancel', variant: 'outline', prefix: xIcon },
		{ content: 'Save changes', color: 'primary', prefix: checkIcon }
	] satisfies PageShellAction[];
${'</' + 'script>'}

	<PageShell
	eyebrow="Settings"
	title="Billing profile"
	subtitle="Footer actions remain available while the page scrolls."
	{footerActions}
	contentPadding="normal"
	contentWidth="narrow"
>
	{#snippet footer()}
		<span>2 unsaved changes</span>
	{/snippet}

	{#snippet children()}
		<form>...</form>
	{/snippet}
</PageShell>`}
		>
			<PageShellFooterActionsDemo />
		</ComponentCard>

		<ComponentCard
			description="Action arrays collapse extra mobile actions into a PopupMenu; snippets are left untouched."
			class="!min-h-fit !items-start !p-4"
			code={`<script lang="ts">
	import { PageShell, type PageShellAction } from 'svelai/page-shell';
	import { arrowClockwiseIcon } from 'svelai/icons/arrowClockwise';
	import { downloadSimpleIcon } from 'svelai/icons/downloadSimple';
	import { funnelIcon } from 'svelai/icons/funnel';
	import { plusIcon } from 'svelai/icons/plus';

	const headerActions = [
		{ label: 'Refresh', squared: true, variant: 'outline', prefix: arrowClockwiseIcon },
		{ content: 'Filter', variant: 'outline', prefix: funnelIcon },
		{ content: 'Export', variant: 'outline', prefix: downloadSimpleIcon },
		{ content: 'Create', color: 'primary', prefix: plusIcon }
	] satisfies PageShellAction[];
${'</' + 'script>'}

<PageShell
	title="Reports"
	{headerActions}
	mobileActionCount={1}
	contentPadding="normal"
>
	{#snippet children()}
		Reports
	{/snippet}
</PageShell>`}
		>
			<PageShellOverflowDemo />
		</ComponentCard>

		<ComponentCard
			description="Child pages can inject title, subtitle, header actions, and footer content through PageShell context."
			class="!min-h-fit !items-start !p-4"
			code={`<!-- +layout.svelte -->
<script lang="ts">
	import { PageShell } from 'svelai/page-shell';
	import RevenuePage from './RevenuePage.svelte';
${'</' + 'script>'}

<PageShell title="Fallback page" subtitle="Child routes can replace this">
	{#snippet children()}
		<RevenuePage />
	{/snippet}
</PageShell>

<!-- RevenuePage.svelte -->
<script lang="ts">
	import { setPageShell } from 'svelai/page-shell';
	import { arrowClockwiseIcon } from 'svelai/icons/arrowClockwise';

	setPageShell({
		title: 'Revenue insights',
		subtitle: 'Child page content injected this header and footer',
		headerActions,
		footer
	});
${'</' + 'script>'}

{#snippet headerActions()}
	<button type="button">
		{@render arrowClockwiseIcon({ class: 'size-4' })}
		Refresh
	</button>
{/snippet}

{#snippet footer()}
	<span>Route footer</span>
	<span>Synced 2 minutes ago</span>
{/snippet}

<section class="p-4">Revenue content</section>`}
		>
			<PageShellInjectionDemo />
		</ComponentCard>
	{/snippet}
</DocPage>
