<script lang="ts">
	// Harness for `popover.browser.test.ts`: the popovers that hold dialog content (DateSelector,
	// ColorInput, MediaVolume), a modal popover and arrow placements, with controls around them.
	import Theme from '../Theme/Theme.svelte';
	import Popover from './Popover.svelte';
	import DateSelector from '../Form/DateSelector/DateSelector.svelte';
	import ColorInput from '../Form/ColorInput/ColorInput.svelte';
	import MediaVolumeControl from '../MediaVolume/MediaVolumeControl.svelte';
	import { tooltip } from '../Tooltip/tooltip.attachment.svelte.js';

	let {
		scenario
	}: {
		scenario: 'date-selector' | 'color-input' | 'media-volume' | 'modal' | 'arrow' | 'arrow-edge';
	} = $props();

	const zero = { in: { duration: 0 }, out: { duration: 0 } };
	let volume = $state(0.5);
	let muted = $state(false);
</script>

<Theme>
	<button type="button">Before</button>
	{#if scenario === 'date-selector'}
		<DateSelector />
	{:else if scenario === 'color-input'}
		<ColorInput defaultValue="#336699" />
	{:else if scenario === 'media-volume'}
		<MediaVolumeControl
			{volume}
			{muted}
			onVolumeChange={(next) => (volume = next)}
			onToggleMuted={() => (muted = !muted)}
			unmuteOnTrigger={false}
			mobileSheet={false}
			popover={{}}
		/>
	{:else if scenario === 'modal'}
		<Popover modal transition={zero} trigger={{ content: 'Open modal' }}>
			<button type="button">First</button>
			<button type="button" {@attach tooltip({ content: 'Second tip', transition: zero })}
				>Second</button
			>
		</Popover>
	{:else if scenario === 'arrow'}
		<div style="padding: 120px 200px">
			<Popover arrow position="bottom" offset={12} transition={zero} trigger={{ content: 'Open' }}>
				<p>Arrow panel</p>
			</Popover>
		</div>
	{:else}
		<!-- A trigger on the viewport's left edge: the panel shifts right to fit, the arrow stays. -->
		<div style="padding: 120px 0">
			<Popover
				arrow
				position="bottom"
				size="large"
				offset={12}
				transition={zero}
				trigger={{ content: 'E' }}
			>
				<p>Arrow panel that is much wider than its tiny trigger</p>
			</Popover>
		</div>
	{/if}
	<button type="button">After</button>
</Theme>
