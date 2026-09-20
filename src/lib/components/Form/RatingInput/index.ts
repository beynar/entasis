export { default as RatingInput } from './RatingInput.svelte';
export type { RatingInputProps } from './ratingInput.props.js';
// The star rendering (and its theme) lives in the Rating display component; re-exported here
// so `entasis/rating-input` consumers can theme the stars without a second import.
export {
	ratingTheme,
	setRatingTheme,
	useRatingTheme,
	type RatingTheme,
	type RatingThemeProps
} from '../../Rating/rating.theme.js';
