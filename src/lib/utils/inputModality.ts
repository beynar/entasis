/**
 * The kind of input behind the user's latest interaction with a document: `touch` after a finger
 * press, `pointer` after a mouse or pen press, `keyboard` after a key. Safari does not focus a
 * tapped button, so focus a script moves afterwards (a drawer focusing its first item) matches
 * `:focus-visible` as if it came from the keyboard; this tells the two apart.
 */
export type InputModality = 'touch' | 'pointer' | 'keyboard';

const modalities = new WeakMap<Document, InputModality>();

const track = (doc: Document) => {
	if (modalities.has(doc)) return;
	modalities.set(doc, 'keyboard');
	const options = { capture: true, passive: true };
	doc.addEventListener(
		'pointerdown',
		(event) => modalities.set(doc, event.pointerType === 'touch' ? 'touch' : 'pointer'),
		options
	);
	doc.addEventListener('keydown', () => modalities.set(doc, 'keyboard'), options);
};

/** Starts tracking `doc` (once) and returns its latest input modality. */
export const inputModality = (doc: Document): InputModality => {
	track(doc);
	return modalities.get(doc) ?? 'keyboard';
};
