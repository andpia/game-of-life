/*
 * Configuration
 */

// Number of cells per row and column (the grid is N x N)
const N = 100;

// Maximum size of each cell and gap between cells (in pixels)
const PIXEL_SIZE = 10;
const GAP_SIZE = 1;

// Simulation interval (in milliseconds)
const TICK_MS = 100;


/*
 * Grid layout
 *
 * The grid is stored with a border of permanently dead cells around it,
 * so every cell always has 8 neighbors and no bounds checks are needed.
 */
const W = N + 2; // width of the padded grid
const NEIGHBOR_OFFSETS = [-W - 1, -W, -W + 1, -1, 1, W - 1, W, W + 1];

// Convert (row, column) coordinates (0-based, without border) into an index of the padded grid
const indexOf = (row, column) => (row + 1) * W + (column + 1);


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
 * `current` is the single source of truth (1 = alive, 0 = dead).
 * `next` is a second buffer used to compute the next generation without allocations.
 * The DOM only reflects the state and is never read to compute the game.
 */
let currentState = new Uint8Array(W * W);
let nextState = new Uint8Array(W * W);

const cellElements = new Array(W * W); // Same indexing as the buffers

// Cells with a transient class (is-born / is-died) to clear on the next step
let markedCells = [];


/*
 * Setup
 */

// Configure the board layout via CSS variables and grid template
function configureBoardLayout() {
	board.style.setProperty("--board-max-size", `${N * PIXEL_SIZE + (N - 1) * GAP_SIZE}px`);
	board.style.setProperty("--pixel-gap", `${GAP_SIZE}px`);
	board.style.gridTemplateColumns = `repeat(${N}, minmax(0, 1fr))`;
	board.style.gridTemplateRows = `repeat(${N}, minmax(0, 1fr))`;
}

// Create all cell elements and append them to the board (row-major order)
function createBoardCells() {
	const fragment = document.createDocumentFragment();

	for (let row = 0; row < N; row++) {
		for (let column = 0; column < N; column++) {
			const index = indexOf(row, column);
			const pixel = document.createElement("div");
			pixel.className = "pixel";
			pixel.dataset.index = String(index);
			cellElements[index] = pixel;
			fragment.append(pixel);
		}
	}

	board.append(fragment);
}

// Always change a cell through setCell, so state and DOM stay in sync
function setCell(index, alive, changeMark = true) {
	currentState[index] = alive ? 1 : 0;

	const pixel = cellElements[index];
	pixel.classList.toggle("is-alive", alive);

	// If the simulation is not running, mark the cell as born/died
	if (changeMark && runIntervalId === null) {
		pixel.classList.add(alive ? "is-born" : "is-died");
		markedCells.push(index);
	}
}

// Remove the transient born/died classes added by the last manual step
function clearMarks() {
	for (const index of markedCells) {
		cellElements[index].classList.remove("is-born", "is-died");
	}
	markedCells = [];
}


/*
 * Game controls
 */

function gameStart() {
	runIntervalId = setInterval(gameStep, TICK_MS);
}

function gameStop() {
	clearInterval(runIntervalId);
	runIntervalId = null;
}

// Advance the simulation by one generation
function gameStep() {
	clearMarks();

	const changed = [];

	// Compute the next generation into `next`, reading only from `current`
	for (let row = 1; row <= N; row++) {
		for (let column = 1; column <= N; column++) {
			const index = row * W + column;

			let neighbors = 0;
			for (const offset of NEIGHBOR_OFFSETS) {
				neighbors += currentState[index + offset];
			}

			// A live cell survives with two or three neighbors; a dead cell is born with three
			const wasAlive = currentState[index] === 1;
			const alive = neighbors === 3 || (wasAlive && neighbors === 2);

			nextState[index] = alive ? 1 : 0;
			if (alive !== wasAlive) changed.push(index);
		}
	}

	[currentState, nextState] = [nextState, currentState]; // Swap buffers

	// Touch the DOM only for the cells whose state changed
	if (changed.length !== 0) {
		for (const index of changed) {
			const alive = currentState[index] === 1;
			setCell(index, alive, true);
		}

		generation++;
		generationCounter.textContent = generation;
	} else {
		// No changes, the simulation has reached a stable state
		gameStop();
	}

}

// Kill every cell
function gameReset() {
	clearMarks();

	for (let index = 0; index < W * W; index++) {
		if (currentState[index] === 1) setCell(index, false, false);
	}

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
	if (runIntervalId !== null) gameStop();
	gameReset();
}

function handleBoardClick(event) {
	if (runIntervalId !== null) gameStop();

	// Event delegation: a single listener handles all cells
	const pixel = event.target.closest(".pixel");
	if (!pixel) return; // click on a gap, not on a cell

	const index = Number(pixel.dataset.index);
	setCell(index, currentState[index] === 0, false);
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