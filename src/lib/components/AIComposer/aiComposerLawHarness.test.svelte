<script lang="ts">
	import I18n from '$lib/i18n/I18n.svelte';
	import type { LocaleCode } from '$lib/i18n/locales.js';
	import Theme from '../Theme/Theme.svelte';
	import AIComposer from './AIComposer.svelte';
	import type { AIComposerHandle, AIComposerProps } from './aiComposer.props.js';

	let {
		value,
		defaultValue,
		onValueChange,
		locale = 'en',
		...rest
	}: AIComposerProps & { locale?: LocaleCode } = $props();
	let composer: AIComposerHandle | undefined = $state();
</script>

<Theme>
	<I18n {locale} manageDocument={false}>
		<AIComposer
			bind:this={composer}
			{value}
			{defaultValue}
			{onValueChange}
			toolbar="none"
			{...rest}
		/>
		<button type="button" onclick={() => composer?.clear()}>Clear composer</button>
	</I18n>
</Theme>
