export interface WorkerTask<T> {
	promise: Promise<T>;
	cancel(): void;
}

interface WorkerResponse<T> {
	ok: boolean;
	value?: T;
	error?: string;
}

export const runDocumentWorker = <Input, Output>(
	source: string,
	input: Input,
	transfer: Transferable[],
	signal: AbortSignal
): WorkerTask<Output> => {
	if (typeof Worker === 'undefined') {
		throw new Error('This document format requires Web Worker support.');
	}

	const blobUrl = URL.createObjectURL(new Blob([source], { type: 'text/javascript' }));
	let worker: Worker;
	try {
		worker = new Worker(blobUrl, { type: 'module' });
	} catch (error) {
		URL.revokeObjectURL(blobUrl);
		const message = error instanceof Error ? error.message : String(error);
		throw new Error(`The document worker could not start: ${message}`, { cause: error });
	}
	let settled = false;
	let rejectTask: (reason: Error) => void = () => undefined;

	const cleanup = () => {
		worker.terminate();
		URL.revokeObjectURL(blobUrl);
		signal.removeEventListener('abort', onAbort);
	};

	const cancel = () => {
		if (settled) return;
		settled = true;
		cleanup();
		rejectTask(new DOMException('Document loading was aborted.', 'AbortError'));
	};

	const onAbort = () => cancel();
	const promise = new Promise<Output>((resolve, reject) => {
		rejectTask = reject;
		worker.onmessage = (event: MessageEvent<WorkerResponse<Output>>) => {
			if (settled) return;
			settled = true;
			cleanup();
			if (!event.data.ok) {
				reject(new Error(event.data.error || 'The document worker failed.'));
				return;
			}
			if (event.data.value === undefined) {
				reject(new Error('The document worker returned no value.'));
				return;
			}
			resolve(event.data.value);
		};
		worker.onerror = (event) => {
			if (settled) return;
			settled = true;
			const message = event.message || event.error?.message || 'The document worker crashed.';
			cleanup();
			reject(new Error(message));
		};
		if (signal.aborted) {
			cancel();
			return;
		}
		signal.addEventListener('abort', onAbort, { once: true });
		try {
			worker.postMessage(input, transfer);
		} catch (error) {
			settled = true;
			cleanup();
			reject(error instanceof Error ? error : new Error(String(error)));
		}
	});

	return { promise, cancel };
};
