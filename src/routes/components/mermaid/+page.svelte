<script lang="ts">
	import DocPage from '../../DocPage.svelte';
	import ComponentCard from '../../ComponentCard.svelte';
	import { createComponentControls } from '../../componentControls.svelte.js';
	import Mermaid from '$lib/components/Mermaid/Mermaid.svelte';
	import Button from '$lib/components/Button/Button.svelte';
	import { onDestroy } from 'svelte';

	const controls = createComponentControls([
		{
			name: 'size',
			type: 'segmented',
			label: 'Size',
			value: 'normal',
			options: ['small', 'normal', 'large']
		},
		{ name: 'showControls', type: 'switch', label: 'Controls', value: true },
		{ name: 'mouseWheelZoom', type: 'switch', label: 'Wheel zoom', value: true }
	]);

	const flowchart = `graph TD
    A[Start] --> B{Is it working?}
    B -->|Yes| C[Ship it]
    B -->|No| D[Debug]
    D --> B
    C --> E[Celebrate]`;

	const sequence = `sequenceDiagram
    participant U as User
    participant A as App
    participant S as Server
    U->>A: Click "Load"
    A->>S: GET /data
    S-->>A: 200 OK
    A-->>U: Render result`;

	const pie = `pie showData
    title Traffic sources
    "Search" : 45
    "Direct" : 30
    "Social" : 15
    "Referral" : 10`;

	const gantt = `gantt
    title Project plan
    dateFormat YYYY-MM-DD
    section Design
    Research      :done,    r1, 2024-01-01, 5d
    Mockups       :active,  m1, after r1, 4d
    section Build
    Components    :         b1, after m1, 7d
    Integration   :         b2, after b1, 3d`;

	// A live-editable diagram bound to a textarea.
	let liveChart = $state(`graph LR
    A[Edit me] --> B[See it update]
    B --> C{Live}
    C -->|reactive| A`);

	// Intentionally broken syntax to show the error surface.
	const broken = `graph TD
    A --> B{{{ this is not valid mermaid
    B -->`;

	// Simulate an LLM streaming the diagram source one chunk at a time. Most
	// intermediate prefixes are invalid mermaid; `errorForgiving` holds the last
	// valid frame instead of flashing an error on every chunk.
	const streamTarget = `graph TD
    A[User prompt] --> B[LLM]
    B --> C{Tool call?}
    C -->|Yes| D[Run tool]
    D --> B
    C -->|No| E[Stream answer]`;
	let streamed = $state(streamTarget);
	let streaming = $state(false);
	let streamTimer: ReturnType<typeof setInterval> | undefined;
	const startStream = () => {
		clearInterval(streamTimer);
		streaming = true;
		streamed = '';
		let i = 0;
		streamTimer = setInterval(() => {
			i += 4;
			streamed = streamTarget.slice(0, i);
			if (i >= streamTarget.length) {
				clearInterval(streamTimer);
				streaming = false;
			}
		}, 50);
	};
	onDestroy(() => clearInterval(streamTimer));
</script>

<DocPage
	title="Mermaid"
	subtitle="Render Mermaid diagrams (flowcharts, sequence, gantt, pie, and more) with pan, zoom, fullscreen and download. Mermaid is loaded from cdnjs at runtime and never bundled. The diagram is themed with our design tokens, so it adapts to light and dark automatically."
	component="Mermaid"
	features={[
		'Mermaid loaded from cdnjs at runtime',
		'Pan, zoom, fit and fullscreen controls',
		'role=img with aria-label on SVG',
		'Design-token theming for light and dark',
		'errorForgiving holds last valid frame'
	]}
>
	<ComponentCard
		{controls}
		description="Drag to pan, scroll or pinch to zoom, and use the floating controls (fit, zoom, fullscreen, download). The diagram colors follow the active theme."
		class="!min-h-fit"
		code={`<Mermaid
	size="${controls.value.size}"
	controls={${controls.value.showControls}}
	mouseWheelZoom={${controls.value.mouseWheelZoom}}
	chart={\`graph TD
    A[Start] --> B{Is it working?}
    B -->|Yes| C[Ship it]
    B -->|No| D[Debug]
    D --> B
    C --> E[Celebrate]\`}
/>`}
	>
		<div class="w-full max-w-3xl">
			<Mermaid
				chart={flowchart}
				size={controls.value.size}
				controls={controls.value.showControls}
				mouseWheelZoom={controls.value.mouseWheelZoom}
			/>
		</div>
	</ComponentCard>

	{#snippet examples()}
		<ComponentCard
			description="Drag to pan, scroll or pinch to zoom, and use the floating controls (fit, zoom, fullscreen, download). The diagram colors follow the active theme."
			class="!min-h-fit"
		>
			<div class="w-full max-w-3xl">
				<Mermaid chart={flowchart} />
			</div>
		</ComponentCard>

		<ComponentCard
			description="Any Mermaid diagram type is supported — the same brand theming and pan/zoom controls apply."
			class="!min-h-fit"
		>
			<div class="w-full max-w-3xl">
				<Mermaid chart={sequence} />
			</div>
		</ComponentCard>

		<ComponentCard description="A pie chart, sized with the large viewport." class="!min-h-fit">
			<div class="w-full max-w-3xl">
				<Mermaid chart={pie} size="large" />
			</div>
		</ComponentCard>

		<ComponentCard
			description="A gantt chart. Sections and task states inherit the design tokens."
			class="!min-h-fit !items-start"
		>
			<div class="w-full max-w-3xl">
				<Mermaid chart={gantt} size="large" />
			</div>
		</ComponentCard>

		<ComponentCard
			description="Bind the chart string to an input and the diagram re-renders reactively as you type."
			class="!min-h-fit !items-start"
		>
			<div class="grid w-full max-w-3xl gap-3">
				<textarea
					bind:value={liveChart}
					spellcheck="false"
					rows="5"
					class="border-neutral-muted bg-surface text-neutral focus:border-primary w-full resize-y rounded border px-3 py-2 font-mono text-sm outline-none"
				></textarea>
				<Mermaid chart={liveChart} />
			</div>
		</ComponentCard>

		<ComponentCard
			description="With errorForgiving, transient parse errors while the source streams in are swallowed — the last valid diagram stays on screen instead of flashing an error. Press Stream to replay a token-by-token render."
			class="!min-h-fit !items-start"
		>
			<div class="grid w-full max-w-3xl gap-3">
				<div class="flex items-center gap-3">
					<Button label="Stream diagram" onclick={startStream} loading={streaming} size="small">
						Stream
					</Button>
					<pre
						class="border-neutral-muted bg-surface text-neutral/60 min-h-16 flex-1 overflow-auto rounded border px-3 py-2 font-mono text-xs">{streamed ||
							' '}</pre>
				</div>
				<Mermaid chart={streamed} errorForgiving />
			</div>
		</ComponentCard>

		<ComponentCard
			description="Invalid Mermaid syntax surfaces an inline error message (danger tokens) instead of crashing or injecting Mermaid's own error DOM."
			class="!min-h-fit"
		>
			<div class="w-full max-w-3xl">
				<Mermaid chart={broken} />
			</div>
		</ComponentCard>
	{/snippet}
</DocPage>
