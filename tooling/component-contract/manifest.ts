export interface PackageConditions {
	types?: string;
	svelte?: string;
	default: string;
}

export interface ComponentDocumentation {
	id: string;
	route: string;
	category: string;
	label: string;
}

export interface McpDescription {
	source: string;
	exportName: string;
}

export type ExportedSymbols = string[] | { pattern: string[]; modules: Record<string, string[]> };

export interface ComponentContractEntry {
	id: string;
	subpath: string | null;
	sourceIndex: string;
	exportedSymbols: ExportedSymbols;
	exports: string | PackageConditions | null;
	docs: ComponentDocumentation[];
	mcp: McpDescription | null;
	capabilities: string[];
	relatedComponents: string[];
	visibility: 'public' | 'internal';
}

interface ComponentOptions {
	docs?: false | ComponentDocumentation[];
	mcp?: false;
	related?: string[];
	visibility?: ComponentContractEntry['visibility'];
}

const toCamelCase = (value: string) =>
	value.replace(/-([a-z])/g, (_, letter: string) => letter.toUpperCase());

const packageConditions = (sourceIndex: string, hasSvelteCondition = true): PackageConditions => {
	const output = `./dist/${sourceIndex.replace(/^src\/lib\//, '').replace(/\.ts$/, '.js')}`;
	const types = output.replace(/\.js$/, '.d.ts');
	return hasSvelteCondition
		? { types, svelte: output, default: output }
		: { types, default: output };
};

const component = (
	id: string,
	sourceDirectory: string,
	category: string,
	label: string,
	options: ComponentOptions = {}
): Omit<ComponentContractEntry, 'exportedSymbols'> => {
	const sourceIndex = `src/lib/${sourceDirectory}/index.ts`;
	const descriptionName = toCamelCase(id);
	const docs =
		options.docs === false
			? []
			: (options.docs ?? [
					{
						id,
						route: `${category === 'Utilities' ? '/utilities' : '/components'}/${id}`,
						category,
						label
					}
				]);

	return {
		id,
		subpath: `./${id}`,
		sourceIndex,
		exports: packageConditions(sourceIndex),
		docs,
		mcp:
			options.mcp === false
				? null
				: {
						source: `${sourceDirectory}/${descriptionName}.mcp.js`,
						exportName: `${descriptionName}Description`
					},
		capabilities: ['svelte', 'component', toCamelCase(category.toLowerCase().replaceAll(' ', '-'))],
		relatedComponents: options.related ?? [],
		visibility: options.visibility ?? 'public'
	};
};

const docs = (
	id: string,
	route: string,
	category: string,
	label: string
): ComponentDocumentation => ({ id, route, category, label });

const entries: Omit<ComponentContractEntry, 'exportedSymbols'>[] = [
	{
		id: 'package-json',
		subpath: './package.json',
		sourceIndex: 'package.json',
		exports: './package.json',
		docs: [],
		mcp: null,
		capabilities: ['package-metadata'],
		relatedComponents: [],
		visibility: 'public'
	},

	component('ai-conversation', 'components/AIConversation', 'AI', 'Conversation', {
		related: ['ai-thread', 'ai-composer', 'ai-message']
	}),
	component('ai-ask-user-question', 'components/AIAskUserQuestion', 'AI', 'Ask user question', {
		related: ['ai-chat', 'ai-message']
	}),
	component('ai-chat', 'components/AIChat', 'AI', 'Chat', {
		related: ['ai-conversation', 'ai-thread', 'ai-composer']
	}),
	component('ai-context', 'components/AIContext', 'AI', 'Context', {
		related: ['ai-chat', 'ai-conversation']
	}),
	component('ai-thread', 'components/AIThread', 'AI', 'Thread', {
		related: ['ai-thread-toc', 'ai-conversation', 'ai-message', 'ai-tool']
	}),
	component('ai-thread-toc', 'components/AIThreadToc', 'AI', 'Thread TOC', {
		related: ['ai-thread', 'scroll-area', 'hover-card']
	}),
	component('ai-message', 'components/AIMessage', 'AI', 'Message', {
		related: ['ai-message-actions', 'ai-marker', 'ai-tool']
	}),
	component('ai-message-actions', 'components/AIMessageActions', 'AI', 'Message actions', {
		related: ['ai-message']
	}),
	component('ai-marker', 'components/AIMarker', 'AI', 'Marker', {
		related: ['ai-message', 'ai-thread']
	}),
	component('ai-model-selector', 'components/AIModelSelector', 'AI', 'Model selector', {
		related: ['ai-composer', 'ai-chat']
	}),
	component('ai-composer', 'components/AIComposer', 'AI', 'Composer', {
		related: ['ai-suggestion', 'ai-model-selector', 'ai-chat']
	}),
	component('ai-reasoning', 'components/AIReasoning', 'AI', 'Reasoning', {
		related: ['ai-message', 'ai-tool']
	}),
	component('ai-suggestion', 'components/AISuggestion', 'AI', 'Suggestion', {
		related: ['ai-composer', 'ai-chat']
	}),
	component('ai-tool', 'components/AITool', 'AI', 'Tool', {
		related: ['ai-message', 'ai-mcp-app']
	}),
	component('ai-mcp-app', 'components/AIMcpApp', 'AI', 'MCP App', {
		related: ['ai-tool', 'ai-chat']
	}),
	component('ai-file-preview', 'components/AIFilePreview', 'AI', 'File preview', {
		docs: false,
		related: ['ai-message', 'document-viewer']
	}),

	component('aspect-ratio', 'components/AspectRatio', 'Layout', 'Aspect ratio'),
	component('card', 'components/Card', 'Layout', 'Card', {
		related: ['stack', 'grid']
	}),
	component('grid', 'components/Grid', 'Layout', 'Grid', {
		docs: [
			docs('grid', '/components/grid', 'Layout', 'Grid'),
			docs('grid-span', '/components/grid-span', 'Layout', 'Grid span')
		],
		related: ['stack', 'card']
	}),
	component('heading', 'components/Heading', 'Layout', 'Heading'),
	component('resizable', 'components/Resizable', 'Layout', 'Resizable'),
	component('scroll-area', 'components/ScrollArea', 'Layout', 'Scroll area'),
	component('separator', 'components/Separator', 'Layout', 'Separator'),
	component('stack', 'components/Stack', 'Layout', 'Stack', {
		related: ['grid', 'card']
	}),

	component('app-shell', 'components/AppShell', 'Shells', 'App shell', {
		related: ['page-shell', 'sidebar']
	}),
	component('page-shell', 'components/PageShell', 'Shells', 'Page shell', {
		related: ['app-shell', 'sidebar']
	}),
	component('sidebar', 'components/Sidebar', 'Shells', 'Sidebar', {
		related: ['app-shell', 'page-shell']
	}),

	component('button', 'components/Button', 'Actions', 'Button', {
		related: ['button-group', 'toggle-button']
	}),
	component('button-group', 'components/ButtonGroup', 'Actions', 'Button group', {
		related: ['button', 'segmented-control']
	}),
	component('segmented-control', 'components/SegmentedControl', 'Actions', 'Segmented control', {
		related: ['toggle-button-group', 'button-group']
	}),
	component('toggle-button', 'components/ToggleButton', 'Actions', 'Toggle button', {
		related: ['toggle-button-group', 'button']
	}),
	component('toggle-button-group', 'components/ToggleButtonGroup', 'Actions', 'Toggle group', {
		related: ['toggle-button', 'segmented-control']
	}),
	component('toggle-menu', 'components/ToggleMenu', 'Actions', 'Toggle menu', {
		related: ['selection-menu', 'menu']
	}),
	component('selection-menu', 'components/SelectionMenu', 'Actions', 'Selection menu', {
		related: ['toggle-menu', 'select']
	}),

	component('ask', 'components/Form/Ask', 'Forms', 'Ask', { docs: false }),
	component('field', 'components/Form/Field', 'Forms', 'Field', {
		docs: false,
		related: ['form']
	}),
	component('calendar', 'components/Form/Calendar', 'Forms', 'Calendar', {
		related: ['date-input', 'date-selector', 'mini-calendar']
	}),
	component('checkbox', 'components/Form/Checkbox', 'Forms', 'Checkbox'),
	component('checkboxes-input', 'components/Form/CheckboxesInput', 'Forms', 'Checkboxes', {
		docs: [docs('checkboxes-input', '/components/checkboxes', 'Forms', 'Checkboxes')],
		related: ['checkbox', 'radio-input']
	}),
	component('color-input', 'components/Form/ColorInput', 'Forms', 'Color input', {
		related: ['color-picker']
	}),
	component('color-picker', 'components/Form/ColorPicker', 'Forms', 'Color picker', {
		related: ['color-input']
	}),
	component('combobox', 'components/Form/Combobox', 'Forms', 'Combobox', {
		related: ['select', 'tags-input']
	}),
	component('date-input', 'components/Form/DateInput', 'Forms', 'Date input', {
		related: ['date-selector', 'calendar']
	}),
	component('date-selector', 'components/Form/DateSelector', 'Forms', 'Date selector', {
		related: ['date-input', 'calendar']
	}),
	component('file-input', 'components/Form/File', 'Forms', 'File', {
		docs: [docs('file-input', '/components/file', 'Forms', 'File')]
	}),
	component('form', 'components/Form/Form', 'Forms', 'Form', {
		related: ['multi-step-form']
	}),
	component('key-value-input', 'components/Form/KeyValueInput', 'Forms', 'Key value input'),
	component('multi-step-form', 'components/Form/MultiStepForm', 'Forms', 'Multi-step form', {
		related: ['form', 'stepper']
	}),
	component('number-input', 'components/Form/NumberInput', 'Forms', 'Number input', {
		related: ['slider', 'text-input']
	}),
	component('password-input', 'components/Form/PasswordInput', 'Forms', 'Password', {
		docs: [docs('password-input', '/components/password', 'Forms', 'Password')],
		related: ['text-input']
	}),
	component('phone-input', 'components/Form/PhoneInput', 'Forms', 'Phone', {
		docs: [docs('phone-input', '/components/phone', 'Forms', 'Phone')],
		related: ['text-input']
	}),
	component('pin-input', 'components/Form/PinInput', 'Forms', 'Pin input', {
		related: ['text-input']
	}),
	component('radio-input', 'components/Form/RadioInput', 'Forms', 'Radios', {
		docs: [docs('radio-input', '/components/radios', 'Forms', 'Radios')],
		related: ['checkboxes-input', 'select']
	}),
	component('rating-input', 'components/Form/RatingInput', 'Forms', 'Rating input', {
		related: ['rating']
	}),
	component('rich-text-input', 'components/RichTextInput', 'Forms', 'Rich text input', {
		related: ['text-area', 'markdown']
	}),
	component('select', 'components/Form/Select', 'Forms', 'Select', {
		related: ['combobox', 'selection-menu']
	}),
	component('slider', 'components/Form/Slider', 'Forms', 'Slider', {
		related: ['number-input']
	}),
	component('switch', 'components/Form/Switch', 'Forms', 'Switch', {
		related: ['checkbox', 'toggle-button']
	}),
	component('tag-group', 'components/Form/TagGroup', 'Forms', 'Tag group', {
		related: ['tags-input', 'chip']
	}),
	component('tags-input', 'components/Form/TagsInput', 'Forms', 'Tags input', {
		related: ['tag-group', 'combobox']
	}),
	component('text-input', 'components/Form/TextInput', 'Forms', 'Text input', {
		docs: [docs('text-input', '/components/textinput', 'Forms', 'Text input')],
		related: ['text-area', 'number-input']
	}),
	component('text-area', 'components/Form/TextArea', 'Forms', 'Textarea', {
		docs: [docs('text-area', '/components/textarea', 'Forms', 'Textarea')],
		related: ['text-input', 'rich-text-input']
	}),
	component('time-input', 'components/Form/TimeInput', 'Forms', 'Time input', {
		related: ['date-input']
	}),
	component('voice-input', 'components/Form/VoiceInput', 'Forms', 'Voice input', {
		related: ['text-input', 'ai-composer']
	}),

	component('avatar', 'components/Avatar', 'Data display', 'Avatar', {
		docs: [
			docs('avatar', '/components/avatar', 'Data display', 'Avatar'),
			docs('avatar-group', '/components/avatar-group', 'Data display', 'Avatar group')
		]
	}),
	component('chart', 'components/Chart', 'Data display', 'Chart'),
	component('chip', 'components/Chip', 'Data display', 'Chip', {
		related: ['tag-group']
	}),
	component('event-calendar', 'components/EventCalendar', 'Data display', 'Event calendar', {
		related: ['calendar', 'gantt-chart']
	}),
	component('gantt-chart', 'components/GanttChart', 'Data display', 'Gantt chart', {
		related: ['event-calendar', 'timeline']
	}),
	component('kanban', 'components/Kanban', 'Data display', 'Kanban', {
		related: ['sortable-list']
	}),
	component('kbd', 'components/Kbd', 'Data display', 'Kbd'),
	component('metadata-list', 'components/MetadataList', 'Data display', 'Metadata list'),
	component('mini-calendar', 'components/MiniCalendar', 'Data display', 'Mini calendar', {
		related: ['calendar', 'date-input']
	}),
	component('rating', 'components/Rating', 'Data display', 'Rating', {
		related: ['rating-input']
	}),
	component('sortable-list', 'components/SortableList', 'Data display', 'Sortable list', {
		related: ['kanban']
	}),
	component('stat', 'components/Stat', 'Data display', 'Stat'),
	component('table', 'components/Table', 'Data display', 'Table', {
		related: ['data-table']
	}),
	component('data-table', 'components/DataTable', 'Data display', 'Data table', {
		related: ['table']
	}),
	component('timeline', 'components/Timeline', 'Data display', 'Timeline', {
		related: ['gantt-chart']
	}),
	component('tree', 'components/Tree', 'Data display', 'Tree'),

	component('alert', 'components/Alert', 'Feedback', 'Alert', {
		related: ['toast', 'confirmation']
	}),
	component('confirmation', 'components/Confirmation', 'Feedback', 'Confirmation', {
		related: ['dialog', 'alert']
	}),
	component('empty', 'components/Empty', 'Feedback', 'Empty'),
	component('meter', 'components/Meter', 'Feedback', 'Meter', {
		related: ['progress-circle']
	}),
	component('network-indicator', 'components/NetworkIndicator', 'Feedback', 'Network indicator', {
		related: ['alert', 'toast']
	}),
	component('progress-circle', 'components/ProgressCircle', 'Feedback', 'Progress circle', {
		related: ['meter', 'spinner']
	}),
	component('skeleton', 'components/Skeleton', 'Feedback', 'Skeleton', {
		related: ['spinner']
	}),
	component('spinner', 'components/Spinner', 'Feedback', 'Spinner', {
		related: ['spinner-text', 'skeleton']
	}),
	component('spinner-text', 'components/SpinnerText', 'Feedback', 'Spinner text', {
		related: ['spinner']
	}),
	component('toast', 'components/Toast', 'Feedback', 'Toast', {
		related: ['alert', 'confirmation']
	}),

	component('accordion', 'components/Accordion', 'Disclosure', 'Accordion', {
		related: ['collapsible']
	}),
	component('collapsible', 'components/Collapsible', 'Disclosure', 'Collapsible', {
		related: ['accordion']
	}),

	component('breadcrumbs', 'components/Breadcrumbs', 'Navigation', 'Breadcrumbs'),
	component('command', 'components/Command', 'Navigation', 'Command', {
		related: ['menu', 'dialog']
	}),
	component('pagination', 'components/Pagination', 'Navigation', 'Pagination'),
	component('stepper', 'components/Stepper', 'Navigation', 'Stepper', {
		related: ['multi-step-form']
	}),
	component('tabbar', 'components/Tabbar', 'Navigation', 'Tabbar', {
		related: ['tabs']
	}),
	component('table-of-contents', 'components/TableOfContents', 'Navigation', 'Table of contents', {
		related: ['sidebar']
	}),
	component('tabs', 'components/Tabs', 'Navigation', 'Tabs', {
		related: ['tabbar']
	}),

	component('context-menu', 'components/ContextMenu', 'Menus', 'Context menu', {
		related: ['menu', 'popup-menu']
	}),
	component('menu', 'components/Menu', 'Menus', 'Menu', {
		related: ['menu-option', 'popup-menu']
	}),
	component('menu-bar', 'components/MenuBar', 'Menus', 'Menu bar', {
		related: ['menu']
	}),
	component('menu-option', 'components/MenuOption', 'Menus', 'Menu option', {
		related: ['menu']
	}),
	component('popup-menu', 'components/PopupMenu', 'Menus', 'Popup menu', {
		related: ['menu', 'context-menu']
	}),

	component('dialog', 'components/Dialog', 'Overlays', 'Dialog', {
		related: ['popover', 'overlay']
	}),
	component('floating-window', 'components/FloatingWindow', 'Overlays', 'Floating window', {
		related: ['dialog', 'overlay']
	}),
	component('hover-card', 'components/HoverCard', 'Overlays', 'Hover card', {
		related: ['popover', 'tooltip']
	}),
	component('link-preview', 'components/LinkPreview', 'Overlays', 'Link preview', {
		related: ['hover-card']
	}),
	component('overlay', 'components/Overlay', 'Overlays', 'Overlay', {
		related: ['dialog', 'popover']
	}),
	component('popover', 'components/Popover', 'Overlays', 'Popover', {
		related: ['dialog', 'tooltip']
	}),
	component('tooltip', 'components/Tooltip', 'Overlays', 'Tooltip', {
		related: ['popover', 'hover-card']
	}),

	component('audio-player', 'components/AudioPlayer', 'Media', 'Audio player', {
		related: ['media-volume', 'video-player']
	}),
	component('carousel', 'components/Carousel', 'Media', 'Carousel', {
		related: ['image-gallery']
	}),
	component('image-gallery', 'components/ImageGallery', 'Media', 'Image gallery', {
		related: ['image-zoom', 'carousel']
	}),
	component('image-zoom', 'components/ImageZoom', 'Media', 'Image zoom', {
		related: ['image-gallery']
	}),
	component('media-volume', 'components/MediaVolume', 'Media', 'Media volume', {
		related: ['audio-player', 'video-player']
	}),
	component('document-viewer', 'components/DocumentViewer', 'Media', 'Document viewer', {
		related: ['ai-file-preview']
	}),
	component('video-player', 'components/VideoPlayer', 'Media', 'Video player', {
		related: ['audio-player', 'media-volume']
	}),

	component('code', 'components/Code', 'Content & graphics', 'Code', {
		related: ['diff', 'markdown']
	}),
	component('diff', 'components/Diff', 'Content & graphics', 'Diff', {
		related: ['code']
	}),
	component('globe', 'components/Globe', 'Content & graphics', 'Globe', {
		related: ['map']
	}),
	component('map', 'components/Map', 'Content & graphics', 'Map', {
		related: ['globe']
	}),
	component('markdown', 'components/Markdown', 'Content & graphics', 'Markdown', {
		related: ['code', 'rich-text-input']
	}),
	component('marquee', 'components/Marquee', 'Content & graphics', 'Marquee'),
	component('mermaid', 'components/Mermaid', 'Content & graphics', 'Mermaid', {
		related: ['markdown', 'code']
	}),
	component('qr-code', 'components/QRCode', 'Content & graphics', 'QR code'),

	component('hitbox', 'components/Hitbox', 'Utilities', 'Hitbox'),
	component('slot', 'components/Slot', 'Utilities', 'Slot', { docs: false }),

	component('theme', 'components/Theme', 'Configuration', 'Theme', { docs: false }),
	{
		id: 'i18n',
		subpath: './i18n',
		sourceIndex: 'src/lib/i18n/index.ts',
		exports: packageConditions('src/lib/i18n/index.ts'),
		docs: [],
		mcp: { source: 'i18n/i18n.mcp.js', exportName: 'i18nDescription' },
		capabilities: ['svelte', 'localization'],
		relatedComponents: ['theme'],
		visibility: 'public'
	},
	{
		id: 'tailwind-plugin',
		subpath: './tailwind-plugin',
		sourceIndex: 'src/lib/tailwind/index.ts',
		exports: packageConditions('src/lib/tailwind/index.ts', false),
		docs: [],
		mcp: { source: 'tailwind/index.mcp.js', exportName: 'tailwindPluginDescription' },
		capabilities: ['tailwind', 'theme-configuration'],
		relatedComponents: ['theme'],
		visibility: 'public'
	},
	{
		id: 'theme-tailwind-plugin',
		subpath: './tailwind-plugin/theme',
		sourceIndex: 'src/lib/tailwind/theme.ts',
		exports: packageConditions('src/lib/tailwind/theme.ts', false),
		docs: [],
		mcp: { source: 'tailwind/theme.mcp.js', exportName: 'themePluginDescription' },
		capabilities: ['tailwind', 'theme-configuration', 'color-palettes'],
		relatedComponents: ['theme', 'tailwind-plugin'],
		visibility: 'public'
	},
	{
		id: 'types',
		subpath: './types',
		sourceIndex: 'src/lib/types/index.ts',
		exports: packageConditions('src/lib/types/index.ts', false),
		docs: [],
		mcp: { source: 'types/types.mcp.js', exportName: 'typesDescription' },
		capabilities: ['typescript', 'utility'],
		relatedComponents: [],
		visibility: 'public'
	},
	{
		id: 'cva',
		subpath: './cva',
		sourceIndex: 'src/lib/utils/cva/index.ts',
		exports: packageConditions('src/lib/utils/cva/index.ts', false),
		docs: [],
		mcp: { source: 'utils/cva/cva.mcp.js', exportName: 'cvaDescription' },
		capabilities: ['styling', 'utility'],
		relatedComponents: ['theme'],
		visibility: 'public'
	},
	{
		id: 'scheduling',
		subpath: './scheduling',
		sourceIndex: 'src/lib/utils/scheduling/index.ts',
		exports: packageConditions('src/lib/utils/scheduling/index.ts', false),
		docs: [],
		mcp: { source: 'utils/scheduling/scheduling.mcp.js', exportName: 'schedulingDescription' },
		capabilities: ['scheduling', 'utility'],
		relatedComponents: ['event-calendar', 'gantt-chart'],
		visibility: 'public'
	},
	{
		id: 'icons',
		subpath: './icons/*',
		sourceIndex: 'src/lib/components/Icons/*.ts',
		exports: {
			types: './dist/components/Icons/*.d.ts',
			default: './dist/components/Icons/*.js'
		},
		docs: [],
		mcp: {
			source: 'components/Icons/icons.mcp.js',
			exportName: 'iconsDescription'
		},
		capabilities: ['icons', 'snippet', 'wildcard-export'],
		relatedComponents: [],
		visibility: 'public'
	},
	{
		id: 'spinner-overlay',
		subpath: './spinner-overlay',
		sourceIndex: 'src/lib/attachments/spinnerOverlay.svelte.ts',
		exports: {
			types: './dist/attachments/spinnerOverlay.svelte.d.ts',
			svelte: './dist/attachments/spinnerOverlay.svelte.js',
			default: './dist/attachments/spinnerOverlay.svelte.js'
		},
		docs: [],
		mcp: { source: 'attachments/spinnerOverlay.mcp.js', exportName: 'spinnerOverlayDescription' },
		capabilities: ['attachment', 'feedback'],
		relatedComponents: ['spinner'],
		visibility: 'public'
	},
	{
		id: 'ai-mcp-app-sandbox',
		subpath: './ai-mcp-app/sandbox',
		sourceIndex: 'src/lib/components/AIMcpApp/sandbox/index.ts',
		exports: packageConditions('src/lib/components/AIMcpApp/sandbox/index.ts', false),
		docs: [],
		mcp: null,
		capabilities: ['ai', 'sandbox', 'utility'],
		relatedComponents: ['ai-mcp-app'],
		visibility: 'internal'
	}
];

const exportedSymbols: Record<string, ExportedSymbols> = {
	'theme-tailwind-plugin': ['ThemeOptions', 'default'],
	'package-json': [],
	'ai-conversation': [
		'AIConversation',
		'AIConversationAskUserQuestionChangePayload',
		'AIConversationBindableState',
		'AIConversationErrorPayload',
		'AIConversationLabelOverrides',
		'AIConversationLabels',
		'AIConversationMessagePayload',
		'AIConversationMessageTarget',
		'AIConversationMessageUpdate',
		'AIConversationMessageUpdatePayload',
		'AIConversationProps',
		'AIConversationQueuedMessagePayload',
		'AIConversationRetryDetail',
		'AIConversationRetryPayload',
		'AIConversationState',
		'AIConversationStateEvents',
		'AIConversationStateOptions',
		'AIConversationStatus',
		'AIConversationStatusChangePayload',
		'AIConversationSubmitDetail',
		'AIConversationSubmitPayload',
		'AIConversationToolTarget',
		'AIConversationToolUpdate',
		'AIConversationToolUpdateChange',
		'AIConversationToolUpdatePayload',
		'AIConversationValueChangePayload',
		'AI_CONVERSATION_CONTEXT_KEY',
		'DEFAULT_AI_CONVERSATION_LABELS',
		'getAIConversation',
		'resolveAIConversationLabels',
		'useAIConversation'
	],
	'ai-ask-user-question': [
		'AIAskAnswer',
		'AIAskAnswers',
		'AIAskQuestion',
		'AIAskUserQuestion',
		'AIAskUserQuestionAnswer',
		'AIAskUserQuestionChoiceQuestion',
		'AIAskUserQuestionFileQuestion',
		'AIAskUserQuestionOption',
		'AIAskUserQuestionProps',
		'AIAskUserQuestionQuestion',
		'AIAskUserQuestionQuestionState',
		'AIAskUserQuestionState',
		'AIAskUserQuestionSubmitDetail',
		'AIAskUserQuestionTextQuestion',
		'AIAskUserQuestionTheme',
		'AIAskUserQuestionThemeProps',
		'AIAskUserQuestionToolPayload',
		'AIAskUserQuestionType',
		'AIAskUserQuestionValue',
		'AIAskUserQuestionValues',
		'AIFileQuestion',
		'AIMultipleQuestion',
		'AIQuestionOption',
		'AISingleQuestion',
		'AITextQuestion',
		'aiAskAnswerSchema',
		'aiAskAnswersSchema',
		'aiAskQuestionSchema',
		'aiAskQuestionsSchema',
		'aiAskUserQuestionChoiceQuestionSchema',
		'aiAskUserQuestionFileQuestionSchema',
		'aiAskUserQuestionOptionSchema',
		'aiAskUserQuestionQuestionSchema',
		'aiAskUserQuestionTextQuestionSchema',
		'aiAskUserQuestionTheme',
		'aiAskUserQuestionToolInputSchema',
		'aiAskUserQuestionToolPayloadSchema',
		'aiAskUserQuestionToolStateSchema',
		'aiAskUserQuestionValueMapSchema',
		'aiFileQuestionSchema',
		'aiMultipleQuestionSchema',
		'aiQuestionOptionSchema',
		'aiSingleQuestionSchema',
		'aiTextQuestionSchema',
		'setAIAskUserQuestionTheme',
		'useAIAskUserQuestionTheme'
	],
	'ai-chat': [
		'AIChat',
		'AIChatAppPayload',
		'AIChatProps',
		'AIChatSkeleton',
		'AIChatSkeletonProps',
		'AIChatState',
		'AIChatTheme',
		'AIChatThemeProps',
		'AIChatToolPayload',
		'AIMessageSize',
		'AIMessageVariant',
		'AIThreadDensity',
		'aiChatTheme',
		'setAIChatTheme',
		'useAIChatTheme'
	],
	'ai-context': [
		'AIContext',
		'AIContextLabels',
		'AIContextProps',
		'AIContextState',
		'AIContextTheme',
		'AIContextThemeProps',
		'AIContextTone',
		'AIContextUsage',
		'aiContextTheme',
		'setAIContextTheme',
		'useAIContextTheme'
	],
	'ai-thread': [
		'AIFileSource',
		'AIMarkerVariant',
		'AIMessageActionHandler',
		'AIMessageActionSnippet',
		'AIMessageActionState',
		'AIMessageActionVisibility',
		'AIMessageSize',
		'AIMessageVariant',
		'AIThread',
		'AIThreadAskUserQuestion',
		'AIThreadAskUserQuestionState',
		'AIThreadAskUserQuestionStateChange',
		'AIThreadDensity',
		'AIThreadItem',
		'AIThreadMessageKey',
		'AIThreadMessageRenderPayload',
		'AIThreadPart',
		'AIThreadProps',
		'AIThreadRenderPayload',
		'AIThreadRole',
		'AIThreadScrollBehavior',
		'AIThreadScrollButtonPosition',
		'AIThreadTheme',
		'AIThreadThemeProps',
		'AIThreadToc',
		'AIThreadTocEntry',
		'AIThreadTocPin',
		'AIThreadTocPinPayload',
		'AIThreadTocPreviewAlign',
		'AIThreadTocPreviewSide',
		'AIThreadTocProps',
		'AIThreadTocRange',
		'AIThreadTocSide',
		'AIThreadTocState',
		'AIThreadTocTheme',
		'AIThreadTocThemeProps',
		'AIThreadToolPart',
		'AIToolCall',
		'AIToolSnippet',
		'AIToolStatus',
		'aiThreadTheme',
		'aiThreadTocTheme',
		'setAIThreadTheme',
		'setAIThreadTocTheme',
		'useAIThreadTheme',
		'useAIThreadTocTheme'
	],
	'ai-thread-toc': [
		'AIFileSource',
		'AIThreadItem',
		'AIThreadToc',
		'AIThreadTocEntry',
		'AIThreadTocPin',
		'AIThreadTocPinPayload',
		'AIThreadTocPreviewAlign',
		'AIThreadTocPreviewSide',
		'AIThreadTocProps',
		'AIThreadTocRange',
		'AIThreadTocSide',
		'AIThreadTocState',
		'AIThreadTocTheme',
		'AIThreadTocThemeProps',
		'aiThreadTocTheme',
		'setAIThreadTocTheme',
		'useAIThreadTocTheme'
	],
	'ai-message': [
		'AIMessage',
		'AIMessageActionHandler',
		'AIMessageActionSnippet',
		'AIMessageActionState',
		'AIMessageActionVisibility',
		'AIMessageFile',
		'AIMessageMarkdownProps',
		'AIMessageProps',
		'AIMessageRenderPayload',
		'AIMessageRole',
		'AIMessageSize',
		'AIMessageTheme',
		'AIMessageThemeProps',
		'AIMessageVariant',
		'aiMessageTheme',
		'setAIMessageTheme',
		'useAIMessageTheme'
	],
	'ai-message-actions': [
		'AIMessageActionHandler',
		'AIMessageActionSnippet',
		'AIMessageActionState',
		'AIMessageActionVisibility',
		'AIMessageActions',
		'AIMessageActionsProps',
		'AIMessageActionsTheme',
		'AIMessageActionsThemeProps',
		'aiMessageActionsTheme',
		'setAIMessageActionsTheme',
		'useAIMessageActionsTheme'
	],
	'ai-marker': [
		'AIMarker',
		'AIMarkerProps',
		'AIMarkerTheme',
		'AIMarkerThemeProps',
		'AIMarkerVariant',
		'aiMarkerTheme',
		'setAIMarkerTheme',
		'useAIMarkerTheme'
	],
	'ai-model-selector': [
		'AIModelSelector',
		'AIModelSelectorGroup',
		'AIModelSelectorLabels',
		'AIModelSelectorMenuItem',
		'AIModelSelectorModel',
		'AIModelSelectorProps',
		'AIModelSelectorState',
		'AIModelSelectorTheme',
		'AIModelSelectorThemeProps',
		'AIModelSelectorValueChangePayload',
		'aiModelSelectorTheme',
		'setAIModelSelectorTheme',
		'useAIModelSelectorTheme'
	],
	'ai-composer': [
		'AIComposer',
		'AIComposerAttachment',
		'AIComposerAttachmentStatus',
		'AIComposerCommand',
		'AIComposerCommandSearch',
		'AIComposerDropzoneState',
		'AIComposerHandle',
		'AIComposerMentionItem',
		'AIComposerMentionSearch',
		'AIComposerMentionSearchPayload',
		'AIComposerMentionSearchType',
		'AIComposerMentionType',
		'AIComposerProps',
		'AIComposerQueuedMessage',
		'AIComposerQueuedMessageEditPayload',
		'AIComposerQueuedMessagePayload',
		'AIComposerSearchResult',
		'AIComposerSkillItem',
		'AIComposerSkillSearch',
		'AIComposerSubmitDetail',
		'AIComposerSubmitEvent',
		'AIComposerSubmitMeta',
		'AIComposerSubmitShortcut',
		'AIComposerSubmitState',
		'AIComposerSubmitToken',
		'AIComposerSuggestionKind',
		'AIComposerSuggestionLifecycleCallback',
		'AIComposerSuggestionLifecycleState',
		'AIComposerSuggestionTrigger',
		'AIComposerTheme',
		'AIComposerThemeProps',
		'AIComposerTriggerSource',
		'AIComposerVoiceInputHandler',
		'AIComposerVoiceInputVariant',
		'aiComposerTheme',
		'setAIComposerTheme',
		'useAIComposerTheme'
	],
	'ai-reasoning': [
		'AIReasoningLabels',
		'AIReasoningState',
		'AIReasoningTheme',
		'AIReasoningThemeProps',
		'Reasoning',
		'ReasoningProps',
		'aiReasoningTheme',
		'setAIReasoningTheme',
		'useAIReasoningTheme'
	],
	'ai-suggestion': [
		'AISuggestionTheme',
		'AISuggestionThemeProps',
		'Suggestion',
		'SuggestionProps',
		'SuggestionRenderPayload',
		'Suggestions',
		'SuggestionsProps',
		'aiSuggestionTheme',
		'setAISuggestionTheme',
		'useAISuggestionTheme'
	],
	'ai-tool': [
		'AITool',
		'AIToolCall',
		'AIToolLabels',
		'AIToolProps',
		'AIToolRenderPayload',
		'AIToolSnippet',
		'AIToolStatus',
		'AIToolTheme',
		'AIToolThemeProps',
		'AIToolToggleIcon',
		'AIToolVariant',
		'aiToolTheme',
		'setAIToolTheme',
		'useAIToolTheme'
	],
	'ai-mcp-app': [
		'AIMcpApp',
		'AIMcpAppContentModalities',
		'AIMcpAppDisplayModeParams',
		'AIMcpAppDisplayModeResult',
		'AIMcpAppDownloadFileParams',
		'AIMcpAppDownloadFileResult',
		'AIMcpAppHostConfig',
		'AIMcpAppHostContext',
		'AIMcpAppMessageParams',
		'AIMcpAppMessageResult',
		'AIMcpAppModelContextParams',
		'AIMcpAppOpenLinkParams',
		'AIMcpAppOpenLinkResult',
		'AIMcpAppPermission',
		'AIMcpAppPermissionPolicy',
		'AIMcpAppProps',
		'AIMcpAppRequest',
		'AIMcpAppRequestExtra',
		'AIMcpAppResource',
		'AIMcpAppResourceCsp',
		'AIMcpAppResourcePermissions',
		'AIMcpAppState',
		'AIMcpAppStatus',
		'AIMcpAppTheme',
		'AIMcpAppThemeProps',
		'AIMcpAppToolCallParams',
		'AIMcpAppToolCallResult',
		'AIMcpAppToolPolicy',
		'AIMcpToolCall',
		'aiMcpAppTheme',
		'setAIMcpAppTheme',
		'useAIMcpAppTheme'
	],
	'ai-file-preview': [
		'AIFilePreview',
		'AIFilePreviewProps',
		'AIFilePreviewSource',
		'AIFilePreviewTheme',
		'AIFilePreviewThemeProps',
		'aiFilePreviewTheme',
		'setAIFilePreviewTheme',
		'useAIFilePreviewTheme'
	],
	'aspect-ratio': [
		'AspectRatio',
		'AspectRatioProps',
		'AspectRatioRatio',
		'AspectRatioTheme',
		'AspectRatioThemeProps',
		'aspectRatioTheme',
		'setAspectRatioTheme',
		'useAspectRatioTheme'
	],
	card: [
		'Card',
		'CardProps',
		'CardTheme',
		'CardThemeProps',
		'CardVariant',
		'cardTheme',
		'setCardTheme',
		'useCardTheme'
	],
	grid: [
		'Grid',
		'GridAlignment',
		'GridColumns',
		'GridProps',
		'GridRepeat',
		'GridSpan',
		'GridSpanProps',
		'GridSpanTheme',
		'GridSpanThemeProps',
		'GridTheme',
		'GridThemeProps',
		'LayoutSpacing',
		'gridDescription',
		'gridSpanTheme',
		'gridTheme',
		'setGridSpanTheme',
		'setGridTheme',
		'useGridSpanTheme',
		'useGridTheme'
	],
	heading: ['Heading', 'HeadingProps'],
	resizable: [
		'Resizable',
		'ResizableChangeMeta',
		'ResizableDir',
		'ResizableDirection',
		'ResizableDisabledHandles',
		'ResizableHandleAriaLabel',
		'ResizableHandlePayload',
		'ResizableHandleVariant',
		'ResizableLayoutCommitPayload',
		'ResizableOrientation',
		'ResizablePanelItem',
		'ResizablePanelPayload',
		'ResizableProps',
		'ResizableSizeValue',
		'ResizableTheme',
		'ResizableThemeProps',
		'ResizableVariant',
		'resizableDescription',
		'resizableTheme',
		'setResizableTheme',
		'useResizableTheme'
	],
	'scroll-area': [
		'ScrollArea',
		'ScrollAreaProps',
		'ScrollAreaTheme',
		'ScrollAreaThemeProps',
		'scrollAreaTheme',
		'setScrollAreaTheme',
		'useScrollAreaTheme'
	],
	separator: [
		'Separator',
		'SeparatorProps',
		'SeparatorTheme',
		'SeparatorThemeProps',
		'separatorTheme',
		'setSeparatorTheme',
		'useSeparatorTheme'
	],
	stack: [
		'LayoutSpacing',
		'Stack',
		'StackAlign',
		'StackElement',
		'StackJustify',
		'StackOrientation',
		'StackProps',
		'StackSizeValue',
		'StackTheme',
		'StackThemeProps',
		'StackWrap',
		'setStackTheme',
		'stackDescription',
		'stackTheme',
		'useStackTheme'
	],
	'app-shell': [
		'AppShell',
		'AppShellActions',
		'AppShellApi',
		'AppShellBack',
		'AppShellBreadcrumbs',
		'AppShellConfig',
		'AppShellProps',
		'AppShellRegion',
		'AppShellSidebarProps',
		'AppShellTheme',
		'AppShellThemeProps',
		'appShellDescription',
		'appShellTheme',
		'setAppShellTheme',
		'useAppShellTheme'
	],
	'page-shell': [
		'PageShell',
		'PageShellAction',
		'PageShellActionOverflow',
		'PageShellActions',
		'PageShellApi',
		'PageShellBack',
		'PageShellBreadcrumbs',
		'PageShellConfig',
		'PageShellContentPadding',
		'PageShellContentWidth',
		'PageShellFooter',
		'PageShellHeader',
		'PageShellMobileActionCount',
		'PageShellProps',
		'PageShellRegion',
		'PageShellRegistrationCleanup',
		'PageShellState',
		'PageShellTextRegion',
		'PageShellTheme',
		'PageShellThemeProps',
		'pageShellDescription',
		'pageShellTheme',
		'setPageShell',
		'setPageShellTheme',
		'usePageShell',
		'usePageShellTheme'
	],
	sidebar: [
		'Sidebar',
		'SidebarApi',
		'SidebarCollapseIcon',
		'SidebarCollapsible',
		'SidebarDensity',
		'SidebarDisplayState',
		'SidebarFrame',
		'SidebarGroup',
		'SidebarIcon',
		'SidebarMenuActionDescriptor',
		'SidebarMenuAlign',
		'SidebarMenuButton',
		'SidebarMenuButtonItem',
		'SidebarMenuButtonSize',
		'SidebarMenuButtonVariant',
		'SidebarMenuEntry',
		'SidebarMenuSide',
		'SidebarMenuSubEntry',
		'SidebarMode',
		'SidebarProps',
		'SidebarRail',
		'SidebarResizable',
		'SidebarResizableOptions',
		'SidebarSearch',
		'SidebarSide',
		'SidebarSize',
		'SidebarState',
		'SidebarTheme',
		'SidebarThemeProps',
		'SidebarTooltipMode',
		'SidebarTreeNode',
		'SidebarVariant',
		'SidebarWidthChangedPayload',
		'setSidebarTheme',
		'sidebarDescription',
		'sidebarTheme',
		'useSidebarTheme'
	],
	button: [
		'Button',
		'ButtonPrimitiveProps',
		'ButtonProps',
		'ButtonTheme',
		'ButtonThemeProps',
		'ButtonVariant',
		'buttonTheme',
		'setButtonTheme',
		'useButtonTheme'
	],
	'button-group': [
		'ButtonGroup',
		'ButtonGroupProps',
		'ButtonGroupTheme',
		'ButtonGroupThemeProps',
		'buttonGroupTheme',
		'setButtonGroupTheme',
		'useButtonGroupTheme'
	],
	'segmented-control': [
		'SegmentedControl',
		'SegmentedControlItem',
		'SegmentedControlProps',
		'SegmentedControlTheme',
		'SegmentedControlThemeProps',
		'SegmentedControlVariant',
		'segmentedControlTheme',
		'setSegmentedControlTheme',
		'useSegmentedControlTheme'
	],
	'toggle-button': [
		'ToggleButton',
		'ToggleButtonProps',
		'ToggleButtonTheme',
		'ToggleButtonThemeProps',
		'ToggleButtonVariant',
		'setToggleButtonTheme',
		'toggleButtonTheme',
		'useToggleButtonTheme'
	],
	'toggle-button-group': [
		'ToggleButtonGroup',
		'ToggleButtonGroupItem',
		'ToggleButtonGroupItems',
		'ToggleButtonGroupProps',
		'ToggleButtonGroupTheme',
		'ToggleButtonGroupThemeProps',
		'ToggleButtonGroupValue',
		'setToggleButtonGroupTheme',
		'toggleButtonGroupTheme',
		'useToggleButtonGroupTheme'
	],
	'toggle-menu': [
		'ToggleMenu',
		'ToggleMenuCustomItem',
		'ToggleMenuCustomPayload',
		'ToggleMenuGroupButtons',
		'ToggleMenuGroupItem',
		'ToggleMenuItem',
		'ToggleMenuMenuItem',
		'ToggleMenuProps',
		'ToggleMenuRadioGroupButton',
		'ToggleMenuRadioGroupButtons',
		'ToggleMenuRadioGroupItem',
		'ToggleMenuTheme',
		'ToggleMenuThemeProps',
		'ToggleMenuToggleItem',
		'setToggleMenuTheme',
		'toggleMenuTheme',
		'useToggleMenuTheme'
	],
	'selection-menu': [
		'SelectionMenu',
		'SelectionMenuPayload',
		'SelectionMenuProps',
		'SelectionMenuSelection',
		'SelectionMenuTarget',
		'SelectionMenuTheme',
		'SelectionMenuThemeProps',
		'selectionMenuTheme',
		'setSelectionMenuTheme',
		'useSelectionMenuTheme'
	],
	ask: ['Ask', 'AskButton', 'AskDialogOptions', 'AskOptions', 'AskProps', 'AskResult', 'ask'],
	field: [
		'BooleanInputType',
		'CalendarInputType',
		'ColorInputType',
		'DateInputType',
		'Field',
		'FieldActionButton',
		'FieldAttributes',
		'FieldControlAttributes',
		'FieldLabelPosition',
		'FieldProps',
		'FieldState',
		'FieldTheme',
		'FieldThemeProps',
		'FieldValidationResult',
		'FieldValue',
		'FileInputType',
		'InputProps',
		'InputType',
		'KeyValueInputType',
		'KeyValuePair',
		'MultipleChoiceInputType',
		'NumberInputType',
		'PinInputType',
		'RatingInputType',
		'RichTextInputType',
		'SingleOptionInputType',
		'SliderRangeInputType',
		'TagGroupInputType',
		'TagInputType',
		'TextInputType',
		'TimeInputType',
		'VoiceInputType',
		'createFieldState',
		'fieldSchemas',
		'fieldStructure',
		'fieldTheme',
		'llmDescription',
		'setFieldTheme',
		'useFieldTheme'
	],
	calendar: [
		'BaseCalendarProps',
		'CalendarInput',
		'CalendarInputProps',
		'CalendarPrimitive',
		'CalendarPrimitiveProps',
		'CalendarTheme',
		'CalendarThemeProps',
		'CalendarType',
		'CalendarValue',
		'Cell',
		'Event',
		'calendarTheme',
		'setCalendarInputTheme',
		'useCalendarInputTheme'
	],
	checkbox: [
		'Checkbox',
		'CheckboxProps',
		'CheckboxTheme',
		'CheckboxThemeProps',
		'checkboxTheme',
		'setCheckboxTheme',
		'useCheckboxTheme'
	],
	'checkboxes-input': [
		'CheckboxOption',
		'CheckboxesInput',
		'CheckboxesInputProps',
		'CheckboxesInputTheme',
		'CheckboxesInputThemeProps',
		'checkboxesInputTheme',
		'setCheckboxesInputTheme',
		'useCheckboxesInputTheme'
	],
	'color-input': [
		'ColorFormat',
		'ColorInput',
		'ColorInputProps',
		'ColorInputTheme',
		'ColorInputThemeProps',
		'colorInputTheme',
		'setColorInputTheme',
		'useColorInputTheme'
	],
	'color-picker': [
		'ColorFormat',
		'ColorPicker',
		'ColorPickerInput',
		'ColorPickerInputProps',
		'ColorPickerProps',
		'ColorPickerTheme',
		'ColorPickerThemeProps',
		'colorPickerTheme',
		'setColorPickerTheme',
		'useColorPickerTheme'
	],
	combobox: [
		'Combobox',
		'ComboboxOption',
		'ComboboxProps',
		'ComboboxTheme',
		'ComboboxThemeProps',
		'ComboboxValueChangePayload',
		'comboboxTheme',
		'setComboboxTheme',
		'useComboboxTheme'
	],
	'date-input': [
		'DateFormat',
		'DateInput',
		'DateInputProps',
		'DateInputTheme',
		'DateInputThemeProps',
		'dateInputTheme',
		'setDateInputTheme',
		'useDateInputTheme'
	],
	'date-selector': [
		'DateSelector',
		'DateSelectorInput',
		'DateSelectorInputMode',
		'DateSelectorInputProps',
		'DateSelectorMode',
		'DateSelectorPreset',
		'DateSelectorProps',
		'DateSelectorTheme',
		'DateSelectorThemeProps',
		'DateSelectorValue',
		'dateSelectorTheme',
		'setDateSelectorTheme',
		'useDateSelectorTheme'
	],
	'file-input': [
		'FileInput',
		'FileInputMode',
		'FileInputProps',
		'FileInputTheme',
		'FileInputThemeProps',
		'FileInputType',
		'FileInputValue',
		'fileInputTheme',
		'setFileInputTheme',
		'useFileInputTheme'
	],
	form: [
		'Ask',
		'AskButton',
		'AskDialogOptions',
		'AskOptions',
		'AskProps',
		'AskResult',
		'FieldLabelPosition',
		'FlattenFormInputs',
		'Form',
		'FormAction',
		'FormActionInput',
		'FormCustomInput',
		'FormFieldController',
		'FormFieldEntry',
		'FormFieldInput',
		'FormGroup',
		'FormGroupColumns',
		'FormGroupInputs',
		'FormInput',
		'FormInputAction',
		'FormInputState',
		'FormInputs',
		'FormInputsWithState',
		'FormLayout',
		'FormProps',
		'FormRenderableInput',
		'FormState',
		'FormSubmitHandler',
		'FormTheme',
		'FormThemeProps',
		'FormValueInput',
		'FormVariant',
		'InferFormValue',
		'LiveFormValue',
		'MaybePromise',
		'ask',
		'formTheme',
		'setFormTheme',
		'useFormTheme'
	],
	'key-value-input': [
		'KeyValueInput',
		'KeyValueInputProps',
		'KeyValueInputTheme',
		'KeyValueInputThemeProps',
		'keyValueInputTheme',
		'setKeyValueInputTheme',
		'useKeyValueInputTheme'
	],
	'multi-step-form': [
		'FormStep',
		'MergedMultiStepFormInputs',
		'MultiStepForm',
		'MultiStepFormProps',
		'MultiStepFormState',
		'MultiStepFormTheme',
		'MultiStepFormThemeProps',
		'multiStepFormTheme',
		'setMultiStepFormTheme',
		'useMultiStepFormTheme'
	],
	'number-input': [
		'NumberInput',
		'NumberInputProps',
		'NumberInputTheme',
		'NumberInputThemeProps',
		'numberInputTheme',
		'setNumberInputTheme',
		'useNumberInputTheme'
	],
	'password-input': [
		'PasswordInput',
		'PasswordInputProps',
		'PasswordInputTheme',
		'PasswordInputThemeProps',
		'passwordInputTheme',
		'setPasswordInputTheme',
		'usePasswordInputTheme'
	],
	'phone-input': [
		'PhoneInput',
		'PhoneInputProps',
		'PhoneInputTheme',
		'PhoneInputThemeProps',
		'phoneInputTheme',
		'setPhoneInputTheme',
		'usePhoneInputTheme'
	],
	'pin-input': [
		'PIN_INPUT_ALPHANUMERIC_PATTERN',
		'PIN_INPUT_CHARS_PATTERN',
		'PIN_INPUT_DIGITS_PATTERN',
		'PinInput',
		'PinInputCell',
		'PinInputPattern',
		'PinInputProps',
		'PinInputTheme',
		'PinInputThemeProps',
		'pinInputTheme',
		'setPinInputTheme',
		'usePinInputTheme'
	],
	'radio-input': [
		'RadioInput',
		'RadioInputProps',
		'RadioInputTheme',
		'RadioInputThemeProps',
		'RadioOption',
		'radioInputTheme',
		'setRadioInputTheme',
		'useRadioInputTheme'
	],
	'rating-input': [
		'RatingInput',
		'RatingInputProps',
		'RatingTheme',
		'RatingThemeProps',
		'ratingTheme',
		'setRatingTheme',
		'useRatingTheme'
	],
	'rich-text-input': [
		'RichTextInput',
		'RichTextInputChange',
		'RichTextInputFormat',
		'RichTextInputHandle',
		'RichTextInputItem',
		'RichTextInputItemContext',
		'RichTextInputMaxHeight',
		'RichTextInputProps',
		'RichTextInputSearchResult',
		'RichTextInputSubmitShortcut',
		'RichTextInputSuggestionLifecycleCallback',
		'RichTextInputSuggestionLifecycleState',
		'RichTextInputTheme',
		'RichTextInputThemeProps',
		'RichTextInputToken',
		'RichTextInputTokenKind',
		'RichTextInputToolbar',
		'RichTextInputTriggerConfig',
		'RichTextInputTriggerContext',
		'RichTextInputTriggers',
		'richTextInputDescription',
		'richTextInputTheme',
		'setRichTextInputTheme',
		'useRichTextInputTheme'
	],
	select: [
		'Select',
		'SelectItems',
		'SelectOption',
		'SelectOptionGroup',
		'SelectProps',
		'SelectState',
		'SelectTheme',
		'SelectThemeProps',
		'SelectTriggerAttributes',
		'selectTheme',
		'setSelectTheme',
		'useSelectTheme'
	],
	slider: [
		'Slider',
		'SliderFormatValue',
		'SliderMark',
		'SliderMarkPayload',
		'SliderMode',
		'SliderOrientation',
		'SliderProps',
		'SliderRangeLabelPayload',
		'SliderRangePayload',
		'SliderState',
		'SliderTheme',
		'SliderThemeProps',
		'SliderValue',
		'SliderValuePayload',
		'SliderVariant',
		'setSliderTheme',
		'sliderTheme',
		'useSliderTheme'
	],
	switch: [
		'Switch',
		'SwitchProps',
		'SwitchTheme',
		'SwitchThemeProps',
		'setSwitchTheme',
		'switchTheme',
		'useSwitchTheme'
	],
	'tag-group': [
		'TagGroup',
		'TagGroupOption',
		'TagGroupProps',
		'TagGroupTheme',
		'TagGroupThemeProps',
		'TagGroupValue',
		'setTagGroupTheme',
		'tagGroupTheme',
		'useTagGroupTheme'
	],
	'tags-input': [
		'TagsInput',
		'TagsInputProps',
		'TagsInputTheme',
		'TagsInputThemeProps',
		'setTagsInputTheme',
		'tagsInputTheme',
		'useTagsInputTheme'
	],
	'text-input': [
		'TextInput',
		'TextInputAttributes',
		'TextInputProps',
		'TextInputTheme',
		'TextInputThemeProps',
		'setTextInputTheme',
		'textInputTheme',
		'useTextInputTheme'
	],
	'text-area': [
		'TextArea',
		'TextAreaAttributes',
		'TextAreaProps',
		'TextAreaTheme',
		'TextAreaThemeProps',
		'setTextAreaTheme',
		'textAreaTheme',
		'useTextAreaTheme'
	],
	'time-input': [
		'TimeInput',
		'TimeInputProps',
		'TimeInputTheme',
		'TimeInputThemeProps',
		'setTimeInputTheme',
		'timeInputTheme',
		'useTimeInputTheme'
	],
	'voice-input': [
		'VoiceInput',
		'VoiceInputProps',
		'VoiceInputResult',
		'VoiceInputStatus',
		'VoiceInputTheme',
		'VoiceInputThemeProps',
		'VoiceInputVariant',
		'setVoiceInputTheme',
		'useVoiceInputTheme',
		'voiceInputTheme'
	],
	avatar: [
		'Avatar',
		'AvatarGroup',
		'AvatarGroupProps',
		'AvatarGroupTheme',
		'AvatarGroupThemeProps',
		'AvatarProps',
		'AvatarTheme',
		'AvatarThemeProps',
		'avatarGroupTheme',
		'avatarTheme',
		'setAvatarGroupTheme',
		'setAvatarTheme',
		'useAvatarGroupTheme',
		'useAvatarTheme'
	],
	chart: [
		'Chart',
		'ChartAnalysisScope',
		'ChartAnnotation',
		'ChartAnnotationTarget',
		'ChartArrowAnnotation',
		'ChartAxisDefinition',
		'ChartAxisTickLabels',
		'ChartAxisTicks',
		'ChartBandAnnotation',
		'ChartBandScale',
		'ChartBarAnalysis',
		'ChartBarMark',
		'ChartBasicStrokeStyle',
		'ChartChannel',
		'ChartColor',
		'ChartCurve',
		'ChartDataMarkProps',
		'ChartDistributionInterval',
		'ChartDistributionMark',
		'ChartDistributionReferenceAnalysis',
		'ChartDistributionVariant',
		'ChartFacetMark',
		'ChartFillStyle',
		'ChartFrameDefinition',
		'ChartInitialDimensions',
		'ChartKey',
		'ChartLabelAnnotation',
		'ChartLegend',
		'ChartLegendDefinition',
		'ChartLineOptions',
		'ChartLinearScale',
		'ChartLogScale',
		'ChartMargin',
		'ChartMark',
		'ChartMarkerAnnotation',
		'ChartMatrixColorScale',
		'ChartMatrixMark',
		'ChartMatrixVariant',
		'ChartNetworkRelationMark',
		'ChartNumericScaleDefinition',
		'ChartPointOptions',
		'ChartPointScale',
		'ChartPointShape',
		'ChartPolarMark',
		'ChartPolarVariant',
		'ChartPositionDefinition',
		'ChartPowerScale',
		'ChartProportionMark',
		'ChartProportionVariant',
		'ChartProps',
		'ChartReferenceAnalysis',
		'ChartRegressionAnalysis',
		'ChartRegressionInterval',
		'ChartRelationLabelOptions',
		'ChartRelationLink',
		'ChartRelationLinkStyle',
		'ChartRelationMark',
		'ChartRelationNodeStyle',
		'ChartRelationVariant',
		'ChartRequiredChannel',
		'ChartRollingAnalysis',
		'ChartRuleAnnotation',
		'ChartSankeyRelationMark',
		'ChartScaleDefinition',
		'ChartScatterAnalysis',
		'ChartScatterMark',
		'ChartScatterSizeScale',
		'ChartScatterSizeScaleShortcut',
		'ChartSeriesAnalysis',
		'ChartSeriesChannels',
		'ChartSeriesInterval',
		'ChartSeriesMark',
		'ChartSqrtScale',
		'ChartStackLayout',
		'ChartStrokeStyle',
		'ChartSymlogScale',
		'ChartTheme',
		'ChartThemeProps',
		'ChartTimeScale',
		'ChartTooltipDefinition',
		'ChartTooltipField',
		'ChartTooltipPlacement',
		'ChartTreeRelationMark',
		'ChartUtcScale',
		'ChartValue',
		'ChartViewport',
		'ChartViewportDefinition',
		'ChartViewportTransition',
		'ChartVisual',
		'ChartWeightedRelationLink',
		'chartDescription',
		'chartTheme',
		'setChartTheme',
		'useChartTheme'
	],
	chip: [
		'Chip',
		'ChipProps',
		'ChipTheme',
		'ChipThemeProps',
		'chipTheme',
		'setChipTheme',
		'useChipTheme'
	],
	'event-calendar': [
		'EventCalendar',
		'EventCalendarAgendaDetailsPayload',
		'EventCalendarAllDayConversionOptions',
		'EventCalendarAllDayPayload',
		'EventCalendarApi',
		'EventCalendarAvailabilityOptions',
		'EventCalendarBusinessHours',
		'EventCalendarCallbackProps',
		'EventCalendarChange',
		'EventCalendarColor',
		'EventCalendarCreateActivation',
		'EventCalendarDateOnly',
		'EventCalendarDayHeaderPayload',
		'EventCalendarDragPreviewPayload',
		'EventCalendarEmptyPayload',
		'EventCalendarError',
		'EventCalendarErrorCode',
		'EventCalendarExpandedOccurrence',
		'EventCalendarHeaderPayload',
		'EventCalendarInteractionBlockedInfo',
		'EventCalendarInteractionOptions',
		'EventCalendarInteractions',
		'EventCalendarItem',
		'EventCalendarItemClickPayload',
		'EventCalendarItemPayload',
		'EventCalendarItemTooltipPayload',
		'EventCalendarItemsChangePayload',
		'EventCalendarLoadingPayload',
		'EventCalendarMonthCellPayload',
		'EventCalendarMonthOptions',
		'EventCalendarMoreClickPayload',
		'EventCalendarMutationSource',
		'EventCalendarNowIndicatorPayload',
		'EventCalendarOccurrence',
		'EventCalendarOffDaysConfig',
		'EventCalendarOverflowContentPayload',
		'EventCalendarOverflowPayload',
		'EventCalendarOverlapPredicate',
		'EventCalendarProposedUpdate',
		'EventCalendarProps',
		'EventCalendarRange',
		'EventCalendarRangeChangeInfo',
		'EventCalendarRecurrenceExpander',
		'EventCalendarRecurrenceOptions',
		'EventCalendarRecurrenceRule',
		'EventCalendarResource',
		'EventCalendarResourceHeaderPayload',
		'EventCalendarScrollMode',
		'EventCalendarSegment',
		'EventCalendarSelection',
		'EventCalendarSlot',
		'EventCalendarSlotClickPayload',
		'EventCalendarSlotSelectInfo',
		'EventCalendarSlotSelectPayload',
		'EventCalendarSnapshot',
		'EventCalendarSnippetProps',
		'EventCalendarTheme',
		'EventCalendarThemeProps',
		'EventCalendarTimeGridOptions',
		'EventCalendarTimeGutterPayload',
		'EventCalendarUpdateAdjustment',
		'EventCalendarUpdateResult',
		'EventCalendarView',
		'EventCalendarViewPayload',
		'EventCalendarWeekday',
		'eventCalendarTheme',
		'externalEvent',
		'setEventCalendarTheme',
		'useEventCalendarTheme'
	],
	'gantt-chart': [
		'GanttAssignment',
		'GanttAssignmentMutationKind',
		'GanttAssignmentProposal',
		'GanttAssignmentUpdateResult',
		'GanttAssignmentsChange',
		'GanttBaselinePayload',
		'GanttBuiltInColumnId',
		'GanttBuiltInZoomLevel',
		'GanttCalendar',
		'GanttCalendarException',
		'GanttChart',
		'GanttChartApi',
		'GanttChartClasses',
		'GanttChartError',
		'GanttChartErrorCode',
		'GanttChartProps',
		'GanttChartTheme',
		'GanttChartThemeProps',
		'GanttColor',
		'GanttColumnAlignment',
		'GanttColumnDefinition',
		'GanttColumnEditContext',
		'GanttColumnHeaderPayload',
		'GanttColumnId',
		'GanttConstraint',
		'GanttConstraintViolation',
		'GanttDateOnly',
		'GanttDeadlinePayload',
		'GanttDependenciesChange',
		'GanttDependency',
		'GanttDependencyClickPayload',
		'GanttDependencyCreationRequest',
		'GanttDependencyEndpoint',
		'GanttDependencyGeometry',
		'GanttDependencyMutationKind',
		'GanttDependencyProposal',
		'GanttDependencyTooltipPayload',
		'GanttDependencyUpdateResult',
		'GanttDisplayOptions',
		'GanttDragPreviewPayload',
		'GanttDuration',
		'GanttEmptyPayload',
		'GanttEventHandlers',
		'GanttGridHeaderPayload',
		'GanttGridOptions',
		'GanttHeaderPayload',
		'GanttHoliday',
		'GanttInteractionBlockedInfo',
		'GanttInteractionOptions',
		'GanttLag',
		'GanttLagUnit',
		'GanttLayoutOptions',
		'GanttLoadingPayload',
		'GanttMutationPolicy',
		'GanttMutationSource',
		'GanttNonWorkingTimePayload',
		'GanttPasteIdRequest',
		'GanttProgressPayload',
		'GanttRange',
		'GanttRangeProposal',
		'GanttRenderers',
		'GanttResolvedDependency',
		'GanttResolvedTaskNode',
		'GanttResource',
		'GanttResourceAssignmentsPayload',
		'GanttResourceView',
		'GanttScaleCell',
		'GanttScaleDefinition',
		'GanttScaleOption',
		'GanttScaleUnit',
		'GanttScheduleAnalysis',
		'GanttScheduleOptions',
		'GanttSchedulePropagation',
		'GanttScheduleViolationsPayload',
		'GanttScrollMode',
		'GanttSelection',
		'GanttSnapshot',
		'GanttSortDirection',
		'GanttTask',
		'GanttTaskBaseline',
		'GanttTaskClickPayload',
		'GanttTaskGeometry',
		'GanttTaskLabelPayload',
		'GanttTaskMutationKind',
		'GanttTaskPayload',
		'GanttTaskProposal',
		'GanttTaskRowPayload',
		'GanttTaskSegment',
		'GanttTaskTooltipPayload',
		'GanttTaskUpdateResult',
		'GanttTasksChange',
		'GanttTimeHeaderPayload',
		'GanttTimelineOptions',
		'GanttTouchActivation',
		'GanttTreeCellPayload',
		'GanttVisibleRangeInfo',
		'GanttWeekday',
		'GanttWorkingInterval',
		'GanttWorkloadBucket',
		'GanttWorkloadCellPayload',
		'GanttZoomLevel',
		'ganttChartDescription',
		'ganttChartTheme',
		'setGanttChartTheme',
		'useGanttChartTheme'
	],
	kanban: [
		'Kanban',
		'KanbanCard',
		'KanbanCardMove',
		'KanbanColumnData',
		'KanbanColumnMove',
		'KanbanProps',
		'KanbanTheme',
		'KanbanThemeProps',
		'kanbanTheme',
		'setKanbanTheme',
		'useKanbanTheme'
	],
	kbd: ['Kbd', 'KbdProps', 'KbdTheme', 'KbdThemeProps', 'kbdTheme', 'setKbdTheme', 'useKbdTheme'],
	'metadata-list': [
		'MetadataList',
		'MetadataListItem',
		'MetadataListItemPayload',
		'MetadataListItemType',
		'MetadataListProps',
		'MetadataListTheme',
		'MetadataListThemeProps',
		'MetadataListValue',
		'metadataListTheme',
		'setMetadataListTheme',
		'useMetadataListTheme'
	],
	'mini-calendar': [
		'MiniCalendar',
		'MiniCalendarDayPayload',
		'MiniCalendarProps',
		'MiniCalendarTheme',
		'MiniCalendarThemeProps',
		'miniCalendarTheme',
		'setMiniCalendarTheme',
		'useMiniCalendarTheme'
	],
	rating: [
		'Rating',
		'RatingProps',
		'RatingStarPayload',
		'RatingTheme',
		'RatingThemeProps',
		'ratingTheme',
		'setRatingTheme',
		'useRatingTheme'
	],
	'sortable-list': [
		'SortableList',
		'SortableListItemPayload',
		'SortableListProps',
		'SortableListReorderPayload',
		'SortableListTheme',
		'SortableListThemeProps',
		'setSortableListTheme',
		'sortableListTheme',
		'useSortableListTheme'
	],
	stat: [
		'Stat',
		'StatIndicatorVariant',
		'StatProps',
		'StatTheme',
		'StatThemeProps',
		'StatTrendDirection',
		'StatVariant',
		'setStatTheme',
		'statTheme',
		'useStatTheme'
	],
	table: [
		'Table',
		'TableCell',
		'TableCellValue',
		'TableProps',
		'TableRow',
		'TableTheme',
		'TableThemeProps',
		'setTableTheme',
		'tableTheme',
		'useTableTheme'
	],
	'data-table': [
		'DataTable',
		'DataTableAggregation',
		'DataTableAlignment',
		'DataTableApi',
		'DataTableBooleanFilter',
		'DataTableBuiltInEditor',
		'DataTableCellCommit',
		'DataTableCellPayload',
		'DataTableCellRenderPayload',
		'DataTableClasses',
		'DataTableColumn',
		'DataTableColumnFilter',
		'DataTableCustomEditor',
		'DataTableCustomFilter',
		'DataTableDateEditor',
		'DataTableDateFilter',
		'DataTableEditor',
		'DataTableEditorPayload',
		'DataTableFilter',
		'DataTableFilterPayload',
		'DataTableHeaderPayload',
		'DataTableHeaderRenderPayload',
		'DataTableInteractionMode',
		'DataTableNumberEditor',
		'DataTableNumberFilter',
		'DataTableOption',
		'DataTablePaginationConfig',
		'DataTablePaginationState',
		'DataTablePinning',
		'DataTableProcessingMode',
		'DataTableProps',
		'DataTableRowPayload',
		'DataTableSearchConfig',
		'DataTableSelectEditor',
		'DataTableSelectFilter',
		'DataTableSelectionMode',
		'DataTableSorting',
		'DataTableState',
		'DataTableSwitchEditor',
		'DataTableTextEditor',
		'DataTableTextFilter',
		'DataTableTheme',
		'DataTableThemeProps',
		'DataTableToolbarPayload',
		'createDataTableColumnHelper',
		'createDataTableState',
		'dataTableDescription',
		'dataTableTheme',
		'setDataTableTheme',
		'useDataTableTheme'
	],
	timeline: [
		'Timeline',
		'TimelineItem',
		'TimelineItemPayload',
		'TimelineOrientation',
		'TimelinePlacement',
		'TimelineProps',
		'TimelineSide',
		'TimelineTheme',
		'TimelineThemeProps',
		'TimelineVariant',
		'setTimelineTheme',
		'timelineTheme',
		'useTimelineTheme'
	],
	tree: [
		'FileTree',
		'FileTreeCompositionOptions',
		'FileTreeDensity',
		'FileTreeDragAndDropConfig',
		'FileTreeIcons',
		'FileTreeMutationEvent',
		'FileTreePreparedInput',
		'FileTreeRenamingConfig',
		'FileTreeRowDecorationRenderer',
		'FileTreeSearchBlurBehavior',
		'FileTreeSearchMode',
		'FileTreeSortComparator',
		'GitStatusEntry',
		'Tree',
		'TreeContextMenuSnippetData',
		'TreeContextMenuSurface',
		'TreeEventProps',
		'TreeInput',
		'TreeOptionProps',
		'TreeOptions',
		'TreeProps',
		'TreeSnippetProps',
		'TreeTheme',
		'TreeThemeProps',
		'TreeTuningProps',
		'createTreeOptions',
		'prepareFileTreeInput',
		'preparePresortedFileTreeInput',
		'setTreeTheme',
		'treeDescription',
		'treeTheme',
		'useTreeTheme'
	],
	alert: [
		'Alert',
		'AlertProps',
		'AlertTheme',
		'AlertThemeProps',
		'AlertVariant',
		'alertTheme',
		'setAlertTheme',
		'useAlertTheme'
	],
	confirmation: ['Confirmation', 'ConfirmationProps', 'confirmation'],
	empty: [
		'Empty',
		'EmptyAction',
		'EmptyMediaVariant',
		'EmptyMode',
		'EmptyProps',
		'EmptyTheme',
		'EmptyThemeProps',
		'emptyTheme',
		'setEmptyTheme',
		'useEmptyTheme'
	],
	meter: [
		'Meter',
		'MeterProps',
		'MeterStep',
		'MeterTheme',
		'MeterThemeProps',
		'meterTheme',
		'setMeterTheme',
		'useMeterTheme'
	],
	'network-indicator': [
		'NetworkIndicator',
		'NetworkIndicatorProps',
		'NetworkIndicatorTheme',
		'NetworkIndicatorThemeProps',
		'NetworkIndicatorVariant',
		'hideNetworkIndicator',
		'networkIndicatorTheme',
		'setNetworkIndicatorTheme',
		'showNetworkIndicator',
		'toggleNetworkIndicator',
		'useNetworkIndicatorTheme'
	],
	'progress-circle': [
		'ProgressCircle',
		'ProgressCircleProps',
		'ProgressCircleSize',
		'ProgressCircleTheme',
		'ProgressCircleThemeProps',
		'progressCircleTheme',
		'setProgressCircleTheme',
		'useProgressCircleTheme'
	],
	skeleton: [
		'Skeleton',
		'SkeletonProps',
		'SkeletonTheme',
		'SkeletonThemeProps',
		'setSkeletonTheme',
		'skeletonTheme',
		'useSkeletonTheme'
	],
	spinner: [
		'Spinner',
		'SpinnerProps',
		'SpinnerTheme',
		'SpinnerThemeProps',
		'SpinnerVariant',
		'setSpinnerTheme',
		'spinnerTheme',
		'useSpinnerTheme'
	],
	'spinner-text': [
		'SpinnerText',
		'SpinnerTextProps',
		'SpinnerTextSpinnerPayload',
		'SpinnerTextTheme',
		'SpinnerTextThemeProps',
		'SpinnerTextTransition',
		'setSpinnerTextTheme',
		'spinnerTextTheme',
		'useSpinnerTextTheme'
	],
	toast: [
		'Toast',
		'ToastProps',
		'ToastTheme',
		'ToastThemeProps',
		'Toaster',
		'ToasterProps',
		'setToastTheme',
		'toast',
		'useToastTheme'
	],
	accordion: [
		'Accordion',
		'AccordionProps',
		'AccordionTheme',
		'AccordionThemeProps',
		'ConditionalKeys',
		'accordionTheme',
		'setAccordionTheme',
		'useAccordionTheme'
	],
	collapsible: [
		'Collapsible',
		'CollapsibleProps',
		'CollapsibleTheme',
		'CollapsibleThemeProps',
		'collapsibleTheme',
		'setCollapsibleTheme',
		'useCollapsibleTheme'
	],
	breadcrumbs: [
		'BreadcrumbItem',
		'BreadcrumbItemConfig',
		'Breadcrumbs',
		'BreadcrumbsProps',
		'BreadcrumbsTheme',
		'BreadcrumbsThemeProps',
		'breadcrumbsTheme',
		'setBreadcrumbsTheme',
		'useBreadcrumbsTheme'
	],
	command: [
		'Command',
		'CommandGroup',
		'CommandItem',
		'CommandProps',
		'CommandSlotPayload',
		'CommandState',
		'CommandTheme',
		'CommandThemeProps',
		'commandTheme',
		'setCommandTheme',
		'useCommandTheme'
	],
	pagination: [
		'Pagination',
		'PaginationControlType',
		'PaginationControlVariant',
		'PaginationGap',
		'PaginationItem',
		'PaginationItemAriaLabel',
		'PaginationPageItemPayload',
		'PaginationProps',
		'PaginationState',
		'PaginationSummaryPayload',
		'PaginationTheme',
		'PaginationThemeProps',
		'PaginationVariant',
		'paginationTheme',
		'setPaginationTheme',
		'usePaginationTheme'
	],
	stepper: [
		'Stepper',
		'StepperPanelAriaLabel',
		'StepperPanelAriaLabelledby',
		'StepperProps',
		'StepperRenderPayload',
		'StepperState',
		'StepperTheme',
		'StepperThemeProps',
		'StepperValueChangePayload',
		'setStepperTheme',
		'stepperTheme',
		'useStepperTheme'
	],
	tabbar: [
		'TabAlignment',
		'TabItem',
		'TabOrientation',
		'Tabbar',
		'TabbarPosition',
		'TabbarProps',
		'TabbarTheme',
		'TabbarThemeProps',
		'setTabbarTheme',
		'tabbarTheme',
		'useTabbarTheme'
	],
	'table-of-contents': [
		'TableOfContents',
		'TableOfContentsActivationThresholds',
		'TableOfContentsDensity',
		'TableOfContentsItem',
		'TableOfContentsLevel',
		'TableOfContentsMarkerVisibility',
		'TableOfContentsProps',
		'TableOfContentsTarget',
		'TableOfContentsTheme',
		'TableOfContentsThemeProps',
		'setTableOfContentsTheme',
		'tableOfContentsTheme',
		'useTableOfContentsTheme'
	],
	tabs: [
		'Tabs',
		'TabsPlacement',
		'TabsProps',
		'TabsRenderPayload',
		'TabsTheme',
		'TabsThemeProps',
		'setTabsTheme',
		'tabsTheme',
		'useTabsTheme'
	],
	'context-menu': ['ContextMenu', 'ContextMenuProps'],
	menu: [
		'Menu',
		'MenuItem',
		'MenuProps',
		'MenuSubmenuMode',
		'MenuTheme',
		'MenuThemeProps',
		'menuTheme',
		'setMenuTheme',
		'useMenuTheme'
	],
	'menu-bar': [
		'MenuBar',
		'MenuBarMenu',
		'MenuBarProps',
		'MenuBarTheme',
		'MenuBarThemeProps',
		'menuBarTheme',
		'setMenuBarTheme',
		'useMenuBarTheme'
	],
	'menu-option': [
		'MenuOption',
		'MenuOptionProps',
		'MenuOptionTheme',
		'MenuOptionThemeProps',
		'menuOptionTheme',
		'setMenuOptionTheme',
		'useMenuOptionTheme'
	],
	'popup-menu': ['MenuItem', 'PopupMenu', 'PopupMenuProps'],
	dialog: [
		'Dialog',
		'DialogProps',
		'DialogTheme',
		'DialogThemeProps',
		'DialogType',
		'dialogTheme',
		'setDialogTheme',
		'useDialogTheme'
	],
	'floating-window': [
		'FloatingWindow',
		'FloatingWindowDimensionTuple',
		'FloatingWindowDimensions',
		'FloatingWindowDockPlacement',
		'FloatingWindowDragFrom',
		'FloatingWindowMovePayload',
		'FloatingWindowPayload',
		'FloatingWindowPosition',
		'FloatingWindowProps',
		'FloatingWindowResizeDirection',
		'FloatingWindowResizePayload',
		'FloatingWindowTheme',
		'FloatingWindowThemeProps',
		'floatingWindowDescription',
		'floatingWindowTheme',
		'setFloatingWindowTheme',
		'useFloatingWindowTheme'
	],
	'hover-card': [
		'HoverCard',
		'HoverCardPayload',
		'HoverCardProps',
		'HoverCardTheme',
		'HoverCardThemeProps',
		'HoverCardTrigger',
		'hoverCardTheme',
		'setHoverCardTheme',
		'useHoverCardTheme'
	],
	'link-preview': [
		'LinkPreview',
		'LinkPreviewCardVariant',
		'LinkPreviewFetch',
		'LinkPreviewHoverCardPayload',
		'LinkPreviewMetadata',
		'LinkPreviewMetadataEndpoint',
		'LinkPreviewPayload',
		'LinkPreviewPosition',
		'LinkPreviewProps',
		'LinkPreviewStatus',
		'LinkPreviewTheme',
		'LinkPreviewThemeProps',
		'LinkPreviewTransition',
		'LinkPreviewTransitionParams',
		'linkPreviewTheme',
		'setLinkPreviewTheme',
		'useLinkPreviewTheme'
	],
	overlay: [
		'Overlay',
		'OverlayAction',
		'OverlayAlign',
		'OverlayPosition',
		'OverlayProps',
		'OverlayShowOn',
		'OverlayTheme',
		'OverlayThemeProps',
		'overlayTheme',
		'setOverlayTheme',
		'useOverlayTheme'
	],
	popover: [
		'Popover',
		'PopoverProps',
		'PopoverTheme',
		'PopoverThemeProps',
		'popoverTheme',
		'setPopoverTheme',
		'usePopoverContext',
		'usePopoverTheme'
	],
	tooltip: [
		'Tooltip',
		'TooltipProps',
		'TooltipTheme',
		'TooltipThemeProps',
		'setTooltipTheme',
		'tooltip',
		'tooltipTheme',
		'useTooltipTheme'
	],
	'audio-player': [
		'AUDIO_PLAYER_DEFAULT_CONTROLS',
		'AudioPlayer',
		'AudioPlayerControl',
		'AudioPlayerCrossOrigin',
		'AudioPlayerError',
		'AudioPlayerErrorPayload',
		'AudioPlayerLayout',
		'AudioPlayerPreload',
		'AudioPlayerProps',
		'AudioPlayerSnapshot',
		'AudioPlayerSource',
		'AudioPlayerState',
		'AudioPlayerStateMode',
		'AudioPlayerTheme',
		'AudioPlayerThemeProps',
		'AudioPlayerTimeVariant',
		'AudioPlayerVariant',
		'AudioPlayerWaveformVariant',
		'audioPlayerDescription',
		'audioPlayerTheme',
		'setAudioPlayerTheme',
		'useAudioPlayerTheme'
	],
	carousel: [
		'Carousel',
		'CarouselProps',
		'CarouselRenderPayload',
		'CarouselState',
		'CarouselTheme',
		'CarouselThemeProps',
		'carouselTheme',
		'setCarouselTheme',
		'useCarouselTheme'
	],
	'image-gallery': [
		'ImageGallery',
		'ImageGalleryCaption',
		'ImageGalleryImage',
		'ImageGalleryIndexChangePayload',
		'ImageGalleryPayload',
		'ImageGalleryProps',
		'ImageGalleryTheme',
		'ImageGalleryThemeProps',
		'imageGalleryTheme',
		'setImageGalleryTheme',
		'useImageGalleryTheme'
	],
	'image-zoom': [
		'ImageZoom',
		'ImageZoomCaption',
		'ImageZoomIndicator',
		'ImageZoomIndicatorPosition',
		'ImageZoomPayload',
		'ImageZoomProps',
		'ImageZoomTheme',
		'ImageZoomThemeProps',
		'imageZoomTheme',
		'setImageZoomTheme',
		'useImageZoomTheme'
	],
	'media-volume': [
		'MediaVolumeControl',
		'MediaVolumeControlButtonPayload',
		'MediaVolumeControlMode',
		'MediaVolumeControlOrientation',
		'MediaVolumeControlProps',
		'MediaVolumeControlTheme',
		'MediaVolumeControlThemeProps',
		'MediaVolumeControlTriggerPayload',
		'MediaVolumeSnapshot',
		'MediaVolumeToggleOptions',
		'clampMediaVolume',
		'isMediaEffectivelyMuted',
		'mediaVolume',
		'mediaVolumeControlTheme',
		'setMediaVolumeControlTheme',
		'useMediaVolumeControlTheme'
	],
	'document-viewer': [
		'DocumentFitMode',
		'DocumentFormat',
		'DocumentOrientation',
		'DocumentSearchMatch',
		'DocumentSource',
		'DocumentToolbarPosition',
		'DocumentUnit',
		'DocumentViewMode',
		'DocumentViewer',
		'DocumentViewerAssets',
		'DocumentViewerAssetsOverride',
		'DocumentViewerCapabilities',
		'DocumentViewerControl',
		'DocumentViewerProps',
		'DocumentViewerState',
		'DocumentViewerTheme',
		'DocumentViewerThemeProps',
		'documentViewerAssets',
		'documentViewerTheme',
		'setDocumentViewerTheme',
		'useDocumentViewerTheme'
	],
	'video-player': [
		'VIDEO_PLAYER_DEFAULT_CONTROLS',
		'VIDEO_PLAYER_DEFAULT_PLAYBACK_RATES',
		'VideoPlayer',
		'VideoPlayerControl',
		'VideoPlayerCrossOrigin',
		'VideoPlayerError',
		'VideoPlayerErrorPayload',
		'VideoPlayerFullscreenState',
		'VideoPlayerOverlayPayload',
		'VideoPlayerPreload',
		'VideoPlayerProps',
		'VideoPlayerSnapshot',
		'VideoPlayerSource',
		'VideoPlayerState',
		'VideoPlayerStateMode',
		'VideoPlayerTheme',
		'VideoPlayerThemeProps',
		'VideoPlayerTimeVariant',
		'VideoPlayerTrack',
		'VideoPlayerTrackKind',
		'setVideoPlayerTheme',
		'useVideoPlayerTheme',
		'videoPlayerDescription',
		'videoPlayerTheme'
	],
	code: [
		'Code',
		'CodeHeaderPayload',
		'CodeLanguageInfo',
		'CodeProps',
		'CodeTheme',
		'CodeThemeProps',
		'bundledCodeLanguagesInfo',
		'codeTheme',
		'codeToHtml',
		'getLanguageLabel',
		'resolveLanguage',
		'setCodeTheme',
		'useCodeTheme'
	],
	diff: [
		'Diff',
		'DiffFiles',
		'DiffInput',
		'DiffLineAnnotation',
		'DiffOptionProps',
		'DiffProps',
		'DiffRenderItem',
		'DiffRenderState',
		'DiffTheme',
		'DiffThemeProps',
		'FileContents',
		'FileDiffOptions',
		'SelectedLineRange',
		'createDiffOptions',
		'createDiffRenderItems',
		'diffTheme',
		'registerDiffSyntaxTheme',
		'setDiffTheme',
		'useDiffTheme'
	],
	globe: [
		'Globe',
		'GlobeColor',
		'GlobeMarker',
		'GlobeProps',
		'GlobeScrollTo',
		'GlobeTheme',
		'GlobeThemeProps',
		'globeTheme',
		'setGlobeTheme',
		'useGlobeTheme'
	],
	map: [
		'Map',
		'MapBounds',
		'MapCircleShape',
		'MapClusterConfig',
		'MapClusterSnippetArg',
		'MapControlAction',
		'MapControlButtonSnippetArg',
		'MapControlPosition',
		'MapGeolocationConfig',
		'MapMarker',
		'MapMarkerPopupContentArg',
		'MapMarkerSnippetArg',
		'MapMarkerTooltipContentArg',
		'MapPolygonShape',
		'MapPolylineShape',
		'MapProps',
		'MapRectangleShape',
		'MapShape',
		'MapStyleOverrides',
		'MapStyleTheme',
		'MapTheme',
		'MapThemeProps',
		'MapUserLocation',
		'MapUserLocationSnippetArg',
		'MapViewChangeArg',
		'mapDescription',
		'mapTheme',
		'setMapTheme',
		'useMapTheme'
	],
	markdown: [
		'Markdown',
		'MarkdownProps',
		'MarkdownSize',
		'MarkdownTheme',
		'MarkdownThemeProps',
		'buildStreamdownTheme',
		'markdownCodeSizes',
		'markdownDescription',
		'markdownMermaidSizes',
		'markdownTheme',
		'setMarkdownTheme',
		'useMarkdownTheme'
	],
	marquee: [
		'Marquee',
		'MarqueeProps',
		'MarqueeTheme',
		'MarqueeThemeProps',
		'marqueeTheme',
		'setMarqueeTheme',
		'useMarqueeTheme'
	],
	mermaid: [
		'Mermaid',
		'MermaidConfig',
		'MermaidControls',
		'MermaidModule',
		'MermaidProps',
		'MermaidState',
		'MermaidTheme',
		'MermaidThemeProps',
		'mermaidTheme',
		'sanitizeMermaidCode',
		'setMermaidTheme',
		'useMermaidTheme'
	],
	'qr-code': [
		'BackgroundSettings',
		'DataModulesSettings',
		'DataModulesStyle',
		'DownloadFileFormat',
		'DownloadOptions',
		'ErrorCorrectionLevel',
		'FinderPatternInnerSettings',
		'FinderPatternInnerStyle',
		'FinderPatternOuterSettings',
		'FinderPatternOuterStyle',
		'GradientSettings',
		'GradientSettingsStop',
		'GradientSettingsType',
		'ImageSettings',
		'QRCode',
		'QRCodeProps',
		'QRCodeTheme',
		'QRCodeThemeProps',
		'qrCodeTheme',
		'setQRCodeTheme',
		'useQRCodeTheme'
	],
	hitbox: [
		'Hitbox',
		'HitboxProps',
		'HitboxTheme',
		'HitboxThemeProps',
		'hitboxTheme',
		'setHitboxTheme',
		'useHitboxTheme'
	],
	slot: ['Slot', 'SlotContent', 'slotDescription'],
	theme: [
		'Theme',
		'ThemeDesignTokenMap',
		'ThemeDesignTokens',
		'ThemeProps',
		'ThemeRadius',
		'ThemeSpacing',
		'ThemeSpacingScale',
		'ThemeSpacingStep',
		'ThemeState',
		'ThemeTransition',
		'TypeScaleOptions',
		'TypeScalePreset',
		'TypeScaleRatio',
		'defaultThemeSpacingScale',
		'themeTransitions',
		'typeScalePresets'
	],
	i18n: [
		'I18n',
		'I18nInput',
		'LocaleCode',
		'LocaleMeta',
		'Messages',
		'en',
		'localeList',
		'locales',
		'setI18n',
		'useI18n'
	],
	'tailwind-plugin': ['default'],
	types: [
		'ColorKeys',
		'ColorPath',
		'Colors',
		'Density',
		'DesignSystem',
		'Easing',
		'FontSize',
		'Sizes',
		'Styles',
		'Theme',
		'ThemeFunction',
		'ThemePaths',
		'Themes',
		'deepMerge'
	],
	cva: [
		'ClassArray',
		'ClassDictionary',
		'ClassValue',
		'ComponentVariant',
		'InferComponentTheme',
		'VariantProps',
		'compose',
		'cva',
		'cx',
		'setComponentTheme',
		'useComponentTheme'
	],
	scheduling: [
		'SchedulingInterval',
		'SchedulingLaneInterval',
		'SchedulingLaneLayout',
		'SchedulingLanePlacement',
		'SchedulingOverlapLayout',
		'SchedulingOverlapPlacement',
		'packSchedulingLanes',
		'packSchedulingOverlaps'
	],
	icons: {
		pattern: [
			'{name}Icon',
			'{name}IconBold',
			'{name}IconDuotone',
			'{name}IconFill',
			'{name}IconLight',
			'{name}IconThin'
		],
		modules: {
			agent: ['agent'],
			bookOpenUser: ['bookOpenUserIcon'],
			'icons.mcp': ['iconsDescription'],
			'index.svelte': ['icon']
		}
	},
	'spinner-overlay': [
		'SpinnerOverlayOptions',
		'setSpinnerOverlayTheme',
		'spinnerOverlay',
		'useSpinnerOverlayTheme'
	],
	'ai-mcp-app-sandbox': ['CreateAIMcpSandboxResponseOptions', 'createAIMcpSandboxResponse']
};

export const componentContract: ComponentContractEntry[] = entries.map((entry) => ({
	...entry,
	exportedSymbols: exportedSymbols[entry.id]
}));
