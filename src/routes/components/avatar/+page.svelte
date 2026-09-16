<script lang="ts">
	import Avatar from '$lib/components/Avatar/Avatar.svelte';
	import ComponentCard from '../../ComponentCard.svelte';
	import { createComponentControls } from '../../componentControls.svelte.js';
	import DocPage from '../../DocPage.svelte';

	const sizes = ['small', 'normal', 'large'] as const;
	const controls = createComponentControls([
		{
			name: 'size',
			type: 'segmented',
			label: 'Size',
			value: 'normal',
			options: sizes
		}
	]);
	const user = {
		name: 'Guillermo Rauch',
		src: 'https://avatars.githubusercontent.com/rauchg?s=64'
	};
	const user2 = {
		name: 'Guillermo Rauch'
	};
</script>

<DocPage
	title="Avatar"
	subtitle="Represents a user or entity with an image, initials, or fallback."
	component="Avatar"
	features={[
		'Image with initials fallback',
		'Configurable delay before reveal',
		'bindable loading flag',
		'Prefix and suffix overlays'
	]}
>
	<ComponentCard
		{controls}
		description="Avatar with image and delay before reveal."
		code={`<Avatar
	delay={1000}
	name="Guillermo Rauch"
	src="https://avatars.githubusercontent.com/rauchg?s=64"
	size="${controls.value.size}"
/>`}
	>
		<Avatar delay={1000} {...user} size={controls.value.size} />
	</ComponentCard>

	{#snippet examples()}
		<ComponentCard description="Sizes with image and initials-only fallback.">
			<div class="flex items-center justify-center gap-4">
				{#each sizes as size, index (index)}
					<Avatar delay={1000} {...user} {size} />
				{/each}
			</div>
			<div class="flex items-center justify-center gap-4">
				{#each sizes as size, index (index)}
					<Avatar {...user2} {size} />
				{/each}
			</div>
		</ComponentCard>
	{/snippet}
</DocPage>
