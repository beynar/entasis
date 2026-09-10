<script lang="ts">
	import { AvatarGroup } from 'svelai/avatar';
	import { Button } from 'svelai/button';
	import { arrowRightIcon } from 'svelai/icons/arrowRight';
</script>

<div class="flex min-h-48 items-center justify-center p-lg">
	<div
		class="flex flex-wrap items-center justify-center gap-lg rounded-full border border-neutral-muted bg-surface-raised p-md"
	>
		<AvatarGroup
			size="small"
			items={[{ name: 'Maya Chen' }, { name: 'Jules Bernard' }, { name: 'Sam Rivera' }]}
		/>
		<p class="text-sm"><strong>Build something together.</strong> Your next idea starts here.</p>
		<Button href="/components" size="small" variant="soft" suffix={arrowRightIcon}>Explore</Button>
	</div>
</div>
