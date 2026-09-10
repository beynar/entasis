export const workflowBlocks = [
	{
		slug: 'login-recovery',
		title: 'Login and recovery',
		description: 'A complete authentication entry point with password recovery.'
	},
	{
		slug: 'dashboard-shell',
		title: 'Dashboard shell',
		description: 'Application navigation, metrics, and recent activity.'
	},
	{
		slug: 'server-data-table',
		title: 'Server data table',
		description: 'Search, filtering, pagination, and row actions around remote data.'
	},
	{
		slug: 'crud-editor',
		title: 'CRUD editor',
		description: 'Create and edit a domain record with validation and actions.'
	},
	{
		slug: 'settings',
		title: 'Settings',
		description: 'Grouped account, notification, and appearance preferences.'
	},
	{
		slug: 'upload',
		title: 'Upload flow',
		description: 'File selection, progress, completion, and rejection feedback.'
	},
	{
		slug: 'command-palette',
		title: 'Command palette',
		description: 'Searchable application actions in a keyboard-first overlay.'
	},
	{
		slug: 'mobile-navigation',
		title: 'Mobile navigation',
		description: 'A responsive shell with compact navigation and primary actions.'
	},
	{
		slug: 'destructive-confirmation',
		title: 'Destructive confirmation',
		description: 'A guarded destructive action with explicit consequences.'
	},
	{
		slug: 'async-states',
		title: 'Loading, empty, and error',
		description: 'The three operational states every data workflow needs.'
	}
] as const;

export type WorkflowBlock = (typeof workflowBlocks)[number];
