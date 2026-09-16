export const mapDescription = `
# Map Component

An interactive vector map (pan, zoom, markers, clustering, shapes, geolocation) built on [MapLibre GL](https://maplibre.org/). MapLibre is loaded from a CDN at runtime and never bundled. The base map style is a tokenized Positron style whose colours are derived from your svelai design tokens, so the map adapts to light and dark automatically. Ported from svelte-pro's Map component.

## Basic Usage

\`\`\`svelte
<script>
  import { Map } from 'svelai/map';
  const markers = [
    { id: 'paris', lng: 2.3522, lat: 48.8566, label: 'Paris' },
    { id: 'lyon', lng: 4.8357, lat: 45.7640, label: 'Lyon' }
  ];
</script>

<Map {markers} controls cluster popup tooltip />
\`\`\`

## Props

### Core Props
- **markers**: MapMarker[] (required) - The markers to place. \`MapMarker = { id, lng, lat, label?, description?, popup?, tooltip?, color?, data? }\`. Ids must be unique; lng/lat are validated.
- **center**: [number, number] (default: [2.3522, 48.8566]) - Initial map center (lng, lat).
- **zoom**: number (default: 5) - Initial zoom level.
- **bounds**: [w,s,e,n] | [[lng,lat],[lng,lat]] - Fit the view to these bounds (overrides center/zoom on mount).
- **minZoom** / **maxZoom**: number - Zoom constraints.
- **size**: 'small' | 'normal' | 'large' (default: 'normal') - Viewport height variant.

### Style Props
- **styleUrl**: string - Use a specific MapLibre style URL instead of the tokenized default (mutually exclusive with \`styles\`).
- **styles**: { positron?: string; dark?: string } - Per-scheme style URL overrides (mutually exclusive with \`styleUrl\`).

### Interaction Props
- **interactive**: boolean - Enable/disable pan/zoom interactions.
- **showAttribution**: boolean (default: true) - Show the attribution control.
- **fitMarkersOnMount**: boolean - Fit the view to all markers on mount.
- **fitMarkersPadding**: number - Padding (px) used when fitting markers.
- **controls**: boolean | ('zoom-in'|'zoom-out'|'fit-markers'|'geolocate'|'reset')[] - Show the control cluster; pass an array to pick which buttons.
- **controlPosition**: 'top-left'|'top-right'|'bottom-left'|'bottom-right' - Where to dock the controls.
- **cluster**: boolean | MapClusterConfig - Cluster nearby markers.
- **geolocation**: boolean | { enabled?, watch?, zoom?, showMarker? } - Locate the user.
- **popup**: boolean | Snippet - Show a popover on marker click. \`true\` uses the marker's \`popup\`/\`label\`; a snippet receives \`{ marker, data, map, lngLat, open, close }\`.
- **tooltip**: boolean | Snippet - Show a hover tooltip. Snippet receives \`{ marker, data, map, lngLat, open }\`.
- **shapes**: MapShape[] - Draw circles, polylines, polygons or rectangles.

### Content Props (Snippets)
- **marker**: Snippet - Custom marker rendering; receives \`{ marker, data, map, lngLat }\`.
- **clusterMarker**: Snippet - Custom cluster rendering; receives \`{ id, count, coordinates, map, expand, markers, data, feature }\`.
- **userLocationMarker**: Snippet - Custom user-location marker.
- **controlButton**: Snippet - Custom control button; receives \`{ action, label, disabled, active, onclick }\`.

### Event Props
- **onMarkerClick**: (payload) => void
- **onClusterClick**: (payload) => void
- **onReady**: (payload) => void - The MapLibre map instance is ready.
- **onViewChange** / **onMoveEnd** / **onZoomEnd**: (payload) => void
- **onError**: (error: Error) => void - Loading, style, or runtime errors (otherwise logged to console).

### Advanced Props
- **class**: string - Additional classes on the map root.
- **theme**: MapTheme - Theme overrides for the root container.

## Theming

The base style is generated at runtime from the current svelai \`--color-*\` tokens and re-generated whenever they change (theme flip, palette swap, runtime token edits): \`primary\` tints land, buildings and water like a monochrome basemap, \`success\` paints parks and points of interest, \`danger\` draws boundaries and \`neutral\` carries roads and labels on \`surface\`. To fully override the cartography, pass \`styleUrl\` or \`styles\`.

## Accessibility

- Markers are focusable buttons with descriptive labels; popups are keyboard-toggleable and close on Escape/outside-click.
- The control cluster is a labelled button group.
- A loading skeleton with \`role="status"\` is shown until the map's first render; if the map fails to load (e.g. the CDN is unreachable) a \`role="alert"\` message replaces it instead of hanging on the skeleton.

## Notes

- MapLibre GL JS + its stylesheet load from a CDN on first mount; nothing is bundled. A network connection is required for the library and the default Positron tiles.
- \`styleUrl\` and \`styles\` cannot both be set.
`;
