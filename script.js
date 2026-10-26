// Number of pixels per row and column (grid size)
const N = 50;

// Maximum size of each pixel in the grid (in pixels)
const PIXEL_SIZE = 10;
const GAP_SIZE = 1;

// Get board element from the DOM
const board = document.querySelector("#board");
const resetButton = document.querySelector("#reset-button");

// Set the responsive board size and grid tracks
board.style.setProperty("--board-max-size", `${N * PIXEL_SIZE + (N - 1) * GAP_SIZE}px`);
board.style.setProperty("--pixel-gap", `${GAP_SIZE}px`);
board.style.gridTemplateColumns = `repeat(${N}, minmax(0, 1fr))`;
board.style.gridTemplateRows = `repeat(${N}, minmax(0, 1fr))`;

// Create the grid of pixels and add click event listeners to toggle their state
for (let row = 0; row < N; row++) {
	for (let column = 0; column < N; column++) {
		const pixel = document.createElement("div");
		pixel.className = "pixel";
		pixel.addEventListener("click", () => {
			pixel.classList.toggle("is-alive");
		});
		board.append(pixel);
	}
}

// Add event listener to the reset button to clear all alive pixels
resetButton.addEventListener("click", () => {
	board.querySelectorAll(".pixel.is-alive").forEach((pixel) => {
		pixel.classList.remove("is-alive");
	});
});
