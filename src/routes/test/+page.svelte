<script lang="ts">
	import Button from '$lib/components/Button/Button.svelte';
	import { bind } from '$lib/utils/state.svelte.js';
	import { useClickOutside } from '$lib/utils/useClickOutside.svelte.js';
	import {
		createRawSnippet,
		mount,
		unmount,
		untrack,
		type Component,
		type ComponentProps
	} from 'svelte';

	let name = $state('John');
	let age = $state(20);
	let isActive = $state(true);

	const clickOutside = useClickOutside({
		isActive: () => isActive,
		callback: () => {
			console.log('click outside', isActive, age);
		}
	});
</script>

<Button onclick={() => (isActive = !isActive)}>
	{isActive ? 'Active' : 'Inactive'}
</Button>
<div class="flex flex-col gap-2">
	<h1>Parent value</h1>

	<div class="size-20 bg-red-500" {@attach clickOutside.reference}>
		<p>click outside</p>
	</div>
	<div class="size-20 bg-blue-500" {@attach clickOutside.reference}>
		<p>click outside 2</p>
	</div>
</div>
