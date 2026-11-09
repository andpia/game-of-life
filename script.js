/*
 * Configuration
 */

// DOM references
const startButton = document.querySelector("#start-button");
const stopButton = document.querySelector("#stop-button");
const stepButton = document.querySelector("#step-button");
const resetButton = document.querySelector("#reset-button");
const generationOutput = document.querySelector("#generation-output");
const sizeInput = document.querySelector("#size-input");
const sizeOutput = document.querySelector("#size-output");
const speedInput = document.querySelector("#speed-input");
const speedOutput = document.querySelector("#speed-output");
const board = document.querySelector("#board");
const populationOutput = document.querySelector("#population-output");
const uniqueCellsLivedOutput = document.querySelector("#unique-cells-lived-output");
const maxPopulationOutput = document.querySelector("#max-population-output");
const maxPopulationGenerationOutput = document.querySelector("#max-population-generation-output");
const patternButtons = document.querySelectorAll(".pattern-button");

// Number of cells per row and column (the grid is N x N)
let gridSize = Number(sizeInput.value);

// Gap between cells (in pixels)
const GAP_SIZE = 1;

function patternFromRows(rows) {
	const cells = [];

	for (const [rowIndex, row] of rows.entries()) {
		for (const [column, cell] of [...row].entries()) {
			if (cell === "O") cells.push([column, rowIndex]);
		}
	}

	return { width: rows[0].length, height: rows.length, cells };
}

const PATTERNS = {
	glider: {
		width: 3,
		height: 3,
		cells: [[1, 0], [2, 1], [0, 2], [1, 2], [2, 2]]
	},
	blinker: {
		width: 3,
		height: 1,
		cells: [[0, 0], [1, 0], [2, 0]]
	},
	toad: {
		width: 4,
		height: 2,
		cells: [[1, 0], [2, 0], [3, 0], [0, 1], [1, 1], [2, 1]]
	},
	beacon: {
		width: 4,
		height: 4,
		cells: [[0, 0], [1, 0], [0, 1], [1, 1], [2, 2], [3, 2], [2, 3], [3, 3]]
	},
	"r-pentomino": {
		width: 3,
		height: 3,
		cells: [[1, 0], [2, 0], [0, 1], [1, 1], [1, 2]]
	},
	acorn: {
		width: 7,
		height: 3,
		cells: [[1, 0], [3, 1], [0, 2], [1, 2], [4, 2], [5, 2], [6, 2]]
	},
	"lightweight-spaceship": {
		width: 5,
		height: 4,
		cells: [[1, 0], [2, 0], [3, 0], [4, 0], [0, 1], [4, 1], [4, 2], [0, 3], [3, 3], [4, 3]]
	},
	block: patternFromRows([
		"OO",
		"OO"
	]),
	beehive: patternFromRows([
		".OO.",
		"O..O",
		".OO."
	]),
	boat: patternFromRows([
		"OO.",
		"O.O",
		".O."
	]),
	"middleweight-spaceship": patternFromRows([
		"...O..",
		".O...O",
		"O.....",
		"O....O",
		"OOOOO."
	]),
	"heavyweight-spaceship": patternFromRows([
		"...OO..",
		".O....O",
		"O......",
		"O.....O",
		"OOOOOO."
	]),
	tub: patternFromRows([
		".O.",
		"O.O",
		".O."
	]),
	loaf: patternFromRows([
		".OO.",
		"O..O",
		".O.O",
		"..O."
	]),
	diehard: patternFromRows([
		"......O.",
		"OO......",
		".O...OOO"
	]),
	pentadecathlon: patternFromRows([
		"..O....O..",
		"OO.OOOO.OO",
		"..O....O.."
	]),
	pulsar: patternFromRows([
		"..OOO...OOO..",
		".............",
		"O....O.O....O",
		"O....O.O....O",
		"O....O.O....O",
		"..OOO...OOO..",
		".............",
		"..OOO...OOO..",
		"O....O.O....O",
		"O....O.O....O",
		"O....O.O....O",
		".............",
		"..OOO...OOO.."
	]),
	"gosper-glider-gun": patternFromRows([
		"........................O...........",
		"......................O.O...........",
		"............OO......OO............OO",
		"...........O...O....OO............OO",
		"OO........O.....O...OO..............",
		"OO........O...O.OO....O.O...........",
		"..........O.....O.......O...........",
		"...........O...O....................",
		"............OO......................"
	])
};


/*
 * Grid layout
 *
 * The grid is stored with a border of permanently dead cells around it,
 * so every cell always has 8 neighbors and no bounds checks are needed.
 */
let W = gridSize + 2; // width of the padded grid
let NEIGHBOR_OFFSETS = [-W - 1, -W, -W + 1, -1, 1, W - 1, W, W + 1];

// Convert (row, column) coordinates (0-based, without border) into an index of the padded grid
const indexOf = (row, column) => (row + 1) * W + (column + 1);


// Interval ID for the simulation loop (null if not running)
let runIntervalId = null;
// Population tracking
let generation = 0;
let maxPopulation = 0;
let maxPopulationGeneration = 0;


/*
 * State
 *
 * `current` is the single source of truth (1 = alive, 0 = dead).
 * `next` is a second buffer used to compute the next generation without allocations.
 * The DOM only reflects the state and is never read to compute the game.
 */
let currentState = new Uint8Array(W * W);
let nextState = new Uint8Array(W * W);
let hasBeenAlive = new Uint8Array(W * W);
let uniqueCellsLived = 0;

let cellElements = new Array(W * W); // Same indexing as the buffers

// Cells with a transient class (is-born / is-died) to clear on the next step
let markedCells = [];


/*
 * Setup
 */

function createBoard() {
	// Configure the board layout via CSS variables and grid template
	board.style.setProperty("--pixel-gap", `${GAP_SIZE}px`);
	board.style.gridTemplateColumns = `repeat(${gridSize}, minmax(0, 1fr))`;
	board.style.gridTemplateRows = `repeat(${gridSize}, minmax(0, 1fr))`;

	// Create all cell elements and append them to the board (row-major order)
	const fragment = document.createDocumentFragment();

	for (let row = 0; row < gridSize; row++) {
		for (let column = 0; column < gridSize; column++) {
			const index = indexOf(row, column);
			const pixel = document.createElement("div");
			pixel.className = "pixel";
			pixel.dataset.index = String(index);
			cellElements[index] = pixel;
			fragment.append(pixel);
		}
	}

	board.append(fragment);

	generation = 0;
	generationOutput.textContent = generation;
	populationOutput.textContent = 0;
	uniqueCellsLivedOutput.textContent = uniqueCellsLived;
	maxPopulation = 0;
	maxPopulationGeneration = 0;
	maxPopulationOutput.textContent = maxPopulation;
	maxPopulationGenerationOutput.textContent = maxPopulationGeneration;
	updatePatternAvailability();
}

// Destroy the current board and recreate its state buffers for a new size
function rebuildBoard(newSize) {
	clearMarks();
	board.replaceChildren();

	gridSize = newSize;
	W = gridSize + 2;
	NEIGHBOR_OFFSETS = [-W - 1, -W, -W + 1, -1, 1, W - 1, W, W + 1];
	currentState = new Uint8Array(W * W);
	nextState = new Uint8Array(W * W);
	hasBeenAlive = new Uint8Array(W * W);
	uniqueCellsLived = 0;
	cellElements = new Array(W * W);

	createBoard();
}

// Always change a cell through setCell, so state and DOM stay in sync
function setCell(index, alive, changeMark = true) {
	currentState[index] = alive ? 1 : 0;

	if (alive && hasBeenAlive[index] === 0) {
		hasBeenAlive[index] = 1;
		uniqueCellsLived++;
		uniqueCellsLivedOutput.textContent = uniqueCellsLived;
	}

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

function updatePopulation() {
	const population = currentState.reduce((sum, cell) => sum + cell, 0);
	populationOutput.textContent = population;
	if (population > maxPopulation) {
		maxPopulation = population;
		maxPopulationGeneration = generation;
	}
	maxPopulationOutput.textContent = maxPopulation;
	maxPopulationGenerationOutput.textContent = maxPopulationGeneration;
}


/*
 * Game controls
 */

function gameStart() {
	runIntervalId = setInterval(gameStep, Number(speedInput.value));
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
	for (let row = 1; row <= gridSize; row++) {
		for (let column = 1; column <= gridSize; column++) {
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
		generationOutput.textContent = generation;
	} else {
		// No changes, the simulation has reached a stable state
		gameStop();
	}

	updatePopulation();
}

// Kill every cell
function gameReset() {
	clearMarks();

	for (let index = 0; index < W * W; index++) {
		if (currentState[index] === 1) setCell(index, false, false);
	}

	generation = 0;
	generationOutput.textContent = generation;
	maxPopulation = 0;
	maxPopulationGeneration = 0;
	hasBeenAlive.fill(0);
	uniqueCellsLived = 0;
	uniqueCellsLivedOutput.textContent = uniqueCellsLived;
	updatePopulation();
}

function updatePatternAvailability() {
	for (const button of patternButtons) {
		const pattern = PATTERNS[button.dataset.pattern];
		button.disabled = !pattern || pattern.width > gridSize || pattern.height > gridSize;
	}
}

function placePattern(pattern) {
	if (runIntervalId !== null) gameStop();
	gameReset();

	const top = Math.floor((gridSize - pattern.height) / 2);
	const left = Math.floor((gridSize - pattern.width) / 2);
	for (const [column, row] of pattern.cells) {
		setCell(indexOf(top + row, left + column), true, false);
	}

	updatePopulation();
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

function handleSizeChange() {
	if (runIntervalId !== null) gameStop();
	const newSize = Number(sizeInput.value);
	if (newSize >= 1 && newSize <= 100) {
		rebuildBoard(newSize);
	}
}

function updateSizeOutput() {
	sizeOutput.textContent = `${sizeInput.value} × ${sizeInput.value}`;
}

function handleSpeedChange() {
	speedOutput.textContent = `${speedInput.value} ms`;
	if (runIntervalId !== null) {
		gameStop();
		gameStart();
	}
}

function handleBoardClick(event) {
	if (runIntervalId !== null) gameStop();

	// Event delegation: a single listener handles all cells
	const pixel = event.target.closest(".pixel");
	if (!pixel) return; // click on a gap, not on a cell

	const index = Number(pixel.dataset.index);
	setCell(index, currentState[index] === 0, false);
	updatePopulation();
}


/*
 * Initialize
 */
createBoard();
updateSizeOutput();

startButton.addEventListener("click", handleStartClick);
stopButton.addEventListener("click", handleStopClick);
stepButton.addEventListener("click", handleStepClick);
resetButton.addEventListener("click", handleResetClick);
sizeInput.addEventListener("input", updateSizeOutput);
sizeInput.addEventListener("change", handleSizeChange);
speedInput.addEventListener("input", handleSpeedChange);
for (const button of patternButtons) {
	button.addEventListener("click", () => {
		placePattern(PATTERNS[button.dataset.pattern]);
	});
}

board.addEventListener("click", handleBoardClick);