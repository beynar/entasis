<script lang="ts">
	import I18n from '$lib/i18n/I18n.svelte';
	import { locales, type LocaleCode } from '$lib/i18n/locales.js';
	import Meter from '../Meter/Meter.svelte';
	import ProgressCircle from '../ProgressCircle/ProgressCircle.svelte';
	import Progress from './Progress.svelte';

	let {
		locale,
		min = 0,
		max = 100,
		value
	}: { locale: LocaleCode; min?: number; max?: number; value: number } = $props();
</script>

<I18n {locale} catalogs={{ [locale]: locales[locale].messages }} manageDocument={false}>
	<Meter {value} {min} {max} label="Meter" />
	<ProgressCircle {value} {min} {max} label="Circle" />
	<Progress {value} {min} {max} label="Bar" showValue />
</I18n>
