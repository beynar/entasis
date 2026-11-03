<script lang="ts">
	// A narrow Diff whose single line overflows, rendered on the client (no server preload).
	import Theme from '../Theme/Theme.svelte';
	import Diff from './Diff.svelte';

	const long = 'const value = "' + 'x'.repeat(400) + '";';
	const files: [{ name: string; contents: string }, { name: string; contents: string }] = [
		{ name: 'a.ts', contents: 'const value = 1;\n' },
		{ name: 'a.ts', contents: `${long}\n` }
	];
</script>

<Theme>
	<div style="width: 360px">
		<Diff {files} diffStyle="unified" />
	</div>
</Theme>
