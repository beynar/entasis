// How an open ask() dialog appears to AI agents: the tool of its Form, named `answer_dialog`, and
// `cancel_dialog`. The tools follow the buttons: a disabled one has no tool, as a person could not
// press it.

import type { WebMCPExpose } from '$lib/utils/webmcp/webmcp.exposure.svelte.js';
import { watchWebMCP } from '$lib/utils/webmcp/webmcp.exposure.svelte.js';
import {
	registerWebMCPTool,
	toolOptions,
	toolText,
	type WebMCPToolHandle
} from '$lib/utils/webmcp/webmcp.registry.js';
import type { WebMCPTool, WebMCPToolProp } from '$lib/utils/webmcp/webmcp.types.js';
import type { FormInputs } from '../Form/form.js';
import type { AskButton, AskOptions } from './ask.props.js';

type AskToolState = {
	readonly id: string;
	readonly open: boolean;
	readonly options: AskOptions<FormInputs>;
};

export type AskToolSource = {
	readonly asks: readonly AskToolState[];
	readonly cancel: (id: string) => boolean;
};

const buttonText = (button: AskButton): string =>
	toolText(typeof button === 'string' ? button : button.text);

const isDisabled = (button: AskButton): boolean =>
	typeof button !== 'string' && Boolean(button.disabled);

/** What the dialog's Form takes as its `tool` prop. */
export function askFormTool(options: AskOptions<FormInputs>): WebMCPToolProp {
	const { title, description, confirm, tool } = options;
	if (tool === false || isDisabled(confirm)) return false;
	const dialog = [toolText(title), toolText(description)].filter(Boolean).join(': ');
	return {
		name: 'answer_dialog',
		title: toolText(title) || undefined,
		description:
			`A dialog is waiting for an answer${dialog ? ` (${dialog})` : ''}. ` +
			`Calling this tool fills it in and confirms it with "${buttonText(confirm)}".`,
		...toolOptions(tool)
	};
}

const cancelTool = ({ id, options }: AskToolState, source: AskToolSource): WebMCPTool => ({
	name: 'cancel_dialog',
	description: `Dismisses the open dialog with "${buttonText(options.cancel)}", without answering it.`,
	execute: () => ({ status: source.cancel(id) ? 'cancelled' : 'busy' })
});

export const expose: WebMCPExpose<AskToolSource> = (source, config) => {
	const handles = new Map<string, WebMCPToolHandle>();
	const stop = watchWebMCP(() => {
		const exposedTo = config.options?.exposedTo;
		const open = source.asks.filter(
			({ open, options }) => open && options.tool !== false && !isDisabled(options.cancel)
		);
		for (const ask of open) {
			const handle = handles.get(ask.id);
			if (handle) handle.update(cancelTool(ask, source), { exposedTo });
			else {
				handles.set(
					ask.id,
					registerWebMCPTool(cancelTool(ask, source), { exposedTo, modal: ask.id })
				);
			}
		}
		for (const [id, handle] of handles) {
			if (open.some((ask) => ask.id === id)) continue;
			handle.remove();
			handles.delete(id);
		}
	});
	return () => {
		stop();
		for (const handle of handles.values()) handle.remove();
		handles.clear();
	};
};
