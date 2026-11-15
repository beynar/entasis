<script lang="ts">
	// Kitchen sink for the motion rules: every principle the presets follow, with a live demo and
	// what to look for. The slow-motion control drives the shared playground state, so it also
	// slows the rest of the docs until it is set back to 1×.
	import { resolve } from '$app/paths';
	import Accordion from '$lib/components/Accordion/Accordion.svelte';
	import Button from '$lib/components/Button/Button.svelte';
	import Code from '$lib/components/Code/Code.svelte';
	import Collapsible from '$lib/components/Collapsible/Collapsible.svelte';
	import Dialog from '$lib/components/Dialog/Dialog.svelte';
	import FloatingWindow from '$lib/components/FloatingWindow/FloatingWindow.svelte';
	import Checkbox from '$lib/components/Form/Checkbox/Checkbox.svelte';
	import { PasswordInput } from '$lib/components/Form/PasswordInput/index.js';
	import { Switch } from '$lib/components/Form/Switch/index.js';
	import HoverCard from '$lib/components/HoverCard/HoverCard.svelte';
	import Pagination from '$lib/components/Pagination/Pagination.svelte';
	import Popover from '$lib/components/Popover/Popover.svelte';
	import PopupMenu from '$lib/components/PopupMenu/PopupMenu.svelte';
	import SegmentedControl from '$lib/components/SegmentedControl/SegmentedControl.svelte';
	import { useTheme } from '$lib/components/Theme/theme.state.svelte.js';
	import { Toaster, toast } from '$lib/components/Toast/index.js';
	import Tooltip from '$lib/components/Tooltip/Tooltip.svelte';
	import type { MenuItem } from '$lib/components/Menu/menu.props.js';
	import { useRuntimeThemePlayground } from '../../../runtimeThemePlayground.svelte.js';

	const theme = useTheme();
	const playground = useRuntimeThemePlayground();

	const speeds = [
		{ value: '1', label: '1×' },
		{ value: '2', label: '2×' },
		{ value: '4', label: '4×' },
		{ value: '8', label: '8×' }
	];
	const speed = {
		get value() {
			return String(playground.motionSpeed);
		},
		set value(next: string) {
			playground.motionSpeed = Number(next);
		}
	};

	const ms = (step: keyof typeof theme.motion.duration) => theme.motion.duration[step];
	const exitMs = (step: keyof typeof theme.motion.duration) =>
		Math.round(ms(step) * theme.motion.exitRatio);

	const rows: MenuItem[] = [
		'New file',
		'Open…',
		'Open recent',
		'Save',
		'Save as…',
		'Duplicate',
		'Rename',
		'Move to…',
		'Export',
		'Close'
	].map((title) => ({ type: 'option', title }));

	let dialogOpen = $state(false);
	let drawerOpen = $state(false);
	let windowOpen = $state(false);
	let windowMinimized = $state(false);
	let indeterminate = $state(true);
	let page = $state(3);
	let view = $state('grid');

	const viewItems = [
		{ value: 'grid', label: 'Grid' },
		{ value: 'list', label: 'List' },
		{ value: 'board', label: 'Board' },
		{ value: 'calendar', label: 'Calendar' }
	];

	const accordionItems = [
		{
			title: 'What weight does a reveal get?',
			content: 'The moderate step (250ms), eased out, and it folds away in 80% of that.'
		},
		{
			title: 'Do every disclosure share it?',
			content: 'Accordion, Collapsible, Field messages, Sidebar groups, FileInput, MetadataList.'
		},
		{
			title: 'And with reduced motion?',
			content: 'Every duration collapses to 0: the content appears and disappears at once.'
		}
	];

	const sample = `const greeting = 'Copy me, then watch the icon';\nconsole.log(greeting);`;
</script>

{#snippet card(numbers: string, title: string, rule: string, steps: string[])}
	<header class="flex flex-col gap-1">
		<span class="text-primary-readable font-mono text-xs">{numbers}</span>
		<h2 class="text-base font-semibold">{title}</h2>
		<p class="text-neutral/80 text-sm leading-relaxed">{rule}</p>
		<ul class="text-neutral/70 mt-1 list-disc space-y-0.5 ps-5 text-sm">
			{#each steps as step (step)}
				<li>{step}</li>
			{/each}
		</ul>
	</header>
{/snippet}

<Toaster />

<article class="text-neutral mx-auto flex w-full max-w-5xl flex-col gap-10 pb-24">
	<header class="flex max-w-3xl flex-col gap-3">
		<a class="text-primary-readable text-sm" href={resolve('/docs/motion')}>← Motion</a>
		<h1 class="text-3xl font-semibold">Motion principles</h1>
		<p class="text-balance">
			Every rule the component presets follow, with something to try. Most of it happens in
			150–300ms, so slow the whole library down first: the timing rules stay true at any speed, they
			just become visible.
		</p>
	</header>

	<section
		class="border-neutral-muted bg-surface-raised flex flex-col gap-4 rounded-xl border p-5 sm:flex-row sm:items-start sm:justify-between"
	>
		<div class="flex max-w-xl flex-col gap-2 text-sm leading-relaxed">
			<h2 class="text-base font-semibold">How to test</h2>
			<p>
				<strong>Slow motion</strong> multiplies every duration step (it is the playground's motion speed,
				so it follows you to other pages: set it back to 1× when done).
			</p>
			<p>
				<strong>Frame by frame</strong>: Chrome DevTools → ⋮ → More tools → Animations, set the
				speed to 10%, then scrub the timeline of the animation you just triggered.
			</p>
			<p>
				<strong>Tune it</strong>: the
				<a class="text-primary-readable" href={resolve('/docs/motion')}>Motion page</a> has sliders for
				the shape tokens (exit ratio, surface scale, press scale, stretch); they apply here too.
			</p>
			<p>
				<strong>Reduced motion</strong>: DevTools → ⋮ → More tools → Rendering → Emulate CSS
				<code>prefers-reduced-motion: reduce</code> (or the OS setting). Everything below should then
				appear and disappear at once, menu rows included.
			</p>
		</div>
		<div class="flex flex-col items-start gap-2">
			<span class="text-sm font-medium">Slow motion</span>
			<SegmentedControl items={speeds} bind:value={speed.value} size="small" />
			<span class="text-neutral/70 font-mono text-xs">
				fast {ms('fast')} · normal {ms('normal')} · moderate {ms('moderate')} · slow {ms('slow')} ms
			</span>
		</div>
	</section>

	<div class="grid gap-5 md:grid-cols-2">
		<!-- 2 -->
		<section class="border-neutral-muted flex flex-col gap-4 rounded-xl border p-5 md:col-span-2">
			{@render card(
				'#2 · #13',
				'The smaller the surface, the quicker',
				`Durations rank surfaces by size. Each one leaves in ${Math.round(theme.motion.exitRatio * 100)}% of the time it took to arrive.`,
				[
					'Open them one after another and compare: the tooltip is the snappiest, the drawer the slowest.',
					'Close each one: the exit is noticeably quicker than the entrance.'
				]
			)}
			<div class="flex flex-wrap items-center gap-3">
				<Tooltip
					content="A tooltip"
					trigger={{ content: `Tooltip · ${ms('fast')}→${exitMs('fast')}`, variant: 'outline' }}
				/>
				<PopupMenu
					trigger={{ content: `Menu · ${ms('normal')}→${exitMs('normal')}`, variant: 'outline' }}
					menu={{ items: rows.slice(0, 4) }}
				/>
				<Button variant="outline" onclick={() => (dialogOpen = true)}>
					Dialog · {ms('moderate')}→{exitMs('moderate')}
				</Button>
				<Button variant="outline" onclick={() => (drawerOpen = true)}>
					Drawer · {ms('slow')}→{exitMs('slow')}
				</Button>
			</div>
		</section>

		<!-- 1, 9, 10, 11 -->
		<section class="border-neutral-muted flex flex-col gap-4 rounded-xl border p-5">
			{@render card(
				'#1 · #9 · #10 · #11',
				'Popovers grow out of their trigger',
				`They ease out on the way in, start at ${theme.motion.surfaceScale} rather than from nothing, and scale from the corner facing the trigger, then shrink back into it.`,
				[
					'Open each one in slow motion: it grows from the side touching its button.',
					'Scroll so the popover flips above: the origin flips with it.',
					'The movement decelerates into place; it never overshoots.'
				]
			)}
			<div class="flex flex-wrap items-center gap-3">
				<Popover trigger={{ content: 'Popover', variant: 'outline' }} position="bottom-start">
					<div class="w-56 p-1 text-sm">
						Scales in from {theme.motion.surfaceScale}, from its top-left corner.
					</div>
				</Popover>
				<Popover trigger={{ content: 'Opens above', variant: 'outline' }} position="top-end">
					<div class="w-56 p-1 text-sm">Placed top-end: it grows from its bottom-right corner.</div>
				</Popover>
				<HoverCard trigger={{ content: '@entasis', variant: 'link' }} title="@entasis">
					<p class="text-neutral/70 text-sm">Hover cards follow the same rule.</p>
				</HoverCard>
			</div>
		</section>

		<!-- 4 -->
		<section class="border-neutral-muted flex flex-col gap-4 rounded-xl border p-5">
			{@render card(
				'#4',
				'A pressed button gives way',
				`While held down, a button shrinks to ${theme.motion.pressScale}; it springs back on release. Disabled and loading buttons stay still.`,
				[
					'Press and hold each button: it sinks slightly, as if pushed.',
					'Hold the disabled one: nothing moves.'
				]
			)}
			<div class="flex flex-wrap items-center gap-3">
				<Button color="primary">Primary</Button>
				<Button variant="outline">Outline</Button>
				<Button variant="ghost">Ghost</Button>
				<Button disabled>Disabled</Button>
			</div>
			<Pagination bind:value={page} totalPages={8} size="small" />
		</section>

		<!-- 5 -->
		<section class="border-neutral-muted flex flex-col gap-4 rounded-xl border p-5">
			{@render card(
				'#5',
				'What moves stretches a little',
				'As a switch thumb slides across, it stretches along its path, longest halfway, and lands round again.',
				[
					'Click the switch at 4×: the thumb is longest in the middle of its trip, round at both ends.',
					'Pressing alone changes nothing; the stretch comes with the movement.'
				]
			)}
			<div class="flex flex-col gap-3">
				<Switch label="Notifications" />
				<Switch label="Already on" value={true} />
				<Switch label="Disabled" disabled />
			</div>
		</section>

		<!-- 6 -->
		<section class="border-neutral-muted flex flex-col gap-4 rounded-xl border p-5">
			{@render card(
				'#6',
				'Travel follows a curve',
				'A floating window flies to its dock chip, and back, along an arc rather than a straight line: the vertical part of the trip leads.',
				[
					'Open the window, then use its minimize button at 4×: it drops, then slides to the chip.',
					'Click the chip to restore it along the same kind of arc.'
				]
			)}
			<div>
				<Button
					variant="outline"
					onclick={() => {
						windowOpen = true;
						windowMinimized = false;
					}}>Open floating window</Button
				>
			</div>
		</section>

		<!-- 8, 18 -->
		<section class="border-neutral-muted flex flex-col gap-4 rounded-xl border p-5">
			{@render card(
				'#8 · #18',
				'One indicator travels between items',
				'The selection is a single shared element that moves from item to item, accelerating then decelerating (ease in-out), as anything going from one place to another should.',
				[
					'Jump from Grid to Calendar: the indicator slides and resizes, it does not fade.',
					'Notice it starts gently and lands gently.'
				]
			)}
			<SegmentedControl items={viewItems} bind:value={view} />
		</section>

		<!-- 7, 14, 16 -->
		<section class="border-neutral-muted flex flex-col gap-4 rounded-xl border p-5 md:col-span-2">
			{@render card(
				'#7 · #14 · #16',
				'Icons crossfade through a blur',
				'When an icon changes, the old one shrinks and blurs away while the new one grows in sharp: both are visible for a moment instead of a hard cut. A confirmation pops as it arrives.',
				[
					'Copy the code: the copy icon blurs into a check that pops, then swaps back after a moment.',
					'Toggle the password visibility: the eye opens and closes through the same crossfade.',
					'Toggle the checkbox between checked and mixed: the check and the dash morph.'
				]
			)}
			<div class="grid items-start gap-5 md:grid-cols-3">
				<Code code={sample} language="ts" />
				<PasswordInput label="Password" value="hunter2-but-longer" />
				<div class="flex flex-col gap-3">
					<Checkbox label="Select all" value={true} {indeterminate} />
					<Button size="small" variant="outline" onclick={() => (indeterminate = !indeterminate)}>
						{indeterminate ? 'Show checked' : 'Show mixed'}
					</Button>
				</div>
			</div>
		</section>

		<!-- 15 -->
		<section class="border-neutral-muted flex flex-col gap-4 rounded-xl border p-5">
			{@render card(
				'#15',
				'Reveals get some weight',
				'Content a disclosure reveals in place takes the moderate step: a little longer than a menu, so the page reflows calmly.',
				[
					'Open and close each item: the same timing everywhere, eased out on the way in.',
					'The closing is quicker than the opening.'
				]
			)}
			<Accordion items={accordionItems} />
			<Collapsible>
				{#snippet trigger()}
					<span class="px-2 text-sm font-semibold">Collapsible: show three more lines</span>
				{/snippet}
				<div class="flex flex-col gap-1 px-2 pb-1 text-sm">
					<span>First revealed line</span>
					<span>Second revealed line</span>
					<span>Third revealed line</span>
				</div>
			</Collapsible>
		</section>

		<!-- 17 -->
		<section class="border-neutral-muted flex flex-col gap-4 rounded-xl border p-5">
			{@render card(
				'#17',
				'Limits are elastic',
				'Pulled past where it can go, a surface follows less and less, then springs back on release.',
				[
					'Open the drawer and drag its handle (the bar at the top) upward: it stretches a few pixels, harder and harder, then returns. Dragging down still dismisses.',
					'Fire a toast and drag it upward, away from the edge it would be dismissed to: it resists.',
					'On a phone, pulling the drawer body upward scrolls its content instead.'
				]
			)}
			<div class="flex flex-wrap items-center gap-3">
				<Button variant="outline" onclick={() => (drawerOpen = true)}>Open bottom drawer</Button>
				<Button
					variant="outline"
					onclick={() =>
						toast.neutral({ title: 'Drag me upward', description: 'Then down to dismiss.' })}
				>
					Fire a toast
				</Button>
			</div>
		</section>

		<!-- 12 -->
		<section class="border-neutral-muted flex flex-col gap-4 rounded-xl border p-5 md:col-span-2">
			{@render card(
				'#12',
				'No springs on transitions',
				'Nothing above bounces past its target: entrances decelerate into place and exits leave cleanly. The only overshoot is deliberate feedback (the copy check pop). An app can still opt in with the emphasized role or a backOut easing through <Theme motion>.',
				['Watch any popover or dialog at 8×: it settles without wobbling.']
			)}
		</section>
	</div>
</article>

<Dialog bind:open={dialogOpen} title="A dialog" description="Moderate step: 250ms in, 200ms out.">
	<p class="text-sm">Close it and compare the two directions.</p>
</Dialog>

<Dialog
	bind:open={drawerOpen}
	type="drawerBottom"
	title="A bottom drawer"
	description="Slow step: 300ms in, 240ms out."
>
	<p class="text-sm">
		Drag the handle at the top upward: the drawer stretches a little and springs back. Drag it down
		to dismiss.
	</p>
</Dialog>

<FloatingWindow bind:open={windowOpen} bind:minimized={windowMinimized} title="Notes" minimizable>
	<p class="p-2 text-sm">Minimize me and watch the path to the dock.</p>
</FloatingWindow>
