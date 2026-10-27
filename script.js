// Number of pixels per row and column (grid size)
const N = 50;

// Maximum size of each pixel in the grid (in pixels)
const PIXEL_SIZE = 10;
const GAP_SIZE = 1;

// Get elements from the DOM
const board = document.querySelector("#board");
const resetButton = document.querySelector("#reset-button");
const stepButton = document.querySelector("#step-button");

// Initialize the grid of pixels
initializeGrid();


/*
 * Game of Life simulation functions
 */

// Create the grid and add click listeners to toggle each cell
function initializeGrid() {
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
			pixel.addEventListener("click", usrToggleCell);
			board.append(pixel);
		}
	}
}

// Function to reset the Game of Life simulation
function reset() {
	board.querySelectorAll(".pixel.is-alive").forEach((pixel) => {
		pixel.classList.remove("is-alive");
	});
}

// Toggle a cell's alive state when it is clicked
function usrToggleCell(event) {
	const pixel = event.currentTarget;
	pixel.classList.toggle("is-alive");
}

// Function to perform a single step of the Game of Life simulation
function step() {
	const cells = Array.from(board.children);
	const nextStates = cells.map((cell) => {
		const row = Number(cell.dataset.row);
		const column = Number(cell.dataset.col);
		const alive = cell.classList.contains("is-alive");
		const neighbors = countAliveNeighbors(row, column, cells);

		// A live cell survives with two or three neighbors; a dead cell is born with three
		return neighbors === 3 || (alive && neighbors === 2);
	});

	cells.forEach((cell, index) => {
		cell.classList.toggle("is-alive", nextStates[index]);
	});
}

function countAliveNeighbors(row, column, cells) {
	let count = 0;

	for (let rowOffset = -1; rowOffset <= 1; rowOffset++) {
		for (let columnOffset = -1; columnOffset <= 1; columnOffset++) {
			if (rowOffset === 0 && columnOffset === 0) continue;

			const neighborRow = row + rowOffset;
			const neighborColumn = column + columnOffset;
			if (neighborRow >= 0 && neighborRow < N && neighborColumn >= 0 && neighborColumn < N) {
				const neighbor = cells[neighborRow * N + neighborColumn];
				if (neighbor.classList.contains("is-alive")) count++;
			}
		}
	}

	return count;
}


/*
 * Add event listeners
 */
stepButton.addEventListener("click", step);
resetButton.addEventListener("click", reset);
