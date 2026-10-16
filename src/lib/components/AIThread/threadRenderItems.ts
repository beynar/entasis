import type { AIAskAnswers, AIAskQuestion } from '../AIAskUserQuestion/aiAskUserQuestion.props.js';
import type { AIToolCall } from '../AITool/aiTool.props.js';
import type {
	AIFileSource,
	AIThreadAskUserQuestion,
	AIThreadAskUserQuestionState,
	AIThreadItem,
	AIThreadPart,
	AIThreadRole,
	AIThreadSource
} from './aiThread.props.js';
import { isAskUserQuestionTool, toAskUserQuestionRequest } from './threadAskUserQuestion.js';
import { collectAIThreadMessageTools, normalizeToolCall, toolFromPart } from './threadTools.js';

export { collectAIThreadMessageTools } from './threadTools.js';

/**
 * The action bar of one transcript unit. A user message is its own unit; an assistant turn —
 * reasoning, tools, and text up to the next user message or marker — is one unit with one bar at
 * its end. `content` joins every text segment of the unit, so copy takes the whole answer, and
 * `message`/`messageIndex` point at the turn's last assistant message, the retry target.
 */
export type AIThreadUnitActions<TMessage extends AIThreadItem = AIThreadItem> = {
	message: TMessage;
	messageIndex: number;
	role: AIThreadRole;
	content: string;
	/** The unit is the final assistant turn: nothing but markers follows it. */
	latest: boolean;
};

export type AIThreadRenderItem<TMessage extends AIThreadItem = AIThreadItem> = (
	| {
			kind: 'message';
			key: string;
			message: TMessage;
			messageIndex: number;
			content?: string;
			/** Files from AI SDK `file` parts, shown with this segment. */
			files?: readonly AIFileSource[];
			/** The unit's action bar when this segment ends its unit; `false` when another one does. */
			actions?: AIThreadUnitActions<TMessage> | false;
			/** The segment is the end of a reply that is still streaming. */
			streaming?: boolean;
	  }
	| {
			kind: 'marker';
			key: string;
			message: TMessage;
			messageIndex: number;
			content: string;
			variant: TMessage['markerVariant'];
	  }
	| {
			kind: 'tool-group';
			key: string;
			message: TMessage;
			messageIndex: number;
			tools: AIToolCall[];
	  }
	| {
			kind: 'reasoning';
			key: string;
			message: TMessage;
			messageIndex: number;
			content: string;
			streaming: boolean;
	  }
	| {
			kind: 'question-summary';
			key: string;
			message: TMessage;
			messageIndex: number;
			questions: readonly AIAskQuestion[];
			value: AIAskAnswers;
			title?: string;
	  }
	| {
			kind: 'sources';
			key: string;
			message: TMessage;
			messageIndex: number;
			sources: AIThreadSource[];
	  }
	| {
			/** A unit's action bar on its own row, when the unit ends with tools or reasoning. */
			kind: 'actions';
			key: string;
			message: TMessage;
			messageIndex: number;
			actions: AIThreadUnitActions<TMessage>;
	  }
	| {
			/** Placeholder assistant row while a reply to the last user turn has not started. */
			kind: 'pending';
			key: string;
	  }
	| {
			/** The conversation error, shown where the reply failed. */
			kind: 'error';
			key: string;
	  }
) & {
	/**
	 * The key of the transcript unit the row belongs to (a user message, an assistant turn or a
	 * marker). Rows of one unit share it; status rows (pending, error) have none.
	 */
	unit?: string;
};

export type DeriveAIThreadRenderItemsOptions<TMessage extends AIThreadItem> = {
	getMessageKey: (message: TMessage, index: number) => string;
	activeQuestion?: AIThreadAskUserQuestion<TMessage> | null;
	splitMessageParts?: boolean;
	/** Local ask-user-question resolutions, by request key, that the messages may not show yet. */
	questionStates?: Record<string, AIThreadAskUserQuestionState | undefined>;
	/** Submitted ask-user-question values by request key. */
	questionValues?: Record<string, AIAskAnswers | undefined>;
	/** An assistant reply is streaming: adds the pending row or marks the streaming segment. */
	streaming?: boolean;
	/** Appends the error row at the end of the transcript. */
	error?: boolean;
};

type PendingToolGroup<TMessage extends AIThreadItem> = {
	firstKey: string;
	lastKey: string;
	message: TMessage;
	messageIndex: number;
	tools: AIToolCall[];
};

type ContentItem<TMessage extends AIThreadItem> = Exclude<
	AIThreadRenderItem<TMessage>,
	{ kind: 'pending' } | { kind: 'error' }
>;
type MessageItem<TMessage extends AIThreadItem> = Extract<
	AIThreadRenderItem<TMessage>,
	{ kind: 'message' }
>;

export function deriveAIThreadRenderItems<TMessage extends AIThreadItem>(
	messages: readonly TMessage[],
	options: DeriveAIThreadRenderItemsOptions<TMessage>
): AIThreadRenderItem<TMessage>[] {
	const items: ContentItem<TMessage>[] = [];
	let pendingTools: PendingToolGroup<TMessage> | undefined;

	function flushTools(): void {
		if (!pendingTools) return;
		items.push({
			kind: 'tool-group',
			key: `tools:${pendingTools.firstKey}:${pendingTools.lastKey}:${pendingTools.tools.length}`,
			message: pendingTools.message,
			messageIndex: pendingTools.messageIndex,
			tools: pendingTools.tools
		});
		pendingTools = undefined;
	}

	function pushMessage(
		message: TMessage,
		messageIndex: number,
		key: string,
		content?: string,
		files?: readonly AIFileSource[]
	): void {
		items.push({
			kind: 'message',
			key,
			message,
			messageIndex,
			content,
			...(files?.length ? { files } : {})
		});
	}

	function pushMarker(
		message: TMessage,
		messageIndex: number,
		key: string,
		content: string,
		variant: TMessage['markerVariant']
	): void {
		items.push({ kind: 'marker', key, message, messageIndex, content, variant });
	}

	function addTool(
		tool: AIToolCall,
		toolIndex: number,
		message: TMessage,
		messageIndex: number,
		messageKey: string
	): void {
		const normalizedTool = normalizeToolCall(tool, `${messageKey}:tool-${toolIndex}`);
		if (isQuestionTool(options.activeQuestion, messageIndex, normalizedTool, toolIndex)) {
			flushTools();
			return;
		}
		const question = isAskUserQuestionTool(normalizedTool)
			? toAskUserQuestionRequest(
					message,
					messageIndex,
					messageKey,
					normalizedTool,
					toolIndex,
					options.questionStates ?? {}
				)
			: undefined;
		// An answered question keeps a compact question → answer record in the transcript instead of
		// a raw tool row; a dismissed one settles as a cancelled call rather than spinning.
		if (question?.state === 'completed') {
			flushTools();
			items.push({
				kind: 'question-summary',
				key: `${messageKey}:question-${toolIndex}`,
				message,
				messageIndex,
				questions: question.questions,
				value: options.questionValues?.[question.key] ?? question.value ?? {},
				title: question.title
			});
			return;
		}
		const groupedTool =
			question?.state === 'discarded' ? { ...normalizedTool, status: 'cancelled' } : normalizedTool;
		pendingTools ??= {
			firstKey: `${messageKey}:${toolIndex}`,
			lastKey: `${messageKey}:${toolIndex}`,
			message,
			messageIndex,
			tools: []
		};
		pendingTools.lastKey = `${messageKey}:${toolIndex}`;
		pendingTools.tools.push(groupedTool);
	}

	for (const [messageIndex, message] of messages.entries()) {
		const messageKey = options.getMessageKey(message, messageIndex);
		if (message.type === 'marker' || message.type === 'context') {
			flushTools();
			pushMarker(
				message,
				messageIndex,
				`${messageKey}:marker`,
				message.content ?? message.name ?? '',
				message.markerVariant
			);
			continue;
		}

		if (options.splitMessageParts !== false && message.parts?.length) {
			let files: readonly AIFileSource[] | undefined = messageFileParts(message.parts, messageKey);
			// Files may be spliced in at the start of this message below, so a tool group still open
			// from the previous message closes first and keeps its place before them.
			if (files.length > 0) flushTools();
			const firstItemIndex = items.length;
			let sources: AIThreadSource[] | undefined;
			let renderedPart = false;
			const takeFiles = () => {
				const taken = files;
				files = undefined;
				return taken;
			};
			const hasTextPart = message.parts.some((part) => part.type === 'text' && Boolean(part.text));
			if (!hasTextPart && hasMessageContent(message)) {
				flushTools();
				pushMessage(message, messageIndex, `${messageKey}:content`, undefined, takeFiles());
				renderedPart = true;
			}
			let toolIndex = 0;
			const lastPartIndex = message.parts.length - 1;
			const isLastMessage = messageIndex === messages.length - 1;
			for (const [partIndex, part] of message.parts.entries()) {
				const partKey = `${messageKey}:part-${partIndex}`;
				const tool = toolFromPart(part, partKey);
				if (tool) {
					addTool(tool, toolIndex, message, messageIndex, messageKey);
					toolIndex += 1;
					renderedPart = true;
					continue;
				}
				if (part.type === 'marker' && typeof part.content === 'string') {
					flushTools();
					pushMarker(message, messageIndex, partKey, part.content, part.variant);
					renderedPart = true;
					continue;
				}
				if (part.type === 'text' && part.text) {
					flushTools();
					pushMessage(message, messageIndex, partKey, part.text, takeFiles());
					renderedPart = true;
					continue;
				}
				if (part.type === 'reasoning' && typeof part.text === 'string' && part.text) {
					flushTools();
					items.push({
						kind: 'reasoning',
						key: partKey,
						message,
						messageIndex,
						content: part.text,
						// AI SDK marks a reasoning part `streaming` until it is done; without a state, the
						// last part of a streaming reply is the one still being written.
						streaming:
							part.state === 'streaming' ||
							(part.state === undefined &&
								Boolean(options.streaming) &&
								isLastMessage &&
								partIndex === lastPartIndex)
					});
					renderedPart = true;
					continue;
				}
				const source = sourceFromPart(part, partKey);
				if (source) {
					if (sources) {
						sources.push(source);
					} else {
						flushTools();
						sources = [source];
						items.push({
							kind: 'sources',
							key: `${partKey}:sources`,
							message,
							messageIndex,
							sources
						});
					}
					renderedPart = true;
				}
			}
			// Files with no text segment to sit on get a segment of their own, first in the message,
			// where an uploaded file sits above its prompt.
			const leftoverFiles = takeFiles();
			if (leftoverFiles?.length) {
				items.splice(firstItemIndex, 0, {
					kind: 'message',
					key: `${messageKey}:files`,
					message,
					messageIndex,
					content: '',
					files: leftoverFiles
				});
				renderedPart = true;
			}
			if (renderedPart) continue;
		}

		const tools = collectAIThreadMessageTools(
			message,
			messageIndex,
			messageKey,
			options.splitMessageParts !== false
		);
		if (tools.length > 0) {
			if (hasMessageContent(message)) {
				flushTools();
				pushMessage(message, messageIndex, `${messageKey}:content`);
			}
			for (const [toolIndex, tool] of tools.entries()) {
				addTool(tool, toolIndex, message, messageIndex, messageKey);
			}
			continue;
		}

		// An assistant message with nothing visible is not a row: an AI SDK message whose parts are
		// only `step-start`, `data-*` or empty text, or the empty placeholder a client adds before the
		// first token. While the reply streams, the pending row stays in its place.
		if (
			isEmptyAssistantMessage(message) &&
			(message.parts !== undefined || (options.streaming && messageIndex === messages.length - 1))
		) {
			continue;
		}
		flushTools();
		pushMessage(message, messageIndex, `${messageKey}:message`);
	}

	flushTools();
	const withActions = assignUnitActions(items, options.streaming === true);
	return appendStatusItems(withActions, options);
}

type Unit = { kind: 'user' | 'system' | 'assistant' | 'none'; start: number; end: number };

function itemRole<TMessage extends AIThreadItem>(item: ContentItem<TMessage>): AIThreadRole {
	return item.message.role ?? 'assistant';
}

/**
 * Splits the transcript into units and gives each one action bar. A user (or system) message is
 * one unit; an assistant turn runs from the first non-user item to the next user message or
 * marker. The bar sits on the unit's last text segment when the unit ends with text, otherwise
 * on an `actions` row after the unit. The final assistant turn of a streaming reply has no bar.
 * Like markers, system notices do not end the latest turn: only a user message does.
 */
function assignUnitActions<TMessage extends AIThreadItem>(
	items: ContentItem<TMessage>[],
	streaming: boolean
): ContentItem<TMessage>[] {
	const units: Unit[] = [];
	for (const [index, item] of items.entries()) {
		const previous = units.at(-1);
		if (item.kind === 'marker') {
			units.push({ kind: 'none', start: index, end: index });
			continue;
		}
		const role = itemRole(item);
		if (item.kind === 'message' && (role === 'user' || role === 'system')) {
			const kind = role === 'user' ? 'user' : 'system';
			// Several text parts of one user message stay one unit.
			const previousItem = previous ? items[previous.end] : undefined;
			if (
				previous?.kind === kind &&
				previousItem?.kind === 'message' &&
				previousItem.messageIndex === item.messageIndex
			) {
				previous.end = index;
			} else {
				units.push({ kind, start: index, end: index });
			}
			continue;
		}
		if (previous?.kind === 'assistant') previous.end = index;
		else units.push({ kind: 'assistant', start: index, end: index });
	}

	const lastUserUnit = units.findLastIndex((unit) => unit.kind === 'user');
	const lastAssistantUnit = units.findLastIndex((unit) => unit.kind === 'assistant');
	const result: ContentItem<TMessage>[] = [];
	for (const [unitIndex, unit] of units.entries()) {
		const unitItems = items.slice(unit.start, unit.end + 1);
		const unitKey = unitItems[0]!.key;
		if (unit.kind === 'none') {
			result.push(...unitItems.map((item) => ({ ...item, unit: unitKey })));
			continue;
		}
		const latest =
			unit.kind === 'assistant' && unitIndex === lastAssistantUnit && unitIndex > lastUserUnit;
		const messageItems = unitItems.filter(
			(item): item is MessageItem<TMessage> => item.kind === 'message'
		);
		const content = messageItems
			.map((item) => item.content ?? item.message.content ?? '')
			.filter(Boolean)
			.join('\n\n');
		const last = unitItems.at(-1)!;
		const target =
			messageItems.findLast((item) => itemRole(item) === 'assistant') ??
			messageItems.at(-1) ??
			last;
		const actions: AIThreadUnitActions<TMessage> = {
			message: target.message,
			messageIndex: target.messageIndex,
			role: unit.kind === 'assistant' ? 'assistant' : itemRole(target),
			content,
			latest
		};
		const replying = streaming && latest;
		// The bar rides on the last segment only when that segment holds the whole unit's text (and
		// is the retry target), so its copy and retry act on the unit; otherwise it gets a row.
		const barOnLast =
			last.kind === 'message' &&
			last === target &&
			(last.content ?? last.message.content ?? '') === content;
		for (const item of unitItems) {
			if (item.kind !== 'message') {
				result.push({ ...item, unit: unitKey });
				continue;
			}
			const isLast = item === last;
			result.push({
				...item,
				unit: unitKey,
				actions: isLast && barOnLast && !replying ? actions : false,
				...(replying && isLast ? { streaming: true } : {})
			});
		}
		if (!replying && !barOnLast) {
			result.push({
				kind: 'actions',
				key: `${last.key}:actions`,
				message: actions.message,
				messageIndex: actions.messageIndex,
				actions,
				unit: unitKey
			});
		}
	}
	return result;
}

function appendStatusItems<TMessage extends AIThreadItem>(
	items: ContentItem<TMessage>[],
	options: DeriveAIThreadRenderItemsOptions<TMessage>
): AIThreadRenderItem<TMessage>[] {
	const result: AIThreadRenderItem<TMessage>[] = items;
	if (options.error) {
		result.push({ kind: 'error', key: `error:${items.at(-1)?.key ?? 'empty'}` });
		return result;
	}
	if (!options.streaming) return result;
	const lastContent = items.findLast((item) => item.kind !== 'marker');
	if (lastContent?.kind === 'message' && itemRole(lastContent) === 'user') {
		result.push({ kind: 'pending', key: `pending:${lastContent.key}` });
	}
	return result;
}

function hasMessageContent(message: AIThreadItem): boolean {
	return message.content !== undefined && message.content !== '';
}

function isEmptyAssistantMessage(message: AIThreadItem): boolean {
	return (
		(message.role ?? 'assistant') === 'assistant' &&
		!hasMessageContent(message) &&
		!message.files?.length &&
		!message.attachments?.length
	);
}

const SAFE_URL = /^(?:https?:|blob:|data:image\/)/i;

function messageFileParts(parts: readonly AIThreadPart[], messageKey: string): AIFileSource[] {
	return parts.flatMap((part, index) => {
		if (part.type !== 'file') return [];
		const url = typeof part.url === 'string' && SAFE_URL.test(part.url) ? part.url : undefined;
		const type = typeof part.mediaType === 'string' ? part.mediaType : undefined;
		const name =
			(typeof part.filename === 'string' && part.filename) ||
			(url && !url.startsWith('data:') ? (url.split(/[?#]/)[0]?.split('/').at(-1) ?? '') : '') ||
			type ||
			'file';
		return [{ id: `${messageKey}:part-${index}`, name, type, previewUrl: url }];
	});
}

function sourceFromPart(part: AIThreadPart, key: string): AIThreadSource | undefined {
	if (part.type === 'source-url' && typeof part.url === 'string') {
		const url = /^https?:/i.test(part.url) ? part.url : undefined;
		return {
			id: typeof part.sourceId === 'string' ? part.sourceId : key,
			url,
			title: (typeof part.title === 'string' && part.title) || hostname(part.url) || part.url
		};
	}
	if (part.type === 'source-document') {
		return {
			id: typeof part.sourceId === 'string' ? part.sourceId : key,
			title:
				(typeof part.title === 'string' && part.title) ||
				(typeof part.filename === 'string' && part.filename) ||
				(typeof part.mediaType === 'string' ? part.mediaType : key)
		};
	}
	return undefined;
}

function hostname(url: string): string | undefined {
	try {
		return new URL(url).hostname.replace(/^www\./, '');
	} catch {
		return undefined;
	}
}

function isQuestionTool<TMessage extends AIThreadItem>(
	request: AIThreadAskUserQuestion<TMessage> | null | undefined,
	messageIndex: number,
	tool: AIToolCall,
	toolIndex: number
): request is AIThreadAskUserQuestion<TMessage> {
	if (!request || (request.state !== undefined && request.state !== 'pending')) return false;
	if (request.messageIndex !== messageIndex) return false;
	if (request.tool.id !== undefined && tool.id !== undefined) return request.tool.id === tool.id;
	if (request.toolIndex !== undefined) return request.toolIndex === toolIndex;
	return request.tool === tool;
}
