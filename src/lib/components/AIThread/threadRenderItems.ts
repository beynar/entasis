import type { AIToolCall, AIToolStatus } from '../AITool/aiTool.props.js';
import type {
	AIThreadAskUserQuestion,
	AIThreadItem,
	AIThreadPart,
	AIThreadToolPart
} from './aiThread.props.js';

export type AIThreadRenderItem<TMessage extends AIThreadItem = AIThreadItem> =
	| { kind: 'message'; key: string; message: TMessage; messageIndex: number; content?: string }
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
	  };

export type DeriveAIThreadRenderItemsOptions<TMessage extends AIThreadItem> = {
	getMessageKey: (message: TMessage, index: number) => string;
	activeQuestion?: AIThreadAskUserQuestion<TMessage> | null;
	splitMessageParts?: boolean;
};

type PendingToolGroup<TMessage extends AIThreadItem> = {
	firstKey: string;
	lastKey: string;
	message: TMessage;
	messageIndex: number;
	tools: AIToolCall[];
};

export function deriveAIThreadRenderItems<TMessage extends AIThreadItem>(
	messages: readonly TMessage[],
	options: DeriveAIThreadRenderItemsOptions<TMessage>
): AIThreadRenderItem<TMessage>[] {
	const items: AIThreadRenderItem<TMessage>[] = [];
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
		content?: string
	): void {
		items.push({ kind: 'message', key, message, messageIndex, content });
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
		pendingTools ??= {
			firstKey: `${messageKey}:${toolIndex}`,
			lastKey: `${messageKey}:${toolIndex}`,
			message,
			messageIndex,
			tools: []
		};
		pendingTools.lastKey = `${messageKey}:${toolIndex}`;
		pendingTools.tools.push(normalizedTool);
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
			let renderedPart = false;
			const hasTextPart = message.parts.some((part) => part.type === 'text' && Boolean(part.text));
			if (!hasTextPart && hasMessageContent(message)) {
				flushTools();
				pushMessage(message, messageIndex, `${messageKey}:content`);
				renderedPart = true;
			}
			let toolIndex = 0;
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
					pushMessage(message, messageIndex, partKey, part.text);
					renderedPart = true;
				}
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

		flushTools();
		pushMessage(message, messageIndex, `${messageKey}:message`);
	}

	flushTools();
	return items;
}

export function collectAIThreadMessageTools(
	message: AIThreadItem,
	_messageIndex: number,
	messageKey: string,
	includePartTools = true
): AIToolCall[] {
	const partTools = (includePartTools ? (message.parts ?? []) : []).flatMap((part, index) => {
		const tool = toolFromPart(part, `${messageKey}:part-${index}`);
		return tool ? [tool] : [];
	});
	if (partTools.length > 0) return partTools;
	if (message.tools?.length) {
		return message.tools.map((tool, index) =>
			normalizeToolCall(tool, `${messageKey}:tool-${index}`)
		);
	}
	if (message.tool) return [normalizeToolCall(message.tool, messageKey)];
	if (message.role === 'tool' || message.type === 'tool') {
		return [
			{
				id: message.id ?? messageKey,
				name: message.toolName ?? message.name,
				title: message.name,
				status: messageToolStatus(message),
				input: message.input,
				output: message.output !== undefined ? message.output : message.content,
				error: message.error
			}
		];
	}
	return [];
}

function hasMessageContent(message: AIThreadItem): boolean {
	return message.content !== undefined && message.content !== '';
}

function normalizeToolCall(tool: AIToolCall, fallbackId: string): AIToolCall {
	return { ...tool, id: tool.id ?? fallbackId, status: toolStatus(tool) };
}

function toolStatus(tool: AIToolCall): AIToolStatus | undefined {
	if (tool.status) return tool.status;
	if (tool.error !== undefined) return 'error';
	if (tool.output !== undefined || tool.result !== undefined) return 'success';
	return undefined;
}

function messageToolStatus(message: AIThreadItem): AIToolStatus | undefined {
	if (message.status) return message.status;
	if (message.error !== undefined) return 'error';
	if (message.output !== undefined || message.content !== undefined) return 'success';
	return undefined;
}

function toolFromPart(part: AIThreadPart, fallbackId: string): AIToolCall | undefined {
	if (part.type === 'tool' && part.tool) return normalizeToolCall(part.tool, fallbackId);
	if (!isToolPart(part)) return undefined;
	const name = part.toolName ?? (part.type.startsWith('tool-') ? part.type.slice(5) : undefined);
	return normalizeToolCall(
		{
			id: part.toolCallId ?? fallbackId,
			name,
			title: name,
			status: toolPartStatus(part.state),
			input: part.input,
			output: part.output,
			structuredContent: part.structuredContent,
			result: part.result,
			error: part.errorText ?? part.error,
			_meta: part._meta
		},
		fallbackId
	);
}

function isToolPart(part: AIThreadPart): part is AIThreadToolPart {
	return part.type === 'dynamic-tool' || part.type?.startsWith('tool-') === true;
}

function toolPartStatus(state: string | undefined): AIToolStatus | undefined {
	if (state === 'output-error') return 'error';
	if (state === 'output-available') return 'success';
	if (state === 'input-streaming') return 'streaming';
	if (state === 'input-available') return 'running';
	return undefined;
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
