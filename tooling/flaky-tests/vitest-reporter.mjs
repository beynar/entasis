// Vitest reporter (CI only, see vite.config.ts): lists tests that passed on a retry.
import { reportFlaky } from './summary.mjs';

export default class FlakyReporter {
	flaky = [];

	onTestCaseResult(testCase) {
		const diagnostic = testCase.diagnostic();
		if (testCase.result().state !== 'passed' || !diagnostic?.retryCount) return;
		this.flaky.push({
			name: testCase.fullName,
			file: testCase.module.moduleId,
			line: testCase.location?.line,
			project: testCase.project.name,
			retries: diagnostic.retryCount
		});
	}

	onTestRunEnd() {
		reportFlaky('Vitest', this.flaky);
		this.flaky = [];
	}
}
