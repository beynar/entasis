<script lang="ts">
	// Test-only harness: a fixed-size container around a TOC driven by a hand-built state.
	import Theme from '../Theme/Theme.svelte';
	import AIThreadToc from './AIThreadToc.svelte';
	import type { AIThreadTocEntry, AIThreadTocState } from './aiThreadToc.props.js';

	let {
		count = 4,
		activeIndex = 1,
		width = 720,
		minContainerWidth,
		onScrollToIndex
	}: {
		count?: number;
		activeIndex?: number;
		width?: number;
		minContainerWidth?: number;
		onScrollToIndex?: (index: number) => void;
	} = $props();

	const entries = $derived<AIThreadTocEntry[]>(
		Array.from({ length: count }, (_, index) => ({
			key: `turn-${index}`,
			index: index * 2,
			messageIndex: index * 2,
			message: { role: 'user', content: `Question ${index + 1}` },
			role: 'user',
			title: `Question ${index + 1}`,
			excerpt: `Answer ${index + 1}`,
			fileCount: 0,
			files: [],
			attachments: [],
			offset: index * 100,
			size: 100
		}))
	);
	const tocState = $derived<AIThreadTocState>({
		entries,
		range: { startOffset: 0, endOffset: count * 100, totalSize: count * 100 },
		activeIndex,
		visibleStartOffset: activeIndex * 100,
		visibleEndOffset: activeIndex * 100 + 150,
		scrollToIndex: (index) => onScrollToIndex?.(index),
		scrollToOffset: () => {}
	});
</script>

<Theme>
	<div data-testid="container" style:width={`${width}px`} style:height="400px" style:display="flex">
		<AIThreadToc state={tocState} {minContainerWidth} />
	</div>
</Theme>
