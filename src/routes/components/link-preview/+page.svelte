<script lang="ts">
	import LinkPreview from '$lib/components/LinkPreview/LinkPreview.svelte';
	import { sizes } from '$lib/utils/tokens.js';
	import ComponentCard from '../../ComponentCard.svelte';
	import { createComponentControls } from '../../componentControls.svelte.js';
	import DocPage from '../../DocPage.svelte';

	const controls = createComponentControls([
		{
			name: 'size',
			type: 'segmented',
			label: 'Size',
			value: 'normal',
			options: sizes
		}
	]);

	const svelaiMetadata = {
		title: 'Svelai',
		description: 'Configuration-first Svelte components for application interfaces.',
		siteName: 'Svelai',
		url: 'https://svelai.dev',
		favicon: '/favicon.png'
	};
</script>

<DocPage
	title="Link Preview"
	subtitle="A HoverCard-derived link preview that loads page metadata asynchronously."
	component="LinkPreview"
	features={[
		'Renders a real anchor trigger',
		'Loads metadata when opened or prefetched',
		'Skeleton loading and explicit error states',
		'Supports Open Graph images and favicons',
		'Custom fetcher or endpoint contract'
	]}
>
	<ComponentCard
		{controls}
		description="Hover or focus the link to load metadata through the default endpoint."
		code={`<LinkPreview href="https://svelte.dev" size="${controls.value.size}">Svelte</LinkPreview>`}
	>
		<LinkPreview href="https://svelte.dev" size={controls.value.size}>Svelte</LinkPreview>
	</ComponentCard>

	{#snippet examples()}
		<ComponentCard
			title="Preloaded Metadata"
			description="Pass metadata when it is already available from your route data or CMS."
			class="!min-h-fit"
			code={`<LinkPreview
	href="https://svelai.dev"
	metadata={{
		title: 'Svelai',
		description: 'Configuration-first Svelte components.',
		siteName: 'Svelai',
		favicon: '/favicon.png'
	}}
>
	Svelai
</LinkPreview>`}
		>
			<LinkPreview href="https://svelai.dev" metadata={svelaiMetadata}>Svelai</LinkPreview>
		</ComponentCard>

		<ComponentCard
			title="Prefetch"
			description="Use prefetch when a preview should be ready before the first hover."
			class="!min-h-fit"
			code={`<LinkPreview href="https://kit.svelte.dev" prefetch>
	SvelteKit
</LinkPreview>`}
		>
			<LinkPreview href="https://kit.svelte.dev" prefetch>SvelteKit</LinkPreview>
		</ComponentCard>

		<ComponentCard
			title="Custom Endpoint"
			description="Point the component at your own server route when the default URL is not used."
			class="!min-h-fit"
			code={`<LinkPreview
	href="https://developer.mozilla.org"
	metadataEndpoint="/api/link-metadata"
	target="_blank"
>
	MDN Web Docs
</LinkPreview>`}
		>
			<LinkPreview
				href="https://developer.mozilla.org"
				metadataEndpoint="/api/link-metadata"
				target="_blank"
			>
				MDN Web Docs
			</LinkPreview>
		</ComponentCard>

		<ComponentCard
			title="Custom Trigger"
			description="The trigger slot receives the preview payload, including loading status."
			class="!min-h-fit"
			code={`<LinkPreview href="https://svelte.dev">
	{#snippet children(preview)}
		<span>{preview.status === 'loading' ? 'Loading...' : 'Svelte'}</span>
	{/snippet}
</LinkPreview>`}
		>
			<LinkPreview href="https://svelte.dev">
				{#snippet children(preview)}
					<span>{preview.status === 'loading' ? 'Loading...' : 'Svelte'}</span>
				{/snippet}
			</LinkPreview>
		</ComponentCard>

		<ComponentCard
			title="Error State"
			description="Failures remain visible instead of falling back to fabricated metadata."
			class="!min-h-fit"
			code={`<LinkPreview href="https://example.com" metadataEndpoint="/api/missing-preview">
	Broken preview
</LinkPreview>`}
		>
			<LinkPreview href="https://example.com" metadataEndpoint="/api/missing-preview">
				Broken preview
			</LinkPreview>
		</ComponentCard>
	{/snippet}
</DocPage>
