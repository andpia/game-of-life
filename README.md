# Conway's Game of Life

A small, dependency-free implementation of Conway's Game of Life. The project is
designed to be easy to explore: the interface is plain HTML and CSS, and the
simulation is implemented in browser JavaScript.

## Run the project

Open `index.html` in a modern browser. No build step or package installation is
required.

## Use the simulation

- **Start**, **Stop**, and **Step** control the simulation.
- **Reset** clears the board and its statistics.
- Click a cell to toggle it while the simulation is stopped.
- Adjust the generation interval and board size with the sliders.
- Choose a pattern to place it in the center of the board.

## How it works

The board follows the four rules of Conway's Game of Life. Each generation is
calculated from the previous one: a live cell survives with two or three live
neighbors, a dead cell is born with exactly three, and all other cells die or
remain dead.

In `script.js`, each cell is stored as `0` (dead) or `1` (alive) in a typed
array. A one-cell border of dead cells surrounds the playable board, so the
neighbor loop can inspect all eight neighbors without checking the edges.
Two arrays are used in turn: one holds the current generation while the other
receives the next one. This keeps the calculation separate from the page and
avoids allocating a new board on every step. The DOM is updated only for cells
whose state changed.

## Project files

- `index.html` contains the page structure and controls.
- `style.css` contains the visual styles and responsive layout.
- `script.js` contains the pattern data, simulation, and event handlers.
- `ARCHITECTURE.md` explains the simulation state and runtime flow.
