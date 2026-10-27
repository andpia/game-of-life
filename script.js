// Number of pixels per row and column (grid size)
const N = 50;

// Maximum size of each pixel in the grid (in pixels)
const PIXEL_SIZE = 10;
const GAP_SIZE = 1;

// Get elements from the DOM
const board = document.querySelector("#board");
const startButton = document.querySelector("#start-button");
const resetButton = document.querySelector("#reset-button");

// Initialize the grid of pixels
grid_init();


/*
 * Game of Life simulation functions
 */

// Function to create the grid of pixels and add click event listeners to toggle their stat
function grid_init() {
	// Set the responsive board size and grid tracks
	board.style.setProperty("--board-max-size", `${N * PIXEL_SIZE + (N - 1) * GAP_SIZE}px`);
	board.style.setProperty("--pixel-gap", `${GAP_SIZE}px`);
	board.style.gridTemplateColumns = `repeat(${N}, minmax(0, 1fr))`;
	board.style.gridTemplateRows = `repeat(${N}, minmax(0, 1fr))`;

	for (let row = 0; row < N; row++) {
		for (let column = 0; column < N; column++) {
			const pixel = document.createElement("div");
			pixel.className = "pixel";
			// Store the row and column indices as data attributes for later reference
			pixel.dataset.row = row;
			pixel.dataset.col = column;
			// Add toggle functionality for the pixel's alive state on click
			pixel.addEventListener("click", toggle_usr);
			board.append(pixel);
		}
	}
}

// Function to start the Game of Life simulation
function start() {
	step();
}

// Function to reset the Game of Life simulation
function reset() {
	board.querySelectorAll(".pixel.is-alive").forEach((pixel) => {
		pixel.classList.remove("is-alive");
	});
}

// Function to toggle the state of a pixel on the board
function toggle_usr(event) {
	const pixel = event.currentTarget;
	pixel.classList.toggle("is-alive");
}

// Function to automatically toggle the state of a pixel on the board during simulation
function toggle_auto(event) {
	const pixel = event.currentTarget;
	pixel.classList.toggle("is-alive");
}

// Function to perform a single step of the Game of Life simulation
function step() {
    board.querySelectorAll(".pixel").forEach(cellMarkNextState);
    board.querySelectorAll('.pixel[data-next-state="toggle"]').forEach((pixel) => toggle_auto({currentTarget: pixel}));
}

// Update the nextState element of dataset based on the Game of Life rules
function cellMarkNextState(pixel) {
	const row = Number(pixel.dataset.row);
	const col = Number(pixel.dataset.col);

	let aliveNeighbors = 0;

	for (let i = -1; i <= 1; i++) {
		for (let j = -1; j <= 1; j++) {
			if (i === 0 && j === 0) continue;
			const r = row + i;
			const c = col + j;
			if (r >= 0 && r < N && c >= 0 && c < N) {
				const neighbor = board.children[r * N + c];
				if (neighbor.classList.contains("is-alive")) {
					aliveNeighbors++;
				}
			}
		}
	}

	// Determine the next state based on the Game of Life rules
	pixel.dataset.nextState = "no-change";
	if (pixel.classList.contains("is-alive") && (aliveNeighbors < 2 || aliveNeighbors > 3)) {
		pixel.dataset.nextState = "toggle";	// killed
	} else if (!pixel.classList.contains("is-alive") && aliveNeighbors === 3) {
		pixel.dataset.nextState = "toggle";	// born
	}
}


/*
 * Add event listeners
 */
startButton.addEventListener("click", start);
resetButton.addEventListener("click", reset);
