<script lang="ts">
	import type { ComponentProps } from 'svelte';
	import I18n from './I18n.svelte';
	import I18nProbe from './I18nProbe.test.svelte';

	let props: Omit<ComponentProps<typeof I18n>, 'children'> = $props();
</script>

<I18n manageDocument={false} {...props}><I18nProbe /></I18n>
