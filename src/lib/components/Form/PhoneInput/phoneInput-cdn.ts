export type PhoneCountry = {
	iso2: string;
	dialCode: string;
	name?: string;
};

export type IntlTelInputInstance = {
	readonly promise: Promise<void>;
	destroy(): void;
	getNumber(): string;
	getSelectedCountry(): { iso2: string } | null;
	isValidNumber(): boolean | null;
	setSelectedCountry(iso2: string): void;
};

type IntlTelInputOptions = {
	strictMode?: boolean;
	initialCountry?: string;
	allowPhonewords?: boolean;
	formatAsYouType?: boolean;
	separateDialCode?: boolean;
	showFlags?: boolean;
	countrySelectorMode?: string;
	containerClass?: string;
};

export type IntlTelInputLibrary = {
	(input: HTMLInputElement, options?: IntlTelInputOptions): IntlTelInputInstance;
	getAllCountries: () => PhoneCountry[];
	utils?: unknown;
};

const INTL_TEL_INPUT_CDN_VERSION = '29.1.1';
const INTL_TEL_INPUT_SCRIPT_ID = 'svelai-intl-tel-input-script';
const INTL_TEL_INPUT_SCRIPT_URL = `https://cdn.jsdelivr.net/npm/intl-tel-input@${INTL_TEL_INPUT_CDN_VERSION}/dist/js/intlTelInputWithUtils.min.js`;

type IntlTelInputWindow = Window & {
	intlTelInput?: IntlTelInputLibrary;
};

let intlTelInputPromise: Promise<IntlTelInputLibrary> | null = null;

export function loadIntlTelInputFromCdn(): Promise<IntlTelInputLibrary> {
	if (typeof window === 'undefined' || typeof document === 'undefined') {
		return Promise.reject(new Error('intl-tel-input can only be loaded in a browser.'));
	}

	const existingLibrary = readWindowIntlTelInput();
	if (existingLibrary) {
		return Promise.resolve(existingLibrary);
	}

	intlTelInputPromise ??= createIntlTelInputScriptPromise().catch((error: unknown) => {
		intlTelInputPromise = null;
		throw error;
	});

	return intlTelInputPromise;
}

function createIntlTelInputScriptPromise(): Promise<IntlTelInputLibrary> {
	return new Promise((resolve, reject) => {
		const existingLibrary = readWindowIntlTelInput();
		if (existingLibrary) {
			resolve(existingLibrary);
			return;
		}

		const existingScript = document.getElementById(INTL_TEL_INPUT_SCRIPT_ID);
		const script =
			existingScript instanceof HTMLScriptElement ? existingScript : createIntlTelInputScript();

		if (existingScript instanceof HTMLScriptElement && script.dataset.status === 'loaded') {
			script.remove();
			reject(new Error('intl-tel-input CDN script loaded without exposing window.intlTelInput.'));
			return;
		}

		script.addEventListener(
			'load',
			() => {
				script.dataset.status = 'loaded';
				const library = readWindowIntlTelInput();

				if (!library) {
					script.remove();
					reject(
						new Error('intl-tel-input CDN script loaded without exposing window.intlTelInput.')
					);
					return;
				}

				resolve(library);
			},
			{ once: true }
		);
		script.addEventListener(
			'error',
			() => {
				script.remove();
				reject(new Error(`Failed to load intl-tel-input from ${INTL_TEL_INPUT_SCRIPT_URL}.`));
			},
			{ once: true }
		);

		if (!existingScript) {
			document.head.append(script);
		}
	});
}

function createIntlTelInputScript(): HTMLScriptElement {
	const script = document.createElement('script');
	script.id = INTL_TEL_INPUT_SCRIPT_ID;
	script.src = INTL_TEL_INPUT_SCRIPT_URL;
	script.async = true;
	script.dataset.status = 'loading';
	return script;
}

function readWindowIntlTelInput(): IntlTelInputLibrary | null {
	const library = (window as IntlTelInputWindow).intlTelInput;

	if (!library || typeof library !== 'function' || typeof library.getAllCountries !== 'function') {
		return null;
	}

	return library;
}
