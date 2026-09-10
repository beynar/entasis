import type { Slot } from '$lib/components/Slot/slot.js';
import type { ResponsiveProps } from '$lib/components/Theme/theme.js';
import type { Easing } from '$lib/transitions/easingFunctions.js';
import type { WithAttachments } from '$lib/types/props.js';
import type { Colors, Sizes } from '$lib/types/theme.js';
import type { Placement } from '@floating-ui/dom';
import type { CardThemeProps } from '../Card/card.theme.js';
import type { HoverCardThemeProps } from '../HoverCard/hoverCard.theme.js';
import type { PopoverThemeProps } from '../Popover/popover.theme.js';
import type { LinkPreviewThemeProps } from './linkPreview.theme.js';

export type LinkPreviewStatus = 'idle' | 'loading' | 'loaded' | 'error';

export type LinkPreviewCardVariant = 'solid' | 'outline' | 'soft' | 'ghost';

export type LinkPreviewPosition = ResponsiveProps<Placement>;

export type LinkPreviewTransitionParams = {
	/** Transition delay in milliseconds. */
	delay?: number;
	/** Transition duration in milliseconds. */
	duration?: number;
	/** Transition easing token. */
	easing?: Easing;
	/** Horizontal fly offset. */
	x?: number | `${number}%`;
	/** Vertical fly offset. */
	y?: number | `${number}%`;
	/** Scale amount used during the transition. */
	scale?: number;
	/** Opacity amount used during the transition. */
	opacity?: number;
};

export type LinkPreviewTransition = ResponsiveProps<
	| LinkPreviewTransitionParams
	| {
			/** Transition settings used when opening. */
			in?: LinkPreviewTransitionParams;
			/** Transition settings used when closing. */
			out?: LinkPreviewTransitionParams;
	  }
>;

export type LinkPreviewHoverCardPayload = {
	/** Stable DOM id used by the underlying HoverCard surface. */
	id: string;
	/** Whether the underlying HoverCard is currently open. */
	isOpen: boolean;
	/** Opens the underlying HoverCard immediately. */
	open: () => void;
	/** Closes the underlying HoverCard immediately. */
	close: () => void;
	/** Toggles the underlying HoverCard immediately. */
	toggle: () => void;
};

export type LinkPreviewMetadata = {
	/** Canonical URL returned by the metadata endpoint. */
	url?: string;
	/** Main link title from Open Graph, Twitter cards, or the document title. */
	title?: string;
	/** Link description from Open Graph, Twitter cards, or meta description. */
	description?: string;
	/** Site or publisher name, usually from `og:site_name`. */
	siteName?: string;
	/** Preview image URL, usually from `og:image` or `twitter:image`. */
	image?: string;
	/** Favicon or touch icon URL discovered from link icon tags. */
	favicon?: string;
};

export type LinkPreviewFetch = (href: string, signal: AbortSignal) => Promise<LinkPreviewMetadata>;

export type LinkPreviewMetadataEndpoint = string | ((href: string) => string);

export type LinkPreviewPayload = {
	/** Link URL used by the trigger and metadata request. */
	href: string;
	/** Metadata currently available for the link, if loading succeeded or was provided. */
	metadata: LinkPreviewMetadata | null;
	/** Current metadata loading status. */
	status: LinkPreviewStatus;
	/** Last loading error message, when status is `error`. */
	error: string | null;
	/** Whether the underlying HoverCard is open. */
	isOpen: boolean;
	/** Reloads metadata through the configured fetcher or endpoint. */
	reload: () => Promise<void>;
	/** Underlying HoverCard payload for imperative open, close, and toggle controls. */
	hoverCard: LinkPreviewHoverCardPayload | null;
};

export type LinkPreviewProps = WithAttachments<{
	/** URL opened by the trigger link and requested by the metadata loader. */
	href: string;
	/** Stable DOM id for the underlying HoverCard; falls back to a generated id. */
	id?: string;
	/** Controls whether the preview card is open; bindable for two-way control. */
	open?: boolean;
	/** Initial open state when `open` is not provided. */
	defaultOpen?: boolean;
	/** Trigger content for the anchor; defaults to the link host. */
	children?: Slot<LinkPreviewPayload>;
	/** Preloaded metadata; when provided, the component skips network loading. */
	metadata?: LinkPreviewMetadata;
	/** Custom async metadata loader used instead of `metadataEndpoint`. */
	fetchMetadata?: LinkPreviewFetch;
	/** Endpoint used when `fetchMetadata` is not provided. Strings receive `?url=<href>`. */
	metadataEndpoint?: LinkPreviewMetadataEndpoint;
	/** When true, loads metadata on mount instead of waiting for the card to open. */
	prefetch?: boolean;
	/** Link target attribute forwarded to the trigger anchor. */
	target?: string;
	/** Link rel attribute forwarded to the trigger anchor. */
	rel?: string;
	/** Fallback title shown when metadata has no title. */
	fallbackTitle?: string;
	/** Accessible alt text for the preview image. */
	imageAlt?: string;
	/** When true, renders the resolved URL line below the description. */
	showUrl?: boolean;
	/** Label used for the skeleton loading region. */
	loadingLabel?: string;
	/** Heading shown when metadata loading fails. */
	errorLabel?: string;
	/** Preferred placement relative to the trigger. */
	position?: LinkPreviewPosition;
	/** Gap in pixels between the trigger and the card. */
	offset?: number;
	/** Opens after this many milliseconds on pointer enter or focus. */
	delay?: number;
	/** Closes after this many milliseconds on pointer leave or focus out. */
	closeDelay?: number;
	/** When true, focus entering the trigger or card opens it. */
	openOnFocus?: boolean;
	/** When true, clicking the trigger toggles the card before navigation. */
	openOnClick?: boolean;
	/** When true, pressing Escape closes the card. */
	closeOnEscape?: boolean;
	/** When true, clicking outside closes the card. */
	closeOnClickOutside?: boolean;
	/** When true, enter and exit transitions slide from the placement direction. */
	directedTransition?: boolean;
	/** Fly/scale opacity transition overrides passed to HoverCard. */
	transition?: LinkPreviewTransition;
	/** Visual size shared by the HoverCard panel and preview content. */
	size?: Sizes;
	/** When true, prevents opening and marks the trigger as disabled. */
	disabled?: boolean;
	/** Additional CSS classes merged onto the trigger anchor. */
	class?: string;
	/** Additional CSS classes merged onto the HoverCard surface. */
	cardClass?: string;
	/** Additional CSS classes merged onto the transparent Popover panel. */
	popoverClass?: string;
	/** Theme color token applied to the inner Card. */
	cardColor?: Colors;
	/** Visual variant applied to the inner Card. */
	cardVariant?: LinkPreviewCardVariant;
	/** Show subtle borders between Card sections. */
	showBorders?: boolean;
	/** Called once when the library requests an open-state change. */
	onOpenChange?: (open: boolean) => void;
	/** Callback after the open transition finishes. */
	onAfterOpen?: (payload: LinkPreviewPayload) => void;
	/** Callback after the close transition finishes. */
	onAfterClose?: (payload: LinkPreviewPayload) => void;
	/** Callback fired after metadata loads successfully. */
	onLoad?: (metadata: LinkPreviewMetadata) => void;
	/** Callback fired after metadata loading fails. */
	onError?: (error: Error) => void;
	/** Theme overrides for LinkPreview parts. */
	theme?: LinkPreviewThemeProps;
	/** Theme overrides for the HoverCard wrapper. */
	hoverCardTheme?: HoverCardThemeProps;
	/** Theme overrides for the inner Card. */
	cardTheme?: CardThemeProps;
	/** Theme overrides for the underlying Popover. */
	popoverTheme?: PopoverThemeProps;
}>;
