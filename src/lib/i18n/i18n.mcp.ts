export const i18nDescription = `
# Internationalization

Import from \`entasis/i18n\`.

I18n provides locale messages to child components. setI18n and useI18n set and read the component context. en is the English message set; Messages and I18nInput describe translation inputs. es, fr, de, ja, zh, pt and ar are the other catalogs, exported by name so an app bundles only the ones it imports: \`<I18n locale="fr" catalogs={{ fr }}>\`. A locale missing from catalogs loads its catalog on demand and renders English until then, including on the server. locales and localeList expose the supported locale inventory with LocaleCode and LocaleMeta types; they import every catalog, so keep them for language pickers.
`;
