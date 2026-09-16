import { fromEvent, type FileWithPath } from 'file-selector';

export async function getFilesFromEvent(event: Event): Promise<File[]> {
	const entries = await fromEvent(event);
	// file-selector 5 yields FileWithPath | DataTransferItem; keep the File subset.
	return entries.filter((entry): entry is FileWithPath => entry instanceof File);
}

export function getFilesFromClipboard(event: ClipboardEvent): File[] {
	return Array.from(event.clipboardData?.files ?? []);
}

export function hasFileTransfer(event: DragEvent): boolean {
	return Array.from(event.dataTransfer?.types ?? []).includes('Files');
}

export function resetFileInput(input: HTMLInputElement): void {
	input.value = '';
}
