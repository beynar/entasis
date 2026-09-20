import type { DocumentFormat, DocumentSource } from './documentViewer.props.js';

export interface ResolvedDocumentSource {
	bytes: Uint8Array;
	fileName?: string;
	mimeType?: string;
}

const extensionFormats: Record<string, DocumentFormat> = {
	pdf: 'pdf',
	docx: 'docx',
	doc: 'doc',
	xlsx: 'xlsx',
	xls: 'xls',
	csv: 'csv',
	pptx: 'pptx',
	ppt: 'ppt',
	pages: 'pages'
};

const mimeFormats: Record<string, DocumentFormat> = {
	'application/pdf': 'pdf',
	'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
	'application/msword': 'doc',
	'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
	'application/vnd.ms-excel': 'xls',
	'text/csv': 'csv',
	'application/csv': 'csv',
	'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
	'application/vnd.ms-powerpoint': 'ppt',
	'application/vnd.apple.pages': 'pages'
};

const bytesStartWith = (bytes: Uint8Array, signature: number[]) =>
	signature.every((value, index) => bytes[index] === value);

const containsBytes = (bytes: Uint8Array, value: string, utf16 = false) => {
	const pattern = utf16
		? Array.from(value).flatMap((character) => [character.charCodeAt(0), 0])
		: Array.from(value, (character) => character.charCodeAt(0));
	outer: for (let offset = 0; offset <= bytes.length - pattern.length; offset++) {
		for (let index = 0; index < pattern.length; index++) {
			if (bytes[offset + index] !== pattern[index]) continue outer;
		}
		return true;
	}
	return false;
};

const formatFromName = (fileName?: string): DocumentFormat | undefined => {
	if (!fileName) return;
	const cleanName = fileName.split(/[?#]/)[0];
	const extension = cleanName.slice(cleanName.lastIndexOf('.') + 1).toLowerCase();
	return extensionFormats[extension];
};

const formatFromMime = (mimeType?: string): DocumentFormat | undefined => {
	if (!mimeType) return;
	return mimeFormats[mimeType.toLowerCase().split(';')[0].trim()];
};

const sniffCompoundDocument = (bytes: Uint8Array): DocumentFormat | undefined => {
	if (containsBytes(bytes, 'WordDocument', true)) return 'doc';
	if (containsBytes(bytes, 'PowerPoint Document', true)) return 'ppt';
	if (containsBytes(bytes, 'Workbook', true) || containsBytes(bytes, 'Book', true)) return 'xls';
};

const sniffZipDocument = (bytes: Uint8Array): DocumentFormat | undefined => {
	if (containsBytes(bytes, 'word/')) return 'docx';
	if (containsBytes(bytes, 'xl/')) return 'xlsx';
	if (containsBytes(bytes, 'ppt/')) return 'pptx';
	if (containsBytes(bytes, 'Index/Document.iwa')) return 'pages';
};

const sniffCsv = (bytes: Uint8Array): DocumentFormat | undefined => {
	const sample = bytes.subarray(0, Math.min(bytes.length, 65_536));
	if (!sample.length || sample.includes(0)) return;
	const text = new TextDecoder('utf-8', { fatal: false }).decode(sample);
	const lines = text.split(/\r?\n/).filter((line) => line.trim().length);
	if (lines.length < 2) return;
	for (const delimiter of [',', ';', '\t']) {
		const counts = lines.slice(0, 8).map((line) => line.split(delimiter).length);
		if (counts[0] > 1 && counts.every((count) => count === counts[0])) return 'csv';
	}
};

export const sniffDocumentFormat = (bytes: Uint8Array): DocumentFormat | undefined => {
	if (bytesStartWith(bytes, [0x25, 0x50, 0x44, 0x46, 0x2d])) return 'pdf';
	if (bytesStartWith(bytes, [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1])) {
		return sniffCompoundDocument(bytes);
	}
	if (bytesStartWith(bytes, [0x50, 0x4b, 0x03, 0x04])) return sniffZipDocument(bytes);
	return sniffCsv(bytes);
};

export const detectDocumentFormat = ({
	format,
	fileName,
	mimeType,
	bytes
}: {
	format?: DocumentFormat;
	fileName?: string;
	mimeType?: string;
	bytes?: Uint8Array;
}): DocumentFormat | undefined =>
	format ??
	formatFromName(fileName) ??
	formatFromMime(mimeType) ??
	(bytes && sniffDocumentFormat(bytes));

export const inferDocumentFileName = (source: DocumentSource, explicitName?: string) => {
	if (explicitName) return explicitName;
	if (typeof File !== 'undefined' && source instanceof File) return source.name;
	if (source instanceof URL) return source.pathname.split('/').pop() || undefined;
	if (typeof source === 'string') {
		try {
			return new URL(source, 'https://entasis.local').pathname.split('/').pop() || undefined;
		} catch {
			return undefined;
		}
	}
};

export const resolveDocumentSource = async (
	source: DocumentSource,
	fileName: string | undefined,
	signal: AbortSignal
): Promise<ResolvedDocumentSource> => {
	if (typeof source === 'string' || source instanceof URL) {
		const response = await fetch(source, { signal });
		if (!response.ok) {
			throw new Error(`Document request failed with ${response.status} ${response.statusText}.`);
		}
		return {
			bytes: new Uint8Array(await response.arrayBuffer()),
			fileName: fileName ?? inferDocumentFileName(source),
			mimeType: response.headers.get('content-type') ?? undefined
		};
	}

	if (source instanceof Blob) {
		return {
			bytes: new Uint8Array(await source.arrayBuffer()),
			fileName: fileName ?? inferDocumentFileName(source),
			mimeType: source.type || undefined
		};
	}

	return {
		bytes: source instanceof Uint8Array ? source.slice() : new Uint8Array(source.slice(0)),
		fileName
	};
};

export const toArrayBuffer = (bytes: Uint8Array): ArrayBuffer => {
	const copy = new Uint8Array(bytes.byteLength);
	copy.set(bytes);
	return copy.buffer;
};
