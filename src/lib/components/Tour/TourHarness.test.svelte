<script lang="ts">
	// Harness for `tour.browser.test.ts`: a page with a few targets (one in a scroller, one far
	// below, one that can sit in an open Dialog) and a Tour over them.
	import Theme from '../Theme/Theme.svelte';
	import Dialog from '../Dialog/Dialog.svelte';
	import Tour from './Tour.svelte';
	import { tourTarget } from './tour.targets.svelte.js';
	import type { TourProps } from './tour.props.js';

	let {
		steps,
		log = [],
		reduceMotion = false,
		dialog = false,
		open = $bindable(false),
		step = $bindable(),
		...tour
	}: Omit<TourProps, 'open' | 'step'> & {
		log?: string[];
		reduceMotion?: boolean;
		dialog?: boolean;
		open?: boolean;
		step?: number;
	} = $props();
</script>

<Theme {reduceMotion}>
	<div id="page" class="flex flex-col items-start gap-6 p-12">
		<button id="opener" type="button" onclick={() => (open = true)}>Start tour</button>
		<button
			id="first"
			type="button"
			class="rounded-lg px-4 py-2"
			style="width: 120px; height: 40px"
			onclick={() => log.push('first-click')}
		>
			First
		</button>
		<div id="sibling">
			<button id="other" type="button" onclick={() => log.push('other-click')}>Other</button>
			<span id="already-inert" inert>Already inert</span>
		</div>
		<button
			id="named"
			type="button"
			{@attach tourTarget('named-target')}
			onclick={() => log.push('named-click')}
		>
			Named
		</button>
		<div id="scroller" style="height: 120px; width: 240px; overflow: auto">
			<div style="height: 600px; padding-top: 300px">
				<button id="deep" type="button">Deep</button>
			</div>
		</div>
		<input id="field" aria-label="Field" />
		<div style="height: 1600px"></div>
		<button id="far" type="button">Far</button>
	</div>
	<Dialog open={dialog} title="Settings" closeOnClickOutside>
		<button id="in-dialog" type="button" onclick={() => log.push('dialog-click')}>
			Inside the dialog
		</button>
	</Dialog>
	<Tour {...tour} {steps} bind:open bind:step />
</Theme>
