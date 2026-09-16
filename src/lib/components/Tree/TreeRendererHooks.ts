import { FileTree, type FileTreeMutationEvent } from '@pierre/trees';

export type TreeRendererHooks = {
	onDispose?: () => void;
	onFocusChange?: (focusedPath: string | null) => void;
	onMutation?: (event: FileTreeMutationEvent) => void;
	onReady?: (payload: FileTree) => void;
	setFileTree?: (fileTree: FileTree | undefined) => void;
};

export class TreeRendererHookSubscriptions {
	private hooks: TreeRendererHooks = {};
	private previousFocusedPath: string | null | undefined;
	private unsubscribeFocus: (() => void) | undefined;
	private unsubscribeMutation: (() => void) | undefined;

	sync(fileTree: FileTree, hooks: TreeRendererHooks): void {
		this.hooks = hooks;

		if (this.previousFocusedPath === undefined) {
			this.previousFocusedPath = fileTree.getFocusedPath();
		}

		if (hooks.onFocusChange != null && this.unsubscribeFocus == null) {
			this.unsubscribeFocus = fileTree.subscribe(() => this.emitFocusChange(fileTree));
		} else if (hooks.onFocusChange == null && this.unsubscribeFocus != null) {
			this.unsubscribeFocus();
			this.unsubscribeFocus = undefined;
		}

		if (hooks.onMutation != null && this.unsubscribeMutation == null) {
			this.unsubscribeMutation = fileTree.onMutation('*', (event) =>
				this.hooks.onMutation?.(event)
			);
		} else if (hooks.onMutation == null && this.unsubscribeMutation != null) {
			this.unsubscribeMutation();
			this.unsubscribeMutation = undefined;
		}
	}

	clear(): void {
		this.unsubscribeFocus?.();
		this.unsubscribeMutation?.();
		this.unsubscribeFocus = undefined;
		this.unsubscribeMutation = undefined;
		this.hooks = {};
		this.previousFocusedPath = undefined;
	}

	private emitFocusChange(fileTree: FileTree): void {
		const focusedPath = fileTree.getFocusedPath();
		if (Object.is(focusedPath, this.previousFocusedPath)) return;

		this.previousFocusedPath = focusedPath;
		this.hooks.onFocusChange?.(focusedPath);
	}
}
