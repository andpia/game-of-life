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

/*
 * Grid layout
 *
 * The grid is stored with a border of permanently dead cells around it,
 * so every cell always has 8 neighbors and no bounds checks are needed.
 */
let paddedWidth = gridSize + 2;
let NEIGHBOR_OFFSETS = [
	-paddedWidth - 1, -paddedWidth, -paddedWidth + 1,
	-1, 1,
	paddedWidth - 1, paddedWidth, paddedWidth + 1
];

// Convert (row, column) coordinates (0-based, without border) into an index of the padded grid
const getCellIndex = (row, column) => (row + 1) * paddedWidth + (column + 1);


// Interval ID for the simulation loop (null if not running)
let runIntervalId = null;
// Population tracking
let generation = 0;
let maxPopulation = 0;
let maxPopulationGeneration = 0;


/*
 * State
 *
 * `currentState` is the single source of truth (1 = alive, 0 = dead).
 * `nextState` receives the next generation before the buffers are swapped.
 * The DOM only reflects the state and is never read to compute the game.
 */
let currentState = new Uint8Array(paddedWidth * paddedWidth);
let nextState = new Uint8Array(paddedWidth * paddedWidth);
let hasBeenAlive = new Uint8Array(paddedWidth * paddedWidth);
let uniqueCellsLived = 0;

let cellElements = new Array(paddedWidth * paddedWidth); // Same indexing as the buffers

// Cells with temporary change classes, cleared before the next generation.
const markedCells = new Set();


/*
 * Board creation and resizing
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
			const index = getCellIndex(row, column);
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
	paddedWidth = gridSize + 2;
	NEIGHBOR_OFFSETS = [
		-paddedWidth - 1, -paddedWidth, -paddedWidth + 1,
		-1, 1,
		paddedWidth - 1, paddedWidth, paddedWidth + 1
	];
	currentState = new Uint8Array(paddedWidth * paddedWidth);
	nextState = new Uint8Array(paddedWidth * paddedWidth);
	hasBeenAlive = new Uint8Array(paddedWidth * paddedWidth);
	uniqueCellsLived = 0;
	cellElements = new Array(paddedWidth * paddedWidth);

	createBoard();
}

/*
 * Cell updates and statistics
 */

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
		pixel.classList.remove("is-born", "is-died");
		pixel.classList.add(alive ? "is-born" : "is-died");
		markedCells.add(index);
	}
}

// Remove the transient born/died classes added by the last manual step
function clearMarks() {
	for (const index of markedCells) {
		cellElements[index].classList.remove("is-born", "is-died");
	}
	markedCells.clear();
}

function updatePopulationStats() {
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

function startGame() {
	runIntervalId = setInterval(stepGame, Number(speedInput.value));
}

function stopGame() {
	clearInterval(runIntervalId);
	runIntervalId = null;
}

// Advance the simulation by one generation
function stepGame() {
	clearMarks();

	const changed = [];

	// Compute the next generation into `nextState`, reading only from `currentState`.
	for (let row = 1; row <= gridSize; row++) {
		for (let column = 1; column <= gridSize; column++) {
			const index = row * paddedWidth + column;

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
		stopGame();
	}

	updatePopulationStats();
}

// Clear the board and reset its population statistics.
function resetGame() {
	clearMarks();

	for (let index = 0; index < paddedWidth * paddedWidth; index++) {
		if (currentState[index] === 1) setCell(index, false, false);
	}

	generation = 0;
	generationOutput.textContent = generation;
	maxPopulation = 0;
	maxPopulationGeneration = 0;
	hasBeenAlive.fill(0);
	uniqueCellsLived = 0;
	uniqueCellsLivedOutput.textContent = uniqueCellsLived;
	updatePopulationStats();
}

/*
 * Pattern placement
 */

function updatePatternAvailability() {
	for (const button of patternButtons) {
		const pattern = PATTERNS[button.dataset.pattern];
		button.disabled = !pattern || pattern.width > gridSize || pattern.height > gridSize;
	}
}

function placePattern(pattern) {
	if (runIntervalId !== null) stopGame();
	resetGame();

	const top = Math.floor((gridSize - pattern.height) / 2);
	const left = Math.floor((gridSize - pattern.width) / 2);
	for (const [column, row] of pattern.cells) {
		setCell(getCellIndex(top + row, left + column), true, false);
	}

	updatePopulationStats();
}


/*
 * Event handlers
 */

function handleStartClick() {
	if (runIntervalId !== null) return;
	startGame();
}

function handleStopClick() {
	if (runIntervalId === null) return;
	stopGame();
}

function handleStepClick() {
	if (runIntervalId !== null) return;
	stepGame();
}

function handleResetClick() {
	if (runIntervalId !== null) stopGame();
	resetGame();
}

function handleSizeChange() {
	const newSize = sizeInput.valueAsNumber;
	const minimumSize = Number(sizeInput.min);
	const maximumSize = Number(sizeInput.max);
	if (!Number.isInteger(newSize) || newSize === gridSize || newSize < minimumSize || newSize > maximumSize) return;

	if (runIntervalId !== null) stopGame();
	rebuildBoard(newSize);
}

function updateSizeOutput() {
	sizeOutput.textContent = `${sizeInput.value} × ${sizeInput.value}`;
}

function handleSpeedChange() {
	speedOutput.textContent = `${speedInput.value} ms`;
	if (runIntervalId !== null) {
		stopGame();
		startGame();
	}
}

function handleBoardClick(event) {
	// Event delegation: a single listener handles all cells
	const pixel = event.target.closest(".pixel");
	if (!pixel) return; // click on a gap, not on a cell

	if (runIntervalId !== null) stopGame();

	const index = Number(pixel.dataset.index);
	setCell(index, currentState[index] === 0, false);
	updatePopulationStats();
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