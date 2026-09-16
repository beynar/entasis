// Mock data for the Tasks dashboard template. Every number here is read off the
// reference screenshot so the rendered template can be compared pixel for pixel.

export type TaskStatus = 'in-progress' | 'pending' | 'completed';

export type WorkspaceProject = {
	id: string;
	label: string;
	/** Semantic role that tints the project's rounded-square icon. */
	tint: 'success' | 'warning' | 'info' | 'danger';
};

export const workspace = {
	user: 'Courtney Henry',
	company: 'The Walt Disney Company'
};

export const essentials = [
	{ id: 'home', label: 'Home' },
	{ id: 'tasks', label: 'Tasks' },
	{ id: 'calendar', label: 'Calendar' },
	{ id: 'team', label: 'Team' },
	{ id: 'docs', label: 'Docs' },
	{ id: 'automations', label: 'Automations' },
	{ id: 'reporting', label: 'Reporting' }
] as const;

export const projects: WorkspaceProject[] = [
	{ id: 'atlas', label: 'Atlas CRM Revamp', tint: 'success' },
	{ id: 'nimbus', label: 'Nimbus Dashboard', tint: 'warning' },
	{ id: 'orion', label: 'Orion API Gateway', tint: 'info' },
	{ id: 'helio', label: 'Helio Task System', tint: 'danger' }
];

export const support = [
	{ id: 'settings', label: 'Settings' },
	{ id: 'releases', label: 'Releases' }
] as const;

export const pageTabs = ['Overview', 'Lists', 'Board', 'Timeline', 'Files'] as const;
export type PageTab = (typeof pageTabs)[number];

export type OverviewStat = {
	label: string;
	value: number;
	description: string;
	/** Percent change against last week; negative values render as a drop. */
	delta: number;
	icon: 'lightning' | 'check' | 'progress' | 'warning';
};

export const overviewStats: OverviewStat[] = [
	{
		label: 'Total Tasks',
		value: 147,
		description: 'Tasks moved, comments & edits',
		delta: 15,
		icon: 'lightning'
	},
	{
		label: 'Tasks Completed',
		value: 89,
		description: 'Finished successfully by team',
		delta: 10,
		icon: 'check'
	},
	{
		label: 'Tasks In Progress',
		value: 42,
		description: 'Currently being worked on',
		delta: -3,
		icon: 'progress'
	},
	{
		label: 'Pending Reviews',
		value: 16,
		description: 'Waiting for approval',
		delta: 4,
		icon: 'warning'
	}
];

export type MonthlyStatus = {
	month: string;
	completed: number;
	inProgress: number;
	pending: number;
};

/** Stacked from the bottom: completed (lavender), in progress (orange), pending (taupe). */
export const monthlyStatus: MonthlyStatus[] = [
	{ month: 'Jan', completed: 22, inProgress: 18, pending: 10 },
	{ month: 'Feb', completed: 50, inProgress: 22, pending: 18 },
	{ month: 'Mar', completed: 30, inProgress: 22, pending: 12 },
	{ month: 'Apr', completed: 48, inProgress: 24, pending: 18 },
	{ month: 'May', completed: 20, inProgress: 18, pending: 8 },
	{ month: 'Jun', completed: 40, inProgress: 18, pending: 18 },
	{ month: 'Jul', completed: 22, inProgress: 18, pending: 10 },
	{ month: 'Aug', completed: 50, inProgress: 22, pending: 18 },
	{ month: 'Sep', completed: 30, inProgress: 22, pending: 12 },
	{ month: 'Oct', completed: 48, inProgress: 24, pending: 18 },
	{ month: 'Nov', completed: 22, inProgress: 18, pending: 10 },
	{ month: 'Dec', completed: 18, inProgress: 14, pending: 8 }
];

export type WeeklyProgress = { day: string; progress: number; compiled: number };

export const weeklyProgress: WeeklyProgress[] = [
	{ day: 'Sun', progress: 32, compiled: 24 },
	{ day: 'Mon', progress: 44, compiled: 31 },
	{ day: 'Tue', progress: 78, compiled: 58 },
	{ day: 'Wed', progress: 72, compiled: 55 },
	{ day: 'Thu', progress: 28, compiled: 20 },
	{ day: 'Fri', progress: 64, compiled: 50 },
	{ day: 'Sat', progress: 65, compiled: 51 }
];

export type MyTask = {
	label: string;
	/** Start column and span on a 12-column hour grid. */
	start: number;
	span: number;
	duration: string;
	assignees: string[];
};

export const myTasks: MyTask[] = [
	{
		label: 'Research',
		start: 0,
		span: 3,
		duration: 'About 4 hours',
		assignees: ['AL', 'BK', 'CM']
	},
	{ label: 'Wireframe', start: 1, span: 2, duration: 'About 3 hours', assignees: ['DR'] },
	{
		label: 'UI Design',
		start: 5,
		span: 5,
		duration: 'About 6 hours',
		assignees: ['EF', 'GH', 'IJ', 'KL']
	}
];

export type TimelineTask = {
	id: string;
	title: string;
	/** Inclusive day offsets from the first visible day (15 December 2025 = 0). */
	start: number;
	end: number;
	tasksLeft: number;
	progress: number;
};

/**
 * The visible window is anchored on the real "today" (offset 14 of 26 days) so GanttChart's own
 * today indicator lands on it. Offsets in `timelineTasks` are days from the window start.
 */
const today = new Date();
today.setHours(0, 0, 0, 0);
export const timelineWindow = {
	start: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 14),
	days: 26,
	todayOffset: 14
};

export const timelineDate = (offset: number) =>
	new Date(
		timelineWindow.start.getFullYear(),
		timelineWindow.start.getMonth(),
		timelineWindow.start.getDate() + offset
	);

export const timelineTasks: TimelineTask[] = [
	{
		id: 'kanban-responsive',
		title: 'Design mobile responsive layout for Kanban board',
		start: 0,
		end: 11,
		tasksLeft: 2,
		progress: 40
	},
	{
		id: 'firebase',
		title: 'Connect task data to Firebase backend',
		start: 2,
		end: 13,
		tasksLeft: 1,
		progress: 80
	},
	{
		id: 'refactor-card',
		title: 'Refactor task card component for modularity',
		start: 11,
		end: 22,
		tasksLeft: 2,
		progress: 10
	},
	{
		id: 'document-api',
		title: 'Document API endpoints for task CRUD operations',
		start: 15,
		end: 26,
		tasksLeft: 2,
		progress: 25
	},
	{
		id: 'permissions',
		title: 'Implement user role permissions & access levels',
		start: 8,
		end: 19,
		tasksLeft: 2,
		progress: 60
	},
	{
		id: 'kanban-mobile',
		title: 'Design mobile layout for Kanban',
		start: 15,
		end: 25,
		tasksLeft: 2,
		progress: 25
	},
	{
		id: 'reminders',
		title: 'Add due-date reminders & notification system',
		start: 8,
		end: 19,
		tasksLeft: 2,
		progress: 50
	},
	{
		id: 'form-inputs',
		title: 'Create reusable UI components for form inputs',
		start: 2,
		end: 13,
		tasksLeft: 2,
		progress: 30
	},
	{
		id: 'activity-log',
		title: 'Integrate activity log to track task history',
		start: 5,
		end: 16,
		tasksLeft: 2,
		progress: 10
	}
];

/** Progress bar colour role by completion, as the reference paints it. */
export const progressColor = (progress: number): 'danger' | 'warning' | 'success' =>
	progress < 20 ? 'danger' : progress < 40 ? 'warning' : 'success';

export type TaskList = {
	id: string;
	title: string;
	owner: string;
	tasks: { title: string; progress: number }[];
};

/** The Lists tab: one card per list, browsed as a carousel. */
export const taskLists: TaskList[] = [
	{
		id: 'backlog',
		title: 'Backlog',
		owner: 'Courtney',
		tasks: [
			{ title: 'Audit onboarding copy', progress: 0 },
			{ title: 'Sketch billing settings', progress: 10 },
			{ title: 'Collect support tags', progress: 5 }
		]
	},
	{
		id: 'this-week',
		title: 'This week',
		owner: 'Atlas team',
		tasks: [
			{ title: 'Kanban mobile layout', progress: 40 },
			{ title: 'Firebase task sync', progress: 80 },
			{ title: 'Reusable form inputs', progress: 30 }
		]
	},
	{
		id: 'in-review',
		title: 'In review',
		owner: 'Nimbus team',
		tasks: [
			{ title: 'Role permissions', progress: 60 },
			{ title: 'Due-date reminders', progress: 50 }
		]
	},
	{
		id: 'blocked',
		title: 'Blocked',
		owner: 'Orion team',
		tasks: [
			{ title: 'Task card refactor', progress: 10 },
			{ title: 'API docs for CRUD', progress: 25 }
		]
	},
	{
		id: 'done',
		title: 'Done',
		owner: 'Helio team',
		tasks: [
			{ title: 'Activity log', progress: 100 },
			{ title: 'Team invites', progress: 100 },
			{ title: 'Search shortcuts', progress: 100 }
		]
	}
];
