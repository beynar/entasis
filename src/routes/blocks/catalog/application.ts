import type { BlockCategory } from './types.js';

export const applicationCategories: BlockCategory[] = [
	{
		slug: 'accept-invite',
		title: 'Accept Invite',
		group: 'Application',
		description:
			'Accept Invite patterns composed from Svelai controls, display, and layout primitives.',
		blocks: [
			{
				id: 'accept-invite-workspace-invitation',
				title: 'You’re invited',
				description:
					'A centered invitation with inviter identity, workspace details, and join/decline state.',
				file: 'accept-invite/WorkspaceInvitation.svelte',
				reference: 'https://www.shadcnblocks.com/block/accept-invite2',
				components: ['Alert', 'Avatar', 'Button', 'Card', 'Chip', 'Stack']
			},
			{
				id: 'accept-invite-join-workspace',
				title: 'Join the team',
				description:
					'A split invitation that introduces workspace benefits and collects a new member profile.',
				file: 'accept-invite/JoinWorkspace.svelte',
				reference: 'https://www.shadcnblocks.com/block/accept-invite1',
				components: ['Alert', 'Avatar', 'Card', 'Chip', 'Form', 'Grid', 'Stack']
			}
		]
	},
	{
		slug: 'application-shell',
		title: 'Application Shell',
		group: 'Application',
		description:
			'Application Shell patterns composed from Svelai controls, display, and layout primitives.',
		blocks: [
			{
				id: 'application-shell-workspace-shell',
				title: 'Workspace shell',
				description:
					'A navigable application frame with breadcrumbs, contextual actions, and project cards.',
				file: 'application-shell/WorkspaceShell.svelte',
				reference: 'https://www.shadcnblocks.com/block/application-shell1',
				components: ['AppShell', 'Button', 'Card', 'Form', 'Grid', 'Meter', 'Stack', 'Stat']
			},
			{
				id: 'application-shell-topbar-shell',
				title: 'Top navigation workspace',
				description:
					'A horizontal navigation shell with a working project filter and view-specific content.',
				file: 'application-shell/TopbarShell.svelte',
				reference: 'https://www.shadcnblocks.com/block/application-shell3',
				components: ['Avatar', 'Button', 'Card', 'Chip', 'Grid', 'Stack', 'TextInput', 'Timeline']
			},
			{
				id: 'application-shell-mail-shell',
				title: 'Focused mail workspace',
				description:
					'An email layout with mailbox navigation, selectable messages, archive, and local reply drafts.',
				file: 'application-shell/MailShell.svelte',
				reference: 'https://www.shadcnblocks.com/block/application-shell8',
				components: ['Alert', 'Avatar', 'Button', 'Form', 'Separator', 'Stack', 'TextInput']
			}
		]
	},
	{
		slug: 'chart-card',
		title: 'Chart Card',
		group: 'Application',
		description:
			'Chart Card patterns composed from Svelai controls, display, and layout primitives.',
		blocks: [
			{
				id: 'chart-card-area-trend',
				title: 'Revenue over time',
				description: 'An interactive time-window card using the native Svelai area chart.',
				file: 'chart-card/AreaTrend.svelte',
				reference: 'https://www.shadcnblocks.com/block/chart-card2',
				components: ['Card', 'Chart', 'Chip', 'Select', 'Stack']
			},
			{
				id: 'chart-card-stacked-revenue',
				title: 'Revenue by plan',
				description: 'A stacked revenue chart with a plan legend and quarter switch.',
				file: 'chart-card/StackedRevenue.svelte',
				reference: 'https://www.shadcnblocks.com/block/chart-card10',
				components: ['Button', 'Card', 'Chart', 'Stack']
			},
			{
				id: 'chart-card-acquisition-donut',
				title: 'Acquisition mix',
				description:
					'A donut chart paired with an explicit acquisition breakdown and sample totals.',
				file: 'chart-card/AcquisitionDonut.svelte',
				reference: 'https://www.shadcnblocks.com/block/chart-card5',
				components: ['Card', 'Chart', 'Stack']
			}
		]
	},
	{
		slug: 'chart-group',
		title: 'Chart Group',
		group: 'Application',
		description:
			'Chart Group patterns composed from Svelai controls, display, and layout primitives.',
		blocks: [
			{
				id: 'chart-group-revenue-channels',
				title: 'Revenue and channels',
				description:
					'A two-chart composition that connects revenue trends to acquisition distribution.',
				file: 'chart-group/RevenueChannels.svelte',
				reference: 'https://www.shadcnblocks.com/block/chart-group6',
				components: ['Card', 'Chart', 'Stack', 'Stat']
			},
			{
				id: 'chart-group-infrastructure-monitor',
				title: 'Infrastructure pulse',
				description:
					'A monitoring overview with request and latency plots plus region-specific sample data.',
				file: 'chart-group/InfrastructureMonitor.svelte',
				reference: 'https://www.shadcnblocks.com/block/chart-group10',
				components: ['Alert', 'Card', 'Chart', 'Grid', 'Select', 'Stack', 'Stat']
			},
			{
				id: 'chart-group-analytics-bento',
				title: 'The analytics overview',
				description:
					'A mixed analytics grid combining growth, conversion, source distribution, and milestones.',
				file: 'chart-group/AnalyticsBento.svelte',
				reference: 'https://www.shadcnblocks.com/block/chart-group8',
				components: [
					'Card',
					'Chart',
					'Chip',
					'Meter',
					'ProgressCircle',
					'Stack',
					'Stat',
					'Timeline'
				]
			}
		]
	},
	{
		slug: 'crud-companies',
		title: 'CRUD Companies',
		group: 'Application',
		description:
			'Crud Companies patterns composed from Svelai controls, display, and layout primitives.',
		blocks: [
			{
				id: 'crud-companies-company-form',
				title: 'Add a company',
				description:
					'A sectioned company editor with contact details and a local saved-record summary.',
				file: 'crud-companies/CompanyForm.svelte',
				reference: 'https://www.shadcnblocks.com/block/companies-create1',
				components: ['Alert', 'Form', 'Stack']
			},
			{
				id: 'crud-companies-company-directory',
				title: 'Company directory',
				description:
					'A searchable company table with a real local create dialog and per-record removal.',
				file: 'crud-companies/CompanyDirectory.svelte',
				reference: 'https://www.shadcnblocks.com/block/companies-create3',
				components: ['Button', 'Card', 'DataTable', 'Dialog', 'Form', 'Stack']
			}
		]
	},
	{
		slug: 'dashboard',
		title: 'Dashboard',
		group: 'Application',
		description:
			'Dashboard patterns composed from Svelai controls, display, and layout primitives.',
		blocks: [
			{
				id: 'dashboard-revenue-dashboard',
				title: 'Revenue workspace',
				description:
					'A revenue overview with period switching, chart, recent transactions, and goal context.',
				file: 'dashboard/RevenueDashboard.svelte',
				reference: 'https://www.shadcnblocks.com/block/dashboard2',
				components: ['Card', 'Chart', 'Grid', 'ProgressCircle', 'Select', 'Stack', 'Stat', 'Table']
			},
			{
				id: 'dashboard-hotel-operations',
				title: 'Hotel operations',
				description:
					'A hotel operations desk with room readiness, arrivals, and local check-in actions.',
				file: 'dashboard/HotelOperations.svelte',
				reference: 'https://www.shadcnblocks.com/block/dashboard18',
				components: ['Avatar', 'Button', 'Card', 'Chip', 'Grid', 'Meter', 'Stack', 'Stat']
			},
			{
				id: 'dashboard-session-analytics',
				title: 'Session analytics',
				description:
					'A session and latency dashboard with working device filtering and a sample event stream.',
				file: 'dashboard/SessionAnalytics.svelte',
				reference: 'https://www.shadcnblocks.com/block/dashboard13',
				components: ['Button', 'Card', 'Chart', 'Grid', 'Meter', 'Stack', 'Stat', 'Table']
			}
		]
	},
	{
		slug: 'data-table',
		title: 'Data Table',
		group: 'Application',
		description:
			'Data Table patterns composed from Svelai controls, display, and layout primitives.',
		blocks: [
			{
				id: 'data-table-searchable-contacts',
				title: 'Searchable contacts',
				description:
					'A searchable contact directory with native sorting, pagination, and column visibility.',
				file: 'data-table/SearchableContacts.svelte',
				reference: 'https://www.shadcnblocks.com/block/data-table9',
				components: ['Card', 'Chip', 'DataTable', 'Stack']
			},
			{
				id: 'data-table-invoice-items',
				title: 'Invoice line items',
				description:
					'An invoice editor with quantity controls, removal, and correctly recalculated totals.',
				file: 'data-table/InvoiceItems.svelte',
				reference: 'https://www.shadcnblocks.com/block/data-table25',
				components: ['Button', 'Card', 'Chip', 'NumberInput', 'Separator', 'Stack']
			},
			{
				id: 'data-table-selectable-orders',
				title: 'Order selection',
				description:
					'A selectable order table with a working bulk fulfillment action and status display.',
				file: 'data-table/SelectableOrders.svelte',
				reference: 'https://www.shadcnblocks.com/block/data-table11',
				components: ['Button', 'Card', 'Chip', 'DataTable', 'Stack']
			},
			{
				id: 'data-table-grouped-transactions',
				title: 'Transactions by date',
				description: 'A grouped ledger with a working date filter and daily subtotals.',
				file: 'data-table/GroupedTransactions.svelte',
				reference: 'https://www.shadcnblocks.com/block/data-table24',
				components: ['Card', 'Grid', 'Select', 'Stack', 'Stat', 'Table']
			}
		]
	},
	{
		slug: 'feedback',
		title: 'Feedback',
		group: 'Application',
		description: 'Feedback patterns composed from Svelai controls, display, and layout primitives.',
		blocks: [
			{
				id: 'feedback-rating-feedback',
				title: 'Rate your experience',
				description:
					'A support resolution card opens a star-rating sheet with validated comments and local completion.',
				file: 'feedback/RatingFeedback.svelte',
				reference: 'https://www.shadcnblocks.com/block/feedback1',
				components: ['Alert', 'Button', 'Card', 'Dialog', 'Form', 'Stack']
			},
			{
				id: 'feedback-feedback-survey',
				title: 'A thoughtful feedback survey',
				description:
					'A multi-step product survey with experience, detail, and optional contact fields.',
				file: 'feedback/FeedbackSurvey.svelte',
				reference: 'https://www.shadcnblocks.com/block/feedback2',
				components: ['Alert', 'Avatar', 'Card', 'Chip', 'MultiStepForm', 'Stack']
			}
		]
	},
	{
		slug: 'field-mapping',
		title: 'Field Mapping',
		group: 'Application',
		description:
			'Field Mapping patterns composed from Svelai controls, display, and layout primitives.',
		blocks: [
			{
				id: 'field-mapping-csv-mapping',
				title: 'Map your import',
				description:
					'A CSV mapping workspace with required destination validation, duplicate detection, and a local import preview.',
				file: 'field-mapping/CsvMapping.svelte',
				reference: 'https://www.shadcnblocks.com/block/field-mapping1',
				components: ['Alert', 'Button', 'Card', 'Chip', 'Select', 'Stack', 'Table']
			},
			{
				id: 'field-mapping-merge-contacts',
				title: 'Resolve duplicate contacts',
				description:
					'A record merge comparison with per-field decisions and a complete local merged preview.',
				file: 'field-mapping/MergeContacts.svelte',
				reference: 'https://www.shadcnblocks.com/block/field-merging1',
				components: ['Alert', 'Button', 'Card', 'Chip', 'RadioInput', 'Stack', 'Table']
			}
		]
	},
	{
		slug: 'forgot-password',
		title: 'Forgot Password',
		group: 'Application',
		description:
			'Forgot Password patterns composed from Svelai controls, display, and layout primitives.',
		blocks: [
			{
				id: 'forgot-password-recovery-card',
				title: 'Recover account access',
				description:
					'A focused recovery card that validates email and shows a clearly labeled inbox preview.',
				file: 'forgot-password/RecoveryCard.svelte',
				reference: 'https://www.shadcnblocks.com/block/forgot-password1',
				components: ['Button', 'Card', 'Form', 'Stack']
			},
			{
				id: 'forgot-password-inline-recovery',
				title: 'Recovery in context',
				description:
					'An inline recovery panel with an account switch, security context, and local validation.',
				file: 'forgot-password/InlineRecovery.svelte',
				reference: 'https://www.shadcnblocks.com/block/forgot-password3',
				components: ['Alert', 'Card', 'Chip', 'Form', 'Stack']
			}
		]
	},
	{
		slug: 'help',
		title: 'Help',
		group: 'Application',
		description: 'Help patterns composed from Svelai controls, display, and layout primitives.',
		blocks: [
			{
				id: 'help-faq-support',
				title: 'Answers and support',
				description:
					'Common answers sit beside a validated support form with a local ticket draft.',
				file: 'help/FaqSupport.svelte',
				reference: 'https://www.shadcnblocks.com/block/help3',
				components: ['Accordion', 'Alert', 'Card', 'Form', 'Stack']
			},
			{
				id: 'help-support-ticket',
				title: 'Get the right help',
				description:
					'A sectioned support ticket form with request categorization, severity, and a ticket summary.',
				file: 'help/SupportTicket.svelte',
				reference: 'https://www.shadcnblocks.com/block/help4',
				components: ['Alert', 'Card', 'Form', 'Stack']
			}
		]
	},
	{
		slug: 'help-center',
		title: 'Help Center',
		group: 'Application',
		description:
			'Help Center patterns composed from Svelai controls, display, and layout primitives.',
		blocks: [
			{
				id: 'help-center-category-help',
				title: 'A home for answers',
				description: 'A browsable help center with category cards and in-place article expansion.',
				file: 'help-center/CategoryHelp.svelte',
				reference: 'https://www.shadcnblocks.com/block/help1',
				components: ['Accordion', 'Button', 'Card', 'Chip', 'Grid', 'Stack']
			},
			{
				id: 'help-center-search-help',
				title: 'Find an answer',
				description:
					'A searchable FAQ view with result counts and a contact form that opens when answers are insufficient.',
				file: 'help-center/SearchHelp.svelte',
				reference: 'https://www.shadcnblocks.com/block/help2',
				components: ['Accordion', 'Alert', 'Button', 'Card', 'Dialog', 'Form', 'Stack', 'TextInput']
			}
		]
	},
	{
		slug: 'invite-user',
		title: 'Invite User',
		group: 'Application',
		description:
			'Invite User patterns composed from Svelai controls, display, and layout primitives.',
		blocks: [
			{
				id: 'invite-user-member-invites',
				title: 'Bring your team',
				description:
					'A member table with a validated invite dialog and visible local pending invitations.',
				file: 'invite-user/MemberInvites.svelte',
				reference: 'https://www.shadcnblocks.com/block/invite-user1',
				components: ['Button', 'Card', 'Dialog', 'Form', 'Stack', 'Table']
			},
			{
				id: 'invite-user-inline-invites',
				title: 'Invite in one place',
				description:
					'A compact batch invitation builder with removable recipients and a shared role selection.',
				file: 'invite-user/InlineInvites.svelte',
				reference: 'https://www.shadcnblocks.com/block/invite-user3',
				components: ['Alert', 'Button', 'Card', 'Chip', 'Form', 'Select', 'Stack']
			}
		]
	},
	{
		slug: 'leaderboard',
		title: 'Leaderboard',
		group: 'Application',
		description:
			'Leaderboard patterns composed from Svelai controls, display, and layout primitives.',
		blocks: [
			{
				id: 'leaderboard-team-progress',
				title: 'Team progress',
				description:
					'A goal-based leaderboard with a period selector, progress bars, and clear ranking.',
				file: 'leaderboard/TeamProgress.svelte',
				reference: 'https://www.shadcnblocks.com/block/leaderboard1',
				components: ['Avatar', 'Card', 'Chip', 'Meter', 'Select', 'Stack']
			},
			{
				id: 'leaderboard-podium-leaderboard',
				title: 'The weekly leaders',
				description:
					'A podium-style contributor ranking with avatar identities and a complete standings table.',
				file: 'leaderboard/PodiumLeaderboard.svelte',
				reference: 'https://www.shadcnblocks.com/block/leaderboard2',
				components: ['Avatar', 'Card', 'Chip', 'Stack', 'Table']
			}
		]
	},
	{
		slug: 'list',
		title: 'List',
		group: 'Application',
		description: 'List patterns composed from Svelai controls, display, and layout primitives.',
		blocks: [
			{
				id: 'list-resource-list',
				title: 'Team resources',
				description:
					'An actionable resource list with search, local bookmarking, and a document detail view.',
				file: 'list/ResourceList.svelte',
				reference: 'https://www.shadcnblocks.com/block/list2',
				components: ['Button', 'Card', 'Dialog', 'Stack', 'Switch', 'TextInput']
			},
			{
				id: 'list-career-timeline',
				title: 'A career in chapters',
				description:
					'An experience timeline with an education view and a concise professional identity panel.',
				file: 'list/CareerTimeline.svelte',
				reference: 'https://www.shadcnblocks.com/block/list3',
				components: ['Avatar', 'Button', 'Card', 'Chip', 'Stack', 'Timeline']
			}
		]
	},
	{
		slug: 'login',
		title: 'Login',
		group: 'Application',
		description: 'Login patterns composed from Svelai controls, display, and layout primitives.',
		blocks: [
			{
				id: 'login-centered-login',
				title: 'Welcome back',
				description: 'A quiet credential card with validated inputs and a remember preference.',
				file: 'login/CenteredLogin.svelte',
				reference: 'https://www.shadcnblocks.com/block/login2',
				components: ['Alert', 'Card', 'Checkbox', 'Form', 'Stack']
			},
			{
				id: 'login-email-first-login',
				title: 'Choose how to continue',
				description:
					'Provider choices expand into an email access form, with explicit demo feedback.',
				file: 'login/EmailFirstLogin.svelte',
				reference: 'https://www.shadcnblocks.com/block/login9',
				components: ['Alert', 'Button', 'Form', 'Separator', 'Stack']
			}
		]
	},
	{
		slug: 'magic-link',
		title: 'Magic Link',
		group: 'Application',
		description:
			'Magic Link patterns composed from Svelai controls, display, and layout primitives.',
		blocks: [
			{
				id: 'magic-link-magic-link-card',
				title: 'A link, no password',
				description: 'A passwordless entry point with a resend and edit-email preview.',
				file: 'magic-link/MagicLinkCard.svelte',
				reference: 'https://www.shadcnblocks.com/block/magic-link1',
				components: ['Alert', 'Button', 'Card', 'Form', 'Separator', 'Stack']
			},
			{
				id: 'magic-link-split-magic-link',
				title: 'Passwordless workspace',
				description: 'A split product story and email form with delivery-state preview.',
				file: 'magic-link/SplitMagicLink.svelte',
				reference: 'https://www.shadcnblocks.com/block/magic-link2',
				components: ['Alert', 'Avatar', 'Chip', 'Form', 'Stack']
			}
		]
	},
	{
		slug: 'onboarding',
		title: 'Onboarding',
		group: 'Application',
		description:
			'Onboarding patterns composed from Svelai controls, display, and layout primitives.',
		blocks: [
			{
				id: 'onboarding-workspace-onboarding',
				title: 'Set up your workspace',
				description:
					'A real multi-step form for identity, workspace details, and notification preferences.',
				file: 'onboarding/WorkspaceOnboarding.svelte',
				reference: 'https://www.shadcnblocks.com/block/onboarding1',
				components: ['Alert', 'Card', 'Chip', 'MultiStepForm', 'Stack']
			},
			{
				id: 'onboarding-guided-setup',
				title: 'A guided first step',
				description:
					'A welcome panel opens a compact onboarding wizard with retained local completion state.',
				file: 'onboarding/GuidedSetup.svelte',
				reference: 'https://www.shadcnblocks.com/block/onboarding2',
				components: ['Alert', 'Button', 'Card', 'Chip', 'Dialog', 'Grid', 'MultiStepForm', 'Stack']
			}
		]
	},
	{
		slug: 'passkey',
		title: 'Passkey',
		group: 'Application',
		description: 'Passkey patterns composed from Svelai controls, display, and layout primitives.',
		blocks: [
			{
				id: 'passkey-passkey-card',
				title: 'Your device is your key',
				description: 'A centered passkey prompt with device context and fallback explanation.',
				file: 'passkey/PasskeyCard.svelte',
				reference: 'https://www.shadcnblocks.com/block/passkey1',
				components: ['Alert', 'Button', 'Card', 'Stack']
			},
			{
				id: 'passkey-passkey-setup',
				title: 'Make future sign-ins easier',
				description:
					'A compact passkey enrollment panel with setup steps and a local guided preview.',
				file: 'passkey/PasskeySetup.svelte',
				reference: 'https://www.shadcnblocks.com/block/passkey2',
				components: ['Alert', 'Button', 'Card', 'Chip', 'Stack']
			}
		]
	},
	{
		slug: 'reset-password',
		title: 'Reset Password',
		group: 'Application',
		description:
			'Reset Password patterns composed from Svelai controls, display, and layout primitives.',
		blocks: [
			{
				id: 'reset-password-reset-card',
				title: 'Choose a new password',
				description: 'Validated password confirmation with a focused centered layout.',
				file: 'reset-password/ResetCard.svelte',
				reference: 'https://www.shadcnblocks.com/block/reset-password1',
				components: ['Alert', 'Card', 'Form', 'Stack']
			},
			{
				id: 'reset-password-password-rules',
				title: 'Reset with clear requirements',
				description: 'Validated password confirmation with a live requirement checklist.',
				file: 'reset-password/PasswordRules.svelte',
				reference: 'https://www.shadcnblocks.com/block/reset-password6',
				components: ['Alert', 'Card', 'Form', 'Grid', 'Stack']
			}
		]
	},
	{
		slug: 'settings-integrations',
		title: 'Settings Integrations',
		group: 'Application',
		description:
			'Settings Integrations patterns composed from Svelai controls, display, and layout primitives.',
		blocks: [
			{
				id: 'settings-integrations-integration-grid',
				title: 'Connect your tools',
				description: 'A searchable integration card grid with explicit local connection toggles.',
				file: 'settings-integrations/IntegrationGrid.svelte',
				reference: 'https://www.shadcnblocks.com/block/settings-integrations1',
				components: ['Button', 'Card', 'Chip', 'Grid', 'Stack', 'TextInput']
			},
			{
				id: 'settings-integrations-integration-categories',
				title: 'Explore integrations',
				description:
					'A category sidebar and integration list with a configuration drawer for each tool.',
				file: 'settings-integrations/IntegrationCategories.svelte',
				reference: 'https://www.shadcnblocks.com/block/settings-integrations8',
				components: ['Alert', 'Button', 'Card', 'Dialog', 'Stack', 'Switch']
			},
			{
				id: 'settings-integrations-integration-activity',
				title: 'Connected tools',
				description:
					'A connected integration list with expandable activity history and disconnect state.',
				file: 'settings-integrations/IntegrationActivity.svelte',
				reference: 'https://www.shadcnblocks.com/block/settings-integrations9',
				components: ['Button', 'Card', 'Chip', 'Stack', 'Timeline']
			}
		]
	},
	{
		slug: 'settings-members',
		title: 'Settings Members',
		group: 'Application',
		description:
			'Settings Members patterns composed from Svelai controls, display, and layout primitives.',
		blocks: [
			{
				id: 'settings-members-member-directory',
				title: 'Workspace members',
				description:
					'A member management table with search, role editing, and a current-owner guard.',
				file: 'settings-members/MemberDirectory.svelte',
				reference: 'https://www.shadcnblocks.com/block/settings-members1',
				components: ['Button', 'Card', 'Chip', 'DataTable', 'Select', 'Stack']
			},
			{
				id: 'settings-members-member-cards',
				title: 'Meet your workspace',
				description:
					'A member-card grid with role filtering, editable permissions, and local role feedback.',
				file: 'settings-members/MemberCards.svelte',
				reference: 'https://www.shadcnblocks.com/block/settings-members3',
				components: [
					'Avatar',
					'Button',
					'Card',
					'Chip',
					'Dialog',
					'Grid',
					'Select',
					'Stack',
					'Switch'
				]
			}
		]
	},
	{
		slug: 'settings-notifications',
		title: 'Settings Notifications',
		group: 'Application',
		description:
			'Settings Notifications patterns composed from Svelai controls, display, and layout primitives.',
		blocks: [
			{
				id: 'settings-notifications-notification-groups',
				title: 'Your notification rhythm',
				description: 'Grouped notification preferences with working reset and local save actions.',
				file: 'settings-notifications/NotificationGroups.svelte',
				reference: 'https://www.shadcnblocks.com/block/settings-notifications3',
				components: ['Alert', 'Form', 'Stack']
			},
			{
				id: 'settings-notifications-channel-matrix',
				title: 'Notifications by channel',
				description:
					'A channel matrix with independent email and in-app controls and a quiet-hours toggle.',
				file: 'settings-notifications/ChannelMatrix.svelte',
				reference: 'https://www.shadcnblocks.com/block/settings-notifications4',
				components: ['Alert', 'Button', 'Card', 'DataTable', 'Stack', 'Switch']
			}
		]
	},
	{
		slug: 'settings-profile',
		title: 'Settings Profile',
		group: 'Application',
		description:
			'Settings Profile patterns composed from Svelai controls, display, and layout primitives.',
		blocks: [
			{
				id: 'settings-profile-profile-editor',
				title: 'Your profile settings',
				description:
					'A profile settings form with cover treatment, avatar identity, validation, and local save state.',
				file: 'settings-profile/ProfileEditor.svelte',
				reference: 'https://www.shadcnblocks.com/block/settings-profile3',
				components: ['Alert', 'Avatar', 'Chip', 'Form', 'Stack']
			},
			{
				id: 'settings-profile-live-profile',
				title: 'A profile that feels like you',
				description:
					'An editable profile with a live public-card preview, appearance choices, and local persistence feedback.',
				file: 'settings-profile/LiveProfile.svelte',
				reference: 'https://www.shadcnblocks.com/block/settings-profile5',
				components: ['Alert', 'Avatar', 'Card', 'Chip', 'Form', 'Stack']
			}
		]
	},
	{
		slug: 'sidebar',
		title: 'Sidebar',
		group: 'Application',
		description: 'Sidebar patterns composed from Svelai controls, display, and layout primitives.',
		blocks: [
			{
				id: 'sidebar-workspace-sidebar',
				title: 'Workspace navigation',
				description:
					'An organization-aware sidebar with nested navigation and working workspace selection.',
				file: 'sidebar/WorkspaceSidebar.svelte',
				reference: 'https://www.shadcnblocks.com/block/sidebar7',
				components: ['Button', 'Card', 'Grid', 'Sidebar', 'Stack', 'Stat']
			},
			{
				id: 'sidebar-file-sidebar',
				title: 'Project file explorer',
				description: 'A tree-driven sidebar with file selection and a readable document pane.',
				file: 'sidebar/FileSidebar.svelte',
				reference: 'https://www.shadcnblocks.com/block/sidebar13',
				components: ['Button', 'Card', 'Chip', 'Sidebar', 'Stack']
			},
			{
				id: 'sidebar-chat-sidebar',
				title: 'Team channels',
				description:
					'A chat navigation sidebar with channel switching and local message composition.',
				file: 'sidebar/ChatSidebar.svelte',
				reference: 'https://www.shadcnblocks.com/block/sidebar18',
				components: ['Avatar', 'Button', 'Form', 'Sidebar']
			}
		]
	},
	{
		slug: 'signup',
		title: 'Signup',
		group: 'Application',
		description: 'Signup patterns composed from Svelai controls, display, and layout primitives.',
		blocks: [
			{
				id: 'signup-create-account',
				title: 'A new workspace starts here',
				description:
					'A centered signup form with password confirmation and required terms acknowledgement.',
				file: 'signup/CreateAccount.svelte',
				reference: 'https://www.shadcnblocks.com/block/signup1',
				components: ['Alert', 'Card', 'Form', 'Stack']
			},
			{
				id: 'signup-split-signup',
				title: 'Your team’s home base',
				description:
					'A split signup with a miniature project overview and validated profile fields.',
				file: 'signup/SplitSignup.svelte',
				reference: 'https://www.shadcnblocks.com/block/signup7',
				components: ['Alert', 'Card', 'Form', 'Meter', 'Stack']
			},
			{
				id: 'signup-plan-signup',
				title: 'Start with the right plan',
				description: 'A bordered account card with plan selection and a live local signup summary.',
				file: 'signup/PlanSignup.svelte',
				reference: 'https://www.shadcnblocks.com/block/signup4',
				components: ['Alert', 'Card', 'Chip', 'Form', 'RadioInput', 'Stack']
			}
		]
	},
	{
		slug: 'stats-card',
		title: 'Stats Card',
		group: 'Application',
		description:
			'Stats Card patterns composed from Svelai controls, display, and layout primitives.',
		blocks: [
			{
				id: 'stats-card-trend-metric',
				title: 'A metric with context',
				description: 'A compact trend metric with a real sparkline and period comparison toggle.',
				file: 'stats-card/TrendMetric.svelte',
				reference: 'https://www.shadcnblocks.com/block/stats-card2',
				components: ['Card', 'Chart', 'Chip', 'Stack', 'Switch']
			},
			{
				id: 'stats-card-goal-metric',
				title: 'Progress toward the goal',
				description: 'A progress metric with a meaningful local milestone action.',
				file: 'stats-card/GoalMetric.svelte',
				reference: 'https://www.shadcnblocks.com/block/stats-card3',
				components: ['Alert', 'Button', 'Card', 'Meter', 'Stack']
			},
			{
				id: 'stats-card-breakdown-metric',
				title: 'Where growth comes from',
				description: 'A revenue metric with a segmented meter and a detailed plan breakdown.',
				file: 'stats-card/BreakdownMetric.svelte',
				reference: 'https://www.shadcnblocks.com/block/stats-card6',
				components: ['Card', 'Meter', 'Stack', 'Stat']
			}
		]
	},
	{
		slug: 'todo-list',
		title: 'Todo List',
		group: 'Application',
		description:
			'Todo List patterns composed from Svelai controls, display, and layout primitives.',
		blocks: [
			{
				id: 'todo-list-task-capture',
				title: 'A place to start',
				description:
					'A focused task list with validated capture, completion toggles, and a clear-completed action.',
				file: 'todo-list/TaskCapture.svelte',
				reference: 'https://www.shadcnblocks.com/block/todo4',
				components: ['Button', 'Card', 'Checkbox', 'Chip', 'Form', 'Meter', 'Stack']
			},
			{
				id: 'todo-list-priority-tasks',
				title: 'Focus on what matters',
				description:
					'A priority-aware task board with filtering, local task creation, and completion state.',
				file: 'todo-list/PriorityTasks.svelte',
				reference: 'https://www.shadcnblocks.com/block/todo6',
				components: ['Button', 'Card', 'Checkbox', 'Chip', 'Form', 'Grid', 'Stack']
			},
			{
				id: 'todo-list-subtask-planner',
				title: 'A plan in smaller steps',
				description:
					'An expandable project checklist with subtasks, completion totals, and per-project task capture.',
				file: 'todo-list/SubtaskPlanner.svelte',
				reference: 'https://www.shadcnblocks.com/block/todo8',
				components: ['Accordion', 'Checkbox', 'Chip', 'Form', 'Meter', 'Stack']
			}
		]
	},
	{
		slug: 'two-factor',
		title: 'Two Factor',
		group: 'Application',
		description:
			'Two Factor patterns composed from Svelai controls, display, and layout primitives.',
		blocks: [
			{
				id: 'two-factor-authenticator-code',
				title: 'Verify it’s you',
				description:
					'An authenticator code card with validated six-digit entry and recovery-code fallback.',
				file: 'two-factor/AuthenticatorCode.svelte',
				reference: 'https://www.shadcnblocks.com/block/two-factor1',
				components: ['Alert', 'Button', 'Card', 'Chip', 'Form', 'Stack']
			},
			{
				id: 'two-factor-recovery-codes',
				title: 'Keep a way back in',
				description:
					'A recovery-code sheet with masked sample codes, reveal, and download actions.',
				file: 'two-factor/RecoveryCodes.svelte',
				reference: 'https://www.shadcnblocks.com/block/two-factor6',
				components: ['Button', 'Card', 'Checkbox', 'Chip', 'Stack']
			}
		]
	},
	{
		slug: 'user-profile',
		title: 'User Profile',
		group: 'Application',
		description:
			'User Profile patterns composed from Svelai controls, display, and layout primitives.',
		blocks: [
			{
				id: 'user-profile-profile-stats',
				title: 'The creator profile',
				description:
					'A centered creator card with summary statistics, follow state, and local contact details.',
				file: 'user-profile/ProfileStats.svelte',
				reference: 'https://www.shadcnblocks.com/block/user-profile2',
				components: ['Alert', 'Avatar', 'Button', 'Card', 'Stack']
			},
			{
				id: 'user-profile-tabbed-profile',
				title: 'A fuller picture',
				description:
					'A cover profile with project, activity, and about views and meaningful sample content.',
				file: 'user-profile/TabbedProfile.svelte',
				reference: 'https://www.shadcnblocks.com/block/user-profile6',
				components: ['Avatar', 'Button', 'Card', 'Chip', 'Grid', 'Stack', 'Timeline']
			},
			{
				id: 'user-profile-freelancer-profile',
				title: 'Independent by design',
				description:
					'A freelancer profile with services, availability, project scope selection, and a validated local inquiry.',
				file: 'user-profile/FreelancerProfile.svelte',
				reference: 'https://www.shadcnblocks.com/block/user-profile13',
				components: ['Alert', 'Avatar', 'Card', 'Chip', 'Form', 'Grid', 'Separator', 'Stack']
			}
		]
	},
	{
		slug: 'verify-email',
		title: 'Verify Email',
		group: 'Application',
		description:
			'Verify Email patterns composed from Svelai controls, display, and layout primitives.',
		blocks: [
			{
				id: 'verify-email-email-code',
				title: 'Verify your email',
				description:
					'A six-digit email confirmation card with demo verification and resend feedback.',
				file: 'verify-email/EmailCode.svelte',
				reference: 'https://www.shadcnblocks.com/block/verify-email1',
				components: ['Alert', 'Button', 'Card', 'Form', 'Stack']
			},
			{
				id: 'verify-email-inbox-prompt',
				title: 'Open your inbox',
				description: 'An inbox confirmation state with editable destination and resend guidance.',
				file: 'verify-email/InboxPrompt.svelte',
				reference: 'https://www.shadcnblocks.com/block/verify-email3',
				components: ['Alert', 'Button', 'Card', 'Form', 'Stack']
			}
		]
	}
];
