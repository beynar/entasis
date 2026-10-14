<script lang="ts">
	// Harness for `linkPreview.browser.test.ts`: a link that breaks across lines in a paragraph.
	import Theme from '../Theme/Theme.svelte';
	import LinkPreview from './LinkPreview.svelte';
	import type { LinkPreviewProps } from './linkPreview.props.js';

	let { link = {} }: { link?: Partial<LinkPreviewProps> } = $props();
	const zero = { in: { duration: 0 }, out: { duration: 0 } };
</script>

<Theme>
	<p style="width: 220px; font: 16px/24px sans-serif; margin: 160px 40px">
		Read the
		<LinkPreview
			href="https://example.com/a-long-article"
			metadata={{ title: 'A long article', description: 'Wraps over two lines.' }}
			delay={0}
			closeDelay={0}
			position="bottom"
			offset={4}
			transition={zero}
			{...link}
		>
			documentation about wrapping links in paragraphs
		</LinkPreview>
		and keep reading afterwards.
	</p>
</Theme>
