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
