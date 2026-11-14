<script lang="ts">
	// Harness for `useSlidingIndicator.browser.test.ts`: a SegmentedControl and a pill Tabbar whose
	// items are laid out at fractional widths, so whole-pixel measures would miss them.
	import Theme from '../components/Theme/Theme.svelte';
	import SegmentedControl from '../components/SegmentedControl/SegmentedControl.svelte';
	import Tabbar from '../components/Tabbar/Tabbar.svelte';

	const segments = [
		{ value: 'a', label: 'A' },
		{ value: 'b', label: 'B' },
		{ value: 'c', label: 'C' }
	];
</script>

{#snippet fractional(text: string)}
	<span style="display:inline-block;width:40.37px">{text}</span>
{/snippet}

<Theme>
	<div style="padding-left:0.3px">
		<SegmentedControl label="Segments" items={segments} defaultValue="c">
			{#snippet item(segment)}{@render fractional(segment.value)}{/snippet}
		</SegmentedControl>
	</div>
	<div style="padding-left:0.3px">
		<Tabbar
			label="Tabs"
			variant="pill"
			defaultValue="2"
			items={[0, 1, 2].map((index) => ({
				value: String(index),
				label: tabLabel
			}))}
		/>
	</div>
</Theme>

{#snippet tabLabel()}{@render fractional('tab')}{/snippet}
