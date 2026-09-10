export function toMapError(value: unknown, fallback: string): Error {
	if (value instanceof Error) {
		return value;
	}

	const message =
		typeof value === 'string'
			? value
			: value &&
				  typeof value === 'object' &&
				  'message' in value &&
				  typeof value.message === 'string'
				? value.message
				: fallback;

	return new Error(message, { cause: value });
}

export function reportMapError(error: Error, onError: ((error: Error) => void) | undefined): void {
	if (onError) {
		onError(error);
		return;
	}

	console.error(error);
}
