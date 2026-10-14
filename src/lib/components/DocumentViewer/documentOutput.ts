import { applyCspNonce } from '$lib/utils/cspNonce.js';
import { toArrayBuffer } from './documentViewer.source.js';
import { getOoxmlUnitCount, renderOoxmlUnit, type OoxmlModel } from './ooxmlAdapter.js';
import type { LegacyOfficeModel } from './legacyOfficeAdapter.js';
import type { DocumentFormat } from './documentViewer.props.js';
import type { DocumentLoading } from './documentLoading.svelte.js';
import type { DocumentViewerState } from './documentViewer.state.svelte.js';

const mimeByFormat: Record<DocumentFormat, string> = {
	pdf: 'application/pdf',
	docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
	doc: 'application/msword',
	xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
	xls: 'application/vnd.ms-excel',
	csv: 'text/csv',
	pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
	ppt: 'application/vnd.ms-powerpoint',
	pages: 'application/vnd.apple.pages'
};

export class DocumentOutput {
	private printFrame: HTMLIFrameElement | null = null;

	constructor(
		private readonly viewer: DocumentViewerState,
		private readonly loading: DocumentLoading
	) {}

	download = () => {
		const { originalBytes, sourceFileName, sourceMimeType } = this.loading;
		if (!originalBytes || !this.viewer.format) throw new Error('No document is loaded.');
		const name =
			this.viewer.downloadFileName ??
			sourceFileName ??
			`download.${this.viewer.format === 'pages' ? 'bin' : this.viewer.format}`;
		const blob = new Blob([toArrayBuffer(originalBytes)], {
			type: sourceMimeType ?? mimeByFormat[this.viewer.format]
		});
		const url = URL.createObjectURL(blob);
		const anchor = document.createElement('a');
		anchor.href = url;
		anchor.download = name;
		anchor.rel = 'noopener';
		document.body.appendChild(anchor);
		anchor.click();
		anchor.remove();
		URL.revokeObjectURL(url);
	};

	print = async () => {
		const surface = this.viewer.getSurfaceController();
		if (surface?.print) {
			await surface.print();
			return;
		}
		if (this.viewer.model?.kind === 'ooxml') {
			await this.printOoxml(this.viewer.model);
			return;
		}
		if (this.viewer.model?.kind === 'legacy') {
			this.printLegacy(this.viewer.model);
			return;
		}
		throw new Error('Printing is not available for this document format.');
	};

	dispose = () => {
		this.printFrame?.remove();
		this.printFrame = null;
	};

	private createPrintDocument = () => {
		this.dispose();
		const frame = document.createElement('iframe');
		frame.style.position = 'fixed';
		frame.style.width = '1px';
		frame.style.height = '1px';
		frame.style.opacity = '0';
		frame.style.pointerEvents = 'none';
		document.body.appendChild(frame);
		const printDocument = frame.contentDocument;
		if (!printDocument) {
			frame.remove();
			throw new Error('The browser could not create a print document.');
		}
		const style = applyCspNonce(printDocument.createElement('style'));
		style.textContent =
			'@page{margin:12mm}body{margin:0;background:white}.unit{break-after:page;display:flex;justify-content:center}.unit:last-child{break-after:auto}canvas{max-width:100%;height:auto}.legacy{white-space:pre-wrap;font:12pt/1.5 system-ui;padding:8mm;box-sizing:border-box;width:100%}h1{font:600 22pt/1.2 system-ui}';
		printDocument.head.appendChild(style);
		this.printFrame = frame;
		return { frame, printDocument };
	};

	private triggerPrint = (frame: HTMLIFrameElement) => {
		const cleanup = () => {
			if (this.printFrame === frame) this.printFrame = null;
			frame.remove();
		};
		if (frame.contentWindow) frame.contentWindow.onafterprint = cleanup;
		setTimeout(cleanup, 60_000);
		requestAnimationFrame(() => requestAnimationFrame(() => frame.contentWindow?.print()));
	};

	private printOoxml = async (model: OoxmlModel) => {
		const { frame, printDocument } = this.createPrintDocument();
		try {
			const count = getOoxmlUnitCount(model);
			for (let index = 0; index < count; index++) {
				const unit = printDocument.createElement('div');
				unit.className = 'unit';
				const canvas = printDocument.createElement('canvas');
				const bitmap = await renderOoxmlUnit(model, index, 1100, 1);
				canvas.width = bitmap.width;
				canvas.height = bitmap.height;
				const context = canvas.getContext('2d');
				if (!context) {
					bitmap.close();
					throw new Error('The browser could not create a print canvas context.');
				}
				context.drawImage(bitmap, 0, 0);
				bitmap.close();
				unit.appendChild(canvas);
				printDocument.body.appendChild(unit);
			}
			this.triggerPrint(frame);
		} catch (error) {
			if (this.printFrame === frame) this.printFrame = null;
			frame.remove();
			throw error;
		}
	};

	private printLegacy = (model: LegacyOfficeModel) => {
		const { frame, printDocument } = this.createPrintDocument();
		for (const documentUnit of model.units) {
			const unit = printDocument.createElement('article');
			unit.className = 'unit legacy';
			if (documentUnit.title) {
				const title = printDocument.createElement('h1');
				title.textContent = documentUnit.title;
				unit.appendChild(title);
			}
			unit.appendChild(printDocument.createTextNode(documentUnit.text));
			printDocument.body.appendChild(unit);
		}
		this.triggerPrint(frame);
	};
}
