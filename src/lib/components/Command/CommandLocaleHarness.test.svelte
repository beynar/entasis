<script lang="ts">
	import I18n from '$lib/i18n/I18n.svelte';
	import type { LocaleCode } from '$lib/i18n/locales.js';
	import Theme from '../Theme/Theme.svelte';
	import Command from './Command.svelte';
	import type { CommandGroup } from './command.props.js';

	let { locale, items }: { locale: LocaleCode; items: CommandGroup[] } = $props();
</script>

<Theme>
	<I18n {locale} manageDocument={false}>
		<Command {items} />
	</I18n>
</Theme>
