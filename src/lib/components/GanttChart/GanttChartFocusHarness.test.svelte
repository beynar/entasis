<script lang="ts">
	import Theme from '../Theme/Theme.svelte';
	import { GanttChart } from './index.js';
	import type { GanttDependency, GanttTask } from './index.js';

	let {
		tasks = $bindable([] as GanttTask[]),
		dependencies = $bindable([] as GanttDependency[])
	}: {
		tasks?: GanttTask[];
		dependencies?: GanttDependency[];
	} = $props();
</script>

<Theme>
	<GanttChart bind:tasks bind:dependencies timeZone="UTC" style="height: 400px" />
</Theme>
