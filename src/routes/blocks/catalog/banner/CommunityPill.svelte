<script lang="ts">
	import { AvatarGroup } from 'svelai/avatar';
	import { Button } from 'svelai/button';
	import { arrowRightIcon } from 'svelai/icons/arrowRight';
</script>

<div class="p-lg flex min-h-48 items-center justify-center">
	<div
		class="gap-lg border-neutral-muted bg-surface-raised p-md flex flex-wrap items-center justify-center rounded-full border"
	>
		<AvatarGroup
			size="small"
			items={[{ name: 'Maya Chen' }, { name: 'Jules Bernard' }, { name: 'Sam Rivera' }]}
		/>
		<p class="text-sm"><strong>Build something together.</strong> Your next idea starts here.</p>
		<Button href="/components" size="small" variant="soft" suffix={arrowRightIcon}>Explore</Button>
	</div>
</div>
