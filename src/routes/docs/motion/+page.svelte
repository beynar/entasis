<script lang="ts">
	import { resolve } from '$app/paths';
	import Button from '$lib/components/Button/Button.svelte';
	import Code from '$lib/components/Code/Code.svelte';
	import Dialog from '$lib/components/Dialog/Dialog.svelte';
	import Slider from '$lib/components/Form/Slider/Slider.svelte';
	import { Switch } from '$lib/components/Form/Switch/index.js';
	import SegmentedControl from '$lib/components/SegmentedControl/SegmentedControl.svelte';
	import { useTheme } from '$lib/components/Theme/theme.state.svelte.js';
	import {
		defaultMotionTokens,
		motionDurationSteps,
		motionEasingRoles
	} from '$lib/tailwind/scales.js';
	import type { MotionDurationToken, MotionEasingToken } from '$lib/utils/motion/index.js';
	import type { DialogType } from '$lib/components/Dialog/index.js';
	import {
		runtimeMotionEasingPresetNames,
		runtimeMotionEasingPresets,
		useRuntimeThemePlayground
	} from '../../runtimeThemePlayground.svelte.js';
	import RetunedDialog from './RetunedDialog.svelte';

	const theme = useTheme();
	// The page shares the playground state: the layout feeds it to `<Theme motion>` and
	// `designTokens.motion` while this route is active, so the sliders below retune the
	// real application, not a sandbox.
	const playground = useRuntimeThemePlayground();

	const durationRoles: Record<MotionDurationToken, string> = {
		instant: 'No animation; the state change is immediate.',
		fast: 'Hover and press feedback, small icon swaps.',
		normal: 'The default: dialogs, popovers, list transitions.',
		slow: 'Large surfaces travelling a long distance.',
		slower: 'Deliberate, attention-carrying reveals.'
	};
	const easingRoleUse: Record<MotionEasingToken, string> = {
		standard: 'Symmetric moves that both enter and leave.',
		enter: 'Elements arriving on screen; decelerates into place.',
		exit: 'Elements leaving; accelerates away.',
		emphasized: 'A touch of overshoot for playful, noticeable motion.'
	};

	// Static class per role so Tailwind sees every utility in the source.
	const easeClass: Record<MotionEasingToken, string> = {
		standard: 'ease-standard',
		enter: 'ease-enter',
		exit: 'ease-exit',
		emphasized: 'ease-emphasized'
	};
	const layers = [
		{
			step: '1',
			title: 'Tokens',
			body: 'Durations and easing roles declared on <Theme motion>, plus the CSS variables the utilities read.'
		},
		{
			step: '2',
			title: 'Presets',
			body: 'Each component keeps a motion() preset in the reserved motion slot of its own theme.'
		},
		{
			step: '3',
			title: 'Overrides',
			body: 'Registry, subtree setter, instance theme, instance transition — deep-merged in that order.'
		}
	];

	const easingItems = runtimeMotionEasingPresetNames.map((name) => ({
		value: name,
		label: runtimeMotionEasingPresets[name].label
	}));
	const durationItems = [
		{ value: 'fast', label: 'fast' },
		{ value: 'normal', label: 'normal' },
		{ value: 'slow', label: 'slow' },
		{ value: 'slower', label: 'slower' }
	] as const satisfies ReadonlyArray<{ value: MotionDurationToken; label: string }>;
	const easingRoleItems = [
		{ value: 'standard', label: 'standard' },
		{ value: 'enter', label: 'enter' },
		{ value: 'exit', label: 'exit' },
		{ value: 'emphasized', label: 'emphasized' }
	] as const satisfies ReadonlyArray<{ value: MotionEasingToken; label: string }>;
	const dialogTypeItems = [
		{ value: 'modal', label: 'modal' },
		{ value: 'drawerRight', label: 'drawerRight' },
		{ value: 'drawerBottom', label: 'drawerBottom' }
	] as const satisfies ReadonlyArray<{ value: DialogType; label: string }>;

	// The segmented controls narrow their bound value to the options they list.
	type DemoDurationToken = (typeof durationItems)[number]['value'];
	type DemoDialogType = (typeof dialogTypeItems)[number]['value'];

	let retunedDuration = $state<DemoDurationToken>('slower');
	let retunedEasing = $state<MotionEasingToken>('emphasized');
	let dialogType = $state<DemoDialogType>('modal');
	let cssDemoOn = $state(false);

	const formatMultiplier = (value: number) => `${Number(value.toFixed(2))}×`;
	// 0× collapses every duration step to 0 ms: the whole app switches instantly.
	const formatSpeed = (value: number) => (value === 0 ? 'instant' : formatMultiplier(value));

	const themeMotionSnippet = $derived(`<script lang="ts">
	import { Theme } from 'entasis/theme';

	let { children } = $props();
</scr${'ipt'}>

<Theme
	motion={{
		duration: { normal: ${playground.motion.duration?.normal}, slow: ${playground.motion.duration?.slow} },
		easing: { standard: '${playground.motion.easing?.standard}', enter: '${playground.motion.easing?.enter}' }
	}}
>
	{@render children()}
</Theme>`);

	const motionSlotSnippet = `import { cva, type InferComponentTheme } from 'entasis/cva';
import { motion, useComponentMotion } from 'entasis/motion';

export const defaultDialogMotion = motion({
	base: {
		in: { x: 0, y: 0, scale: 0.98, opacity: 0 },
		out: { x: 0, y: 0, scale: 0.98, opacity: 0 },
		duration: 'normal',
		easing: 'standard'
	},
	variants: {
		type: {
			modal: {},
			drawerRight: { in: { x: '100%' }, out: { x: '100%' } }
		}
	},
	defaultVariants: { type: 'modal' }
});

// The reserved \`motion\` slot sits next to the class slots.
export const dialogTheme = { motion: defaultDialogMotion, root: defaultDialog };
export const useDialogMotion = () => useComponentMotion('dialog', defaultDialogMotion);`;

	const ladderSnippet = $derived(`<script lang="ts">
	import { Theme } from 'entasis/theme';
	import { Dialog, setDialogTheme } from 'entasis/dialog';

	// 2. every dialog in the app
	// 3. every dialog under this component
	setDialogTheme({ motion: { duration: '${retunedDuration}', easing: '${retunedEasing}' } });
</scr${'ipt'}>

<Theme components={{ dialog: { motion: { easing: 'enter' } } }}>
	<!-- 4. this instance only -->
	<Dialog theme={{ motion: { duration: 'fast' } }} title="Retuned" />

	<!-- 5. wins over every motion override -->
	<Dialog transition={{ in: { y: 24 }, out: { y: 24 } }} title="Explicit" />
</Theme>`);

	const reducedMotionSnippet = `<script lang="ts">
	import { Theme } from 'entasis/theme';

	let { children } = $props();
</scr${'ipt'}>

<!-- Omit the prop to follow the OS setting instead of forcing it. -->
<Theme reduceMotion={true}>
	{@render children()}
</Theme>`;

	const utilitiesSnippet = `<div class="transition-transform duration-normal ease-emphasized hover:scale-105">
	Utilities read the same variables the presets resolve.
</div>`;
</script>

<article class="text-neutral mx-auto flex w-full max-w-4xl flex-col gap-14 pb-24">
	<header class="flex max-w-3xl flex-col gap-3">
		<h1 class="text-3xl font-semibold">Motion</h1>
		<p class="text-balance">
			Motion is a token scale, not a pile of per-component magic numbers. Five duration steps and
			four easing roles are declared once on <code>&lt;Theme&gt;</code>; every component resolves
			its transition against them, and so do the
			<code>duration-*</code> / <code>ease-*</code> CSS utilities.
		</p>
	</header>

	<section class="grid gap-4 sm:grid-cols-3">
		{#each layers as layer (layer.step)}
			<div
				class="border-neutral-muted bg-surface-raised raised-sm grid gap-2 rounded-xl border p-4"
			>
				<span class="text-primary-readable font-mono text-xs">Layer {layer.step}</span>
				<h2 class="text-base font-semibold">{layer.title}</h2>
				<p class="text-neutral/70 text-sm leading-relaxed">{layer.body}</p>
			</div>
		{/each}
	</section>

	<section class="flex flex-col gap-5">
		<div class="max-w-3xl">
			<h2 class="text-lg font-semibold">1. Tokens</h2>
			<p class="mt-1 text-sm leading-relaxed">
				Durations are milliseconds, easings are names from the library's easing set. A token you
				omit keeps its default. The Tailwind plugin writes the variables at build time;
				<code>&lt;Theme motion&gt;</code> and <code>designTokens.motion</code> rewrite them at runtime.
			</p>
		</div>

		<div class="border-neutral-muted overflow-x-auto rounded-xl border">
			<table class="w-full min-w-lg text-left text-sm">
				<thead class="border-neutral-muted bg-surface-raised border-b">
					<tr>
						<th class="px-4 py-2 font-medium">Duration</th>
						<th class="px-4 py-2 font-medium">Default</th>
						<th class="px-4 py-2 font-medium">Current</th>
						<th class="px-4 py-2 font-medium">Use</th>
					</tr>
				</thead>
				<tbody class="divide-neutral-muted/60 divide-y">
					{#each motionDurationSteps as step (step)}
						<tr>
							<td class="text-primary-readable px-4 py-2 font-mono">{step}</td>
							<td class="px-4 py-2 font-mono">{defaultMotionTokens.duration[step]}ms</td>
							<td class="px-4 py-2 font-mono">{theme?.motion.duration[step]}ms</td>
							<td class="text-neutral/70 px-4 py-2">{durationRoles[step]}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>

		<div class="border-neutral-muted overflow-x-auto rounded-xl border">
			<table class="w-full min-w-lg text-left text-sm">
				<thead class="border-neutral-muted bg-surface-raised border-b">
					<tr>
						<th class="px-4 py-2 font-medium">Easing role</th>
						<th class="px-4 py-2 font-medium">Default</th>
						<th class="px-4 py-2 font-medium">Current</th>
						<th class="px-4 py-2 font-medium">Use</th>
					</tr>
				</thead>
				<tbody class="divide-neutral-muted/60 divide-y">
					{#each motionEasingRoles as role (role)}
						<tr>
							<td class="text-primary-readable px-4 py-2 font-mono">{role}</td>
							<td class="px-4 py-2 font-mono">{defaultMotionTokens.easing[role]}</td>
							<td class="px-4 py-2 font-mono">{theme?.motion.easing[role]}</td>
							<td class="text-neutral/70 px-4 py-2">{easingRoleUse[role]}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>

		<Code language="svelte" code={themeMotionSnippet} />
	</section>

	<section class="flex flex-col gap-5">
		<div class="max-w-3xl">
			<h2 class="text-lg font-semibold">Live token scale</h2>
			<p class="mt-1 text-sm leading-relaxed">
				These controls drive the real <code>&lt;Theme&gt;</code> wrapping this documentation site while
				you stay on this page. Speed scales all five duration steps together; the easing kit re-points
				the four roles. Open a dialog or hover the card to feel the difference.
			</p>
		</div>

		<div
			class="border-neutral-muted bg-surface-raised gap-layout-sm p-layout-sm grid rounded-xl border"
		>
			<Slider
				label="Speed"
				bind:value={playground.motionSpeed}
				min={0}
				max={2}
				step={0.05}
				showValue
				formatValue={formatSpeed}
			/>
			<div class="gap-xs grid grid-cols-5 text-center">
				{#each motionDurationSteps as step (step)}
					<div class="gap-micro grid">
						<span class="text-neutral/70 text-xs uppercase">{step}</span>
						<span class="text-xs font-medium">{theme?.motion.duration[step]}ms</span>
					</div>
				{/each}
			</div>
			<div class="gap-md grid">
				<span class="text-sm font-medium">Easing kit</span>
				<SegmentedControl
					items={easingItems}
					bind:value={playground.motionEasing}
					size="small"
					label="Motion easing kit"
					class="w-full"
				/>
			</div>
			<div class="flex flex-wrap items-center gap-3">
				<Dialog
					type="modal"
					size="small"
					title="Theme-scale dialog"
					description="Uses the dialog preset with the tokens above."
					trigger={{ content: 'Open dialog', variant: 'outline', color: 'neutral' }}
				>
					<p class="text-neutral/70 text-sm">
						Every duration in this transition came from the scale you just tuned.
					</p>
				</Dialog>
				<Button
					variant="outline"
					color="neutral"
					onclick={() => playground.reset()}
					disabled={playground.hasDefaultMotion}
				>
					Reset motion
				</Button>
			</div>
		</div>
	</section>

	<section class="flex flex-col gap-5">
		<div class="max-w-3xl">
			<h2 class="text-lg font-semibold">2. The <code>motion</code> slot</h2>
			<p class="mt-1 text-sm leading-relaxed">
				<code>motion()</code> is to a transition what <code>cva()</code> is to classes: a base spec,
				optional variants, and a resolver. A component keeps its preset in the reserved
				<code>motion</code>
				slot of its <code>*.theme.ts</code>, so the same <code>theme</code> prop covers classes and
				motion. Leaving <code>duration</code> / <code>easing</code> as token names is what lets a
				<code>&lt;Theme motion&gt;</code> retune and reduced motion reach the component.
			</p>
		</div>
		<Code language="typescript" code={motionSlotSnippet} />
		<p class="text-neutral/70 max-w-3xl text-sm leading-relaxed">
			The Structure tab of every component page lists its <code>motion</code> slot next to the class
			slots, with the variants it keys on — see
			<a class="text-primary-readable underline" href={resolve('/components/dialog')}>Dialog</a>.
		</p>
	</section>

	<section class="flex flex-col gap-5">
		<div class="max-w-3xl">
			<h2 class="text-lg font-semibold">3. The override ladder</h2>
			<p class="mt-1 text-sm leading-relaxed">
				Motion overrides are always deep-merged (there is no <code>override: true</code> for motion; that
				flag is class-only). Lowest priority first:
			</p>
			<ol class="mt-3 grid list-decimal gap-1 pl-5 text-sm leading-relaxed">
				<li>the component's own preset, from its theme's <code>motion</code> slot;</li>
				<li>
					<code
						>&lt;Theme components=&lbrace;&lbrace; dialog: &lbrace; motion &rbrace;
						&rbrace;&rbrace;&gt;</code
					> — the app-wide registry;
				</li>
				<li>
					<code>setDialogTheme(&lbrace; motion &rbrace;)</code> — every dialog in that subtree;
				</li>
				<li>the instance <code>theme=&lbrace;&lbrace; motion &rbrace;&rbrace;</code> slot;</li>
				<li>
					the instance <code>transition</code> prop — a side it names (<code>in</code> /
					<code>out</code>) replaces the merged one, then picks the tokens back up.
				</li>
			</ol>
		</div>
		<Code language="svelte" code={ladderSnippet} />

		<div
			class="border-neutral-muted bg-surface-raised gap-layout-sm p-layout-sm grid rounded-xl border"
		>
			<div class="gap-md grid sm:grid-cols-3">
				<div class="grid gap-2">
					<span class="text-sm font-medium">Duration token</span>
					<SegmentedControl
						items={durationItems}
						bind:value={retunedDuration}
						size="small"
						label="Retuned duration token"
						class="w-full"
					/>
				</div>
				<div class="grid gap-2">
					<span class="text-sm font-medium">Easing role</span>
					<SegmentedControl
						items={easingRoleItems}
						bind:value={retunedEasing}
						size="small"
						label="Retuned easing role"
						class="w-full"
					/>
				</div>
				<div class="grid gap-2">
					<span class="text-sm font-medium">Dialog type</span>
					<SegmentedControl
						items={dialogTypeItems}
						bind:value={dialogType}
						size="small"
						label="Dialog type"
						class="w-full"
					/>
				</div>
			</div>

			<div class="flex flex-wrap items-center gap-3">
				<RetunedDialog duration={retunedDuration} easing={retunedEasing} type={dialogType} />
				<Dialog
					type={dialogType}
					size="small"
					title="Default dialog"
					description="No override: the component preset plus the Theme scale."
					trigger={{ content: 'Open default dialog', variant: 'outline', color: 'neutral' }}
				>
					<p class="text-neutral/70 text-sm">
						Same type, same tokens, untouched preset — open both to compare.
					</p>
				</Dialog>
			</div>
			<p class="text-neutral/70 text-xs">
				The retuned dialog sits under a component that calls
				<code>setDialogTheme(&lbrace; motion &rbrace;)</code>; the default one sits outside it.
			</p>
		</div>
	</section>

	<section class="flex flex-col gap-5">
		<div class="max-w-3xl">
			<h2 class="text-lg font-semibold">Reduced motion</h2>
			<p class="mt-1 text-sm leading-relaxed">
				<code>ThemeState.preferReducesMotion</code> is the Theme's <code>reduceMotion</code> prop
				when set, otherwise the OS
				<code>prefers-reduced-motion</code> setting. When it is true every resolved duration
				collapses to 0 — last, after every override, so no component can animate around it. The same
				preference is mirrored onto <code>&lt;html&gt;</code> so CSS-only animations honour it too.
			</p>
			<p class="text-neutral/70 mt-2 text-sm">
				Resolved on this page: <code class="font-mono"
					>{theme?.preferReducesMotion ? 'reduced' : 'full motion'}</code
				>
			</p>
		</div>
		<Code language="svelte" code={reducedMotionSnippet} />
	</section>

	<section class="flex flex-col gap-5">
		<div class="max-w-3xl">
			<h2 class="text-lg font-semibold">CSS utilities</h2>
			<p class="mt-1 text-sm leading-relaxed">
				The same scale is available to plain CSS transitions and animations:
				<code>duration-instant|fast|normal|slow|slower</code> and
				<code>ease-standard|enter|exit|emphasized</code>, backed by the
				<code>--duration-*</code> / <code>--ease-*</code> variables. Use them instead of
				<code>duration-200</code> so hand-written motion moves with the theme.
			</p>
		</div>
		<Code language="svelte" code={utilitiesSnippet} />

		<div
			class="border-neutral-muted bg-surface-raised gap-layout-sm p-layout-sm grid rounded-xl border"
		>
			<Switch label="Animate the utility demo" bind:value={cssDemoOn} />
			<div class="grid gap-3">
				{#each motionEasingRoles as role (role)}
					<div class="flex items-center gap-3">
						<span class="text-neutral/70 w-28 shrink-0 font-mono text-xs">ease-{role}</span>
						<div
							class="bg-surface-recessed h-6 flex-1 overflow-hidden rounded-full"
							style="container-type: inline-size"
						>
							<div
								class="bg-primary duration-slower h-full w-10 rounded-full transition-transform {easeClass[
									role
								]} {cssDemoOn ? 'translate-x-[calc(100cqw-2.5rem)]' : 'translate-x-0'}"
							></div>
						</div>
					</div>
				{/each}
			</div>
			<p class="text-neutral/70 text-xs">
				All four bars run for <code class="font-mono">duration-slower</code> — only the easing role differs,
				and the speed slider above rescales them all.
			</p>
		</div>
	</section>
</article>
