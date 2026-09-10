import { fromEvent } from 'file-selector';
import { untrack } from 'svelte';
import { on } from 'svelte/events';
import { acceptFiles, isAcceptedFileType, type FileRejection } from './fileAcceptance.js';
import { getFilesFromEvent, hasFileTransfer, resetFileInput } from './fileSelection.js';

export type FileDropzoneState = 'idle' | 'potential' | 'valid' | 'invalid';

export type FileDropzoneOptions = {
	accept?: string;
	types?: readonly string[];
	mode?: 'single' | 'multiple';
	multiple?: boolean;
	maxFiles?: number;
	maxSize?: number;
	disabled?: boolean;
	clickToOpen?: boolean;
	clickable?: boolean;
	files?: readonly File[];
	onAccept?: (files: File[]) => void;
	onValueChange?: (files: File[]) => void;
	onReject?: (rejections: FileRejection[]) => void;
	onError?: (error: unknown) => void;
};

export type FileDropzoneOptionsSource = FileDropzoneOptions | (() => FileDropzoneOptions);

type FileCandidate = File | DataTransferItem;
type FileCandidateMatch = 'match' | 'mismatch' | 'unknown';

export class FileDropzone {
	files = $state<File[]>([]);
	inputElement = $state<HTMLInputElement>();
	state = $state<FileDropzoneState>('idle');

	readonly input: (node: HTMLInputElement) => void | (() => void);
	readonly zone: (node: HTMLElement) => void | (() => void);

	private dragDepth = 0;
	private dragGeneration = 0;

	constructor(private optionsSource: FileDropzoneOptionsSource) {
		this.input = (node) => this.attachInput(node);
		this.zone = (node) => this.attachZone(node);

		$effect(() => {
			const externalFiles = this.options.files;
			if (!externalFiles || areSameFiles(externalFiles, this.files)) return;
			untrack(() => {
				this.files = [...externalFiles];
			});
		});
	}

	get isActive(): boolean {
		return this.state !== 'idle';
	}

	open(): void {
		if (this.isDisabled) return;
		this.inputElement?.click();
	}

	acceptFiles(files: readonly File[]): void {
		if (this.isDisabled || files.length === 0) return;
		this.intakeFiles(files);
	}

	removeFile(file: File): void {
		if (this.isDisabled) return;
		this.commitFiles(
			this.currentFiles.filter((currentFile) => currentFile !== file),
			[]
		);
	}

	reset(): void {
		this.dragDepth = 0;
		this.dragGeneration += 1;
		this.state = 'idle';
	}

	formatSize(bytes: number): string {
		if (bytes === 0) return '0 Bytes';
		const units = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
		const unitIndex = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
		if (unitIndex === 0) return `${bytes} ${units[unitIndex]}`;
		return `${(bytes / 1024 ** unitIndex).toFixed(1)} ${units[unitIndex]}`;
	}

	private get options(): FileDropzoneOptions {
		return typeof this.optionsSource === 'function' ? this.optionsSource() : this.optionsSource;
	}

	private get currentFiles(): readonly File[] {
		return this.options.files ?? this.files;
	}

	private get isDisabled(): boolean {
		return this.options.disabled ?? false;
	}

	private get isMultiple(): boolean {
		if (this.options.mode) return this.options.mode === 'multiple';
		return this.options.multiple ?? false;
	}

	private get maxFiles(): number {
		return this.isMultiple ? (this.options.maxFiles ?? Number.POSITIVE_INFINITY) : 1;
	}

	private get acceptedTypes(): string[] {
		if (this.options.types) return Array.from(this.options.types);
		return (this.options.accept ?? '')
			.split(',')
			.map((type) => type.trim())
			.filter(Boolean);
	}

	private get shouldOpenOnClick(): boolean {
		return this.options.clickToOpen ?? this.options.clickable ?? false;
	}

	private attachInput(node: HTMLInputElement): () => void {
		this.inputElement = node;
		const offChange = on(node, 'change', this.handleInputChange);
		return () => {
			offChange();
			if (this.inputElement === node) this.inputElement = undefined;
		};
	}

	private attachZone(node: HTMLElement): () => void {
		const offDragEnter = on(node, 'dragenter', this.handleDragEnter);
		const offDragOver = on(node, 'dragover', this.handleDragOver);
		const offDragLeave = on(node, 'dragleave', this.handleDragLeave);
		const offDrop = on(node, 'drop', this.handleDrop);
		const offClick = on(node, 'click', this.handleClick);
		const offKeydown = on(node, 'keydown', this.handleKeydown);

		return () => {
			offDragEnter();
			offDragOver();
			offDragLeave();
			offDrop();
			offClick();
			offKeydown();
		};
	}

	private handleInputChange = async (event: Event): Promise<void> => {
		event.preventDefault();
		await this.intakeEvent(event);
		if (this.inputElement) resetFileInput(this.inputElement);
	};

	private handleDragEnter = async (event: DragEvent): Promise<void> => {
		if (this.isDisabled || !hasFileTransfer(event)) return;
		event.preventDefault();
		event.stopPropagation();
		this.dragDepth += 1;
		this.state = 'potential';

		const generation = ++this.dragGeneration;
		try {
			const candidates = await fromEvent(event);
			if (generation !== this.dragGeneration) return;
			this.state = this.getCandidateState(candidates);
		} catch (error) {
			this.handleError(error);
		}
	};

	private handleDragOver = (event: DragEvent): void => {
		if (this.isDisabled || !hasFileTransfer(event)) return;
		event.preventDefault();
		event.stopPropagation();
		if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy';
	};

	private handleDragLeave = (event: DragEvent): void => {
		if (!this.isActive || !hasFileTransfer(event)) return;
		event.stopPropagation();
		this.dragDepth = Math.max(0, this.dragDepth - 1);
		if (this.dragDepth > 0) return;
		this.reset();
	};

	private handleDrop = async (event: DragEvent): Promise<void> => {
		if (!hasFileTransfer(event)) return;
		event.preventDefault();
		event.stopPropagation();
		this.reset();
		if (this.isDisabled) return;
		await this.intakeEvent(event);
	};

	private handleClick = (event: MouseEvent): void => {
		if (!this.shouldOpenOnClick || this.isDisabled || isInteractiveEvent(event)) return;
		this.open();
	};

	private handleKeydown = (event: KeyboardEvent): void => {
		if (!this.shouldOpenOnClick || this.isDisabled || isInteractiveEvent(event)) return;
		if (event.key !== 'Enter' && event.key !== ' ') return;
		event.preventDefault();
		this.open();
	};

	private async intakeEvent(event: Event): Promise<void> {
		try {
			const files = await getFilesFromEvent(event);
			this.acceptFiles(files);
		} catch (error) {
			this.handleError(error);
		}
	}

	private intakeFiles(files: readonly File[]): void {
		const currentFiles = this.isMultiple ? this.currentFiles : [];
		const acceptance = acceptFiles(files, {
			types: this.acceptedTypes,
			maxSize: this.options.maxSize,
			maxFiles: this.maxFiles,
			currentFiles
		});

		if (acceptance.accepted.length > 0) {
			const nextFiles = this.isMultiple
				? [...currentFiles, ...acceptance.accepted]
				: acceptance.accepted.slice(0, 1);
			this.commitFiles(nextFiles, acceptance.accepted);
		}
		if (acceptance.rejected.length > 0) this.options.onReject?.(acceptance.rejected);
	}

	private getCandidateState(candidates: FileCandidate[]): Exclude<FileDropzoneState, 'idle'> {
		if (candidates.length === 0) return 'potential';
		const candidateFiles: File[] = [];
		for (const candidate of candidates) {
			const file = getCandidateFile(candidate);
			if (!file) break;
			candidateFiles.push(file);
		}
		if (candidateFiles.length === candidates.length) {
			const currentFiles = this.isMultiple ? this.currentFiles : [];
			const acceptance = acceptFiles(candidateFiles, {
				types: this.acceptedTypes,
				maxSize: this.options.maxSize,
				maxFiles: this.maxFiles,
				currentFiles
			});
			return acceptance.rejected.length === 0 ? 'valid' : 'invalid';
		}

		const currentFileCount = this.isMultiple ? this.currentFiles.length : 0;
		if (candidates.length > this.maxFiles - currentFileCount) return 'invalid';
		let hasUnknownCandidate = false;
		for (const candidate of candidates) {
			const match = matchCandidate(candidate, this.acceptedTypes);
			if (match === 'mismatch') return 'invalid';
			if (match === 'unknown') hasUnknownCandidate = true;
		}
		return hasUnknownCandidate ? 'potential' : 'valid';
	}

	private commitFiles(nextFiles: readonly File[], acceptedFiles: File[]): void {
		this.files = [...nextFiles];
		if (acceptedFiles.length > 0) this.options.onAccept?.(acceptedFiles);
		this.options.onValueChange?.([...this.files]);
	}

	private handleError(error: unknown): void {
		if (this.options.onError) {
			this.options.onError(error);
			return;
		}
		throw error;
	}
}

function isInteractiveEvent(event: Event): boolean {
	return event.composedPath().some((node) => {
		if (node === event.currentTarget || !(node instanceof HTMLElement)) return false;
		return node.matches(
			'button,input,select,textarea,a,label,[role="button"],[contenteditable="true"]'
		);
	});
}

function isFile(candidate: FileCandidate): candidate is File {
	return typeof File !== 'undefined' && candidate instanceof File;
}

function getCandidateFile(candidate: FileCandidate): File | undefined {
	if (isFile(candidate)) return candidate;
	return candidate.getAsFile() ?? undefined;
}

function matchCandidate(
	candidate: FileCandidate,
	acceptedTypes: readonly string[]
): FileCandidateMatch {
	const file = getCandidateFile(candidate);
	if (file) {
		return isAcceptedFileType(file, acceptedTypes) ? 'match' : 'mismatch';
	}
	if (acceptedTypes.length === 0) return 'match';

	const mimeTypes = acceptedTypes.filter((acceptedType) => !acceptedType.startsWith('.'));
	const hasExtensionType = mimeTypes.length !== acceptedTypes.length;
	if (!candidate.type || mimeTypes.length === 0) return 'unknown';
	if (isAcceptedFileType({ name: '', type: candidate.type }, mimeTypes)) return 'match';
	return hasExtensionType ? 'unknown' : 'mismatch';
}

function areSameFiles(left: readonly File[], right: readonly File[]): boolean {
	return left.length === right.length && left.every((file, index) => right[index] === file);
}
