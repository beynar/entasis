export const cvaDescription = `
# Component variants

Import from \`entasis/cva\`.

cva defines class variants and defaults. cx joins class values; compose composes variants. setComponentTheme and useComponentTheme connect component theme definitions to the Svelte theme context. A resolver takes an optional second argument, the shared variant values, and then returns every class slot already bound to them, so a template calls \`slots.root()\` instead of passing the same props to each slot. VariantProps and InferComponentTheme derive the corresponding public types. Keep component CVA definitions beside their owner in a .theme.ts file.
`;
