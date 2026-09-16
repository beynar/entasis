export function toMapLibreColor(color: string): string | null {
	const srgbMatch = /^color\(srgb\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+))?\)$/.exec(
		color
	);

	if (srgbMatch) {
		const red = Math.round(Number(srgbMatch[1]) * 255);
		const green = Math.round(Number(srgbMatch[2]) * 255);
		const blue = Math.round(Number(srgbMatch[3]) * 255);
		const alpha = srgbMatch[4] ? Number(srgbMatch[4]) : 1;

		return Number.isFinite(alpha) && alpha < 1
			? `rgba(${red}, ${green}, ${blue}, ${alpha})`
			: `rgb(${red}, ${green}, ${blue})`;
	}

	return color.startsWith('rgb(') || color.startsWith('rgba(') || color.startsWith('#')
		? color
		: null;
}
