<script lang="ts">
	import { Alert } from 'svelai/alert';
	import { Button } from 'svelai/button';
	import { Card } from 'svelai/card';
	import { Empty } from 'svelai/empty';
	import { SegmentedControl } from 'svelai/segmented-control';
	import { Skeleton } from 'svelai/skeleton';
	import { Stack } from 'svelai/stack';
	import { arrowClockwiseIcon } from 'svelai/icons/arrowClockwise';
	import { folderOpenIcon } from 'svelai/icons/folderOpen';
	import { plusIcon } from 'svelai/icons/plus';
	import { spinnerGapIcon } from 'svelai/icons/spinnerGap';
	import { xCircleIcon } from 'svelai/icons/xCircle';

	const stateOptions = [
		{ value: 'loading', label: 'Loading', icon: spinnerGapIcon },
		{ value: 'empty', label: 'Empty', icon: folderOpenIcon },
		{ value: 'error', label: 'Error', icon: xCircleIcon }
	] as const;

	let viewState = $state<(typeof stateOptions)[number]['value']>('loading');

	async function retry() {
		viewState = 'loading';
		await new Promise<void>((resolve) => setTimeout(resolve, 900));
		viewState = 'empty';
	}
</script>

<Stack align="center">
	<Card class="w-full max-w-3xl" variant="outline" density="normal" showBorders>
		{#snippet header()}
			<Stack orientation="horizontal" align="center" justify="between" gap="lg" wrap="wrap">
				<Stack gap="xs">
					<h2 class="text-neutral text-lg font-semibold">Projects</h2>
					<p class="text-neutral/70 text-sm">Operational states for a remote project list.</p>
				</Stack>
				<SegmentedControl
					items={stateOptions}
					bind:value={viewState}
					size="small"
					variant="pill"
					label="Preview project list state"
				/>
			</Stack>
		{/snippet}

		<Stack class="min-h-80" justify="center">
			{#if viewState === 'loading'}
				<div aria-live="polite" aria-busy="true">
					<Stack gap="lg">
						<span class="sr-only">Loading projects</span>
						<Stack orientation="horizontal" align="center" gap="md">
							<Skeleton class="size-10 shrink-0 rounded-md" />
							<Stack class="w-full" gap="sm">
								<Skeleton class="h-4 w-2/5" />
								<Skeleton class="h-3 w-3/5" />
							</Stack>
						</Stack>
						<Stack orientation="horizontal" align="center" gap="md">
							<Skeleton class="size-10 shrink-0 rounded-md" />
							<Stack class="w-full" gap="sm">
								<Skeleton class="h-4 w-1/3" />
								<Skeleton class="h-3 w-1/2" />
							</Stack>
						</Stack>
						<Stack orientation="horizontal" align="center" gap="md">
							<Skeleton class="size-10 shrink-0 rounded-md" />
							<Stack class="w-full" gap="sm">
								<Skeleton class="h-4 w-1/2" />
								<Skeleton class="h-3 w-2/3" />
							</Stack>
						</Stack>
					</Stack>
				</div>
			{:else if viewState === 'empty'}
				<Empty
					class="min-h-72"
					mediaVariant="icon"
					media={folderOpenIcon}
					title="No projects yet"
					description="Create your first project to organize files, decisions, and collaborators."
					actions={[
						{
							content: 'Create project',
							prefix: plusIcon,
							color: 'primary'
						},
						{
							content: 'Import project',
							variant: 'outline',
							color: 'neutral'
						}
					]}
				/>
			{:else}
				<Stack gap="lg">
					<Alert
						color="danger"
						variant="soft"
						prefix={xCircleIcon}
						title="Projects could not be loaded"
						description="The server stopped responding before the request completed. Your existing projects are safe."
					/>
					<Stack orientation="horizontal" align="center" justify="between" gap="md" wrap="wrap">
						<p class="text-neutral/70 text-sm">Error code: GATEWAY_TIMEOUT</p>
						<Button variant="outline" color="danger" prefix={arrowClockwiseIcon} onclick={retry}>
							Try again
						</Button>
					</Stack>
				</Stack>
			{/if}
		</Stack>
	</Card>
</Stack>
