import type { FloatingWindowDockPlacement } from '../FloatingWindow/floatingWindow.props.js';
import type { Attachment } from 'svelte/attachments';

export type FloatingWindowSurface = 'window' | 'dock';

type FloatingWindowDockEntry = {
	id: string;
	placement: FloatingWindowDockPlacement;
	setIndex: (index: number) => void;
};

export class ThemeFloatingWindows {
	private zIndex = 1000;
	private dockEntries: FloatingWindowDockEntry[] = [];
	private layerNode?: HTMLElement;
	private portalNodes = new Set<HTMLElement>();
	private surfaces = new Map<string, { type: FloatingWindowSurface; zIndex: number }>();

	readonly layer: Attachment<HTMLElement> = (node) => {
		this.layerNode = node;
		this.portalNodes.forEach((portalNode) => node.appendChild(portalNode));

		return () => {
			if (this.layerNode === node) this.layerNode = undefined;
		};
	};

	readonly portal: Attachment<HTMLElement> = (node) => {
		this.portalNodes.add(node);
		(this.layerNode ?? document.body).appendChild(node);

		return () => {
			this.portalNodes.delete(node);
			node.remove();
		};
	};

	/**
	 * Brings a surface to the top. `reserveBelow` also claims the index just under it, for a
	 * window's backdrop: the counter never hands an index out twice, so no other surface can land
	 * between a window and its backdrop.
	 */
	activate(id: string, type: FloatingWindowSurface, reserveBelow = false) {
		this.zIndex += reserveBelow ? 2 : 1;
		this.surfaces.set(id, { type, zIndex: this.zIndex });
		return this.zIndex;
	}

	unregisterSurface(id: string, type: FloatingWindowSurface) {
		if (this.surfaces.get(id)?.type === type) this.surfaces.delete(id);
	}

	isTopWindow(id: string) {
		const surface = this.surfaces.get(id);
		if (surface?.type !== 'window') return false;
		for (const candidate of this.surfaces.values()) {
			if (candidate.type === 'window' && candidate.zIndex > surface.zIndex) return false;
		}
		return true;
	}

	registerDock(entry: FloatingWindowDockEntry) {
		this.dockEntries = [...this.dockEntries.filter(({ id }) => id !== entry.id), entry];
		this.notifyDock();
		return () => {
			this.dockEntries = this.dockEntries.filter(({ id }) => id !== entry.id);
			this.notifyDock();
		};
	}

	updateDock(id: string, placement: FloatingWindowDockPlacement) {
		const entry = this.dockEntries.find((candidate) => candidate.id === id);
		if (!entry || entry.placement === placement) return;
		entry.placement = placement;
		this.notifyDock();
	}

	getDockCount(placement: FloatingWindowDockPlacement) {
		return this.dockEntries.filter((entry) => entry.placement === placement).length;
	}

	reorderDock(id: string, targetIndex: number) {
		const moving = this.dockEntries.find((entry) => entry.id === id);
		if (!moving) return;
		const placementEntries = this.dockEntries.filter(
			(entry) => entry.placement === moving.placement && entry.id !== id
		);
		placementEntries.splice(Math.min(Math.max(targetIndex, 0), placementEntries.length), 0, moving);

		let placementIndex = 0;
		this.dockEntries = this.dockEntries.map((entry) =>
			entry.placement === moving.placement ? placementEntries[placementIndex++] : entry
		);
		this.notifyDock();
	}

	private notifyDock() {
		const placementIndexes = new Map<FloatingWindowDockPlacement, number>();
		this.dockEntries.forEach((entry) => {
			const index = placementIndexes.get(entry.placement) ?? 0;
			entry.setIndex(index);
			placementIndexes.set(entry.placement, index + 1);
		});
	}
}
