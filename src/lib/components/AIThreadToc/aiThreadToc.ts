import type {
	AIThreadItem,
	AIThreadScrollBehavior,
	AIThreadTocEntry,
	AIThreadTocPin,
	AIThreadTocState
} from '../AIThread/aiThread.props.js';
import type { AIThreadRenderItem } from '../AIThread/threadRenderItems.js';
import type { Messages } from '$lib/i18n/en.js';

type AIThreadTocMessages = Pick<Messages, 'aiThreadTocFiles' | 'aiThreadTocScrollTo'>;

type BuildAIThreadTocStateOptions = {
	totalSize: number;
	scrollOffset: number;
	viewportSize: number;
	isPinnedToBottom: boolean;
	estimateSize: number;
	getItemOffset: (index: number) => number | undefined;
	getItemSize: (index: number) => number | undefined;
	scrollToIndex: (index: number, behavior: AIThreadScrollBehavior) => void;
	scrollToOffset: (offset: number, behavior: AIThreadScrollBehavior) => void;
};

type CompactAIThreadTocOptions = {
	maxPins: number;
	activeEntryIndex?: number;
};

const TOC_ARIA_EXCERPT_MAX_LENGTH = 120;
const TOC_ARIA_LABEL_MAX_LENGTH = 180;
const TOC_METADATA_LABEL_MAX_LENGTH = 110;
const TOC_METADATA_NAME_MAX_LENGTH = 36;
const TOC_PROMPT_MAX_LENGTH = 220;
const TOC_RESPONSE_MAX_LENGTH = 420;
const TOC_TITLE_MAX_LENGTH = 40;

export function buildAIThreadTocState<TMessage extends AIThreadItem>(
	items: readonly AIThreadRenderItem<TMessage>[],
	options: BuildAIThreadTocStateOptions
): AIThreadTocState<TMessage> {
	const entries = buildEntries(items, options);
	const totalSize = nonNegative(options.totalSize);
	const visibleStartOffset = clamp(nonNegative(options.scrollOffset), 0, totalSize);
	const visibleEndOffset = clamp(
		visibleStartOffset + nonNegative(options.viewportSize),
		visibleStartOffset,
		totalSize
	);
	return {
		entries,
		range: { startOffset: 0, endOffset: totalSize, totalSize },
		activeIndex: activeEntryIndex(
			entries,
			visibleStartOffset,
			visibleEndOffset,
			options.isPinnedToBottom
		),
		visibleStartOffset,
		visibleEndOffset,
		scrollToIndex(index) {
			if (!Number.isFinite(index)) return;
			options.scrollToIndex(Math.trunc(index), 'instant');
		},
		scrollToOffset(offset) {
			if (!Number.isFinite(offset)) return;
			options.scrollToOffset(clamp(offset, 0, totalSize), 'instant');
		}
	};
}

export function compactAIThreadTocEntries<TMessage extends AIThreadItem>(
	entries: readonly AIThreadTocEntry<TMessage>[],
	options: CompactAIThreadTocOptions
): AIThreadTocPin<TMessage>[] {
	if (entries.length === 0) return [];
	const maxPins = Math.max(1, Math.trunc(nonNegative(options.maxPins)));
	if (entries.length <= maxPins) {
		return entries.map((entry, entryIndex) => createPin(entry, entryIndex, false));
	}

	const preservedIndexes = new Set<number>([0, entries.length - 1]);
	preserveIndex(preservedIndexes, options.activeEntryIndex, entries.length);
	const targetCount = Math.min(entries.length, Math.max(maxPins, preservedIndexes.size));
	const selectedIndexes = new Set(preservedIndexes);
	const needed = targetCount - selectedIndexes.size;
	if (needed > 0) {
		for (const entryIndex of bucketEntryIndexes(entries, preservedIndexes, needed)) {
			if (selectedIndexes.size >= targetCount) break;
			selectedIndexes.add(entryIndex);
		}
	}
	if (selectedIndexes.size < targetCount) {
		const candidates = entries
			.map((entry, entryIndex) => ({ entry, entryIndex }))
			.filter(({ entryIndex }) => !selectedIndexes.has(entryIndex));
		for (const entryIndex of bucketEntryIndexesByOrder(
			candidates,
			targetCount - selectedIndexes.size
		)) {
			selectedIndexes.add(entryIndex);
		}
	}

	return [...selectedIndexes]
		.sort((left, right) => left - right)
		.map((entryIndex) => {
			const entry = entries[entryIndex];
			return createPin(entry, entryIndex, !preservedIndexes.has(entryIndex));
		});
}

export function getAIThreadTocMetadata(entry: AIThreadTocEntry, t: AIThreadTocMessages): string {
	if (entry.fileCount === 0) return '';
	const names = [...entry.attachments, ...entry.files]
		.map((file) => file.name.trim())
		.filter(Boolean);
	const shownNames = names.slice(0, 2).map((name) => truncate(name, TOC_METADATA_NAME_MAX_LENGTH));
	const hiddenCount = Math.max(0, names.length - shownNames.length);
	const namesLabel = shownNames.length > 0 ? ` - ${shownNames.join(', ')}` : '';
	const hiddenLabel = hiddenCount > 0 ? ` +${hiddenCount}` : '';
	return truncate(
		`${t.aiThreadTocFiles(entry.fileCount)}${namesLabel}${hiddenLabel}`,
		TOC_METADATA_LABEL_MAX_LENGTH
	);
}

export function getAIThreadTocLabel(entry: AIThreadTocEntry, t: AIThreadTocMessages): string {
	const metadata = getAIThreadTocMetadata(entry, t);
	return truncate(
		[
			t.aiThreadTocScrollTo(truncate(entry.title, TOC_TITLE_MAX_LENGTH)),
			truncate(entry.excerpt, TOC_ARIA_EXCERPT_MAX_LENGTH),
			metadata
		]
			.filter(Boolean)
			.join(' - '),
		TOC_ARIA_LABEL_MAX_LENGTH
	);
}

export function isAIThreadTocEntryVisible(
	entry: AIThreadTocEntry,
	state: AIThreadTocState
): boolean {
	return (
		entry.offset <= state.visibleEndOffset && entry.offset + entry.size >= state.visibleStartOffset
	);
}

function buildEntries<TMessage extends AIThreadItem>(
	items: readonly AIThreadRenderItem<TMessage>[],
	options: BuildAIThreadTocStateOptions
): AIThreadTocEntry<TMessage>[] {
	const entries: AIThreadTocEntry<TMessage>[] = [];
	const messageIndexes = new Set<number>();
	let currentEntry: AIThreadTocEntry<TMessage> | undefined;
	let assistantMessageIndex: number | undefined;
	for (const [index, item] of items.entries()) {
		if (item.kind !== 'message') continue;
		if (item.message.role !== 'user') {
			if (!currentEntry || (item.message.role ?? 'assistant') !== 'assistant') continue;
			const response = messageText(item.message, item.content);
			if (!response) continue;
			if (assistantMessageIndex === undefined || item.messageIndex >= assistantMessageIndex) {
				assistantMessageIndex = item.messageIndex;
				currentEntry.excerpt = truncate(response, TOC_RESPONSE_MAX_LENGTH);
			}
			continue;
		}
		if (messageIndexes.has(item.messageIndex)) continue;
		const content = messageText(item.message, item.content);
		const files = item.message.files ?? [];
		const attachments = item.message.attachments ?? [];
		if (!content && files.length === 0 && attachments.length === 0) continue;
		messageIndexes.add(item.messageIndex);
		const fileNames = [...attachments, ...files].map((file) => file.name);
		currentEntry = {
			key: item.key,
			index,
			messageIndex: item.messageIndex,
			message: item.message,
			role: item.message.role,
			name: item.message.name,
			title: truncate(content || fileNames.join(', ') || 'Attachment', TOC_PROMPT_MAX_LENGTH),
			excerpt: '',
			fileCount: files.length + attachments.length,
			files,
			attachments,
			offset: nonNegative(options.getItemOffset(index) ?? index * options.estimateSize),
			size: nonNegative(options.getItemSize(index) ?? options.estimateSize)
		};
		entries.push(currentEntry);
		assistantMessageIndex = undefined;
	}
	return entries;
}

// The TOC is rebuilt on every scroll (its active entry follows the viewport), and normalizing every
// message's text each time made scrolling a long thread drop frames. Messages are replaced, never
// mutated, so their text is computed once per message object.
const messageTextCache = new WeakMap<AIThreadItem, { renderedContent?: string; text: string }>();

function messageText(message: AIThreadItem, renderedContent?: string): string {
	const cached = messageTextCache.get(message);
	if (cached && cached.renderedContent === renderedContent) return cached.text;
	const text = computeMessageText(message, renderedContent);
	messageTextCache.set(message, { renderedContent, text });
	return text;
}

function computeMessageText(message: AIThreadItem, renderedContent?: string): string {
	const content = normalize(message.content ?? '');
	if (content) return content;
	const partContent = normalize(
		(message.parts ?? [])
			.filter((part) => part.type === 'text' && typeof part.text === 'string')
			.map((part) => part.text)
			.join(' ')
	);
	return partContent || normalize(renderedContent ?? '');
}

function activeEntryIndex<TMessage extends AIThreadItem>(
	entries: readonly AIThreadTocEntry<TMessage>[],
	visibleStartOffset: number,
	visibleEndOffset: number,
	isPinnedToBottom: boolean
): number | undefined {
	if (entries.length === 0) return undefined;
	if (isPinnedToBottom) return entries.length - 1;
	const viewportSize = Math.max(0, visibleEndOffset - visibleStartOffset);
	const anchorOffset = visibleStartOffset + Math.min(48, viewportSize * 0.12);
	let activeIndex: number | undefined;
	for (const [index, entry] of entries.entries()) {
		if (entry.offset > anchorOffset) break;
		activeIndex = index;
	}
	return activeIndex ?? 0;
}

function createPin<TMessage extends AIThreadItem>(
	entry: AIThreadTocEntry<TMessage>,
	entryIndex: number,
	isBucket: boolean
): AIThreadTocPin<TMessage> {
	return {
		key: `${entry.key}:${entryIndex}`,
		entry,
		entryIndex,
		isBucket
	};
}

function preserveIndex(indexes: Set<number>, index: number | undefined, length: number): void {
	if (index !== undefined && index >= 0 && index < length) indexes.add(index);
}

function entryCenter(entry: AIThreadTocEntry): number {
	return entry.offset + entry.size / 2;
}

function bucketEntryIndexes<TMessage extends AIThreadItem>(
	entries: readonly AIThreadTocEntry<TMessage>[],
	preservedIndexes: Set<number>,
	bucketCount: number
): number[] {
	const candidates = entries
		.map((entry, entryIndex) => ({ entry, entryIndex }))
		.filter(({ entryIndex }) => !preservedIndexes.has(entryIndex));
	if (candidates.length === 0 || bucketCount <= 0) return [];
	const firstOffset = entryCenter(entries[0]);
	const lastOffset = entryCenter(entries[entries.length - 1]);
	if (lastOffset <= firstOffset) return bucketEntryIndexesByOrder(candidates, bucketCount);

	const buckets = Array.from({ length: bucketCount }, () => [] as typeof candidates);
	const span = lastOffset - firstOffset;
	for (const candidate of candidates) {
		const ratio = (entryCenter(candidate.entry) - firstOffset) / span;
		const bucketIndex = Math.min(bucketCount - 1, Math.max(0, Math.floor(ratio * bucketCount)));
		buckets[bucketIndex]?.push(candidate);
	}

	return buckets.flatMap((bucket, bucketIndex) => {
		if (bucket.length === 0) return [];
		const center = firstOffset + (bucketIndex + 0.5) * (span / bucketCount);
		let nearest = bucket[0];
		for (const candidate of bucket.slice(1)) {
			if (
				Math.abs(entryCenter(candidate.entry) - center) <
				Math.abs(entryCenter(nearest.entry) - center)
			) {
				nearest = candidate;
			}
		}
		return nearest ? [nearest.entryIndex] : [];
	});
}

function bucketEntryIndexesByOrder<TMessage extends AIThreadItem>(
	candidates: Array<{ entry: AIThreadTocEntry<TMessage>; entryIndex: number }>,
	count: number
): number[] {
	if (count <= 0 || candidates.length === 0) return [];
	return Array.from({ length: Math.min(count, candidates.length) }, (_, position) => {
		const candidateIndex = Math.min(
			candidates.length - 1,
			Math.floor(((position + 0.5) * candidates.length) / count)
		);
		return candidates[candidateIndex]?.entryIndex;
	}).filter((entryIndex): entryIndex is number => entryIndex !== undefined);
}

function normalize(value: string): string {
	return value.replace(/\s+/g, ' ').trim();
}

function truncate(value: string, maxLength: number): string {
	const normalized = normalize(value);
	if (normalized.length <= maxLength) return normalized;
	return `${normalized.slice(0, Math.max(0, maxLength - 3)).trimEnd()}...`;
}

function nonNegative(value: number): number {
	return Number.isFinite(value) && value > 0 ? value : 0;
}

function clamp(value: number, minimum: number, maximum: number): number {
	return Math.min(Math.max(value, minimum), maximum);
}
