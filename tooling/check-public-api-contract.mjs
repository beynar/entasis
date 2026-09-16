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
// A bindable `value` owes the caller a `defaultValue`. A props file opts out by marking the
// property `/** @readonly-value <reason> */`, which keeps the reason next to the declaration.
const readOnlyValueMarker = /@readonly-value[ \t]+(\S[^\n*]*)/;
// Prop names retired by the vocabulary pass, with the replacement each caller should reach for.
const retiredPropNames = new Map([
	['hoverDelay', 'the delay before a hover-opened surface opens is `delay`'],
	['onToggle', 'report the resulting state instead: `onOpenChange` or `onValueChange`'],
	['onWidthChanged', 'change callbacks are present tense: `onWidthChange`'],
	['onPageChange', 'a paginated value reports through `onValueChange`'],
	['page', 'the current page is the component value: `value` / `defaultValue` / `onValueChange`']
]);
// Each exemption names the owner and why the retired word is the domain word there; unused
// exemptions fail the check.
const retiredPropExemptions = new Map([
	[
		'DocumentViewerProps.page',
		'A document page is one coordinate beside sheet, scale, and rotation, not the viewer value.'
	],
	[
		'DocumentViewerProps.onPageChange',
		'Reports the document coordinate exempted above; the viewer has no single value to change.'
	]
]);
const usedRetiredPropExemptions = new Set();
// A boolean prop is the adjective the caller reads off the tag: `open`, `disabled`, `loading`, or
// `show*` for optional chrome. A verb or copula prefix (`isOpen`, `enableSystem`, `allowCustom`,
// `withHandle`) re-states in the name what the boolean type already says, and the two spellings
// drift apart across components. Scoped to component props types the way `checkVocabulary` is:
// nested payload and item types describe data, not the tag, and keep their own vocabulary.
const booleanPrefix = /^(is|enable|disable|allow|with|has|can|no)[A-Z]/;
// Each exemption names the props type and why the prefix is the domain word there; unused
// exemptions fail the check.
const booleanPrefixExemptions = new Map();
const usedBooleanPrefixExemptions = new Set();
// `label` is the one prop that names a component, whether or not the name is painted: a visible
// label, an `aria-label`, or an `aria-labelledby` pointing at the rendered label. `ariaLabel` (and
// the DOM spelling `aria-label`) is therefore never a prop name.
const ariaLabelPropNames = new Set(['ariaLabel', 'aria-label']);
// Attribute bags a component hands back for the caller to spread onto a DOM node are not props;
// each exemption names the bag and why the DOM spelling is the point. Unused exemptions fail.
const ariaLabelAttributeBags = new Map([
	[
		'src/lib/components/Carousel/carousel.props.ts:NavigationButton.aria-label',
		'ARIA attributes the carousel spreads onto a custom navigation button, not props it accepts.'
	],
	[
		'src/lib/components/Carousel/carousel.props.ts:Dot.aria-label',
		'ARIA attributes the carousel spreads onto a custom pagination dot, not props it accepts.'
	]
]);
const usedAriaLabelAttributeBags = new Set();
// Every component that renders an interactive control with no visible text of its own owes the
// caller a `label`. This registry is that list: the props type, and the control the name lands on.
const accessibleNameProps = new Map([
	[
		'InputProps',
		"The Field family's one name: painted beside the control, or spoken when the control paints none."
	],
	[
		'ButtonPrimitiveProps',
		'An icon-only button paints nothing; `children` is the visible text when there is any.'
	],
	['ToggleButtonProps', 'Same button, pressed state added: the icon-only case still needs a name.'],
	['ToggleButtonGroupProps', 'Names the group wrapping the toggles.'],
	['ToggleMenuProps', 'Names the toolbar wrapping the toggles, groups, and menus.'],
	['SelectionMenuProps', 'Names the floating toolbar it raises over a selection.'],
	[
		'SegmentedControlProps',
		'Names the radiogroup; each segment names itself from its own `label`.'
	],
	['PaginationProps', 'Names the navigation landmark around the page controls.'],
	['ScrollAreaProps', 'Names the scrolling viewport, which is focusable and paints no text.'],
	['ChartProps', 'A plot is a graphics role with no text of its own; the name is required.'],
	['QRCodeProps', 'The rendered code is an image with no text.'],
	['TableOfContentsProps', 'Names the navigation landmark around the rail.'],
	['AudioPlayerProps', 'Names the player region; falls back to the track title.'],
	['VideoPlayerProps', 'Names the player region; falls back to the video title.'],
	['CalendarPrimitiveProps', 'Names the calendar group; the month grids name themselves.'],
	['SpinnerProps', 'Names the status region when no visible text is rendered.'],
	['SpinnerTextProps', 'Names the status region when `texts` is empty.'],
	['ProgressCircleProps', 'Names the progressbar when no text is drawn inside the ring.'],
	['NetworkIndicatorProps', 'Names the status dot when no text is drawn beside it.'],
	['MediaVolumeControlProps', 'Names the volume slider when no text is drawn beside it.'],
	['TabbarProps', 'Names the tab list, so a page showing two sets of tabs tells them apart.']
]);
const usedAccessibleNameProps = new Set();
// The other side of the rule: components that do render interactive controls yet genuinely owe the
// caller no name prop. One line each; an entry that turns out to declare `label` is stale.
const unnamedInteractiveProps = new Map([
	[
		'CarouselProps',
		'Its arrows and dots are named per slide from the i18n catalog; the caller names nothing.'
	],
	['ResizableProps', 'The only control is the separator handle, named from the i18n catalog.'],
	['SortableListProps', 'The only control is the drag handle, named from the i18n catalog.'],
	['StepperProps', 'Each panel is named by its own step through `panelAriaLabelledby`.'],
	['TabsProps', 'Every tab paints its own text.'],
	['TreeProps', 'Every row paints its own text.'],
	['KanbanProps', 'Every column and card paints its own text.'],
	['ToastProps', 'The toast paints its title; its dismiss button is named from the i18n catalog.'],
	['CommandProps', 'The palette input carries the placeholder and every row paints its own text.'],
	[
		'BreadcrumbsProps',
		'Every crumb paints its own text; the landmark is named from the i18n catalog.'
	],
	['SidebarProps', 'Every rail item, menu entry, and action carries its own `label`.']
]);
const usedUnnamedInteractiveProps = new Set();
// A bindable handle is the component's imperative API and is always called `api`.
const handlePropExemptions = new Map([
	[
		'Form.form',
		'FormState is also the context every Form.* input resolves by name; renaming the prop to `api` is its own cascade.'
	]
]);
const usedHandleExemptions = new Set();
// Literal members the vocabulary pass retired, with what replaced them.
const retiredLiterals = new Map([
	['outlined', "'outline'"],
	['math', "'plus-minus'"],
	['caret', "'chevron'"],
	['topLeft', "'top-left'"],
	['topRight', "'top-right'"],
	['bottomLeft', "'bottom-left'"],
	['bottomRight', "'bottom-right'"]
]);
// Tailwind's breakpoint words are not a component size scale: `Sizes` from src/lib/types/theme.ts
// is. Each exemption names a union that really does address Tailwind's own scales.
const sizeScaleTokens = new Set(['xs', 'sm', 'md', 'lg', 'xl']);
// The other way a component size scale gets re-declared is by spelling `Sizes` out under a local
// alias (the `MarkdownSize = 'small' | 'normal' | 'large'` this pass removed). A union carrying
// all three words is that scale whatever it is called.
const sizesTokens = new Set(['small', 'normal', 'large']);
const sizeUnionExemptions = new Map([
	[
		'src/lib/components/Theme/theme.ts:Breakpoint',
		'Viewport breakpoint tracked from the Tailwind screens, shared by Dialog and Menu.'
	],
	[
		'src/lib/tailwind/scales.ts:ThemeSpacingStep',
		'Key of the generated Tailwind --space-* scale, not a component size.'
	],
	[
		'src/lib/components/Layout/layoutSpacing.ts:LayoutSpacing',
		'Key of the Tailwind --space-* scale used by Stack and Grid gap and padding.'
	]
]);
const usedSizeUnionExemptions = new Set();
// Configuring a child component by flattening its props under the child's name (`tabbarSize`,
// `cardVariant`) re-declares that child's API one prop at a time, and the copy drifts the moment
// the child gains or renames anything. A child is configured through one nested object named
// after it, the way PopupMenu takes `menu={{ items }}`: `tabbar={{ size }}`, `card={{ variant }}`.
const childPrefix = /^(tabbar|card|menu|dialog|popover)[A-Z]/;
// Each exemption names the props file, the declaring type, and why the prefixed name is not a
// flattened copy of that child's props; unused exemptions fail the check.
const childPrefixExemptions = new Map([
	[
		'src/lib/components/AIModelSelector/aiModelSelector.props.ts:AIModelSelectorProps.menuItems',
		'Extra items the selector appends after its model choices; the items are its own data, not Menu props.'
	],
	[
		'src/lib/components/Kanban/kanban.props.ts:KanbanProps.cardHandle',
		"Drag gate for the board's own card rows. Kanban renders no Card component to forward props to."
	],
	[
		'src/lib/components/Sidebar/sidebar.props.ts:SidebarMenuActionDescriptor.menuClass',
		'Placement and class of the popup this descriptor opens, beside the `menu` items it lists; the descriptor is sidebar data, not a props object handed to Menu.'
	],
	[
		'src/lib/components/Sidebar/sidebar.props.ts:SidebarMenuActionDescriptor.menuSide',
		'Placement of the popup this descriptor opens; sidebar data, not Menu props.'
	],
	[
		'src/lib/components/Sidebar/sidebar.props.ts:SidebarMenuActionDescriptor.menuAlign',
		'Alignment of the popup this descriptor opens; sidebar data, not Menu props.'
	],
	[
		'src/lib/components/Sidebar/sidebar.props.ts:SidebarMenuEntryBase.menuClass',
		'Class of the popup this entry opens; sidebar data, not Menu props.'
	],
	[
		'src/lib/components/Sidebar/sidebar.props.ts:SidebarMenuEntryBase.menuSide',
		'Placement of the popup this entry opens; sidebar data, not Menu props.'
	],
	[
		'src/lib/components/Sidebar/sidebar.props.ts:SidebarMenuEntryBase.menuAlign',
		'Alignment of the popup this entry opens; sidebar data, not Menu props.'
	],
	[
		'src/lib/components/Sidebar/sidebar.props.ts:SidebarMenuButtonItemBase.menuSide',
		'Placement of the popup this item opens; sidebar data, not Menu props.'
	],
	[
		'src/lib/components/Sidebar/sidebar.props.ts:SidebarMenuButtonItemBase.menuAlign',
		'Alignment of the popup this item opens; sidebar data, not Menu props.'
	],
	[
		'src/lib/components/Sidebar/sidebar.props.ts:SidebarMenuButtonItemBase.menuClass',
		'Class of the popup this item opens; sidebar data, not Menu props.'
	],
	[
		'src/lib/components/Sidebar/sidebar.props.ts:SidebarMenuButtonItemBase.menuIconClass',
		'Class of the icon this item draws inside its popup trigger; sidebar data, not Menu props.'
	],
	[
		'src/lib/components/Sidebar/sidebar.props.ts:SidebarMenuButtonItemBase.menuShowLabel',
		'Whether this item paints its label beside the icon; sidebar data, not Menu props.'
	]
]);
const usedChildPrefixExemptions = new Set();
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
// An exemption is stale once the declaration it names stops needing it. That verdict is only
// available when the run actually compiled that declaration: a reduced source tree (the contract
// fixture in tooling/component-contract/verify-checks.mjs compiles a single component) says
// nothing about an exemption whose owner it never wrote. These record what was inspected so the
// stale sweeps can tell "no longer needed" from "not in this tree".
const inspectedPropsTypes = new Set();
const inspectedComponents = new Set();
const inspectedFiles = new Set();
const errors = new Set();
const files = (await listSources(path.join(repositoryRoot, 'src/lib'))).filter(
	(filename) => !filename.endsWith('.mcp.ts') && !/\.(test|spec)\./.test(filename)
);
const entries = await loadManifest();
const virtualSources = new Map();
const bindableSources = new Map();
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
		const contract = `${imports}\nfunction componentContract${generics ? `<${generics}>` : ''}() {\n${body}\n}`;
		// Components that type their props inline are contract-checked in full; the rest still get a
		// compiled script so the bindable-handle rule can resolve what `$bindable()` returns.
		(hasLocalProps ? virtualSources : bindableSources).set(`${filename}.contract.ts`, contract);
	}
}
const program = createSourceProgram(files, new Map([...virtualSources, ...bindableSources]));
const checker = program.getTypeChecker();
const exposedDeclarations = new Set();
const exportedProps = new Set();
const local = (node) =>
	node?.getSourceFile().fileName.startsWith(path.join(repositoryRoot, 'src/lib/'));
const report = (node, message) => {
	const source = node.getSourceFile();
	const filename = path.relative(repositoryRoot, source.fileName);
	const location =
		virtualSources.has(source.fileName) || bindableSources.has(source.fileName)
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

function typeParts(type) {
	return type.isUnion() ? type.types.flatMap(typeParts) : [type];
}

// A handle is a state class the component hands back to the caller, exposed either directly or
// through an alias such as `StepperApi`. Plain data bags named `*State` are not handles.
function handleName(type) {
	for (const part of typeParts(type)) {
		const named = part.aliasSymbol?.name ?? part.symbol?.name;
		if (!named || !/(?:Api|State)$/.test(named)) continue;
		if (part.symbol?.declarations?.some(ts.isClassDeclaration)) return named;
	}
	return null;
}

function checkVocabulary(node, label, name) {
	inspectedPropsTypes.add(label);
	const owner = `${label}.${name}`;
	const retired = retiredPropNames.get(name);
	if (retired) {
		const numeric =
			name !== 'page' ||
			typeParts(checker.getTypeAtLocation(node)).some(
				(part) => (part.flags & ts.TypeFlags.NumberLike) !== 0
			);
		if (numeric) {
			if (retiredPropExemptions.has(owner)) usedRetiredPropExemptions.add(owner);
			else report(node, `retired prop name ${owner}: ${retired}`);
		}
	}
	if (
		booleanPrefix.test(name) &&
		typeParts(checker.getTypeAtLocation(node)).every(
			(part) => (part.flags & (ts.TypeFlags.BooleanLike | ts.TypeFlags.Undefined)) !== 0
		)
	) {
		if (booleanPrefixExemptions.has(owner)) usedBooleanPrefixExemptions.add(owner);
		else
			report(
				node,
				`boolean prop ${owner} restates its type in its name; a boolean prop is a bare adjective (\`open\`, \`disabled\`) or \`show\`-prefixed optional chrome`
			);
	}
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
		if (accessibleNameProps.has(label)) {
			usedAccessibleNameProps.add(label);
			if (!names.has('label'))
				report(
					declaration,
					`${label} renders an interactive control with no visible text of its own and must accept \`label\`: ${accessibleNameProps.get(label)}`
				);
		}
		if (unnamedInteractiveProps.has(label) && !names.has('label'))
			usedUnnamedInteractiveProps.add(label);
		for (const contract of controlledContracts) {
			const state = properties.find((property) => property.name === contract[0]);
			const hasDeclaredState = state?.declarations?.some(
				(node) => local(node) && ts.isPropertySignature(node)
			);
			const readOnly =
				contract[0] === 'value' &&
				state?.declarations?.some((node) =>
					ts
						.getJSDocCommentsAndTags(node)
						.some((documentation) => readOnlyValueMarker.test(documentation.getText()))
				);
			if (!contract.slice(1).some((name) => names.has(name)) && (!hasDeclaredState || readOnly))
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
				checkVocabulary(node, label, property.name);
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
for (const filename of [...virtualSources.keys(), ...bindableSources.keys()]) {
	const source = program.getSourceFile(filename);
	if (!source) continue;
	const component = path.basename(filename, '.svelte.contract.ts');
	inspectedComponents.add(component);
	const visit = (node) => {
		if (
			ts.isVariableDeclaration(node) &&
			node.initializer &&
			ts.isCallExpression(node.initializer) &&
			node.initializer.expression.getText(source) === '$props' &&
			ts.isObjectBindingPattern(node.name)
		) {
			const propsType = node.type
				? checker.getTypeFromTypeNode(node.type)
				: checker.getTypeAtLocation(node);
			for (const element of node.name.elements) {
				if (
					!element.initializer ||
					!ts.isCallExpression(element.initializer) ||
					element.initializer.expression.getText(source) !== '$bindable'
				)
					continue;
				const name = (element.propertyName ?? element.name).getText(source);
				if (name === 'api') continue;
				const property = checker.getPropertyOfType(propsType, name);
				const handle = handleName(
					property
						? checker.getTypeOfSymbolAtLocation(property, property.declarations?.[0] ?? element)
						: checker.getTypeAtLocation(element.initializer)
				);
				if (!handle) continue;
				const owner = `${component}.${name}`;
				if (handlePropExemptions.has(owner)) usedHandleExemptions.add(owner);
				else
					report(
						element,
						`bindable ${handle} handle ${owner} must be named api so every component hands its instance back the same way`
					);
			}
		}
		ts.forEachChild(node, visit);
	};
	visit(source);
}
const themeTypes = path.join(repositoryRoot, 'src/lib/types/theme.ts');
const declaringName = (node) => {
	let owner = node.parent;
	while (owner && !ts.isSourceFile(owner)) {
		if (ts.isTypeAliasDeclaration(owner) || ts.isInterfaceDeclaration(owner))
			return owner.name.text;
		owner = owner.parent;
	}
	return null;
};
// A cva variant key is the other half of every literal rename: `classes.root({ position:
// 'top-right' })` resolves no class at all when the theme still spells the key `topRight`, and
// nothing else in the build notices. Only keys inside a `variants` object are read, so theme part
// names that happen to share a retired word (`caret`, `math`) stay untouched.
const checkVariantKeys = (node) => {
	if (!ts.isPropertyAssignment(node) || propertyName(node) !== 'variants') return;
	if (!ts.isObjectLiteralExpression(node.initializer)) return;
	for (const variant of node.initializer.properties) {
		if (!ts.isPropertyAssignment(variant) || !ts.isObjectLiteralExpression(variant.initializer))
			continue;
		for (const key of variant.initializer.properties) {
			const text = propertyName(key);
			const replacement = text && retiredLiterals.get(text);
			if (replacement)
				report(key, `retired variant key '${text}' in a cva variants object; use ${replacement}`);
		}
	}
};
for (const filename of [...files, ...virtualSources.keys()]) {
	const source = program.getSourceFile(filename);
	if (!source) continue;
	inspectedFiles.add(path.relative(repositoryRoot, filename));
	const isThemeFile = filename.endsWith('.theme.ts');
	const isPropsFile = filename.endsWith('.props.ts') || isThemeFile || virtualSources.has(filename);
	const declaresProps = filename.endsWith('.props.ts');
	const visit = (node) => {
		if (declaresProps && ts.isPropertySignature(node)) {
			const name = propertyName(node);
			const child = name && childPrefix.exec(name)?.[1];
			if (child) {
				const key = `${path.relative(repositoryRoot, filename)}:${declaringName(node) ?? 'inline'}.${name}`;
				if (childPrefixExemptions.has(key)) usedChildPrefixExemptions.add(key);
				else
					report(
						node,
						`prefixed child prop ${key} flattens ${child}'s props; pass them as one nested object instead (\`${child}={{ ... }}\`)`
					);
			}
		}
		if (
			(declaresProps || virtualSources.has(filename)) &&
			(ts.isPropertySignature(node) || ts.isMethodSignature(node))
		) {
			const name = propertyName(node);
			if (name && ariaLabelPropNames.has(name)) {
				const key = `${path.relative(repositoryRoot, filename)}:${declaringName(node) ?? 'inline'}.${name}`;
				if (ariaLabelAttributeBags.has(key)) usedAriaLabelAttributeBags.add(key);
				else
					report(
						node,
						`${key} names a component with \`${name}\`; the accessible name is the same prop as the visible one, \`label\``
					);
			}
		}
		if (isPropsFile && ts.isLiteralTypeNode(node) && ts.isStringLiteral(node.literal)) {
			const replacement = retiredLiterals.get(node.literal.text);
			if (replacement)
				report(node, `retired literal '${node.literal.text}' in a props type; use ${replacement}`);
		}
		if (isThemeFile) checkVariantKeys(node);
		if (ts.isUnionTypeNode(node) && filename !== themeTypes) {
			const members = node.types
				.filter((part) => ts.isLiteralTypeNode(part) && ts.isStringLiteral(part.literal))
				.map((part) => part.literal.text);
			const scaleMembers = members.filter((member) => sizeScaleTokens.has(member)).length;
			// `Sizes` spelled out: every member of the union is one of its three words. A wider
			// union that merely shares a word (`'none' | 'small' | 'normal' | 'large'`, or a scale
			// that also accepts a number) is a different scale and stays its own type.
			const isSizes =
				members.length === node.types.length &&
				members.length === sizesTokens.size &&
				members.every((member) => sizesTokens.has(member));
			if (scaleMembers >= 3 || isSizes) {
				const key = `${path.relative(repositoryRoot, filename)}:${declaringName(node) ?? 'inline'}`;
				if (sizeUnionExemptions.has(key)) usedSizeUnionExemptions.add(key);
				else
					report(
						node,
						`local size scale ${key} duplicates Sizes from $lib/types/theme.js; use Sizes or justify the union as a Tailwind scale`
					);
			}
		}
		if (
			(ts.isTypeAliasDeclaration(node) || ts.isInterfaceDeclaration(node)) &&
			node.name.text === 'Sizes' &&
			filename !== themeTypes
		)
			report(node, 'Sizes is declared once, in src/lib/types/theme.ts; import it instead');
		ts.forEachChild(node, visit);
	};
	visit(source);
}
for (const owner of domainSizes.keys())
	if (!usedDomainSizes.has(owner)) errors.add(`Stale numeric-size domain exemption: ${owner}`);
// Each sweep reports an exemption only when this run compiled the declaration it names: an
// exemption whose owner is absent was not exercised, which is silence rather than staleness.
for (const owner of retiredPropExemptions.keys())
	if (!usedRetiredPropExemptions.has(owner) && inspectedPropsTypes.has(owner.split('.')[0]))
		errors.add(`Stale retired-prop-name exemption: ${owner}`);
for (const owner of handlePropExemptions.keys())
	if (!usedHandleExemptions.has(owner) && inspectedComponents.has(owner.split('.')[0]))
		errors.add(`Stale bindable-handle exemption: ${owner}`);
for (const owner of unnamedInteractiveProps.keys())
	if (!usedUnnamedInteractiveProps.has(owner) && inspectedPropsTypes.has(owner))
		errors.add(
			`Stale unnamed-interactive exemption: ${owner} declares \`label\`; move it to the accessible-name registry`
		);
for (const owner of ariaLabelAttributeBags.keys())
	if (
		!usedAriaLabelAttributeBags.has(owner) &&
		inspectedFiles.has(owner.slice(0, owner.lastIndexOf(':')))
	)
		errors.add(`Stale aria-label attribute-bag exemption: ${owner}`);
for (const owner of booleanPrefixExemptions.keys())
	if (!usedBooleanPrefixExemptions.has(owner) && inspectedPropsTypes.has(owner.split('.')[0]))
		errors.add(`Stale boolean-prop-prefix exemption: ${owner}`);
for (const owner of childPrefixExemptions.keys())
	if (
		!usedChildPrefixExemptions.has(owner) &&
		inspectedFiles.has(owner.slice(0, owner.lastIndexOf(':')))
	)
		errors.add(`Stale prefixed-child-prop exemption: ${owner}`);
for (const owner of sizeUnionExemptions.keys())
	if (
		!usedSizeUnionExemptions.has(owner) &&
		inspectedFiles.has(owner.slice(0, owner.lastIndexOf(':')))
	)
		errors.add(`Stale size-scale exemption: ${owner}`);
if (errors.size)
	throw new Error(`Public API contract check failed:\n- ${[...errors].join('\n- ')}`);
console.log(
	`Public API contract check passed (${files.length} source files; ${virtualSources.size} locally typed and ${bindableSources.size} shared-props component scripts; ${usedDomainSizes.size} justified domain sizes; ${usedAccessibleNameProps.size} components that must accept \`label\`).`
);
