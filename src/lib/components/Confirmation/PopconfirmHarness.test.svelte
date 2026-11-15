<script lang="ts">
	// Harness for `popconfirm.browser.test.ts`: clicks guarded by an anchored confirmation.
	import Theme from '../Theme/Theme.svelte';
	import Button from '../Button/Button.svelte';
	import Confirmation from './Confirmation.svelte';
	import { popconfirm } from './confirmation.state.svelte.js';

	let { log, slow = false }: { log: string[]; slow?: boolean } = $props();
</script>

<Theme>
	<Confirmation />
	<div class="flex flex-col items-start gap-4 p-24 pt-72">
		<Button
			onclick={popconfirm(
				async (event, anchor) => {
					if (slow) await new Promise((resolve) => setTimeout(resolve, 300));
					log.push(`deleted:${event.type}:${anchor.textContent?.trim()}`);
				},
				{ title: 'Delete the file?', confirm: { text: 'Delete', color: 'danger' } }
			)}
		>
			Delete
		</Button>
		<a href="#replayed" onclick={popconfirm({ title: 'Leave the page?' })}>Leave</a>
		<form
			onsubmit={(event) => {
				event.preventDefault();
				log.push('submitted');
			}}
		>
			<button type="submit" onclick={popconfirm()}>Submit</button>
		</form>
	</div>
</Theme>
