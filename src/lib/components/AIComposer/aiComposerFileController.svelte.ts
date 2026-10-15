import type { Messages } from '$lib/i18n/en.js';
import type { FileRejection } from '../Form/File/fileAcceptance.js';
import { FileDropzone } from '../Form/File/fileDropzone.svelte.js';
import { getFilesFromClipboard } from '../Form/File/fileSelection.js';
import type { AIComposerAttachment, AIComposerQueuedMessage } from './aiComposer.props.js';
import { createId } from '$lib/utils/id.js';
import { SvelteMap } from 'svelte/reactivity';

type AIComposerFileControllerOptions = {
	disabled: boolean;
	isWorking: boolean;
	fileDropzone: boolean;
	fileMultiple: boolean;
	accept: readonly string[];
	maxFiles: number;
	maxFileSize: number;
	managedAttachments: boolean;
	files: File[];
	attachments: AIComposerAttachment[];
	setFiles: (files: File[]) => void;
	setAttachments: (attachments: AIComposerAttachment[]) => void;
	onFilesRejected?: (files: File[]) => void;
	onFilesChange?: (files: File[]) => void;
	onFileReject?: (rejections: FileRejection[]) => void;
	onAttachmentAdd?: (payload: AIComposerAttachment) => void;
	onAttachmentRetry?: (payload: AIComposerAttachment) => void | Promise<void>;
	onAttachmentRemove?: (payload: AIComposerAttachment) => void;
	messages: Messages;
};

export class AIComposerFileController {
	readonly dropzone: FileDropzone;
	error = $state<string>();
	/** Plain-language note about files that were just rejected; the composer dismisses it. */
	notice = $state<string>();
	/** Counts rejection notes, so a repeated identical note still re-announces and restarts its timer. */
	noticeId = $state(0);

	constructor(private optionsSource: () => AIComposerFileControllerOptions) {
		this.dropzone = new FileDropzone(() => ({
			disabled: this.isDisabled,
			types: this.accept,
			mode: this.options.fileMultiple ? 'multiple' : 'single',
			maxFiles: this.maxFiles,
			maxSize: this.options.maxFileSize,
			files: this.files,
			onValueChange: (files) => this.replaceFiles(files),
			onReject: (rejections) => this.reportRejections(rejections)
		}));
	}

	get files(): File[] {
		const options = this.options;
		if (options.managedAttachments) {
			return options.attachments.map((attachment) => attachment.file);
		}
		return options.files;
	}

	get attachments(): AIComposerAttachment[] {
		return this.options.attachments;
	}

	get accept(): readonly string[] {
		return this.options.accept;
	}

	/** The effective file limit: a single-file composer holds one file whatever `maxFiles` says. */
	get maxFiles(): number {
		return this.options.fileMultiple ? this.options.maxFiles : 1;
	}

	get isDisabled(): boolean {
		const options = this.options;
		return options.disabled || options.isWorking || !options.fileDropzone;
	}

	addFiles(files: readonly File[]): void {
		this.dropzone.acceptFiles(files);
	}

	removeFile(file: File): void {
		const key = getFileKey(file);
		if (!this.options.managedAttachments) {
			this.commitFiles(this.files.filter((candidate) => getFileKey(candidate) !== key));
			return;
		}
		const attachment = this.options.attachments.find(
			(candidate) => getFileKey(candidate.file) === key
		);
		this.commitManagedAttachments(
			this.options.attachments.filter((candidate) => getFileKey(candidate.file) !== key)
		);
		if (attachment) this.options.onAttachmentRemove?.(attachment);
	}

	async retryAttachment(attachmentId: string): Promise<void> {
		const callback = this.options.onAttachmentRetry;
		if (!callback) return;
		const attachment = this.requireAttachment(attachmentId);
		this.updateAttachment(attachmentId, (current) => ({
			...current,
			status: 'uploading',
			error: undefined
		}));
		this.error = undefined;
		try {
			await callback(attachment);
			this.updateAttachment(attachmentId, (current) => ({
				...current,
				status: 'uploaded',
				error: undefined
			}));
		} catch (error) {
			const message = getErrorMessage(
				error,
				this.options.messages.aiComposerUploadFailed(attachment.file.name)
			);
			this.updateAttachment(attachmentId, (current) => ({
				...current,
				status: 'failed',
				error: message
			}));
			this.error = message;
		}
	}

	clear(): void {
		if (this.options.managedAttachments) this.commitManagedAttachments([]);
		else this.commitFiles([]);
		this.error = undefined;
		this.notice = undefined;
		this.dropzone.reset();
	}

	dismissNotice(): void {
		this.notice = undefined;
	}

	restore(message: AIComposerQueuedMessage): void {
		if (this.options.managedAttachments) {
			const attachments =
				message.attachments.length > 0
					? message.attachments.map((attachment) => ({ ...attachment }))
					: message.files.map(createAttachment);
			this.commitManagedAttachments(attachments);
		} else {
			this.commitFiles([...message.files]);
		}
		this.error = undefined;
	}

	handlePaste(event: ClipboardEvent): void {
		if (this.isDisabled) return;
		const files = getFilesFromClipboard(event);
		if (files.length === 0) return;
		this.addFiles(files);
		if (!hasClipboardText(event.clipboardData)) event.preventDefault();
	}

	private get options(): AIComposerFileControllerOptions {
		return this.optionsSource();
	}

	private replaceFiles(files: File[]): void {
		this.error = undefined;
		this.notice = undefined;
		const options = this.options;
		if (!options.managedAttachments) {
			this.commitFiles(files);
			return;
		}

		const existingAttachments = new SvelteMap(
			options.attachments.map((attachment) => [getFileKey(attachment.file), attachment])
		);
		const addedAttachments: AIComposerAttachment[] = [];
		const nextAttachments = files.map((file) => {
			const existingAttachment = existingAttachments.get(getFileKey(file));
			if (existingAttachment) return existingAttachment;
			const attachment = createAttachment(file);
			addedAttachments.push(attachment);
			return attachment;
		});
		this.commitManagedAttachments(nextAttachments);
		for (const attachment of addedAttachments) options.onAttachmentAdd?.(attachment);
	}

	private commitFiles(files: File[]): void {
		this.options.setFiles(files);
		this.options.onFilesChange?.(files);
	}

	private commitAttachments(attachments: AIComposerAttachment[]): void {
		this.options.setAttachments(attachments);
	}

	private commitManagedAttachments(attachments: AIComposerAttachment[]): void {
		this.commitAttachments(attachments);
		this.commitFiles(attachments.map((attachment) => attachment.file));
	}

	private requireAttachment(attachmentId: string): AIComposerAttachment {
		const attachment = this.options.attachments.find((candidate) => candidate.id === attachmentId);
		if (attachment) return attachment;
		throw new Error(`Cannot update missing AI composer attachment "${attachmentId}".`);
	}

	private updateAttachment(
		attachmentId: string,
		update: (attachment: AIComposerAttachment) => AIComposerAttachment
	): void {
		this.requireAttachment(attachmentId);
		this.commitAttachments(
			this.options.attachments.map((attachment) =>
				attachment.id === attachmentId ? update(attachment) : attachment
			)
		);
	}

	private reportRejections(rejections: FileRejection[]): void {
		if (rejections.length === 0) {
			this.notice = undefined;
			return;
		}
		const options = this.options;
		options.onFileReject?.(rejections);
		options.onFilesRejected?.(rejections.map((rejection) => rejection.file));
		this.noticeId += 1;
		this.notice = describeRejections(rejections, {
			accept: options.accept,
			maxFiles: this.maxFiles,
			maxFileSize: this.dropzone.formatSize(options.maxFileSize),
			messages: options.messages
		});
	}
}

/**
 * One sentence a person can act on: the file's name and what to do instead ("notes.txt isn't
 * supported — use images or PDF"), never the rejection code.
 */
export function describeRejections(
	rejections: readonly FileRejection[],
	context: { accept: readonly string[]; maxFiles: number; maxFileSize: string; messages: Messages }
): string {
	const { messages } = context;
	const first = rejections[0].reason;
	const reason = rejections.every((rejection) => rejection.reason === first) ? first : undefined;
	const name = rejections[0].file.name;
	const single = rejections.length === 1;
	if (reason === 'limit') return messages.aiComposerFileLimit(context.maxFiles);
	if (reason === 'type') {
		const types = describeAcceptedTypes(context.accept, messages);
		return single
			? messages.aiComposerFileUnsupported(name, types)
			: messages.aiComposerFilesUnsupported(rejections.length, types);
	}
	if (single && reason === 'size')
		return messages.aiComposerFileTooLarge(name, context.maxFileSize);
	if (single && reason === 'duplicate') return messages.aiComposerFileDuplicate(name);
	return messages.aiComposerFilesRejected(rejections.length);
}

/** "images or PDF" from `['image/*', '.pdf']`, joined the locale's way. */
export function describeAcceptedTypes(accept: readonly string[], messages: Messages): string {
	const names = accept.map((pattern) => describeAcceptPattern(pattern.trim(), messages));
	const unique = names.filter((name, index) => name && names.indexOf(name) === index);
	try {
		return new Intl.ListFormat(messages.locale, { type: 'disjunction' }).format(unique);
	} catch {
		return unique.join(', ');
	}
}

function describeAcceptPattern(pattern: string, messages: Messages): string {
	const normalized = pattern.toLowerCase();
	if (normalized.startsWith('.')) return normalized.slice(1).toUpperCase();
	const [family, subtype] = normalized.split('/');
	if (subtype === '*') {
		if (family === 'image') return messages.aiComposerFileTypeImages;
		if (family === 'video') return messages.aiComposerFileTypeVideos;
		if (family === 'audio') return messages.aiComposerFileTypeAudio;
		if (family === 'text') return messages.aiComposerFileTypeText;
		return family;
	}
	// `application/pdf` → PDF; `application/vnd.ms-excel` → MS-EXCEL.
	return (subtype ?? family).replace(/^(?:vnd\.|x-)/, '').toUpperCase();
}

function createAttachment(file: File): AIComposerAttachment {
	return {
		id: createId('ai-composer-file'),
		file,
		name: file.name,
		size: file.size,
		type: file.type,
		status: 'pending'
	};
}

function getFileKey(file: Pick<File, 'name' | 'size' | 'type' | 'lastModified'>): string {
	return `${file.name}:${file.size}:${file.type}:${file.lastModified}`;
}

function hasClipboardText(clipboard: DataTransfer | null): boolean {
	if (!clipboard) return false;
	return Boolean(
		clipboard.getData('text/markdown') ||
		clipboard.getData('text/x-markdown') ||
		clipboard.getData('text/plain')
	);
}

function getErrorMessage(error: unknown, fallback: string): string {
	return error instanceof Error && error.message ? error.message : fallback;
}
