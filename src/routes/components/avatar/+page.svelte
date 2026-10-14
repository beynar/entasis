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
		'One accessible name for image and initials',
		'data-status for crossfades and styling',
		'fallbackDelay holds the initials while the image loads',
		'Native image attributes: srcset, sizes, loading and more',
		'Configurable delay before reveal',
		'bindable loading flag',
		'Prefix and suffix overlays'
	]}
>
	<ComponentCard
		{controls}
		description="Avatar with image and delay before reveal."
		code={`<Avatar
	revealDelay={1000}
	name="Guillermo Rauch"
	src="https://avatars.githubusercontent.com/rauchg?s=64"
	size="${controls.value.size}"
/>`}
	>
		<Avatar revealDelay={1000} {...user} size={controls.value.size} />
	</ComponentCard>

	{#snippet examples()}
		<ComponentCard description="Sizes with image and initials-only fallback.">
			<div class="flex items-center justify-center gap-4">
				{#each sizes as size, index (index)}
					<Avatar revealDelay={1000} {...user} {size} />
				{/each}
			</div>
			<div class="flex items-center justify-center gap-4">
				{#each sizes as size, index (index)}
					<Avatar {...user2} {size} />
				{/each}
			</div>
		</ComponentCard>
		<ComponentCard
			description="fallbackDelay keeps the surface empty while the image loads, so a fast image never flashes the initials. The working image below never shows them; a broken one shows them after the image fails."
			code={`<Avatar fallbackDelay={600} name="Guillermo Rauch" src="..." />
<Avatar fallbackDelay={600} name="Broken Image" src="/missing.png" />`}
		>
			<div class="flex items-center justify-center gap-4">
				<Avatar fallbackDelay={600} {...user} />
				<Avatar fallbackDelay={600} name="Broken Image" src="/missing-avatar.png" />
			</div>
		</ComponentCard>

		<ComponentCard
			description="Native image attributes go through image. The avatar is one image with one name: the img is empty-alt and the initials are hidden, so a screen reader reads it once whether the picture loads, fails or is missing. The root exposes data-status."
			code={`<Avatar
	name="Guillermo Rauch"
	src="https://avatars.githubusercontent.com/rauchg?s=64"
	image={{
		srcset: 'https://avatars.githubusercontent.com/rauchg?s=64 1x, https://avatars.githubusercontent.com/rauchg?s=128 2x',
		loading: 'lazy',
		decoding: 'async',
		referrerpolicy: 'no-referrer'
	}}
/>`}
		>
			<div class="flex items-center justify-center gap-4">
				<Avatar
					{...user}
					image={{
						srcset:
							'https://avatars.githubusercontent.com/rauchg?s=64 1x, https://avatars.githubusercontent.com/rauchg?s=128 2x',
						loading: 'lazy',
						decoding: 'async',
						referrerpolicy: 'no-referrer'
					}}
				/>
			</div>
		</ComponentCard>
	{/snippet}
</DocPage>
