<script lang="ts">
	// Test-only: a calendar under an app's locale, with or without an I18n.
	import { setI18n } from '$lib/i18n/context.svelte.js';
	import { fr } from '$lib/i18n/fr.js';
	import Theme from '../../Theme/Theme.svelte';
	import DateInput from './DateInput.svelte';

	let { withI18n, locale }: { withI18n: boolean; locale?: string } = $props();
	// svelte-ignore state_referenced_locally
	if (withI18n) setI18n(fr);
</script>

<Theme>
	<DateInput label="Day" value={new Date(2026, 11, 5)} {locale} />
</Theme>
