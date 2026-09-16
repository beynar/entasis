<script lang="ts">
	import AIThreadToc from '$lib/components/AIThreadToc/AIThreadToc.svelte';
	import type {
		AIThreadItem,
		AIThreadTocEntry,
		AIThreadTocState
	} from '$lib/components/AIThreadToc/aiThreadToc.props.js';
	import ComponentCard from '../../ComponentCard.svelte';
	import { createComponentControls } from '../../componentControls.svelte.js';
	import DocPage from '../../DocPage.svelte';

	const ENTRY_STEP = 96;
	const entries: AIThreadTocEntry[] = Array.from({ length: 48 }, (_, turn) => {
		const title = `Review deployment checkpoint ${turn + 1}`;
		const excerpt = `The assistant response records the validation result and the next rollout action for checkpoint ${turn + 1}.`;
		const files =
			turn === 12
				? [{ id: 'release-log', name: 'release-log.md', size: 12_800, type: 'text/markdown' }]
				: [];
		const message: AIThreadItem = {
			id: `toc-user-${turn}`,
			role: 'user',
			content: title,
			files
		};
		return {
			key: `toc-entry-${turn}`,
			index: turn,
			messageIndex: turn * 2,
			message,
			role: 'user',
			title,
			excerpt,
			fileCount: files.length,
			files,
			attachments: [],
			offset: turn * ENTRY_STEP,
			size: 72
		};
	});
	const totalSize = entries.length * ENTRY_STEP;
	const controls = createComponentControls([
		{
			name: 'side',
			type: 'segmented',
			label: 'Side',
			value: 'left',
			options: ['left', 'right']
		},
		{
			name: 'height',
			type: 'segmented',
			label: 'Height',
			value: 'short',
			options: ['short', 'tall']
		}
	]);

	let activeIndex: number = $state(8);
	const side = $derived(controls.value.side);
	const height = $derived(controls.value.height);
	const heightClass = $derived(height === 'short' ? 'h-64' : 'h-[32rem]');
	const activeEntry = $derived(entries[activeIndex]);
	const tocState = $derived<AIThreadTocState>({
		entries,
		range: { startOffset: 0, endOffset: totalSize, totalSize },
		activeIndex,
		visibleStartOffset: activeEntry?.offset ?? 0,
		visibleEndOffset: Math.min(totalSize, (activeEntry?.offset ?? 0) + 240),
		scrollToIndex: selectIndex,
		scrollToOffset: selectOffset
	});

	function selectIndex(index: number): void {
		activeIndex = Math.max(0, Math.min(entries.length - 1, Math.trunc(index)));
	}

	function selectOffset(offset: number): void {
		selectIndex(Math.round(offset / ENTRY_STEP));
	}
</script>

<DocPage
	title="AI Thread TOC"
	subtitle="A standalone, controlled user-turn minimap with compact previews and bounded scrollbar-free navigation."
	component="AIThreadToc"
	relatedComponents={['AIThread', 'ScrollArea', 'HoverCard']}
	features={[
		'Standalone svelai/ai-thread-toc package export',
		'Controlled state from AIThread or another transcript owner',
		'80% container-height bound with scrollbar-free ScrollArea',
		'Side-aware pin magnification and shared HoverCard preview',
		'Wheel, touch, and programmatic navigation'
	]}
>
	<ComponentCard
		{controls}
		description="The short container forces the standalone rail to scroll while its root remains capped at 80% of the available height. Scrollbars stay hidden; wheel, touch, focus, and pin activation remain functional."
		class="!min-h-0 p-4"
		code={`<script lang="ts">
  import {
    AIThreadToc,
    type AIThreadTocState
  } from 'svelai/ai-thread-toc';

  let state: AIThreadTocState;
${'</' + 'script>'}

<div class="relative h-64">
  <AIThreadToc {state} side="left" />
</div>`}
	>
		<div class="grid w-full gap-3">
			<div
				class="border-neutral-muted relative w-full overflow-hidden rounded-lg border {heightClass}"
			>
				<div
					class="pointer-events-none absolute inset-y-0 flex items-center {side === 'left'
						? 'left-0'
						: 'right-0'}"
				>
					<AIThreadToc state={tocState} {side} />
				</div>
				<div class="grid h-full place-items-center px-16 text-center">
					<div class="max-w-sm">
						<p class="text-sm font-medium">{activeEntry?.title}</p>
						<p class="text-neutral/70 mt-1 text-xs">
							Select or focus a pin to navigate the controlled state.
						</p>
					</div>
				</div>
			</div>
			<p class="text-neutral/70 truncate text-center text-xs" aria-live="polite">
				Active turn {activeIndex + 1} of {entries.length}
			</p>
		</div>
	</ComponentCard>
</DocPage>
