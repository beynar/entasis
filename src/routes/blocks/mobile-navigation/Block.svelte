<script lang="ts">
	import { Button } from 'svelai/button';
	import { Card } from 'svelai/card';
	import { Empty } from 'svelai/empty';
	import { Stack } from 'svelai/stack';
	import { Tabbar } from 'svelai/tabbar';
	import { checkCircleIcon } from 'svelai/icons/checkCircle';
	import { magnifyingGlassIcon } from 'svelai/icons/magnifyingGlass';
	import { plusIcon } from 'svelai/icons/plus';
	import { userIcon } from 'svelai/icons/user';

	const navigationItems = ['Home', 'Explore', 'Updates', 'Profile'];

	let activeView = $state('Home');
</script>

<Stack align="center">
	<Card class="w-full max-w-xl overflow-hidden" variant="outline" density="compact" showBorders>
		{#snippet header()}
			<Stack orientation="horizontal" align="center" justify="between" gap="md" wrap="wrap">
				<Stack gap="xs">
					<p class="text-primary-readable text-xs font-semibold tracking-wide uppercase">Orbit</p>
					<p class="text-neutral text-lg font-semibold">Monday, September 7</p>
				</Stack>
				<Button
					prefix={plusIcon}
					size="small"
					color="primary"
					onclick={() => (activeView = 'Explore')}
				>
					New project
				</Button>
			</Stack>
		{/snippet}

		<Stack class="min-h-80" gap="lg">
			{#if activeView === 'Home'}
				<Stack gap="xs">
					<h2 class="text-neutral text-2xl font-bold tracking-tight">Good morning, Maya</h2>
					<p class="text-neutral/70 text-sm">Three priorities are ready for your attention.</p>
				</Stack>

				<Stack gap="md">
					<Card variant="soft" density="compact">
						<Stack orientation="horizontal" align="center" justify="between" gap="md">
							<Stack gap="xs">
								<p class="text-neutral font-medium">Launch onboarding</p>
								<p class="text-neutral/70 text-xs">Design review · 10:30 AM</p>
							</Stack>
							{@render checkCircleIcon({ color: 'success' })}
						</Stack>
					</Card>
					<Card variant="soft" density="compact">
						<Stack orientation="horizontal" align="center" justify="between" gap="md">
							<Stack gap="xs">
								<p class="text-neutral font-medium">Resolve checkout notes</p>
								<p class="text-neutral/70 text-xs">6 comments from the team</p>
							</Stack>
							<span class="bg-warning size-2 shrink-0 rounded-full" aria-label="Needs attention"
							></span>
						</Stack>
					</Card>
					<Card variant="soft" density="compact">
						<Stack orientation="horizontal" align="center" justify="between" gap="md">
							<Stack gap="xs">
								<p class="text-neutral font-medium">Share weekly update</p>
								<p class="text-neutral/70 text-xs">Draft saved 18 minutes ago</p>
							</Stack>
							<span class="bg-info size-2 shrink-0 rounded-full" aria-label="In progress"></span>
						</Stack>
					</Card>
				</Stack>
			{:else if activeView === 'Explore'}
				<Empty
					class="min-h-72"
					mediaVariant="icon"
					media={magnifyingGlassIcon}
					title="Find your next project"
					description="Search templates, teams, and recent work from one place."
					actions={[
						{
							content: 'Browse templates',
							color: 'primary',
							size: 'small'
						}
					]}
				/>
			{:else if activeView === 'Updates'}
				<Stack gap="lg">
					<Stack gap="xs">
						<h2 class="text-neutral text-2xl font-bold tracking-tight">Updates</h2>
						<p class="text-neutral/70 text-sm">The latest changes across your workspace.</p>
					</Stack>
					<Stack gap="md">
						<Card variant="soft" density="compact">
							<p class="text-neutral text-sm">
								<strong>Noah</strong> approved the launch checklist.
							</p>
						</Card>
						<Card variant="soft" density="compact">
							<p class="text-neutral text-sm">
								<strong>Priya</strong> mentioned you in Checkout.
							</p>
						</Card>
						<Card variant="soft" density="compact">
							<p class="text-neutral text-sm">The weekly report is ready to share.</p>
						</Card>
					</Stack>
				</Stack>
			{:else}
				<Stack gap="lg">
					<Stack orientation="horizontal" align="center" gap="lg">
						<div
							class="bg-primary-muted text-primary-muted-readable flex size-12 shrink-0 items-center justify-center rounded-full"
						>
							{@render userIcon()}
						</div>
						<Stack gap="xs">
							<h2 class="text-neutral text-xl font-semibold">Maya Chen</h2>
							<p class="text-neutral/70 text-sm">Product designer · Lisbon</p>
						</Stack>
					</Stack>
					<Card variant="soft" density="compact">
						<Stack gap="sm">
							<p class="text-neutral text-sm font-medium">Workspace plan</p>
							<p class="text-neutral/70 text-sm">Pro · 12 collaborators</p>
						</Stack>
					</Card>
				</Stack>
			{/if}
		</Stack>

		{#snippet footer()}
			<Tabbar
				items={navigationItems}
				bind:value={activeView}
				size="small"
				variant="pill"
				fullWidth
				label="Mobile navigation"
			/>
		{/snippet}
	</Card>
</Stack>
