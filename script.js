/*
 * Configuration
 */

// Number of cells per row and column (the grid is N x N)
const N = 50;

// Maximum size of each cell and gap between cells (in pixels).
// The board is responsive: these values define its maximum size.
const PIXEL_SIZE = 10;
const GAP_SIZE = 1;


/*
 * DOM references
 */
const board = document.querySelector("#board");
const resetButton = document.querySelector("#reset-button");
const stepButton = document.querySelector("#step-button");


/*
 * State
 *
 * The grid state is the single source of truth: a flat array of booleans
 * (true = alive), indexed as row * N + column.
 * The DOM only *reflects* this state and is never read to compute the game.
 */
const cellStates = new Array(N * N).fill(false);

// DOM elements for each cell, using the same indexing as `cellState`
const cellElements = [];

// Convert (row, column) coordinates into an index of the flat arrays
const indexOf = (row, column) => row * N + column;


/*
 * Setup
 */

// Build the board: set its size via CSS variables and create one element per cell
function initializeGrid() {
	board.style.setProperty("--board-max-size", `${N * PIXEL_SIZE + (N - 1) * GAP_SIZE}px`);
	board.style.setProperty("--pixel-gap", `${GAP_SIZE}px`);
	board.style.gridTemplateColumns = `repeat(${N}, minmax(0, 1fr))`;
	board.style.gridTemplateRows = `repeat(${N}, minmax(0, 1fr))`;

	// Build all cells off-DOM first, then append them in a single operation
	const fragment = document.createDocumentFragment();

	for (let index = 0; index < N * N; index++) {
		const pixel = document.createElement("div");
		pixel.className = "pixel";
		// Store the index so the click handler knows which cell was clicked
		pixel.dataset.index = index;
		cellElements.push(pixel);
		fragment.append(pixel);
	}

	board.append(fragment);
}


/*
 * State updates
 * Always change a cell through setCellState, so state and DOM stay in sync.
 */

function setCellState(index, alive) {
	cellStates[index] = alive;
	cellElements[index].classList.toggle("is-alive", alive);
}

// Kill every cell
function reset() {
	cellStates.forEach((alive, index) => {
		if (alive) setCellState(index, false);
	});
}

// Toggle the clicked cell. A single listener on the board handles all cells
// (event delegation) instead of attaching N*N separate listeners.
function handleBoardClick(event) {
	const pixel = event.target.closest(".pixel");
	if (!pixel) return; // click on a gap, not on a cell

    // toggle the clicked cell's state
	const index = Number(pixel.dataset.index);
	setCellState(index, !cellStates[index]);
}


/*
 * Game of Life rules
 */

// Advance the simulation by one generation
function step() {
	// Compute the whole next generation from the current one *before* changing anything,
	// otherwise updated cells would affect their neighbors' counts in the same step
	const nextCellStates = cellStates.map((alive, index) => {
		const row = Math.floor(index / N);
		const column = index % N;
		const neighbors = countAliveNeighbors(row, column);

		// A live cell survives with two or three neighbors; a dead cell is born with three
		return neighbors === 3 || (alive && neighbors === 2);
	});

	// Touch the DOM only for cells whose state actually changed
	nextCellStates.forEach((alive, index) => {
		if (alive !== cellStates[index]) setCellState(index, alive);
	});
}

// Count the live cells among the 8 surrounding ones.
// Edges are not wrapped: cells outside the board count as dead.
function countAliveNeighbors(row, column) {
	let count = 0;

	for (let rowOffset = -1; rowOffset <= 1; rowOffset++) {
		for (let columnOffset = -1; columnOffset <= 1; columnOffset++) {
			if (rowOffset === 0 && columnOffset === 0) continue; // skip the cell itself

			const neighborRow = row + rowOffset;
			const neighborColumn = column + columnOffset;
			const isValidNeighbor =
				neighborRow >= 0 && neighborRow < N &&
				neighborColumn >= 0 && neighborColumn < N;

			if (isValidNeighbor && cellStates[indexOf(neighborRow, neighborColumn)]) count++;
		}
	}

	return count;
}


/*
 * Start
 */
initializeGrid();

board.addEventListener("click", handleBoardClick);
stepButton.addEventListener("click", step);
resetButton.addEventListener("click", reset);