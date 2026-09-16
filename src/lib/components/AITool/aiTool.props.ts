import type { Slot } from '$lib/components/Slot/slot.js';
import type { DisclosureIndicator } from '$lib/types/theme.js';
import type { WithAttachments } from '$lib/types/props.js';
import type { HTMLAttributes } from 'svelte/elements';
import type { AIToolThemeProps } from './aiTool.theme.js';

export type AIToolStatus =
	| 'pending'
	| 'loading'
	| 'running'
	| 'streaming'
	| 'success'
	| 'error'
	| 'cancelled'
	| (string & {});

export type AIToolVariant = 'card' | 'ghost' | 'outline' | 'soft';
export type AIToolToggleIcon = DisclosureIndicator;

export type AIToolCall = {
	id?: string | number | bigint;
	name?: string;
	title?: string;
	status?: AIToolStatus;
	input?: unknown;
	output?: unknown;
	structuredContent?: unknown;
	result?: unknown;
	error?: unknown;
	_meta?: Record<string, unknown>;
};

export type AIToolRenderPayload = {
	tool: AIToolCall;
	index: number;
};

export type AIToolSnippet = Slot<AIToolRenderPayload>;

export type AIToolLabels = {
	fallbackTitle: string;
	group: (count: number) => string;
	input: string;
	output: string;
	error: string;
	empty: string;
};

type AIToolRootAttributes = Omit<
	HTMLAttributes<HTMLDivElement>,
	'children' | 'class' | 'content' | 'icon' | 'input' | 'output' | 'title'
>;

export type AIToolProps = WithAttachments<
	AIToolRootAttributes & {
		/** Bindable reference to the root tool-call group. */
		ref?: HTMLDivElement | null;
		/** Single call fallback used when `tools` is empty. */
		tool?: AIToolCall;
		/** Consecutive calls rendered as one aggregate accordion group. Takes precedence over `tool`. */
		tools?: readonly AIToolCall[];
		/** Bindable ids of the expanded single call or aggregate call group. */
		value?: string[];
		/** Initial expanded call or group ids when value is omitted. */
		defaultValue?: string[];
		/** Called once for each library-originated expansion state change. */
		onValueChange?: (value: string[]) => void;
		/** Allows multiple nested tool-call rows to remain expanded. */
		multiple?: boolean;
		/** Visual treatment applied to the group trigger and each complete call surface. @default 'ghost' */
		variant?: AIToolVariant;
		/** Expand indicator shown on group and child triggers. */
		toggleIcon?: AIToolToggleIcon;
		/** Maximum nested object depth in the default value renderer. */
		maxDepth?: number;
		/** Maximum entries rendered per object or array. */
		maxEntries?: number;
		/** Overrides labels used by the default renderer. */
		labels?: Partial<AIToolLabels>;
		/** Formats the accessible label for the default status indicator. */
		formatStatus?: (status: AIToolStatus) => string;
		/** Custom renderer for the tool icon. */
		icon?: Slot<AIToolRenderPayload>;
		/** Custom renderer for the tool title. */
		title?: Slot<AIToolRenderPayload>;
		/** Replaces the default body for a tool call. */
		content?: Slot<AIToolRenderPayload>;
		/** Custom renderer for an input section. */
		input?: Slot<AIToolRenderPayload>;
		/** Custom renderer for an output section. Also renders errors when `error` is omitted. */
		output?: Slot<AIToolRenderPayload>;
		/** Custom renderer for an error section. */
		error?: Slot<AIToolRenderPayload>;
		/** Custom status renderer. */
		status?: Slot<AIToolRenderPayload>;
		/** Class applied to the root tool-call group. */
		class?: string;
		/** Theme overrides for accordions, tool rows, value sections, status, and value trees. */
		theme?: AIToolThemeProps;
	}
>;
