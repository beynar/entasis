<script lang="ts">
	import { Skeleton } from '$lib/components/Skeleton/index.js';
</script>

<div class="bg-surface grid h-full min-w-0 place-items-center p-8">
	<div class="grid w-full max-w-2xl gap-3">
		<Skeleton color="primary" class="h-3 w-11/12 rounded-full" />
		<Skeleton class="h-3 w-8/12 rounded-full" />
		<Skeleton class="h-3 w-full rounded-full" />
		<Skeleton color="primary" class="h-3 w-7/12 rounded-full" />
	</div>
</div>
