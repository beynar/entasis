// The component's stylesheets are imported from this JavaScript module rather than from the
// component itself: TypeScript keeps a side-effect import in the declaration it emits for a Svelte
// or TypeScript module, and a consumer on TypeScript 6 (noUncheckedSideEffectImports) cannot
// resolve a CSS import there. A JavaScript module emits an empty declaration. package.json lists
// *.styles.js as having side effects, so bundlers keep this import.
import 'lightgallery/css/lightgallery.css';
import 'lightgallery/css/lg-thumbnail.css';
import 'lightgallery/css/lg-zoom.css';
