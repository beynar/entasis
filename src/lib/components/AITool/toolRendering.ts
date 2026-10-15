import type { Messages } from '$lib/i18n/en.js';
import type { Colors } from '$lib/types/theme.js';
import type { AIToolCall, AIToolStatus } from './aiTool.props.js';

export type AIToolStatusTone =
	'active' | 'awaiting' | 'success' | 'error' | 'denied' | 'cancelled' | 'default';

// Statuses that show a spinner. Approval requests and denials have no output yet but are not
// running: they wait on, or were stopped by, the user, so they must never spin.
const activeStatuses = new Set<AIToolStatus>([
	'pending',
	'loading',
	'running',
	'streaming',
	'approval-responded'
]);

/**
 * Maps an AI SDK UI tool part `state` onto an AITool status. Unknown states return `undefined`
 * so callers can fall back to inference from output and errors.
 */
export function getAIToolStatusFromState(state: string | undefined): AIToolStatus | undefined {
	switch (state) {
		case 'input-streaming':
			return 'streaming';
		case 'input-available':
			return 'running';
		case 'approval-requested':
			return 'approval-requested';
		case 'approval-responded':
			return 'approval-responded';
		case 'output-available':
			return 'success';
		case 'output-error':
			return 'error';
		case 'output-denied':
			return 'output-denied';
		default:
			return undefined;
	}
}

export function resolveAIToolStatus(tool: AIToolCall): AIToolStatus {
	// A responded approval that was declined is a denial, whatever state the stream reports.
	if (tool.approval?.approved === false && !hasOutcome(tool)) return 'output-denied';
	if (tool.status) return tool.status;
	if (tool.error !== undefined || isErrorResult(tool.result)) return 'error';
	if (hasOutcome(tool)) return 'success';
	return 'pending';
}

export function resolveAIToolGroupStatus(tools: readonly AIToolCall[]): AIToolStatus {
	const statuses = tools.map(resolveAIToolStatus);
	return (
		statuses.find((status) => status === 'error') ??
		statuses.find((status) => status === 'approval-requested') ??
		statuses.find(isActiveAIToolStatus) ??
		statuses.find((status) => status === 'output-denied') ??
		statuses.find((status) => status === 'cancelled') ??
		(statuses.every((status) => status === 'success') ? 'success' : statuses[0]) ??
		'pending'
	);
}

export function isActiveAIToolStatus(status: AIToolStatus): boolean {
	return activeStatuses.has(status);
}

/** Readable fallback for app-defined statuses: `needs-review` → "Needs review". */
export function formatAIToolStatus(status: AIToolStatus): string {
	const words = status.split(/[-_\s]+/).filter(Boolean);
	return capitalize(words.join(' ').toLowerCase());
}

/** Localized word for a built-in status; app-defined statuses fall back to their readable form. */
export function getAIToolStatusLabel(status: AIToolStatus, t: Messages): string {
	switch (status) {
		case 'pending':
			return t.aiToolStatusPending;
		case 'loading':
		case 'running':
			return t.aiToolStatusRunning;
		case 'streaming':
			return t.aiToolStatusStreaming;
		case 'success':
			return t.aiToolStatusSuccess;
		case 'error':
			return t.aiToolStatusError;
		case 'cancelled':
			return t.aiToolStatusCancelled;
		case 'approval-requested':
			return t.aiToolStatusAwaitingApproval;
		case 'approval-responded':
			return t.aiToolStatusApproved;
		case 'output-denied':
			return t.aiToolStatusDenied;
		default:
			return formatAIToolStatus(status);
	}
}

export function getAIToolStatusColor(status: AIToolStatus): Colors {
	const tone = getAIToolStatusTone(status);
	if (tone === 'success') return 'success';
	if (tone === 'error') return 'danger';
	if (tone === 'awaiting') return 'warning';
	if (tone === 'active') return 'info';
	return 'neutral';
}

export function getAIToolStatusTone(status: AIToolStatus): AIToolStatusTone {
	if (status === 'success') return 'success';
	if (status === 'error') return 'error';
	if (status === 'cancelled') return 'cancelled';
	if (status === 'approval-requested') return 'awaiting';
	if (status === 'output-denied') return 'denied';
	if (isActiveAIToolStatus(status)) return 'active';
	return 'default';
}

export function hasRenderableAIToolValue(value: unknown): boolean {
	return value !== undefined && value !== '';
}

export function getAIToolOutputValue(tool: AIToolCall): unknown {
	if (tool.output !== undefined) return tool.output;
	if (tool.structuredContent !== undefined) return tool.structuredContent;
	return tool.result;
}

export function getAIToolErrorValue(tool: AIToolCall): unknown {
	if (tool.error !== undefined) return tool.error;
	return isErrorResult(tool.result) ? tool.result : undefined;
}

export function getAIToolCallValue(tool: AIToolCall, index: number): string {
	return `${getAIToolValue(tool, index)}:${index}`;
}

export function getAIToolGroupValue(tools: readonly AIToolCall[]): string {
	const firstTool = tools[0];
	return firstTool ? getAIToolValue(firstTool, 0) : 'tools';
}

/**
 * Readable tool title. An explicit `title` wins unless it only repeats the raw `name`, which is
 * humanized: `searchDocs` → "Search docs", `analyze_release` → "Analyze release",
 * `mcp__github__list_issues` → "List issues".
 */
export function getAIToolTitle(tool: AIToolCall, fallback: string): string {
	if (tool.title && tool.title !== tool.name) return tool.title;
	const name = tool.name ?? tool.title;
	return name ? humanizeAIToolName(name) || name : fallback;
}

export function humanizeAIToolName(name: string): string {
	// MCP-style names namespace the tool behind `__`; the last segment is the tool itself.
	const segments = name.split('__').filter(Boolean);
	const base = segments[segments.length - 1] ?? name;
	const words = base
		.replace(/([a-z\d])([A-Z])/g, '$1 $2')
		.replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
		.split(/[\s_\-.:/]+/)
		.filter(Boolean)
		.map((word) => (/^[A-Z\d]+$/.test(word) && word.length > 1 ? word : word.toLowerCase()));
	return capitalize(words.join(' '));
}

const SUMMARY_MAX_LENGTH = 80;

/**
 * One-line summary of a call's input: an explicit `summary` wins (an empty string hides it),
 * otherwise the first primitive input value. Strings are quoted so `"3"` differs from `3`.
 */
export function getAIToolSummary(tool: AIToolCall): string | undefined {
	if (tool.summary !== undefined) return tool.summary || undefined;
	const value = firstPrimitive(tool.input, 0);
	if (value === undefined) return undefined;
	const text = typeof value === 'string' ? `"${singleLine(value)}"` : String(value);
	return text.length > SUMMARY_MAX_LENGTH ? `${text.slice(0, SUMMARY_MAX_LENGTH - 1)}…` : text;
}

function firstPrimitive(value: unknown, depth: number): string | number | boolean | undefined {
	if (typeof value === 'string') return value.trim() ? value : undefined;
	if (typeof value === 'number' || typeof value === 'boolean') return value;
	if (typeof value === 'bigint') return Number(value);
	if (!value || typeof value !== 'object' || depth > 2) return undefined;
	const entries = Array.isArray(value) ? value : Object.values(value);
	for (const entry of entries.slice(0, 8)) {
		const found = firstPrimitive(entry, depth + 1);
		if (found !== undefined) return found;
	}
	return undefined;
}

function singleLine(value: string): string {
	return value.replace(/\s+/g, ' ').trim();
}

function capitalize(value: string): string {
	return value.charAt(0).toUpperCase() + value.slice(1);
}

/** Group header text: "Search docs · 2 calls", or the distinct tool titles when they differ. */
export function getAIToolGroupSummary(
	tools: readonly AIToolCall[],
	fallbackTitle: string,
	t: Messages
): string {
	const titles = [...new Set(tools.map((tool) => getAIToolTitle(tool, fallbackTitle)))];
	const shown = titles.slice(0, 2).join(', ');
	const label = titles.length > 2 ? `${shown} ${t.aiToolMoreTools(titles.length - 2)}` : shown;
	return t.aiToolGroupSummary(label, tools.length);
}

function toMilliseconds(value: Date | number | string | undefined): number | undefined {
	if (value === undefined) return undefined;
	const time = value instanceof Date ? value.getTime() : new Date(value).getTime();
	return Number.isFinite(time) ? time : undefined;
}

export type AIToolTiming = { startedAt?: number; completedAt?: number; duration?: number };

/** Reads the call's own timing fields as epoch milliseconds and a duration in milliseconds. */
export function getAIToolTiming(tool: AIToolCall): AIToolTiming {
	const startedAt = toMilliseconds(tool.startedAt);
	const completedAt = toMilliseconds(tool.completedAt);
	const duration =
		typeof tool.duration === 'number' && Number.isFinite(tool.duration)
			? Math.max(0, tool.duration)
			: startedAt !== undefined && completedAt !== undefined
				? Math.max(0, completedAt - startedAt)
				: undefined;
	return { startedAt, completedAt, duration };
}

/** Compact elapsed time: "<1s", "6s", "1m 12s", "1h 4m". */
export function formatAIElapsed(milliseconds: number, t: Messages): string {
	const totalSeconds = Math.floor(Math.max(0, milliseconds) / 1000);
	if (totalSeconds < 1) return t.aiElapsedUnderSecond;
	if (totalSeconds < 60) return t.aiElapsedSeconds(totalSeconds);
	const totalMinutes = Math.floor(totalSeconds / 60);
	if (totalMinutes < 60) return t.aiElapsedMinutes(totalMinutes, totalSeconds % 60);
	return t.aiElapsedHours(Math.floor(totalMinutes / 60), totalMinutes % 60);
}

function hasOutcome(tool: AIToolCall): boolean {
	return (
		tool.output !== undefined || tool.structuredContent !== undefined || tool.result !== undefined
	);
}

function getAIToolValue(tool: AIToolCall, index: number): string {
	return String(tool.id ?? index);
}

function isErrorResult(result: unknown): boolean {
	return Boolean(
		result &&
		typeof result === 'object' &&
		'isError' in result &&
		(result as { isError?: unknown }).isError === true
	);
}
