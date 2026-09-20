export const linkPreviewDescription = `
# LinkPreview Component

LinkPreview renders an anchor trigger with a HoverCard preview that loads link metadata asynchronously. It shows Skeleton placeholders while loading and displays title, description, site name, Open Graph image, and favicon when available.

## Import

\`\`\`svelte
<script>
	import { LinkPreview } from 'entasis/link-preview';
</script>
\`\`\`

## Basic Usage

\`\`\`svelte
<LinkPreview href="https://svelte.dev">Svelte</LinkPreview>
\`\`\`

By default, LinkPreview requests \`/api/link-metadata?url=<href>\` when the card opens. Browser-only fetching of arbitrary links is not reliable because most sites block cross-origin HTML reads, so applications should provide a server endpoint or a custom \`fetchMetadata\` function.

## With Preloaded Metadata

\`\`\`svelte
<LinkPreview
	href="https://entasis.dev"
	metadata={{
		title: 'Entasis',
		description: 'Configuration-first Svelte components.',
		siteName: 'Entasis',
		favicon: '/favicon.png'
	}}
>
	Entasis
</LinkPreview>
\`\`\`

## Custom Fetcher

\`\`\`svelte
<script>
	const fetchMetadata = async (href, signal) => {
		const response = await fetch(\`/api/preview?href=\${encodeURIComponent(href)}\`, { signal });
		if (!response.ok) throw new Error('Preview unavailable');
		return response.json();
	};
</script>

<LinkPreview href="https://example.com" {fetchMetadata}>Example</LinkPreview>
\`\`\`

## Props

- **href**: string - URL opened by the trigger link and requested by the metadata loader.
- **id**: string - Stable DOM id for the underlying HoverCard; falls back to a generated id.
- **open**: boolean - Bindable open state.
- **defaultOpen**: boolean (default: false) - Initial state when open is not provided.
- **children**: string | Snippet<[LinkPreviewPayload]> - Trigger anchor content.
- **metadata**: LinkPreviewMetadata - Preloaded metadata; skips network loading.
- **fetchMetadata**: (href, signal) => Promise<LinkPreviewMetadata> - Custom async loader.
- **metadataEndpoint**: string | (href) => string - Endpoint used when fetchMetadata is not provided. String endpoints receive ?url=<href>.
- **prefetch**: boolean - Load metadata on mount instead of waiting for open.
- **target**: string - Trigger anchor target.
- **rel**: string - Trigger anchor rel. Defaults to noopener noreferrer for target="_blank".
- **fallbackTitle**: string - Title shown when metadata has no title.
- **imageAlt**: string - Alt text for the preview image.
- **showUrl**: boolean - Whether to show the URL line.
- **loadingLabel**: string - Accessible label for the loading region.
- **errorLabel**: string - Heading shown when metadata loading fails.
- **position**: Popover placement - Preferred card placement.
- **offset**: number - Gap between trigger and card.
- **delay**: number - Open delay in milliseconds.
- **closeDelay**: number - Close delay in milliseconds.
- **openOnFocus**: boolean - Open when focus enters trigger or card.
- **openOnClick**: boolean - Toggle card on click before navigation.
- **closeOnEscape**: boolean - Close on Escape.
- **closeOnClickOutside**: boolean - Close when clicking outside.
- **directedTransition**: boolean - Use placement-aware transitions.
- **transition**: object - Popover transition overrides.
- **size**: 'small' | 'normal' | 'large' - Preview card size.
- **disabled**: boolean - Disable opening and link navigation.
- **class**: string - Trigger anchor classes.
- **card**: Props forwarded to the inner Card as one object - \`{ class, color, variant, theme }\` (defaults: color 'neutral', variant 'solid').
- **popover**: Props forwarded to the Popover panel as one object - \`{ class, theme }\`.
- **showBorders**: boolean - Show Card section borders.
- **onOpenChange**: (open: boolean) => void - Called once for each library-requested state change.
- **onAfterOpen**: (payload) => void - Called after open transition.
- **onAfterClose**: (payload) => void - Called after close transition.
- **onLoad**: (payload) => void - Called after metadata loads.
- **onError**: (error) => void - Called after metadata loading fails.
- **theme**: LinkPreviewThemeProps - LinkPreview theme overrides.
- **hoverCardTheme**: HoverCardThemeProps - HoverCard wrapper theme overrides.

## Metadata Shape

\`\`\`ts
type LinkPreviewMetadata = {
	url?: string;
	title?: string;
	description?: string;
	siteName?: string;
	image?: string;
	favicon?: string;
};
\`\`\`

## Endpoint Contract

The default endpoint should return JSON matching LinkPreviewMetadata. Non-2xx responses should return a JSON object with a \`message\` string when possible.

## Accessibility

- The trigger remains a real anchor, so the destination is reachable without hover.
- Loading and error states use role="status".
- A disabled LinkPreview removes the anchor href and prevents hover opening.

## Theme Parts

- **trigger** - Anchor trigger.
- **card** - HoverCard surface classes.
- **content** - Preview content wrapper.
- **media** - Image container.
- **image** - Preview image.
- **body** - Metadata text stack.
- **header** - Favicon and site row.
- **favicon** - Favicon image.
- **site** - Site name text.
- **title** - Preview title.
- **description** - Preview description.
- **url** - URL display line.
- **loading** - Skeleton stack.
- **error** - Error state container.

## Motion

- LinkPreview has no preset of its own: it forwards \`transition\` (now a plain \`FSOProps\`,
  responsive) to HoverCard, whose **motion** slot owns the preset.
- Retune it with \`<Theme components={{ 'hover-card': { motion } }}>\` or
  \`setHoverCardTheme({ motion })\`; the \`transition\` prop still wins per instance.
`;
