import type { SidebarCollapsible, SidebarDisplayState } from './sidebar.props.js';

type SidebarDisplayStateBridgeOptions = {
	readonly open: boolean;
	readonly displayState: SidebarDisplayState | undefined;
	readonly collapsible: SidebarCollapsible;
	setOpen: (open: boolean) => void;
	onOpenChange?: (open: boolean) => void;
	setDisplayStateProp: (state: SidebarDisplayState) => void;
	onDisplayStateChange?: (state: SidebarDisplayState) => void;
};

export class SidebarDisplayStateBridge {
	private internalDisplayState: SidebarDisplayState | undefined = $state(undefined);
	private previousOpen: boolean | undefined = $state(undefined);
	private previousCollapsible: SidebarCollapsible | undefined = $state(undefined);
	private previousControlledDisplayState: SidebarDisplayState | undefined = $state(undefined);
	private syncingOpenFromDisplayState = $state(false);

	constructor(private options: SidebarDisplayStateBridgeOptions) {
		$effect(() => {
			this.syncExternalState();
		});
	}

	get displayState(): SidebarDisplayState {
		return this.normalizeState(
			this.options.displayState ?? this.internalDisplayState ?? this.legacyDisplayState
		);
	}

	setDisplayState = (nextState: SidebarDisplayState) => {
		const normalizedState = this.normalizeState(nextState);
		if (normalizedState === this.displayState) return;
		const previousOpen = this.options.open;

		if (this.options.displayState !== undefined) {
			this.options.setDisplayStateProp(normalizedState);
		} else {
			this.internalDisplayState = normalizedState;
		}

		this.updateOpenFromDisplayState(normalizedState);
		const nextOpen = this.options.open;
		this.options.onDisplayStateChange?.(normalizedState);
		if (nextOpen !== previousOpen) this.options.onOpenChange?.(nextOpen);
	};

	private syncExternalState() {
		const nextOpen = this.options.open;
		const nextCollapsible = this.options.collapsible;
		const nextControlledDisplayState = this.options.displayState;

		if (this.previousOpen === undefined || this.previousCollapsible === undefined) {
			this.previousOpen = nextOpen;
			this.previousCollapsible = nextCollapsible;
			this.previousControlledDisplayState = nextControlledDisplayState;
			if (nextControlledDisplayState !== undefined) {
				this.updateOpenFromDisplayState(nextControlledDisplayState);
			}
			return;
		}

		const openChanged = nextOpen !== this.previousOpen;
		const collapsibleChanged = nextCollapsible !== this.previousCollapsible;
		const controlledDisplayStateChanged =
			nextControlledDisplayState !== this.previousControlledDisplayState;

		this.previousOpen = nextOpen;
		this.previousCollapsible = nextCollapsible;
		this.previousControlledDisplayState = nextControlledDisplayState;

		if (nextControlledDisplayState !== undefined && controlledDisplayStateChanged) {
			this.updateOpenFromDisplayState(nextControlledDisplayState);
			return;
		}
		if (this.syncingOpenFromDisplayState) {
			this.syncingOpenFromDisplayState = false;
			return;
		}
		if (nextControlledDisplayState !== undefined || (!openChanged && !collapsibleChanged)) return;

		this.internalDisplayState = this.legacyDisplayState;
	}

	private get legacyDisplayState(): SidebarDisplayState {
		if (this.options.open || this.options.collapsible === 'none') return 'expanded';
		return this.collapsedDisplayState;
	}

	private get collapsedDisplayState(): SidebarDisplayState {
		return this.options.collapsible === 'offcanvas' ? 'hidden' : 'collapsed';
	}

	private normalizeState(state: SidebarDisplayState) {
		if (this.options.collapsible === 'none') return 'expanded';
		if (this.options.collapsible === 'offcanvas' && state === 'collapsed') return 'hidden';
		return state;
	}

	private updateOpenFromDisplayState(state: SidebarDisplayState) {
		const nextOpen = state === 'expanded';
		if (this.options.open === nextOpen) return;

		this.syncingOpenFromDisplayState = true;
		this.options.setOpen(nextOpen);
	}
}
