import type { Snippet } from 'svelte';
import type { HTMLAttributes } from 'svelte/elements';
import type {
	PageShellActionOverflow,
	PageShellAction,
	PageShellApi,
	PageShellContentPadding,
	PageShellContentWidth,
	PageShellMobileActionCount,
	PageShellTextRegion
} from '$lib/components/PageShell/index.js';
import type { BreadcrumbItem } from '$lib/components/Breadcrumbs/index.js';
import type { PageShellThemeProps } from '$lib/components/PageShell/pageShell.theme.js';
import type { SidebarApi, SidebarProps, SidebarVariant } from '$lib/components/Sidebar/index.js';
import type { WithAttachments } from '$lib/types/props.js';
import type { AppShellThemeProps } from './appShell.theme.js';

export type AppShellSidebarProps = Omit<SidebarProps, 'children' | 'mode' | 'frame' | 'variant'>;

export type AppShellApi = {
	/** Page shell API for title, header, footer, and scoped overrides. */
	pageShell: PageShellApi;
	/** Sidebar API for responsive open state and toggle control. */
	sidebar: SidebarApi;
};

export type AppShellRegion = Snippet<[AppShellApi]>;
export type AppShellActions = AppShellRegion | PageShellAction[];
export type AppShellBack = AppShellRegion | PageShellAction;
export type AppShellBreadcrumbs = AppShellRegion | BreadcrumbItem[];

export type AppShellConfig = {
	/**
	 * Shared Sidebar geometry and PageShell chrome treatment. `framed` draws one rounded app card on
	 * the canvas around the sidebar and the page; the Sidebar's own `framed` variant paints its well
	 * as an inset of that card.
	 */
	variant?: SidebarVariant;
	/** Small metadata above the PageShell title. Ignored when breadcrumbs are provided. */
	eyebrow?: PageShellTextRegion;
	/** Breadcrumb items or a custom breadcrumb snippet rendered above the PageShell title. */
	breadcrumbs?: AppShellBreadcrumbs;
	/** Maximum breadcrumb items before collapsing into an overflow menu. */
	breadcrumbsMaxItems?: number;
	/** Back affordance rendered before breadcrumbs or eyebrow. */
	back?: AppShellBack;
	/** Accessible name for the page's `main` landmark, forwarded to PageShell. */
	label?: string;
	/** Default PageShell title. */
	title?: PageShellTextRegion;
	/** Default PageShell subtitle. */
	subtitle?: PageShellTextRegion;
	/** Custom PageShell header with access to both shell APIs. */
	header?: AppShellRegion;
	/** Default PageShell header actions with access to both shell APIs. */
	headerActions?: AppShellActions;
	/** PageShell footer with access to both shell APIs. */
	footer?: AppShellRegion;
	/** PageShell footer actions. */
	footerActions?: AppShellActions;
	/** Padding applied to the PageShell content inner wrapper. */
	contentPadding?: PageShellContentPadding;
	/** Width preset applied to the PageShell content inner wrapper. */
	contentWidth?: PageShellContentWidth;
	/** Responsive overflow behavior for action arrays. */
	actionOverflow?: PageShellActionOverflow;
	/** Number of action-array buttons to keep inline on mobile when overflow is auto. */
	mobileActionCount?: PageShellMobileActionCount;
};

type AppShellRootAttributes = Partial<Pick<HTMLAttributes<HTMLDivElement>, 'id' | 'style'>> & {
	[dataAttribute: `data-${string}`]: string | number | boolean | null | undefined;
};

export type AppShellProps = WithAttachments<
	AppShellRootAttributes &
		AppShellConfig & {
			/** Bindable reference to the root app shell wrapper. */
			ref?: HTMLElement | null;
			/** Sidebar content and behavior props; AppShell forwards its variant and owns the frame. */
			sidebar?: AppShellSidebarProps;
			/** Main page content. Receives both PageShell and Sidebar APIs. */
			children: Snippet<[AppShellApi]>;
			/** Classes applied to the root app shell wrapper. */
			class?: string;
			/** Per-instance PageShell theme overrides. */
			pageShellTheme?: PageShellThemeProps;
			/** Per-instance AppShell theme overrides. */
			theme?: AppShellThemeProps;
		}
>;
