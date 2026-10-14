import ts from 'typescript';
import { describe, expect, test } from 'vitest';
import source from './avatar.props.ts?raw';

// The docs props table is built from each prop's JSDoc description, which leaves out tags such
// as @deprecated, so a deprecated alias needs a plain sentence too or its row renders empty.
describe('avatar props documentation', () => {
	test('the deprecated delay alias has a description that points at revealDelay', () => {
		const sourceFile = ts.createSourceFile('avatar.props.ts', source, ts.ScriptTarget.Latest, true);
		let description = '';
		const visit = (node: ts.Node) => {
			if (ts.isPropertySignature(node) && node.name.getText(sourceFile) === 'delay') {
				const doc = (node as unknown as { jsDoc?: ts.JSDoc[] }).jsDoc?.[0];
				description = ts.getTextOfJSDocComment(doc?.comment) ?? '';
			}
			ts.forEachChild(node, visit);
		};
		visit(sourceFile);
		expect(description).toContain('revealDelay');
	});
});
