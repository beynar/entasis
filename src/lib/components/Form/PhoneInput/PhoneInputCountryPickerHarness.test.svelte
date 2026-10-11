<script lang="ts">
	// Harness for `phoneInputCountryPicker.svelte.test.ts`: the country picker inside <Theme>.
	import type { ComponentProps } from 'svelte';
	import Theme from '../../Theme/Theme.svelte';
	import PhoneInputCountryPicker from './PhoneInputCountryPicker.svelte';

	let props: ComponentProps<typeof PhoneInputCountryPicker> = $props();
</script>

<Theme>
	<PhoneInputCountryPicker {...props} />
</Theme>
