// Playwright reporter (CI only, see playwright.config.ts): lists tests whose outcome is `flaky`,
// failed first and passed on a retry.
import { reportFlaky } from './summary.mjs';

export default class FlakyReporter {
	onBegin(_config, suite) {
		this.suite = suite;
	}

	onEnd() {
		const flaky = (this.suite?.allTests() ?? [])
			.filter((test) => test.outcome() === 'flaky')
			.map((test) => ({
				// Root, project and file suites come first in the title path.
				name: test.titlePath().slice(3).join(' › '),
				file: test.location.file,
				line: test.location.line,
				project: test.parent.project()?.name || undefined,
				retries: test.results.length - 1
			}));
		reportFlaky('Playwright', flaky);
	}

	printsToStdio() {
		return false;
	}
}
