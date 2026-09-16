<script lang="ts">
	let {
		once = false,
		immediate = false,
		scripts = [],
		css = []
	}: {
		once?: boolean;
		/** Executes while the document is parsing instead of waiting for DOMContentLoaded. */
		immediate?: boolean;
		scripts?: string[];
		css?: string[];
	} = $props();

	const id = $props.id();
	const source = $derived(scripts.join('\n'));
	const removeScript = $derived(
		once ? `document.getElementById(${JSON.stringify(id)})?.remove();` : ''
	);
</script>

<!-- eslint-disable svelte/no-at-html-tags -- this component exists to inject caller-supplied <script>/<style> text into <head> before hydration; raw HTML is its entire contract -->
<svelte:head>
	{@html /*html*/ `<s${'cript'} id="${id}">
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
	{@html `<s${'tyle'}>
            ${css.join('\n\n')}
        </s${'tyle'}>`}
</svelte:head>
