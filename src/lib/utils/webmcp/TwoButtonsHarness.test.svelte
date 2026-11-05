<script lang="ts">
	// Two Buttons meant for different origins.
	import Button from '$lib/components/Button/Button.svelte';
</script>

<Button tool={{ exposedTo: ['https://partner.example'] }}>Shared</Button>
<Button>Private</Button>
