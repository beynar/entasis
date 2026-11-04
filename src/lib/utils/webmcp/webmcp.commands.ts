// The `run_command` tool that Command, menus and command-like rows add their rows to.

import { createChoiceTool } from './webmcp.choices.js';

export const commandTool = createChoiceTool({
	name: 'run_command',
	consequentialName: 'run_consequential_command',
	title: 'Run a command',
	description: 'Runs a command or menu entry of this page, as choosing it would.',
	consequentialDescription:
		'Runs a command or menu entry whose action is significant or hard to undo.',
	param: 'id',
	doneStatus: 'done',
	limit: 200
});
