import type { Slot } from '$lib/components/Slot/slot.js';
import type { DisclosureIndicator, Sizes } from '$lib/types/theme.js';
import type { WithAttachments } from '$lib/types/props.js';
import type { Snippet } from 'svelte';
import type { HTMLAttributes } from 'svelte/elements';
import type { AIToolThemeProps } from './aiTool.theme.js';

/**
 * Lifecycle of one call. AI SDK UI tool part states map onto it with
 * `getAIToolStatusFromState`: `input-streaming` → `streaming`, `input-available` → `running`,
 * `approval-requested` → `approval-requested`, `approval-responded` → `approval-responded`,
 * `output-available` → `success`, `output-error` → `error`, `output-denied` → `output-denied`.
 * Only `pending`, `loading`, `running`, `streaming` and `approval-responded` show a spinner;
 * app-defined strings render as a neutral, settled status.
 */
export type AIToolStatus =
	| 'pending'
	| 'loading'
	| 'running'
	| 'streaming'
	| 'success'
	| 'error'
	| 'cancelled'
	/** Waiting for the user to approve or deny the call. Never spins. */
	| 'approval-requested'
	/** The user approved; the call runs until an output state follows. */
	| 'approval-responded'
	/** The user denied the call. Never spins. */
	| 'output-denied'
	| (string & {});

/** How the default renderer shows input, output and object errors. */
export type AIToolValueView = 'json' | 'tree';

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
	/** Approval decision recorded by AI SDK approval flows. `approved: false` renders as denied. */
	approval?: { approved?: boolean; reason?: string };
	/** One-line muted summary shown after the title. Defaults to the first input value; `''` hides it. */
	summary?: string;
	/** Icon shown in place of the leading status mark; the status then moves next to its word. */
	icon?: Snippet<[{ size?: number | string }]>;
	/** When the call started. Enables a live elapsed time while the call runs. */
	startedAt?: Date | number | string;
	/** When the call settled. With `startedAt`, gives the final duration. */
	completedAt?: Date | number | string;
	/** Final duration in milliseconds. Takes precedence over `startedAt` and `completedAt`. */
	duration?: number;
	_meta?: Record<string, unknown>;
};

export type AIToolRenderPayload = {
	tool: AIToolCall;
	index: number;
};

export type AIToolSnippet = Slot<AIToolRenderPayload>;

export type AIToolLabels = {
	/** Title for calls without `title` or `name`. */
	fallbackTitle: string;
	/** Group header text. Defaults to the distinct tool titles and the call count: "Search docs · 2 calls". */
	group: (count: number, tools: readonly AIToolCall[]) => string;
	input: string;
	output: string;
	error: string;
	empty: string;
	/** Expands a long value. */
	showAll: string;
	/** Collapses an expanded long value. */
	showLess: string;
};

type AIToolRootAttributes = Omit<
	HTMLAttributes<HTMLDivElement>,
	'children' | 'class' | 'content' | 'icon' | 'input' | 'output' | 'title'
>;

export type AIToolProps = WithAttachments<
	AIToolRootAttributes & {
		/** Bindable reference to the root tool-call group. */
		ref?: HTMLDivElement | null;
		/** Type and icon scale: `small`, `normal` (default) or `large`, matching AIMessage sizes. AIThread passes its `messageSize`. */
		size?: Sizes;
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
		/** Default value renderer: highlighted, copyable JSON or a key/value tree. @default 'json' */
		valueView?: AIToolValueView;
		/** Lines (JSON) or rows (tree) shown before a value collapses behind "Show all". @default 12 */
		maxLines?: number;
		/** Overrides labels used by the default renderer. */
		labels?: Partial<AIToolLabels>;
		/** Formats the status word and the status mark's accessible label. Defaults to localized words. */
		formatStatus?: (status: AIToolStatus) => string;
		/** Replaces the leading status mark of each call row. */
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
		/** Replaces the trailing status word and duration of each call row. */
		status?: Slot<AIToolRenderPayload>;
		/** Class applied to the root tool-call group. */
		class?: string;
		/** Theme overrides for accordions, tool rows, value sections, status, and value trees. */
		theme?: AIToolThemeProps;
	}
>;
