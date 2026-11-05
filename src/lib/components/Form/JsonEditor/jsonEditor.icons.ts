// The icon of each kind of value, in one place.
import { atIcon } from '../../Icons/at.js';
import { bracketsCurlyIcon } from '../../Icons/bracketsCurly.js';
import { bracketsSquareIcon } from '../../Icons/bracketsSquare.js';
import { calendarBlankIcon } from '../../Icons/calendarBlank.js';
import { circleDashedIcon } from '../../Icons/circleDashed.js';
import { clockIcon } from '../../Icons/clock.js';
import { fingerprintSimpleIcon } from '../../Icons/fingerprintSimple.js';
import { hashIcon } from '../../Icons/hash.js';
import { hashStraightIcon } from '../../Icons/hashStraight.js';
import { linkSimpleIcon } from '../../Icons/linkSimple.js';
import { listBulletsIcon } from '../../Icons/listBullets.js';
import { lockKeyIcon } from '../../Icons/lockKey.js';
import { lockSimpleIcon } from '../../Icons/lockSimple.js';
import { paletteIcon } from '../../Icons/palette.js';
import { textAaIcon } from '../../Icons/textAa.js';
import { toggleLeftIcon } from '../../Icons/toggleLeft.js';
import { asteriskIcon } from '../../Icons/asterisk.js';
import type { JsonType } from './jsonEditor.schema.js';

export type JsonIconSnippet = typeof textAaIcon;

const BY_TYPE: Record<JsonType, JsonIconSnippet> = {
	string: textAaIcon,
	number: hashIcon,
	integer: hashStraightIcon,
	boolean: toggleLeftIcon,
	object: bracketsCurlyIcon,
	array: bracketsSquareIcon,
	null: circleDashedIcon
};

const BY_FORMAT: Record<string, JsonIconSnippet> = {
	date: calendarBlankIcon,
	'date-time': calendarBlankIcon,
	time: clockIcon,
	email: atIcon,
	'idn-email': atIcon,
	uri: linkSimpleIcon,
	url: linkSimpleIcon,
	iri: linkSimpleIcon,
	uuid: fingerprintSimpleIcon,
	color: paletteIcon,
	password: lockKeyIcon
};

/** The icon for a type name. */
export const jsonTypeIcon = (type: JsonType): JsonIconSnippet => BY_TYPE[type];

/** The icon for a value, the most specific that applies. */
export const jsonValueIcon = (input: {
	type: JsonType | undefined;
	format?: string;
	fixed?: boolean;
	options?: boolean;
}): JsonIconSnippet => {
	if (input.fixed) return lockSimpleIcon;
	if (input.options) return listBulletsIcon;
	if (input.type === 'string' && input.format && BY_FORMAT[input.format]) {
		return BY_FORMAT[input.format];
	}
	return input.type ? BY_TYPE[input.type] : asteriskIcon;
};
