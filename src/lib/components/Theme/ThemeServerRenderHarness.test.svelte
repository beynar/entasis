<script lang="ts">
	import Theme from './Theme.svelte';
	import Child from './ThemeBoundOutputChild.test.svelte';

	let api = $state<object>();
</script>

<Theme nonce="leak-test" reduceMotion>
	<Child bind:api />
</Theme>
