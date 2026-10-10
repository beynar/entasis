<script lang="ts">
	import { untrack } from 'svelte';
	import Theme from '../../Theme/Theme.svelte';
	import I18n from '$lib/i18n/I18n.svelte';
	import Form from '../Form/Form.svelte';
	import Slider from './Slider.svelte';
	import type { SliderProps } from './slider.props.js';

	let {
		dir,
		formEntry,
		onFormSubmit,
		bound,
		...sliderProps
	}: SliderProps & {
		/** Wraps the slider in an I18n direction context that leaves `<html dir>` alone. */
		dir?: 'ltr' | 'rtl';
		/** Renders the slider as this Form entry instead of standalone. */
		formEntry?: { type: 'slider-range' } & SliderProps;
		onFormSubmit?: (value: { level?: number[] | null }) => void;
		/** Binds the slider to a $state holding this initial value. */
		bound?: number | number[];
	} = $props();

	let boundValue = $state<number | number[] | null | undefined>(untrack(() => bound));

	// A deep $state proxy, as an app's bound Form value is: the Slider must settle against it.
	let formValue = $state<{ level?: number[] | null }>({});
</script>

<Theme>
	<I18n {dir} manageDocument={false}>
		{#if formEntry}
			<Form inputs={{ level: formEntry }} bind:value={formValue} onSubmit={onFormSubmit}>
				{#snippet children(form)}
					<button type="button" onclick={() => form.submit()}>Submit form</button>
				{/snippet}
			</Form>
			<output data-testid="form-value">{JSON.stringify(formValue)}</output>
		{:else if bound !== undefined}
			<Slider {...sliderProps} bind:value={boundValue} />
		{:else}
			<Slider {...sliderProps} />
		{/if}
	</I18n>
</Theme>
