# Entasis

Entasis is a component library that exposes concise semantic descriptions and owns their rendering details.

## Chart language

**Mark**:
A semantic visual representation of rows in a chart. A mark can contain compatible secondary representations and annotations.
_Avoid_: Primitive, layer

**Variant**:
The mutually exclusive primary representation of a semantic mark.
_Avoid_: Type, mode

**Series**:
A Cartesian mark for ordered observations. It renders a line by default, can add points, and can add either an area or an interval.
_Avoid_: Plot, trace

**Scatter**:
A Cartesian mark for independent observations positioned by X and Y channels, with optional color and size encodings. A size channel uses a linear, square-root, logarithmic, or exponential radius transformation.

**Bar**:
A Cartesian magnitude mark whose variant is group or stack when multiple series share a category.

**Distribution**:
A statistical summary of grouped samples whose variant is violin, box, or error bar.

**Proportion**:
A part-to-whole representation whose variant is pie, donut, or waffle.

**Polar**:
A representation positioned by angle and radius. Circular and radar paths can add area, line, and point representations; radial-bar and rose render wedges.
_Avoid_: Radar, when referring to the full family

**Relation**:
A complete topology layout of node rows. Its variant is tree, network, or Sankey.
_Avoid_: Graph, when referring only to the network variant

**Matrix**:
A grid that positions one cell from an X category and a Y category. A numeric value can map to color intensity for heatmaps and contribution graphs.
_Avoid_: Cell chart

**Facet**:
A mark that repeats nested marks for subsets of the shared data.

**Annotation**:
An explanatory visual owned by a data mark and attached to one final rendered position from that mark.
_Avoid_: Top-level annotation mark
