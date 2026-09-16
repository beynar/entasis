/**
 * Calls `callback` (once per animation frame) whenever the resolved `--color-*` tokens
 * may have changed: a theme flip (`data-theme` / `class` / inline `style` on `<html>`) or
 * a `<style>` in `<head>` being added, removed or rewritten (runtime design tokens, palette
 * overrides, playgrounds). Components that bake token colours into non-CSS output
 * (canvas maps, Mermaid SVG, charts) use it to re-derive; compare a signature before
 * doing expensive work, because `<head>` also mutates on ordinary navigation.
 */
export function observeThemeTokens(callback: () => void): () => void {
	if (typeof document === 'undefined') return () => {};
	let frame = 0;
	const schedule = () => {
		cancelAnimationFrame(frame);
		frame = requestAnimationFrame(callback);
	};
	const observer = new MutationObserver(schedule);
	observer.observe(document.documentElement, {
		attributes: true,
		attributeFilter: ['class', 'style', 'data-theme']
	});
	observer.observe(document.head, { childList: true, subtree: true, characterData: true });
	return () => {
		cancelAnimationFrame(frame);
		observer.disconnect();
	};
}
