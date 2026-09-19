# EventCalendar performance envelope

The calendar renders only the active view. Occurrences are keyed, and projections are
staged: item admission re-runs only when the item collection or admission-relevant options
change, the occurrence index re-projects only when admitted items or the visible range
change, and the date profile and resource model derive independently. View switches reuse
admitted items without re-validation. Lane and timed-segment packers are memoized by their
schedule keys, and formatters are cached by locale and time zone. Pointer movement is
sampled through `requestAnimationFrame`; it does not rebuild the item index per frame.

## Measured data point

This is a practical measurement, not a supported maximum or a cross-device benchmark. It
predates the September 2026 projection-pipeline redesign; re-run the same method before
quoting current numbers.

- Date: 2026-07-27
- Browser: Chrome 146, headed
- Environment: macOS compatibility user agent, 8 GB reported device memory, 14 reported
  hardware threads, 1200 × 1159 CSS-pixel viewport at 2× device pixel ratio
- Data: 500 timed events distributed over 28 days in March 2026
- Method: replace the controlled item collection, wait for the requested view to become
  active, then measure through two animation frames; count mounted event elements and
  DOM nodes inside the calendar root

| Operation                |     Time | Mounted events | Calendar DOM nodes |
| ------------------------ | -------: | -------------: | -----------------: |
| Load 500 events in Week  | 309.7 ms |            126 |              1,873 |
| Switch Week → Month      | 132.1 ms |             28 |                523 |
| Switch Month → Week      | 164.6 ms |            126 |              1,873 |
| Switch Week → Agenda     | 124.3 ms |            356 |              2,378 |
| Switch Agenda → Resource |  80.2 ms |             18 |                487 |

Five hundred dense events remained practically interactive in this setup. Consumers
should profile their own snippets, recurrence density, visible range, resources, browser,
and target hardware; those inputs can materially change render cost.
