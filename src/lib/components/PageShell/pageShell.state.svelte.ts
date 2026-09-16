import { getContext, onDestroy, setContext } from 'svelte';
import type {
	PageShellApi,
	PageShellActions,
	PageShellBack,
	PageShellBreadcrumbs,
	PageShellConfig,
	PageShellRegion,
	PageShellTextRegion
} from './pageShell.props.js';

const PAGE_SHELL_CONTEXT = Symbol('page-shell');

type PageShellStateOptions = Readonly<PageShellConfig> & {
	readonly isContentScrolled?: boolean;
};

export class PageShellState {
	private overrides = $state<PageShellConfig[]>([]);

	readonly api: PageShellApi;

	constructor(private options: PageShellStateOptions) {
		// Arrow accessors keep the instance in scope for the `api` getters below, whose own
		// `this` is the api object rather than the shell.
		const current = () => this.current;
		const isContentScrolled = () => this.options.isContentScrolled ?? false;
		const hasHeader = () => this.hasHeader;
		const hasFooter = () => this.hasFooter;

		this.api = {
			get title() {
				return current().title;
			},
			get subtitle() {
				return current().subtitle;
			},
			get header() {
				return current().header;
			},
			get headerActions() {
				return current().headerActions;
			},
			get footer() {
				return current().footer;
			},
			get footerActions() {
				return current().footerActions;
			},
			get eyebrow() {
				return current().eyebrow;
			},
			get breadcrumbs() {
				return current().breadcrumbs;
			},
			get breadcrumbsMaxItems() {
				return current().breadcrumbsMaxItems;
			},
			get back() {
				return current().back;
			},
			get contentPadding() {
				return current().contentPadding;
			},
			get contentWidth() {
				return current().contentWidth;
			},
			get actionOverflow() {
				return current().actionOverflow;
			},
			get mobileActionCount() {
				return current().mobileActionCount;
			},
			get isContentScrolled() {
				return isContentScrolled();
			},
			get hasHeader() {
				return hasHeader();
			},
			get hasFooter() {
				return hasFooter();
			},
			set: this.set,
			setEyebrow: this.setEyebrow,
			setBreadcrumbs: this.setBreadcrumbs,
			setBack: this.setBack,
			setTitle: this.setTitle,
			setSubtitle: this.setSubtitle,
			setHeader: this.setHeader,
			setHeaderActions: this.setHeaderActions,
			setFooter: this.setFooter,
			setFooterActions: this.setFooterActions,
			reset: this.reset
		};

		setContext(PAGE_SHELL_CONTEXT, this);
	}

	get current(): PageShellConfig {
		return Object.assign(
			{
				eyebrow: this.options.eyebrow,
				breadcrumbs: this.options.breadcrumbs,
				breadcrumbsMaxItems: this.options.breadcrumbsMaxItems,
				back: this.options.back,
				title: this.options.title,
				subtitle: this.options.subtitle,
				header: this.options.header,
				headerActions: this.options.headerActions,
				footer: this.options.footer,
				footerActions: this.options.footerActions,
				contentPadding: this.options.contentPadding,
				contentWidth: this.options.contentWidth,
				actionOverflow: this.options.actionOverflow,
				mobileActionCount: this.options.mobileActionCount
			},
			...this.overrides
		);
	}

	get hasHeader() {
		const current = this.current;
		return Boolean(
			current.header ||
			current.back ||
			current.breadcrumbs ||
			current.eyebrow ||
			current.title ||
			current.subtitle ||
			current.headerActions
		);
	}

	get hasFooter() {
		const current = this.current;
		return Boolean(current.footer || current.footerActions);
	}

	set = (config: PageShellConfig) => {
		this.overrides = [...this.overrides, config];
		let isActive = true;

		return () => {
			if (!isActive) return;
			isActive = false;
			this.overrides = this.overrides.filter((override) => override !== config);
		};
	};

	setEyebrow = (eyebrow?: PageShellTextRegion) => this.set({ eyebrow });
	setBreadcrumbs = (breadcrumbs?: PageShellBreadcrumbs) => this.set({ breadcrumbs });
	setBack = (back?: PageShellBack) => this.set({ back });
	setTitle = (title?: PageShellTextRegion) => this.set({ title });
	setSubtitle = (subtitle?: PageShellTextRegion) => this.set({ subtitle });
	setHeader = (header?: PageShellRegion) => this.set({ header });
	setHeaderActions = (headerActions?: PageShellActions) => this.set({ headerActions });
	setFooter = (footer?: PageShellRegion) => this.set({ footer });
	setFooterActions = (footerActions?: PageShellActions) => this.set({ footerActions });

	reset = () => {
		this.overrides = [];
	};
}

export function usePageShell() {
	const shell = getContext<PageShellState | undefined>(PAGE_SHELL_CONTEXT);
	if (!shell) {
		throw new Error('usePageShell must be called inside a PageShell.');
	}
	return shell.api;
}

export function setPageShell(config: PageShellConfig) {
	const shell = usePageShell();
	onDestroy(shell.set(config));
	return shell;
}
