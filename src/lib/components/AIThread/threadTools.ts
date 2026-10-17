import type { AIToolCall, AIToolStatus } from '../AITool/aiTool.props.js';
import { getAIToolStatusFromState } from '../AITool/toolRendering.js';
import type { AIThreadItem, AIThreadPart, AIThreadToolPart } from './aiThread.props.js';

/**
 * Every tool call a transcript message carries, in order: AI SDK tool parts and `{ type: 'tool' }`
 * parts first, then `tools`, `tool`, or a tool-shaped message. Shared by the render-item
 * derivation and ask-user-question detection so both see the same calls with the same ids.
 */
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

export function normalizeToolCall(tool: AIToolCall, fallbackId: string): AIToolCall {
	return { ...tool, id: tool.id ?? fallbackId, status: toolStatus(tool) };
}

export function toolFromPart(part: AIThreadPart, fallbackId: string): AIToolCall | undefined {
	if (part.type === 'tool' && part.tool) return normalizeToolCall(part.tool, fallbackId);
	if (!isToolPart(part)) return undefined;
	const name = part.toolName ?? (part.type.startsWith('tool-') ? part.type.slice(5) : undefined);
	return normalizeToolCall(
		{
			id: part.toolCallId ?? fallbackId,
			name,
			title: name,
			// AI SDK approval states (`approval-requested`, `approval-responded`, `output-denied`) map
			// onto AITool's own statuses, so a call waiting on the user never spins.
			status: getAIToolStatusFromState(part.state),
			input: part.input,
			output: part.output,
			structuredContent: part.structuredContent,
			result: part.result,
			error: part.errorText ?? part.error,
			...(part.approval ? { approval: part.approval } : {}),
			_meta: part._meta
		},
		fallbackId
	);
}

export function isToolPart(part: AIThreadPart): part is AIThreadToolPart {
	return part.type === 'dynamic-tool' || part.type?.startsWith('tool-') === true;
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
