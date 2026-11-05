<script lang="ts">
	// Test-only: a ColorInput inside a Theme, with something to press outside it, above the panel.
	import Theme from '../../Theme/Theme.svelte';
	import ColorInput from './ColorInput.svelte';
</script>

<Theme>
	<button type="button" data-testid="before">before</button>
	<div data-testid="outside" style="height: 60px">outside</div>
	<div style="width: 320px"><ColorInput label="Accent" defaultValue="#5f62ef" /></div>
</Theme>
