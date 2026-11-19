<script lang="ts">
	import Button from '$lib/components/Button/Button.svelte';
	import Slider from '$lib/components/Form/Slider/Slider.svelte';
	import Stack from '$lib/components/Stack/Stack.svelte';
	import { ThinkingOrb } from '$lib/components/ThinkingOrb/index.js';
	import type {
		ThinkingOrbFrameFunction,
		ThinkingOrbState
	} from '$lib/components/ThinkingOrb/index.js';
	import type { Colors, Sizes } from '$lib/types/theme.js';
	import ComponentCard from '../../ComponentCard.svelte';
	import DocPage from '../../DocPage.svelte';
	import { createComponentControls } from '../../componentControls.svelte.js';

	const states: ThinkingOrbState[] = [
		'working',
		'searching',
		'solving',
		'listening',
		'connecting',
		'weaving',
		'composing',
		'breathing',
		'shaping'
	];
	const colors: Colors[] = [
		'neutral',
		'primary',
		'secondary',
		'info',
		'success',
		'warning',
		'danger'
	];

	const controls = createComponentControls([
		{
			name: 'state',
			type: 'segmented',
			label: 'State',
			value: 'searching',
			options: states
		},
		{
			name: 'color',
			type: 'segmented',
			label: 'Color',
			value: 'neutral',
			options: colors
		},
		{
			name: 'size',
			type: 'segmented',
			label: 'Size',
			value: 'large',
			options: ['small', 'normal', 'large']
		}
	]);

	// Only what differs from the defaults is written in the Usage code.
	const usageProps = $derived(
		[
			`state="${controls.value.state}"`,
			controls.value.color !== 'neutral' && `color="${controls.value.color}"`,
			controls.value.size !== 'normal' && `size="${controls.value.size}"`
		]
			.filter(Boolean)
			.join(' ')
	);

	// A stand-in for an agent: it moves from one activity to the next every few seconds.
	const run: Array<{ state: ThinkingOrbState; text: string }> = [
		{ state: 'breathing', text: 'Thinking about the question' },
		{ state: 'searching', text: 'Searching the documentation' },
		{ state: 'connecting', text: 'Calling the billing service' },
		{ state: 'solving', text: 'Working out the totals' },
		{ state: 'composing', text: 'Writing the answer' }
	];
	let step = $state(0);
	$effect(() => {
		const timer = setInterval(() => (step = (step + 1) % run.length), 2800);
		return () => clearInterval(timer);
	});

	let speed = $state(1);
	let dots = $state(1);
	let dotSize = $state(1);
	let paused = $state(false);

	// A drawing of one's own: a ring of dots, each rising toward the viewer in turn.
	const ripple: ThinkingOrbFrameFunction = (size, time) => {
		const count = Math.max(8, Math.round(size / 3));
		const radius = size * 0.34;
		const dots = [];
		for (let i = 0; i < count; i++) {
			const angle = (i / count) * Math.PI * 2;
			const lift = 0.5 + 0.5 * Math.sin(angle * 2 - time * 1.2);
			dots.push({
				x: size / 2 + Math.cos(angle) * radius * (0.82 + 0.18 * lift),
				y: size / 2 + Math.sin(angle) * radius * (0.82 + 0.18 * lift),
				z: lift,
				r: size * (0.018 + 0.03 * lift),
				white: 0.6 - 0.55 * lift
			});
		}
		return { dots, lines: [] };
	};
</script>

<DocPage
	title="Thinking orb"
	subtitle="Shows what an agent is doing as a small figure of dots: searching, solving, composing and six more."
	component="ThinkingOrb"
	features={[
		'Nine states, each with its own drawing',
		'Three sizes tuned as separate designs, and any size between',
		'A change of state crosses from one drawing to the next',
		'Any colour role, with depth shown on the ink itself',
		'Every orb reads one clock: orbs in the same state move together',
		'Shows a still frame under reduced motion and stops drawing off screen'
	]}
>
	<ComponentCard
		{controls}
		description="Give it what the agent is doing. Each state is a different figure."
		class="mx-auto max-w-3xl"
		code={`<ThinkingOrb ${usageProps} />`}
	>
		<div class="py-lg flex w-full justify-center">
			<ThinkingOrb
				state={controls.value.state as ThinkingOrbState}
				color={controls.value.color as Colors}
				size={controls.value.size as Sizes}
			/>
		</div>
	</ComponentCard>

	{#snippet examples()}
		<ComponentCard
			title="Nine states"
			description="Orbits for work, a scanned globe for a search, a sphere that scrambles and solves itself, a waveform, a constellation, a plait, a sash, a breathing ring and an outline that changes shape."
			class="mx-auto max-w-4xl"
			code={`<ThinkingOrb state="working" size="large" />
<ThinkingOrb state="searching" size="large" />
<ThinkingOrb state="solving" size="large" />
<ThinkingOrb state="listening" size="large" />
<ThinkingOrb state="connecting" size="large" />
<ThinkingOrb state="weaving" size="large" />
<ThinkingOrb state="composing" size="large" />
<ThinkingOrb state="breathing" size="large" />
<ThinkingOrb state="shaping" size="large" />`}
		>
			<div class="gap-lg grid w-full grid-cols-3 justify-items-center">
				{#each states as state (state)}
					<Stack gap="sm" align="center">
						<ThinkingOrb {state} size="large" />
						<span class="text-neutral-readable text-xs">{state}</span>
					</Stack>
				{/each}
			</div>
		</ComponentCard>

		<ComponentCard
			title="Sizes"
			description="`small` is 20 pixels and sits in a line of text, `normal` is 32, `large` is 64. They are separate designs: a small orb draws fewer, bolder dots and moves faster. `diameter` sets any size."
			class="mx-auto max-w-4xl"
			code={`<ThinkingOrb state="searching" size="small" />
<ThinkingOrb state="searching" size="normal" />
<ThinkingOrb state="searching" size="large" />
<ThinkingOrb state="searching" diameter={128} />`}
		>
			<Stack gap="lg" class="w-full">
				{#each ['searching', 'connecting', 'composing'] as const as state (state)}
					<Stack orientation="horizontal" gap="xl" align="center" justify="center" class="w-full">
						<ThinkingOrb {state} size="small" />
						<ThinkingOrb {state} size="normal" />
						<ThinkingOrb {state} size="large" />
						<ThinkingOrb {state} diameter={128} />
					</Stack>
				{/each}
			</Stack>
		</ComponentCard>

		<ComponentCard
			title="Following an agent"
			description="Bind `state` to what the agent does. One drawing crosses into the next, so the orb never cuts."
			class="mx-auto max-w-3xl"
			code={`<script>
	// 'breathing' | 'searching' | 'connecting' | 'solving' | 'composing' ...
	let { activity, text } = $props();
</${'script'}>

<p>
	<ThinkingOrb state={activity} size="small" />
	{text}
</p>`}
		>
			<Stack gap="lg" align="center" class="w-full">
				<ThinkingOrb state={run[step].state} size="large" />
				<p class="gap-sm text-neutral-readable flex items-center text-sm">
					<ThinkingOrb state={run[step].state} size="small" />
					{run[step].text}
				</p>
			</Stack>
		</ComponentCard>

		<ComponentCard
			title="Colours"
			description="`color` takes a role. Depth stays on the ink: far dots fade toward the surface. The ink is the root's text colour, so a text colour class gives any other; on a coloured surface, say which way depth fades with `colorScheme`."
			class="mx-auto max-w-4xl"
			code={`<ThinkingOrb state="working" color="primary" />
<ThinkingOrb state="working" color="success" />
<div class="bg-primary">
	<ThinkingOrb state="weaving" class="text-primary-contrast" colorScheme="dark" />
</div>`}
		>
			<Stack gap="lg" class="w-full">
				{#each ['working', 'listening'] as const as state (state)}
					<div class="gap-md grid w-full grid-cols-4 justify-items-center md:grid-cols-7">
						{#each colors as color (color)}
							<Stack gap="sm" align="center">
								<ThinkingOrb {state} {color} size="large" />
								<span class="text-neutral-readable text-xs">{color}</span>
							</Stack>
						{/each}
					</div>
				{/each}
				<Stack orientation="horizontal" gap="md" justify="center" class="w-full">
					<div class="bg-primary p-md rounded-md">
						<ThinkingOrb
							state="weaving"
							size="large"
							class="text-primary-contrast"
							colorScheme="dark"
						/>
					</div>
					<div class="bg-success p-md rounded-md">
						<ThinkingOrb
							state="searching"
							size="large"
							class="text-success-contrast"
							colorScheme="dark"
						/>
					</div>
				</Stack>
			</Stack>
		</ComponentCard>

		<ComponentCard
			title="Pace and density"
			description="`speed` multiplies the state's own pace, `dots` how many dots are drawn and `dotSize` their radius. `paused` holds the orb on its frame."
			class="mx-auto max-w-3xl"
			code={`<ThinkingOrb
	state="searching"
	size="large"
	speed={${speed}}
	dots={${dots}}
	dotSize={${dotSize}}${paused ? '\n\tpaused' : ''}
/>`}
		>
			<Stack gap="lg" align="center" class="w-full">
				<Stack orientation="horizontal" gap="xl" justify="center" class="w-full">
					{#each ['searching', 'working', 'weaving'] as const as state (state)}
						<ThinkingOrb {state} diameter={96} {speed} {dots} {dotSize} {paused} />
					{/each}
				</Stack>
				<div class="gap-md grid w-full max-w-xl grid-cols-1 md:grid-cols-3">
					<Slider bind:value={speed} min={0.25} max={3} step={0.25} label="Speed" />
					<Slider bind:value={dots} min={0.25} max={2.5} step={0.25} label="Dots" />
					<Slider bind:value={dotSize} min={0.5} max={2} step={0.1} label="Dot size" />
				</div>
				<Button variant="outline" onclick={() => (paused = !paused)}>
					{paused ? 'Resume' : 'Pause'}
				</Button>
			</Stack>
		</ComponentCard>

		<ComponentCard
			title="Tuning a drawing"
			description="`tuning` reaches the knobs of each drawing: hold one outline of the shaping state, flatten the sash, widen the constellation's reach, slow the scan."
			class="mx-auto max-w-4xl"
			code={`<ThinkingOrb state="shaping" tuning={{ shape: 'square' }} />
<ThinkingOrb state="composing" tuning={{ wobble: 0.3, spin: 1 }} />
<ThinkingOrb state="connecting" tuning={{ reach: 1, signals: 12 }} />
<ThinkingOrb state="searching" tuning={{ scanSpeed: 1.5, dim: 0.2 }} />
<ThinkingOrb state="working" tuning={{ particles: 1, trailOpacity: 0.9 }} />`}
		>
			<div class="gap-md grid w-full grid-cols-3 justify-items-center md:grid-cols-5">
				<ThinkingOrb state="shaping" size="large" tuning={{ shape: 'square' }} />
				<ThinkingOrb state="composing" size="large" tuning={{ wobble: 0.3, spin: 1 }} />
				<ThinkingOrb state="connecting" size="large" tuning={{ reach: 1, signals: 12 }} />
				<ThinkingOrb state="searching" size="large" tuning={{ scanSpeed: 1.5, dim: 0.2 }} />
				<ThinkingOrb state="working" size="large" tuning={{ particles: 1, trailOpacity: 0.9 }} />
			</div>
		</ComponentCard>

		<ComponentCard
			title="A drawing of your own"
			description="`frame` replaces the state's drawing: a function from the size and the time to the dots of that instant. The orb sorts them by depth and paints them in its ink."
			class="mx-auto max-w-3xl"
			code={`<script>
	// A ring of dots, each rising toward the viewer in turn.
	const ripple = (size, time) => {
		const count = Math.max(8, Math.round(size / 3));
		const radius = size * 0.34;
		const dots = [];
		for (let i = 0; i < count; i++) {
			const angle = (i / count) * Math.PI * 2;
			const lift = 0.5 + 0.5 * Math.sin(angle * 2 - time * 1.2);
			dots.push({
				x: size / 2 + Math.cos(angle) * radius * (0.82 + 0.18 * lift),
				y: size / 2 + Math.sin(angle) * radius * (0.82 + 0.18 * lift),
				z: lift,
				r: size * (0.018 + 0.03 * lift),
				white: 0.6 - 0.55 * lift
			});
		}
		return { dots, lines: [] };
	};
</${'script'}>

<ThinkingOrb frame={ripple} size="large" label="Syncing…" />`}
		>
			<Stack orientation="horizontal" gap="xl" align="center" justify="center" class="w-full">
				<ThinkingOrb frame={ripple} size="small" label="Syncing…" />
				<ThinkingOrb frame={ripple} size="large" label="Syncing…" />
				<ThinkingOrb frame={ripple} diameter={112} color="primary" label="Syncing…" />
			</Stack>
		</ComponentCard>
	{/snippet}
</DocPage>
