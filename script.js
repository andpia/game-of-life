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
const startButton = document.querySelector("#start-button");
const stopButton = document.querySelector("#stop-button");
const stepButton = document.querySelector("#step-button");
const resetButton = document.querySelector("#reset-button");
const generationCounter = document.querySelector("#generation-counter");
const board = document.querySelector("#board");

// Interval ID for the simulation loop (null if not running)
let runIntervalId = null;
let generation = 0;


/*
 * State
 *
 * The grid state is the single source of truth: a flat array of booleans
 * (true = alive), indexed as 'row * N + column'.
 * The DOM only reflects this state and is never read to compute the game.
 */
const cellStates = new Array(N * N).fill(false);
const cellElements = []; // Same indexing as `cellStates`.

// Convert (row, column) coordinates into an index of the flat arrays
const indexOf = (row, column) => row * N + column;


/*
 * Setup
 */

// Configure the board layout via CSS variables and grid template
function configureBoardLayout() {
	// Set the board's maximum size and the gap between cells via CSS variables
	board.style.setProperty("--board-max-size", `${N * PIXEL_SIZE + (N - 1) * GAP_SIZE}px`);
	board.style.setProperty("--pixel-gap", `${GAP_SIZE}px`);

	// Set the grid template to create N columns and N rows with equal fractions of available space
	board.style.gridTemplateColumns = `repeat(${N}, minmax(0, 1fr))`;
	board.style.gridTemplateRows = `repeat(${N}, minmax(0, 1fr))`;
}

// Create all cell elements and append them to the board
function createBoardCells() {
	// Create a document fragment to hold the cells before appending them to the board
	const fragment = document.createDocumentFragment();

	// Create all N*N cells and append them to the fragment
	for (let index = 0; index < N * N; index++) {
		const pixel = document.createElement("div");
		pixel.className = "pixel";
		pixel.dataset.index = index; // Store the index for later reference.
		cellElements.push(pixel);
		fragment.append(pixel);
	}

	board.append(fragment);
}

// Always change a cell through setCellState, so state and DOM stay in sync.
function setCellState(index, alive) {
	cellStates[index] = alive;
	cellElements[index].classList.toggle("is-alive", alive);
}

// Game of Life rules for the next generation of a cell
function cellNextGeneration(alive, index) {
	const row = Math.floor(index / N);
	const column = index % N;

	let neighbors = 0;

	// Count the live cells among the 8 surrounding ones.
	// Edges are not wrapped: cells outside the board count as dead.
	for (let rowOffset = -1; rowOffset <= 1; rowOffset++) {
		for (let columnOffset = -1; columnOffset <= 1; columnOffset++) {
			if (rowOffset === 0 && columnOffset === 0) continue; // skip the cell itself

			const neighborRow = row + rowOffset;
			const neighborColumn = column + columnOffset;
			const isValidNeighbor =
				neighborRow >= 0 && neighborRow < N &&
				neighborColumn >= 0 && neighborColumn < N;

			if (isValidNeighbor && cellStates[indexOf(neighborRow, neighborColumn)]) neighbors++;
		}
	}

	// A live cell survives with two or three neighbors; a dead cell is born with three
	return (neighbors === 3 || (alive && neighbors === 2));
}


/*
 * Game controls
 */

// Start the simulation loop
function gameStart() {
	runIntervalId = setInterval(gameStep, 100);
}

// Stop the simulation loop
function gameStop() {
	clearInterval(runIntervalId);
	runIntervalId = null;
}

// Advance the simulation by one generation
function gameStep() {
	// Compute the next generation for all cells without modifying the current state
	const nextCellStates = cellStates.map(cellNextGeneration);

	// Touch the DOM only for cells whose state actually changed
	nextCellStates.forEach((alive, index) => {
		if (alive !== cellStates[index]) setCellState(index, alive);
	});

	generation++;
	generationCounter.textContent = generation;
}

// Kill every cell
function gameReset() {
	cellStates.forEach((alive, index) => {
		if (alive) setCellState(index, false);
	});

	generation = 0;
	generationCounter.textContent = generation;
}


/*
 * Event handlers
 */

function handleStartClick() {
	if (runIntervalId !== null) return;
	gameStart();
}

function handleStopClick() {
	if (runIntervalId === null) return;
	gameStop();
}

function handleStepClick() {
	if (runIntervalId !== null) return;
	gameStep();
}

function handleResetClick() {
	if (runIntervalId !== null) {
		gameStop();
	}
	gameReset();
}

function handleBoardClick(event) {
	if (runIntervalId !== null) {
		gameStop();
	}

	// A single listener on the board handles all cells (event delegation)
	const pixel = event.target.closest(".pixel");
	if (!pixel) return; // click on a gap, not on a cell

	// Toggle the clicked cell's state.
	const index = Number(pixel.dataset.index);
	setCellState(index, !cellStates[index]);
}


/*
 * Initialize
 */
configureBoardLayout();
createBoardCells();

startButton.addEventListener("click", handleStartClick);
stopButton.addEventListener("click", handleStopClick);
stepButton.addEventListener("click", handleStepClick);
resetButton.addEventListener("click", handleResetClick);

board.addEventListener("click", handleBoardClick);