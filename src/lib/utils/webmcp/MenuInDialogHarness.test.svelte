<script lang="ts">
	// A PopupMenu inside an open modal Dialog, beside one on the page.
	import Dialog from '$lib/components/Dialog/Dialog.svelte';
	import PopupMenu from '$lib/components/PopupMenu/PopupMenu.svelte';

	const row = (title: string) => ({
		menu: { items: [{ type: 'option' as const, title, onclick: () => {} }] }
	});
</script>

<PopupMenu {...row('On page')} trigger={{ content: 'Page' }} />
<Dialog open title="Modal">
	<PopupMenu {...row('In dialog')} trigger={{ content: 'Inside' }} />
</Dialog>
