// How a MultiStepForm appears to AI agents: the Form of the current step, whose tool submits the
// step and so moves to the next. The steps out of view stay out of reach.

import { toolOptions, toolText } from '$lib/utils/webmcp/webmcp.registry.js';
import type { WebMCPToolProp } from '$lib/utils/webmcp/webmcp.types.js';

/** What the Form of a step takes as its `tool` prop. */
export function stepFormTool(
	tool: WebMCPToolProp | undefined,
	step: { title?: string; description?: string },
	index: number,
	activeStep: number,
	total: number,
	/** The button that submits the step cannot be pressed right now. */
	blocked: boolean
): WebMCPToolProp {
	if (tool === false || blocked || index !== activeStep) return false;
	const about = [toolText(step.title), toolText(step.description)].filter(Boolean).join(': ');
	const options = toolOptions(tool);
	return {
		...options,
		description:
			options.description ??
			`Step ${index + 1} of ${total}${about ? ` (${about})` : ''}. Calling this tool fills in the step and submits it, which ${index + 1 < total ? 'moves to the next step' : 'completes the form'}.`
	};
}
