import path from 'node:path';
import { readFile } from 'node:fs/promises';
import { parse } from 'svelte/compiler';
import ts from 'typescript';
import {
	createSourceProgram,
	listSources,
	loadManifest,
	moduleExports,
	propertyName,
	repositoryRoot
} from './component-contract/source.mjs';

const deprecatedCallbacks = new Set([
	'onClick',
	'onChange',
	'onOpen',
	'onClose',
	'onEnter',
	'onLeave'
]);
const controlledContracts = [
	['value', 'defaultValue', 'onValueChange'],
	['open', 'defaultOpen', 'onOpenChange']
];
const readOnlyValues = new Map([
	['RatingProps', 'Displays a rating; native star events report interactions to RatingInput.'],
	['MeterProps', 'Displays a measured value without editing it.'],
	['ProgressCircleProps', 'Displays progress without editing it.'],
	['QRCodeProps', 'Encodes the supplied content without editing it.']
]);
// Each exemption names the domain owner and measurement; unused exemptions fail the check.
const domainSizes = new Map([
	['AIFilePreviewSource.size', 'File byte count'],
	['AIFileSource.size', 'File byte count'],
	['AIThreadTocEntry.size', 'Measured virtual transcript row height'],
	['AIComposerAttachment.size', 'File byte count'],
	['ResizablePanelPayload.size', 'Panel share as a percentage'],
	['ResizableHandleAriaLabel.size', 'Panel share as a percentage'],
	['ResizableHandlePayload.size', 'Panel share as a percentage'],
	['GlobeMarker.size', 'Globe marker magnitude'],
	['ChartAxisTicks.size', 'Plot axis tick length in pixels'],
	['IconProps.size', 'SVG snippet viewport dimension in CSS units'],
	['ChartScatterSize.size', 'Scatter mark radius or data channel']
]);
const usedDomainSizes = new Set();
const errors = new Set();
const files = (await listSources(path.join(repositoryRoot, 'src/lib'))).filter(
	(filename) => !filename.endsWith('.mcp.ts') && !/\.(test|spec)\./.test(filename)
);
const entries = await loadManifest();
const virtualSources = new Map();
for (const entry of entries) {
	if (entry.visibility !== 'public' || !entry.sourceIndex.endsWith('/index.ts')) continue;
	const indexPath = path.join(repositoryRoot, entry.sourceIndex);
	const index = ts.createSourceFile(
		indexPath,
		await readFile(indexPath, 'utf8'),
		ts.ScriptTarget.Latest,
		true
	);
	for (const statement of index.statements) {
		if (
			!ts.isExportDeclaration(statement) ||
			!statement.moduleSpecifier ||
			!ts.isStringLiteral(statement.moduleSpecifier) ||
			!statement.moduleSpecifier.text.endsWith('.svelte')
		)
			continue;
		const filename = path.resolve(path.dirname(indexPath), statement.moduleSpecifier.text);
		const source = await readFile(filename, 'utf8');
		const parsed = parse(source, { filename, modern: true });
		if (!parsed.instance) continue;
		const script = source.slice(parsed.instance.content.start, parsed.instance.content.end);
		const scriptFile = ts.createSourceFile(filename, script, ts.ScriptTarget.Latest, true);
		const localTypes = new Set(
			scriptFile.statements
				.filter((node) => ts.isTypeAliasDeclaration(node) || ts.isInterfaceDeclaration(node))
				.map((node) => node.name.text)
		);
		let hasLocalProps = false;
		const findProps = (node) => {
			if (
				ts.isVariableDeclaration(node) &&
				node.initializer &&
				ts.isCallExpression(node.initializer) &&
				node.initializer.expression.getText(scriptFile) === '$props' &&
				node.type
			) {
				const findLocalType = (type) => {
					if (
						ts.isTypeLiteralNode(type) ||
						(ts.isTypeReferenceNode(type) && localTypes.has(type.typeName.getText(scriptFile)))
					)
						hasLocalProps = true;
					ts.forEachChild(type, findLocalType);
				};
				findLocalType(node.type);
			}
			ts.forEachChild(node, findProps);
		};
		findProps(scriptFile);
		if (!hasLocalProps) continue;
		const imports = scriptFile.statements
			.filter(ts.isImportDeclaration)
			.map((node) => node.getText(scriptFile))
			.join('\n');
		const body = scriptFile.statements
			.filter((node) => !ts.isImportDeclaration(node))
			.map((node) => node.getFullText(scriptFile))
			.join('\n');
		const generics = source
			.slice(parsed.instance.start, parsed.instance.content.start)
			.match(/generics="([^"]+)"/)?.[1];
		virtualSources.set(
			`${filename}.contract.ts`,
			`${imports}\nfunction componentContract${generics ? `<${generics}>` : ''}() {\n${body}\n}`
		);
	}
}
const program = createSourceProgram(files, virtualSources);
const checker = program.getTypeChecker();
const exposedDeclarations = new Set();
const exportedProps = new Set();
const local = (node) =>
	node?.getSourceFile().fileName.startsWith(path.join(repositoryRoot, 'src/lib/'));
const report = (node, message) => {
	const source = node.getSourceFile();
	const filename = path.relative(repositoryRoot, source.fileName);
	const location = virtualSources.has(source.fileName)
		? filename.replace(/\.contract\.ts$/, '')
		: `${filename}:${source.getLineAndCharacterOfPosition(node.getStart()).line + 1}`;
	errors.add(`${location}: ${message}`);
};

function exposeDeclaration(declaration) {
	if (!local(declaration) || exposedDeclarations.has(declaration)) return;
	if (!ts.isTypeAliasDeclaration(declaration) && !ts.isInterfaceDeclaration(declaration)) return;
	exposedDeclarations.add(declaration);
	const visit = (node) => {
		if (ts.isTypeReferenceNode(node) || ts.isExpressionWithTypeArguments(node)) {
			let symbol = checker.getSymbolAtLocation(node.typeName ?? node.expression);
			if (symbol?.flags & ts.SymbolFlags.Alias) symbol = checker.getAliasedSymbol(symbol);
			for (const referenced of symbol?.declarations ?? []) exposeDeclaration(referenced);
		}
		ts.forEachChild(node, visit);
	};
	visit(declaration);
}

for (const entry of entries) {
	if (
		entry.visibility !== 'public' ||
		entry.sourceIndex.includes('*') ||
		entry.sourceIndex === 'package.json'
	)
		continue;
	for (let symbol of moduleExports(program, path.join(repositoryRoot, entry.sourceIndex))) {
		if (symbol.flags & ts.SymbolFlags.Alias) symbol = checker.getAliasedSymbol(symbol);
		for (const declaration of symbol.declarations ?? []) {
			exposeDeclaration(declaration);
			if (
				(ts.isTypeAliasDeclaration(declaration) || ts.isInterfaceDeclaration(declaration)) &&
				declaration.name.text.endsWith('Props')
			)
				exportedProps.add(declaration);
		}
	}
}
// The icon factory exposes this private type through its inferred snippet return type.
for (const statement of program.getSourceFile(
	path.join(repositoryRoot, 'src/lib/components/Icons/index.svelte.ts')
).statements) {
	if (ts.isTypeAliasDeclaration(statement) && statement.name.text === 'IconProps')
		exposeDeclaration(statement);
}

function hasAny(type, seen = new Set()) {
	if (type.flags & ts.TypeFlags.Any) return true;
	if (seen.has(type)) return false;
	seen.add(type);
	if (type.isUnionOrIntersection()) return type.types.some((part) => hasAny(part, seen));
	// A caller's generic type and a typed state controller do not erase their payload type.
	if (type.flags & (ts.TypeFlags.TypeParameter | ts.TypeFlags.Conditional)) return false;
	if (type.objectFlags & ts.ObjectFlags.Reference) {
		if (checker.getTypeArguments(type).some((argument) => hasAny(argument, seen))) return true;
	}
	if (type.aliasTypeArguments?.some((argument) => hasAny(argument, seen))) return true;
	if (type.symbol?.declarations?.some(ts.isClassDeclaration)) return false;
	if (
		checker
			.getIndexInfosOfType(type)
			.some((index) => index.declaration && local(index.declaration) && hasAny(index.type, seen))
	)
		return true;
	for (const property of checker.getPropertiesOfType(type)) {
		const declaration = property.valueDeclaration ?? property.declarations?.[0];
		if (
			local(declaration) &&
			hasAny(checker.getTypeOfSymbolAtLocation(property, declaration), seen)
		)
			return true;
	}
	return false;
}

function callbackSignatures(type) {
	return type.isUnion()
		? type.types.flatMap(callbackSignatures)
		: checker.getSignaturesOfType(type, ts.SignatureKind.Call);
}

function ownerName(node) {
	let owner = node.parent;
	const names = [];
	while (owner && !ts.isSourceFile(owner)) {
		if (ts.isTypeAliasDeclaration(owner) || ts.isInterfaceDeclaration(owner)) {
			names.unshift(owner.name.text);
			break;
		}
		if (ts.isPropertySignature(owner) && propertyName(owner)) names.unshift(propertyName(owner));
		owner = owner.parent;
	}
	return [...names, propertyName(node)].join('.');
}

function checkProperty(node) {
	const name = propertyName(node);
	if (!name) return;
	if (deprecatedCallbacks.has(name)) report(node, `deprecated callback ${name}`);
	if (ts.isPropertySignature(node) && /^on[a-z]/.test(name)) {
		const nativeEvent = checker.resolveName('Event', node, ts.SymbolFlags.Type, false);
		for (const signature of callbackSignatures(checker.getTypeAtLocation(node))) {
			const parameter = signature.getParameters()[0];
			if (!parameter) continue;
			const parameterType =
				parameter &&
				checker.getTypeOfSymbolAtLocation(parameter, parameter.valueDeclaration ?? node);
			if (
				!parameterType ||
				parameterType.flags & ts.TypeFlags.Any ||
				!nativeEvent ||
				!checker.isTypeAssignableTo(parameterType, checker.getDeclaredTypeOfSymbol(nativeEvent))
			)
				report(node, `lowercase callback ${name} must receive a native Event`);
		}
	}
	if (/^on[A-Z]/.test(name)) {
		const type = checker.getTypeAtLocation(node);
		if (type.flags & ts.TypeFlags.Any) report(node, `callback ${name} uses any`);
		for (const signature of callbackSignatures(type)) {
			const parameters = signature.getParameters();
			if (parameters.length > 1)
				report(
					node,
					`callback ${name} must use one payload object, found ${parameters.length} positional parameters`
				);
			for (const parameter of parameters) {
				const declaration = parameter.valueDeclaration ?? parameter.declarations?.[0] ?? node;
				if (ts.isParameter(declaration) && declaration.dotDotDotToken)
					report(node, `callback ${name} must use one payload object instead of rest parameters`);
				if (hasAny(checker.getTypeOfSymbolAtLocation(parameter, declaration)))
					report(node, `callback ${name} uses any in its payload`);
			}
		}
	}
	if (name !== 'size' || !node.type) return;
	const type = checker.getTypeAtLocation(node);
	const parts = type.isUnion() ? type.types : [type];
	if (!parts.some((part) => (part.flags & (ts.TypeFlags.NumberLike | ts.TypeFlags.Any)) !== 0))
		return;
	const owner = ownerName(node);
	if (domainSizes.has(owner)) usedDomainSizes.add(owner);
	else report(node, `numeric size ${owner} has no explicit domain justification`);
}

function checkProps(declaration, label = declaration.name.text) {
	const type =
		ts.isVariableDeclaration(declaration) && declaration.type
			? checker.getTypeFromTypeNode(declaration.type)
			: checker.getTypeAtLocation(declaration);
	const branches = type.isUnion() ? type.types : [type];
	for (const branch of branches) {
		const properties = checker.getPropertiesOfType(branch);
		const names = new Set(properties.map((property) => property.name));
		for (const contract of controlledContracts) {
			const state = properties.find((property) => property.name === contract[0]);
			const hasDeclaredState = state?.declarations?.some(
				(node) => local(node) && ts.isPropertySignature(node)
			);
			if (
				!contract.slice(1).some((name) => names.has(name)) &&
				(!hasDeclaredState ||
					(contract[0] === 'value' && readOnlyValues.has(`${label.replace(/Props$/, '')}Props`)))
			)
				continue;
			for (const name of contract) {
				if (!names.has(name))
					report(declaration, `${label} is missing controlled-state prop ${name}`);
			}
			const callback = properties.find((property) => property.name === contract[2]);
			if (!state || !callback) continue;
			const stateDeclaration = state.valueDeclaration ?? state.declarations?.[0] ?? declaration;
			const stateType = checker.getTypeOfSymbolAtLocation(state, stateDeclaration);
			for (const signature of callbackSignatures(
				checker.getTypeOfSymbolAtLocation(callback, declaration)
			)) {
				const parameters = signature.getParameters();
				if (parameters.length !== 1)
					report(declaration, `${label}.${contract[2]} must receive its semantic state value`);
				else {
					const parameter = parameters[0];
					let parameterType = checker.getTypeOfSymbolAtLocation(
						parameter,
						parameter.valueDeclaration ?? declaration
					);
					const embeddedValue = checker.getPropertyOfType(parameterType, contract[0]);
					if (embeddedValue)
						parameterType = checker.getTypeOfSymbolAtLocation(
							embeddedValue,
							embeddedValue.valueDeclaration ?? declaration
						);
					// Rich-text changes carry the edited string as markdown beside token metadata.
					if (label === 'RichTextInputProps' && contract[0] === 'value') {
						const markdown = checker.getPropertyOfType(parameterType, 'markdown');
						if (markdown)
							parameterType = checker.getTypeOfSymbolAtLocation(
								markdown,
								markdown.valueDeclaration ?? declaration
							);
					}
					const states = stateType.isUnion() ? stateType.types : [stateType];
					const unresolved = (type) =>
						type.isUnionOrIntersection()
							? type.types.some(unresolved)
							: Boolean(type.flags & (ts.TypeFlags.TypeParameter | ts.TypeFlags.Conditional));
					if (
						!checker.isTypeAssignableTo(parameterType, stateType) &&
						![parameterType, ...states].some(unresolved)
					)
						report(declaration, `${label}.${contract[2]} payload is not its semantic state type`);
				}
			}
		}
		for (const property of properties) {
			for (const node of property.declarations ?? []) {
				if (!local(node) || (!ts.isPropertySignature(node) && !ts.isMethodSignature(node)))
					continue;
				if (node.type && checker.getTypeFromTypeNode(node.type).flags & ts.TypeFlags.Never)
					continue;
				if (ts.getJSDocCommentsAndTags(node).length === 0)
					report(node, `${label}.${property.name} has no public documentation`);
			}
		}
	}
}

for (const declaration of exposedDeclarations) {
	if (declaration.getSourceFile().fileName.endsWith('.theme.ts')) continue;
	const visit = (node) => {
		if (ts.isPropertySignature(node) || ts.isMethodSignature(node)) checkProperty(node);
		ts.forEachChild(node, visit);
	};
	visit(declaration);
	if (exportedProps.has(declaration)) checkProps(declaration);
}
for (const filename of virtualSources.keys()) {
	const source = program.getSourceFile(filename);
	const visit = (node) => {
		if (
			ts.isVariableDeclaration(node) &&
			node.initializer &&
			ts.isCallExpression(node.initializer) &&
			node.initializer.expression.getText(source) === '$props'
		) {
			checkProps(node, path.basename(filename, '.svelte.contract.ts'));
			const properties = checker.getPropertiesOfType(
				node.type ? checker.getTypeFromTypeNode(node.type) : checker.getTypeAtLocation(node)
			);
			for (const property of properties)
				for (const declaration of property.declarations ?? [])
					if (
						local(declaration) &&
						(ts.isPropertySignature(declaration) || ts.isMethodSignature(declaration))
					)
						checkProperty(declaration);
		}
		ts.forEachChild(node, visit);
	};
	visit(source);
}
for (const owner of domainSizes.keys())
	if (!usedDomainSizes.has(owner)) errors.add(`Stale numeric-size domain exemption: ${owner}`);
if (errors.size)
	throw new Error(`Public API contract check failed:\n- ${[...errors].join('\n- ')}`);
console.log(
	`Public API contract check passed (${files.length} source files; ${virtualSources.size} component scripts; ${usedDomainSizes.size} justified domain sizes).`
);
