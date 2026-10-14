<script lang="ts">
	import { getContext } from 'svelte';
	import { nonceAttribute } from '$lib/utils/cspNonce.js';
	import type { ThemeState } from '../Theme/theme.state.svelte.js';

	let {
		once = false,
		immediate = false,
		scripts = [],
		css = [],
		nonce: nonceProp
	}: {
		once?: boolean;
		/** Executes while the document is parsing instead of waiting for DOMContentLoaded. */
		immediate?: boolean;
		scripts?: string[];
		css?: string[];
		/** CSP nonce for the emitted `<script>` and `<style>`. Defaults to the Theme's `nonce`. */
		nonce?: string;
	} = $props();

	// Optional: the Theme context is absent when this renders outside a `<Theme>`.
	const theme = getContext<ThemeState | undefined>('entasisTheme');
	const nonce = $derived(nonceAttribute(nonceProp ?? theme?.nonce));

	const id = $props.id();
	const source = $derived(scripts.join('\n'));
	const removeScript = $derived(
		once ? `document.getElementById(${JSON.stringify(id)})?.remove();` : ''
	);
</script>

<!-- eslint-disable svelte/no-at-html-tags -- this component exists to inject caller-supplied <script>/<style> text into <head> before hydration; raw HTML is its entire contract -->
<svelte:head>
	{@html /*html*/ `<s${'cript'} id="${id}"${nonce}>
	${
		immediate
			? `${source}
	${removeScript}`
			: `
		document.addEventListener('DOMContentLoaded', () => {
			${source}
			${removeScript}
		})
	// if readyState is complete, execute the scripts directly
	if(document.readyState === 'complete') {
		${source}
		${removeScript}
	}`
	}
	</s${'cript'}>`}
	{@html `<s${'tyle'}${nonce}>
            ${css.join('\n\n')}
        </s${'tyle'}>`}
</svelte:head>
