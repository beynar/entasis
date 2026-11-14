<script lang="ts">
	// Harness for `useDirection.svelte.test.ts`: a page whose I18n sets one direction, holding an
	// island that declares the other, with a SegmentedControl inside the island and one outside.
	import I18n from '../i18n/I18n.svelte';
	import SegmentedControl from '../components/SegmentedControl/SegmentedControl.svelte';

	let { page, island }: { page: 'ltr' | 'rtl'; island: 'ltr' | 'rtl' } = $props();

	const items = [
		{ value: 'list', label: 'List' },
		{ value: 'grid', label: 'Grid' },
		{ value: 'board', label: 'Board' }
	];
</script>

<I18n dir={page}>
	<SegmentedControl label="Page" {items} defaultValue="grid" />
	<div dir={island}>
		<SegmentedControl label="Island" {items} defaultValue="grid" />
	</div>
</I18n>
