<script lang="ts">
	import ComponentCard from '../../ComponentCard.svelte';
	import { createComponentControls } from '../../componentControls.svelte.js';
	import DocPage from '../../DocPage.svelte';
	import SortableList from '$lib/components/SortableList/SortableList.svelte';

	type Task = { id: string; label: string };
	type Feature = { id: string; title: string; description: string };

	const makeTasks = (): Task[] => [
		{ id: 'brief', label: 'Write the project brief' },
		{ id: 'design', label: 'Design the mockups' },
		{ id: 'build', label: 'Build the components' },
		{ id: 'review', label: 'Review with the team' },
		{ id: 'ship', label: 'Ship the release' }
	];
	const controls = createComponentControls([
		{
			name: 'feedback',
			type: 'segmented',
			label: 'Feedback',
			value: 'preview',
			options: [
				{ value: 'preview', label: 'Live preview' },
				{ value: 'indicator', label: 'Indicator line' }
			]
		},
		{
			name: 'size',
			type: 'segmented',
			label: 'Size',
			value: 'normal',
			options: ['small', 'normal', 'large']
		},
		{ name: 'handle', type: 'switch', label: 'Handle', value: false },
		{ name: 'disabled', type: 'switch', label: 'Disabled', value: false }
	]);

	// A separate list per interactive example so reorders don't bleed across cards.
	let basic = $state(makeTasks());
	let handleTasks = $state(makeTasks());
	let sizedTasks = $state(makeTasks());
	let disabledTasks = $state(makeTasks());

	let bound = $state(makeTasks());
	const boundOrder = $derived(bound.map((task) => task.label).join(' → '));

	let features = $state<Feature[]>([
		{ id: 'a11y', title: 'Accessible', description: 'Keyboard sorting and ARIA out of the box' },
		{ id: 'animated', title: 'Animated', description: 'Rows slide out of the way as you drag' },
		{ id: 'generic', title: 'Generic', description: 'Works with any item type' }
	]);

	// Two lists in the same group: rows drag freely between them.
	let today = $state<Task[]>([
		{ id: 'standup', label: 'Team standup' },
		{ id: 'fix-login', label: 'Fix the login redirect' },
		{ id: 'review-pr', label: 'Review the theme PR' }
	]);
	let tomorrow = $state<Task[]>([
		{ id: 'write-docs', label: 'Write the release docs' },
		{ id: 'plan-sprint', label: 'Plan the next sprint' }
	]);
	let lastCrossMove = $state('');

	// Orientation examples
	let queue = $state(['Intro', 'Verse', 'Chorus', 'Bridge', 'Outro']);
	let tiles = $state(
		Array.from({ length: 10 }, (_, i) => ({ id: `t${i + 1}`, label: `Tile ${i + 1}` }))
	);
</script>

<DocPage
	title="Sortable list"
	subtitle="A vertical list whose items reorder by drag and drop, animated by default."
	component="SortableList"
	features={[
		'Live placeholder preview or insertion-line feedback',
		'Full-row or handle-only drag via a single prop',
		'State updates once, at drop — the preview is render-only',
		'Custom item and handle content via snippets',
		'Generic over the item type, built on the useDndList utility'
	]}
>
	<ComponentCard
		{controls}
		title="Live preview or indicator"
		description="Explore drag feedback, row size, handle-only dragging, and the disabled state."
		code={`<SortableList
	bind:items
	indicator={${controls.value.feedback === 'indicator'}}
	size="${controls.value.size}"
	handle={${controls.value.handle}}
	disabled={${controls.value.disabled}}
/>`}
	>
		<SortableList
			bind:items={basic}
			indicator={controls.value.feedback === 'indicator'}
			size={controls.value.size}
			handle={controls.value.handle}
			disabled={controls.value.disabled}
			class="w-full max-w-lg"
		/>
	</ComponentCard>

	{#snippet examples()}
		<!-- Example 1: Handle-only drag -->
		<ComponentCard
			description="With handle, only the grip initiates the drag"
			code="<SortableList bind:items handle />"
		>
			<SortableList bind:items={handleTasks} handle class="w-full max-w-md" />
		</ComponentCard>

		<!-- Example 2: Cross-list group -->
		<ComponentCard
			description="Lists sharing a group accept each other's rows — drag between Today and Tomorrow. Both bound arrays update at drop; onReceive/onRemove report the move."
			code={`<SortableList bind:items={today} group="planner" name="today" empty="Drop tasks here" />
<SortableList bind:items={tomorrow} group="planner" name="tomorrow" empty="Drop tasks here" />`}
		>
			<div class="flex w-full max-w-2xl flex-col gap-3">
				<div class="grid gap-6 sm:grid-cols-2">
					<div class="flex flex-col gap-2">
						<span class="text-neutral/70 text-sm font-medium">Today ({today.length})</span>
						<SortableList
							bind:items={today}
							group="planner"
							name="today"
							empty="Nothing planned — drop tasks here"
							onReceive={({ item, from }) =>
								(lastCrossMove = `"${item.label}" ← ${from.list} #${from.index}`)}
						/>
					</div>
					<div class="flex flex-col gap-2">
						<span class="text-neutral/70 text-sm font-medium">Tomorrow ({tomorrow.length})</span>
						<SortableList
							bind:items={tomorrow}
							group="planner"
							name="tomorrow"
							empty="Nothing planned — drop tasks here"
							onReceive={({ item, from }) =>
								(lastCrossMove = `"${item.label}" ← ${from.list} #${from.index}`)}
						/>
					</div>
				</div>
				<p class="text-neutral/70 text-xs">
					{lastCrossMove || 'Drag a task into the other list to see onReceive.'}
				</p>
			</div>
		</ComponentCard>

		<!-- Orientations -->
		<ComponentCard
			description="orientation='horizontal' lays rows in a line; before/after resolves on the horizontal axis"
			code="<SortableList bind:items orientation=&quot;horizontal&quot; size=&quot;small&quot; />"
		>
			<SortableList
				bind:items={queue}
				orientation="horizontal"
				size="small"
				class="w-full max-w-xl"
			/>
		</ComponentCard>

		<ComponentCard
			description="orientation='grid' wraps rows — drag across lines, the drop math follows the logical order. Override the root theme for a real CSS grid."
			code="<SortableList bind:items orientation=&quot;grid&quot; size=&quot;small&quot; />"
		>
			<SortableList bind:items={tiles} orientation="grid" size="small" class="w-full max-w-sm">
				{#snippet item({ item })}
					<span class="w-16 px-1 text-center">{item.label}</span>
				{/snippet}
			</SortableList>
		</ComponentCard>

		<!-- Example 3: Custom item snippet (rich rows) -->
		<ComponentCard
			description="Custom row content via the item snippet"
			code={`<SortableList bind:items handle>
	{#snippet item({ item })}
		<div class="flex flex-col">
			<span class="font-medium">{item.title}</span>
			<span class="text-neutral/70 text-sm">{item.description}</span>
		</div>
	{/snippet}
</SortableList>`}
		>
			<SortableList bind:items={features} handle class="w-full max-w-md">
				{#snippet item({ item })}
					<div class="flex flex-col">
						<span class="font-medium">{item.title}</span>
						<span class="text-neutral/70 text-sm">{item.description}</span>
					</div>
				{/snippet}
			</SortableList>
		</ComponentCard>

		<!-- Example 3: Custom handle snippet -->
		<ComponentCard
			description="Custom handle content via the handle snippet"
			code={`<SortableList bind:items>
	{#snippet handle()}
		<span class="text-lg leading-none">⠿</span>
	{/snippet}
</SortableList>`}
		>
			<SortableList bind:items={sizedTasks} class="w-full max-w-md">
				{#snippet handle()}
					<span class="text-lg leading-none">⠿</span>
				{/snippet}
			</SortableList>
		</ComponentCard>

		<!-- Example 4: bind:items with a live order readout -->
		<ComponentCard
			description="Bind items and read the live order"
			code={`<script lang="ts">
	let items = $state([...]);
	const order = $derived(items.map((t) => t.label).join(' → '));
</scr${'ipt'}>

<SortableList bind:items />
<p>{order}</p>`}
		>
			<div class="flex w-full max-w-md flex-col gap-3">
				<SortableList bind:items={bound} />
				<p class="text-neutral/70 text-sm">{boundOrder}</p>
			</div>
		</ComponentCard>

		<!-- Example 5: Sizes -->
		<ComponentCard
			description="Small, normal and large sizes"
			code={`<SortableList bind:items size="small" />
<SortableList bind:items size="normal" />
<SortableList bind:items size="large" />`}
		>
			<div class="grid w-full max-w-3xl gap-6 sm:grid-cols-3">
				<SortableList items={makeTasks().slice(0, 3)} size="small" />
				<SortableList items={makeTasks().slice(0, 3)} size="normal" />
				<SortableList items={makeTasks().slice(0, 3)} size="large" />
			</div>
		</ComponentCard>

		<!-- Example 6: Disabled -->
		<ComponentCard
			description="Disabled renders the rows but blocks reordering"
			code="<SortableList bind:items disabled />"
		>
			<SortableList bind:items={disabledTasks} disabled class="w-full max-w-md" />
		</ComponentCard>
	{/snippet}
</DocPage>
