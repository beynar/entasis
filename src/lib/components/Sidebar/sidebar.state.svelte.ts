import { MediaQuery } from 'svelte/reactivity';
import type {
	SidebarApi,
	SidebarCollapsible,
	SidebarDisplayState,
	SidebarMode,
	SidebarSide,
	SidebarState
} from './sidebar.props.js';

type SidebarStateOptions = {
	readonly mode: SidebarMode;
	readonly keyboardShortcut: string | false;
	readonly displayState: SidebarDisplayState;
	readonly side: SidebarSide;
	readonly collapsible: SidebarCollapsible;
	readonly peeking: boolean;
	setDisplayState: (state: SidebarDisplayState) => void;
};

function isEditableTarget(target: EventTarget | null) {
	if (!(target instanceof HTMLElement)) return false;
	const tagName = target.tagName.toLowerCase();

	return (
		target.isContentEditable ||
		tagName === 'input' ||
		tagName === 'textarea' ||
		tagName === 'select' ||
		!!target.closest('[contenteditable="true"]')
	);
}

/** Live view of the controller, built outside the class so the getters close over a parameter instead of aliasing `this`. */
function createSidebarApi(controller: SidebarStateController): SidebarApi {
	return {
		get open() {
			return controller.open;
		},
		get state() {
			return controller.state;
		},
		get displayState() {
			return controller.displayState;
		},
		get isMobile() {
			return controller.isMobile;
		},
		get openMobile() {
			return controller.openMobile;
		},
		get collapsible() {
			return controller.collapsible;
		},
		get isPeeking() {
			return controller.isPeeking;
		},
		get side() {
			return controller.side;
		},
		toggle: () => controller.toggle(),
		setOpen: (open) => controller.setOpen(open),
		setDisplayState: (state) => controller.setDisplayState(state),
		setOpenMobile: (open) => controller.setOpenMobile(open)
	};
}

export class SidebarStateController {
	private mobileQuery = new MediaQuery('(max-width: 767px)');
	openMobile = $state(false);
	api: SidebarApi;

	constructor(private options: SidebarStateOptions) {
		this.api = createSidebarApi(this);

		$effect(() => {
			const shortcut = this.options.keyboardShortcut;
			if (this.options.mode === 'panel' || shortcut === false) return;

			const onKeydown = (event: KeyboardEvent) => {
				if (event.defaultPrevented || isEditableTarget(event.target)) return;
				if (event.key.toLowerCase() !== shortcut.toLowerCase()) return;
				if (!event.metaKey && !event.ctrlKey) return;

				event.preventDefault();
				this.toggle();
			};

			window.addEventListener('keydown', onKeydown);
			return () => window.removeEventListener('keydown', onKeydown);
		});
	}

	get open(): boolean {
		return this.displayState === 'expanded';
	}

	get state(): SidebarState {
		return this.displayState;
	}

	get displayState(): SidebarDisplayState {
		if (this.collapsible === 'none') return 'expanded';
		return this.options.displayState;
	}

	get collapsibleState(): SidebarCollapsible | '' {
		if (this.displayState === 'collapsed') return 'icon';
		if (this.displayState === 'hidden') return 'offcanvas';
		return '';
	}

	get isMobile(): boolean {
		return this.mobileQuery.current;
	}

	get side(): SidebarSide {
		return this.options.side;
	}

	get collapsible(): SidebarCollapsible {
		return this.options.collapsible;
	}

	/**
	 * A hover peek renders the collapsed panel at full width without touching the persisted
	 * collapsed state, so `displayState` stays `'collapsed'` and this reports the rendered
	 * width instead: everything that hides content in icon mode reads it.
	 */
	get isPeeking(): boolean {
		return this.options.peeking && !this.isMobile;
	}

	setOpen = (open: boolean) => {
		this.setDisplayState(open ? 'expanded' : this.defaultCollapsedState);
	};

	setDisplayState = (state: SidebarDisplayState) => {
		const nextState = this.collapsible === 'none' ? 'expanded' : state;
		this.options.setDisplayState(nextState);
	};

	setOpenMobile = (open: boolean) => {
		this.openMobile = open;
	};

	toggle = () => {
		if (this.isMobile) {
			this.openMobile = !this.openMobile;
			return;
		}
		this.setDisplayState(
			this.displayState === 'expanded' ? this.defaultCollapsedState : 'expanded'
		);
	};

	private get defaultCollapsedState(): SidebarDisplayState {
		return this.collapsible === 'offcanvas' ? 'hidden' : 'collapsed';
	}
}
