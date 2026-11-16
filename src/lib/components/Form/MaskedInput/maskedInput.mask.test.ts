import { describe, expect, test } from 'vitest';
import { fieldToolSchema } from '../Form/form.webmcp.js';
import type { FormValueInput } from '../Form/form.js';
import {
	compileMaskPattern,
	createMaskEngine,
	describeMaskForTool,
	type MaskedInputMask
} from './maskedInput.mask.js';
import { createMaskedInputMaskito, maskValue } from './maskedInput.maskito.js';

const shape = (source: string) =>
	compileMaskPattern(source).items.map((item) =>
		item.kind === 'literal'
			? item.char
			: `${item.token}${item.optional ? '?' : ''}${item.repeat ? '+' : ''}`
	);

/** Formats a value as Maskito would, then reads it back. */
const run = (
	mask: MaskedInputMask,
	value: string,
	tokens?: Parameters<typeof createMaskEngine>[0]['tokens']
) => {
	const engine = createMaskEngine({ mask, tokens });
	return engine.details(maskValue(engine, value));
};

describe('compileMaskPattern', () => {
	test('reads tokens, literals, escapes and modifiers', () => {
		expect(shape('AA-###-AA')).toEqual(['A', 'A', '-', '#', '#', '#', '-', 'A', 'A']);
		expect(shape('(###) *')).toEqual(['(', '#', '#', '#', ')', ' ', '*']);
		expect(shape('\\#\\A\\\\#')).toEqual(['#', 'A', '\\', '#']);
		expect(shape('##?-A+')).toEqual(['#', '#?', '-', 'A+']);
		expect(shape('#?+')).toEqual(['#?+']);
		// `?` and `+` that follow no token are literals.
		expect(shape('+## ?')).toEqual(['+', '#', '#', ' ', '?']);
		// A trailing backslash stays a literal.
		expect(shape('#\\')).toEqual(['#', '\\']);
	});

	test('counts required slots, a repeating slot once', () => {
		expect(compileMaskPattern('AA-###-AA').requiredSlots).toBe(7);
		expect(compileMaskPattern('##?-A+').requiredSlots).toBe(2);
	});

	test('app tokens add to and replace the built-in ones', () => {
		const tokens = { X: { pattern: /[A-Z0-9]/ }, '#': { pattern: /[0-7]/ } };
		const items = compileMaskPattern('X#', tokens).items;
		expect(items.map((item) => item.kind)).toEqual(['slot', 'slot']);
		const [x, octal] = items as Extract<(typeof items)[number], { kind: 'slot' }>[];
		expect(x.accepts('Z')).toBe(true);
		expect(octal.accepts('8')).toBe(false);
	});
});

describe('built-in tokens', () => {
	test('# takes digits, A letters, * both', () => {
		const engine = createMaskEngine({ mask: '#A*' });
		expect(maskValue(engine, '1bé')).toBe('1bé');
		expect(maskValue(engine, 'a1')).toBe('1');
		expect(maskValue(engine, '1b2')).toBe('1b2');
		expect(maskValue(engine, '1b-')).toBe('1b');
	});

	test('A keeps the case typed', () => {
		expect(run('AA-###-AA', 'ab123cd')).toEqual({
			masked: 'ab-123-cd',
			raw: 'ab123cd',
			complete: true
		});
	});
});

describe('formatting', () => {
	test('writes the separators between raw characters', () => {
		expect(run('AA-###-AA', 'AB123CD')).toEqual({
			masked: 'AB-123-CD',
			raw: 'AB123CD',
			complete: true
		});
		expect(run('### ### ### #####', '73282932000074')).toEqual({
			masked: '732 829 320 00074',
			raw: '73282932000074',
			complete: true
		});
	});

	test('reads a formatted value the same as a raw one', () => {
		expect(run('AA-###-AA', 'AB-123-CD')).toEqual(run('AA-###-AA', 'AB123CD'));
	});

	test('a partial value is not complete', () => {
		expect(run('AA-###-AA', 'AB12')).toEqual({ masked: 'AB-12', raw: 'AB12', complete: false });
		expect(run('AA-###-AA', '')).toEqual({ masked: '', raw: '', complete: false });
	});

	test('characters the mask refuses are dropped, and extra ones cut', () => {
		expect(run('###', '1a2b3c4')).toEqual({ masked: '123', raw: '123', complete: true });
	});

	test('leading separators are written with the first character', () => {
		expect(run('(###) ###-####', '5')).toEqual({ masked: '(5', raw: '5', complete: false });
		expect(run('(###) ###-####', '5551234567').masked).toBe('(555) 123-4567');
	});

	test('a literal digit of the mask is read as the separator, not as a slot', () => {
		expect(run('+1 (###) ###-####', '+1 (555) 123-4567')).toEqual({
			masked: '+1 (555) 123-4567',
			raw: '5551234567',
			complete: true
		});
		expect(run('+1 (###) ###-####', '5551234567').raw).toBe('5551234567');
	});

	test('escaped tokens are literals', () => {
		expect(run('\\#####', '1234')).toEqual({ masked: '#1234', raw: '1234', complete: true });
	});
});

describe('optional and repeating slots', () => {
	test('an optional slot is filled when typed, and skipped by the next separator', () => {
		expect(run('##?-##', '1234')).toEqual({ masked: '12-34', raw: '1234', complete: true });
		expect(run('##?-##', '1-23')).toEqual({ masked: '1-23', raw: '123', complete: true });
		expect(run('##?-##', '12')).toMatchObject({ raw: '12', complete: false });
	});

	test('optional slots at the end do not hold completion back', () => {
		expect(run('###-##?', '12345')).toEqual({ masked: '123-45', raw: '12345', complete: true });
		expect(run('###-##?', '1234')).toEqual({ masked: '123-4', raw: '1234', complete: true });
	});

	test('a repeating slot takes every character it accepts', () => {
		expect(run('A+-##', 'abcd12')).toEqual({ masked: 'abcd-12', raw: 'abcd12', complete: true });
		expect(run('A+-##', 'abcd')).toMatchObject({ raw: 'abcd', complete: false });
		expect(run('#+ €', '1234')).toEqual({ masked: '1234 €', raw: '1234', complete: true });
		expect(run('#+ €', '')).toMatchObject({ complete: false });
	});

	test('an optional repeat may stay empty', () => {
		expect(run('A#?+', 'a')).toEqual({ masked: 'a', raw: 'a', complete: true });
		expect(run('A#?+', 'a123')).toEqual({ masked: 'a123', raw: 'a123', complete: true });
	});
});

describe('several masks', () => {
	const phone = ['(###) ###-####', '+## # ## ## ## ##'];

	test('the first mask the text fits wins', () => {
		expect(run(phone, '0612345678').masked).toBe('(061) 234-5678');
		expect(run(phone, '+33612345678')).toEqual({
			masked: '+33 6 12 34 56 78',
			raw: '33612345678',
			complete: true
		});
	});

	test('text too long for the first mask moves to the next one', () => {
		expect(run(phone, '(061) 234-56789').masked).toBe('+06 1 23 45 67 89');
	});
});

describe('function masks', () => {
	const mask = (raw: string) => (raw.length <= 3 ? '###' : '###-####');

	test('the function receives the raw characters typed so far', () => {
		const seen: string[] = [];
		const engine = createMaskEngine({
			mask: (raw) => {
				seen.push(raw);
				return mask(raw);
			}
		});
		expect(engine.details(maskValue(engine, '12345'))).toEqual({
			masked: '123-45',
			raw: '12345',
			complete: false
		});
		expect(seen).toContain('12345');
		expect(run(mask, '123')).toEqual({ masked: '123', raw: '123', complete: true });
		expect(run(mask, '1234567')).toEqual({ masked: '123-4567', raw: '1234567', complete: true });
	});
});

describe('token transforms', () => {
	const tokens = { X: { pattern: /[A-Z0-9]/, transform: 'upper' as const } };

	test('a typed character is rewritten before it is checked', () => {
		expect(run('XXXX XXXX', 'ab12cd34', tokens)).toEqual({
			masked: 'AB12 CD34',
			raw: 'AB12CD34',
			complete: true
		});
	});

	test('lower and function transforms', () => {
		expect(run('LL', 'AB', { L: { pattern: /[a-z]/, transform: 'lower' } }).masked).toBe('ab');
		expect(
			run('DD', '١٢', {
				D: { pattern: /[0-9]/, transform: (char) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(char)) }
			}).masked
		).toBe('12');
	});

	test('a global flag on the token pattern does not make it stateful', () => {
		expect(run('GGG', 'aaa', { G: { pattern: /a/g } }).masked).toBe('aaa');
	});
});

describe('engine helpers', () => {
	test('the tail shows empty slots and the separators between them', () => {
		const engine = createMaskEngine({ mask: 'AA-###-AA' });
		expect(engine.tail('')).toBe('__-___-__');
		expect(engine.tail('AB-1')).toBe('__-__');
		expect(engine.tail('AB-123-CD')).toBe('');
		expect(createMaskEngine({ mask: '(###)', placeholderChar: '•' }).tail('(1')).toBe('••)');
	});

	test('numeric only when every slot takes digits', () => {
		expect(createMaskEngine({ mask: '### ###' }).numeric).toBe(true);
		expect(createMaskEngine({ mask: ['(###)', '+## #'] }).numeric).toBe(true);
		expect(createMaskEngine({ mask: 'AA-###' }).numeric).toBe(false);
		expect(
			createMaskEngine({ mask: '###', tokens: { '#': { pattern: /[0-9a-f]/ } } }).numeric
		).toBe(false);
		expect(createMaskEngine({ mask: '---' }).numeric).toBe(false);
	});

	test('display adds the placeholder only when it shows', () => {
		const engine = createMaskEngine({ mask: 'AA-###' });
		expect(createMaskedInputMaskito(engine, 'always').display('AB1', false)).toBe('AB-1__');
		expect(createMaskedInputMaskito(engine, 'focus').display('AB1', false)).toBe('AB-1');
		expect(createMaskedInputMaskito(engine, 'focus').display('AB1', true)).toBe('AB-1__');
		expect(createMaskedInputMaskito(engine, 'never').display('AB1', true)).toBe('AB-1');
	});

	test('strip removes the placeholder the input shows', () => {
		const engine = createMaskEngine({ mask: 'AA-###' });
		const maskito = createMaskedInputMaskito(engine, 'always');
		maskito.sync('AB-1');
		expect(maskito.strip('AB-1__')).toBe('AB-1');
		expect(maskito.strip('AB-12_')).toBe('AB-12');
	});
});

describe('agent tool schema', () => {
	test('describes the format and the app tokens', () => {
		expect(describeMaskForTool('AA-###-AA')).toContain('Format "AA-###-AA"');
		expect(describeMaskForTool(['(###)', '+## #'])).toContain('"(###)" or "+## #"');
		expect(describeMaskForTool('XX', { X: { pattern: /[A-Z]/ } })).toContain(
			'X app-defined characters'
		);
		expect(describeMaskForTool((raw) => raw)).toContain('Send the characters only');
	});

	test("a Form entry of type 'masked' is a string for agents", () => {
		const input = { type: 'masked', label: 'Plate', mask: 'AA-###-AA' } as FormValueInput;
		expect(fieldToolSchema(input)).toEqual({
			type: 'string',
			description: describeMaskForTool('AA-###-AA')
		});
	});
});
