# Architecture

This document describes how the browser implementation is structured and how
the simulation moves from one generation to the next. The project has no build
step, framework, or external runtime dependency.

## Files and responsibilities

- `index.html` provides the page structure, controls, statistics, and pattern
  buttons. The script is loaded with `defer`, so the document is parsed before
  initialization begins.
- `style.css` defines the visual design, responsive layout, and cell-state
  appearance.
- `script.js` contains the pattern definitions, simulation state, game rules,
  DOM updates, and event handlers.

The JavaScript is a single browser script rather than a set of modules. This
keeps the example easy to run directly while separating the main concerns into
named sections and functions.

## Runtime flow

The browser UI sends user actions to event handlers. Those handlers update the
simulation or its settings, and the script reflects the resulting state in the
DOM. When the game is running, a timer calls the same generation-step function
used by the Step button.

```mermaid
flowchart TD
    UI["HTML controls and board"] --> Events["Event handlers"]
    Events --> Actions["Start, stop, step, reset, resize, or place pattern"]
    Actions --> State["Simulation state"]
    Timer["setInterval timer"] --> Step["gameStep()"]
    Actions --> Step
    Step --> State
    State --> Render["Update changed cells and statistics"]
    Render --> UI
```

## Simulation state

`gridSize` is the number of playable rows and columns. The implementation uses
a linear array with a one-cell border around the playable grid:

- `W` is the padded row width (`gridSize + 2`).
- `currentState` stores the current generation.
- `nextState` receives the next generation before the two buffers are swapped.
- `hasBeenAlive` records which cells have been alive since the most recent
  reset or grid resize.
- `cellElements` maps padded-array indices to the corresponding playable cell
  elements in the DOM.

Cell values are `0` for dead and `1` for alive. The padded border remains dead,
so each playable cell can inspect the eight neighboring offsets without
checking whether it is at an edge. `indexOf(row, column)` converts zero-based
playable coordinates to an index in the padded arrays.

The typed arrays are the source of truth for the game. The DOM is a visual
representation: generation calculations read the arrays, not cell classes or
other rendered markup. `setCell` is used when a cell is changed directly or
when a changed cell needs to be reflected in the DOM.

## Generation update

`gameStep()` performs one complete generation:

1. Clear temporary birth and death highlights from the previous step.
2. Visit every playable cell and count its live neighbors in `currentState`.
3. Apply Conway's rules and write the result to `nextState`.
4. Record indices whose alive/dead state changed.
5. Swap the current and next buffers.
6. Update the DOM only for changed cells, then refresh population statistics.

The rule is expressed as: a cell is alive in the next generation if it has
exactly three live neighbors, or if it is already alive and has exactly two.
If no cell changes, the board is stable and the running timer is stopped.

## Controls and statistics

- Start creates one interval using the selected generation interval; Stop
  clears it. Changing the interval while running restarts the timer with the
  new value.
- Step advances once only while stopped. Clicking a board cell while running
  stops the timer; clicking a gap does nothing.
- Reset clears the board and resets its generation, peak population, and
  unique-cells-lived statistics.
- Changing the grid size stops the simulation, recreates the board and state
  arrays, and disables patterns that do not fit.
- A pattern button resets the board, then places the selected pattern centered
  in the grid. Patterns are stored in `PATTERNS`; `patternFromRows` converts a
  compact text representation into coordinates.

`generation` counts completed steps that changed the board. `maxPopulation`
and `maxPopulationGeneration` track the greatest live population observed.
`uniqueCellsLived` counts distinct cells that have been alive at least once
since the last reset or resize.
