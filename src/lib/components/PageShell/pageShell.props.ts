import type { Snippet } from 'svelte';
import type { HTMLAttributes } from 'svelte/elements';
import type { ButtonProps } from '$lib/components/Button/index.js';
import type { BreadcrumbItem } from '$lib/components/Breadcrumbs/index.js';
import type { Slot } from '$lib/components/Slot/slot.js';
import type { WithAttachments } from '$lib/types/props.js';
import type { PageShellThemeProps } from './pageShell.theme.js';

export type PageShellRegion = Snippet<[PageShellApi]>;
export type PageShellTextRegion = Slot<PageShellApi>;
/** A button rendered in the header actions row — Button props plus its label as `content`. */
export type PageShellAction = ButtonProps & { content?: string };
export type PageShellActions = Snippet<[PageShellApi]> | PageShellAction[];
export type PageShellBack = PageShellAction | PageShellRegion;
export type PageShellBreadcrumbs = BreadcrumbItem[] | PageShellRegion;
export type PageShellContentPadding = 'none' | 'small' | 'normal' | 'large';
export type PageShellContentWidth = 'full' | 'narrow' | 'normal' | 'wide' | 'prose';
export type PageShellActionOverflow = 'auto' | 'never';
export type PageShellMobileActionCount = 0 | 1 | 2;
export type PageShellRegistrationCleanup = () => void;

export type PageShellConfig = {
	/** Small metadata above the title. Ignored when breadcrumbs are provided. */
	eyebrow?: Slot<PageShellApi>;
	/** Breadcrumb items or a custom breadcrumb snippet rendered above the title. */
	breadcrumbs?: PageShellBreadcrumbs;
	/** Maximum breadcrumb items before collapsing into an overflow menu. */
	breadcrumbsMaxItems?: number;
	/** Back affordance rendered before breadcrumbs or eyebrow. */
	back?: PageShellBack;
	/** Default title, or route-level title override. */
	title?: Slot<PageShellApi>;
	/** Default subtitle, or route-level subtitle override. */
	subtitle?: Slot<PageShellApi>;
	/** Custom header content. Replaces the default title/actions layout inside the sticky header. */
	header?: Snippet<[PageShellApi]>;
	/** Actions rendered on the right side of the default sticky header. */
	headerActions?: PageShellActions;
	/** Custom sticky footer content. */
	footer?: Snippet<[PageShellApi]>;
	/** Actions rendered on the right side of the sticky footer. */
	footerActions?: PageShellActions;
	/** Padding applied to the content inner wrapper. */
	contentPadding?: PageShellContentPadding;
	/** Width preset applied to the content inner wrapper. */
	contentWidth?: PageShellContentWidth;
	/** Responsive overflow behavior for action arrays. */
	actionOverflow?: PageShellActionOverflow;
	/** Number of action-array buttons to keep inline on mobile when overflow is auto. */
	mobileActionCount?: PageShellMobileActionCount;
};

export type PageShellApi = Readonly<PageShellConfig> & {
	/** Whether the page's nearest scroll container has moved past the top. */
	readonly isContentScrolled: boolean;
	/** Whether the resolved shell has header content. */
	readonly hasHeader: boolean;
	/** Whether the resolved shell has footer content. */
	readonly hasFooter: boolean;
	/** Push a scoped shell override. Call the returned cleanup to remove it. */
	set: (config: PageShellConfig) => PageShellRegistrationCleanup;
	/** Push scoped eyebrow content. */
	setEyebrow: (eyebrow?: PageShellTextRegion) => PageShellRegistrationCleanup;
	/** Push scoped breadcrumbs. */
	setBreadcrumbs: (breadcrumbs?: PageShellBreadcrumbs) => PageShellRegistrationCleanup;
	/** Push a scoped back affordance. */
	setBack: (back?: PageShellBack) => PageShellRegistrationCleanup;
	/** Push a scoped title override. */
	setTitle: (title?: PageShellTextRegion) => PageShellRegistrationCleanup;
	/** Push a scoped subtitle override. */
	setSubtitle: (subtitle?: PageShellTextRegion) => PageShellRegistrationCleanup;
	/** Push scoped custom header content. */
	setHeader: (header?: PageShellRegion) => PageShellRegistrationCleanup;
	/** Push scoped default-header actions. */
	setHeaderActions: (headerActions?: PageShellActions) => PageShellRegistrationCleanup;
	/** Push scoped page footer content. */
	setFooter: (footer?: PageShellRegion) => PageShellRegistrationCleanup;
	/** Push scoped page footer actions. */
	setFooterActions: (footerActions?: PageShellActions) => PageShellRegistrationCleanup;
	/** Remove all scoped overrides. */
	reset: () => void;
};

type PageShellRootAttributes = Partial<Pick<HTMLAttributes<HTMLDivElement>, 'id' | 'style'>> & {
	[dataAttribute: `data-${string}`]: string | number | boolean | null | undefined;
};

export type PageShellProps = WithAttachments<
	PageShellRootAttributes &
		PageShellConfig & {
			/** Bindable reference to the root shell. */
			ref?: HTMLElement | null;
			/** Classes applied to the root shell. */
			class?: string;
			/**
			 * Accessible name for the page's `main` landmark, so a screen reader's landmark list
			 * tells this region apart from another page's. Applied as `aria-label`.
			 */
			label?: string;
			/** Main page content. Receives the resolved shell API. */
			children: PageShellRegion;
			/** Per-instance theme overrides. */
			theme?: PageShellThemeProps;
		}
>;
