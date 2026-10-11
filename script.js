const grid = document.getElementById('grid');

const CELL_STATES = {
  DEAD: 0,
  NASCENT: 1,
  ALIVE: 2,
};

const getNextState = (state) => {
  if (state === CELL_STATES.DEAD) return CELL_STATES.NASCENT;
  if (state === CELL_STATES.NASCENT) return CELL_STATES.ALIVE;
  return CELL_STATES.DEAD;
};

const updateCellState = (cell, state) => {
  cell.dataset.state = String(state);
  cell.classList.remove('is-dead', 'is-nascent', 'is-alive');

  if (state === CELL_STATES.NASCENT) {
    cell.classList.add('is-nascent');
  } else if (state === CELL_STATES.ALIVE) {
    cell.classList.add('is-alive');
  } else {
    cell.classList.add('is-dead');
  }

  const stateName = {
    [CELL_STATES.DEAD]: 'dead',
    [CELL_STATES.NASCENT]: 'nascent',
    [CELL_STATES.ALIVE]: 'alive',
  }[state];
  cell.setAttribute('aria-label', `cell [${cell.dataset.row + 1}, ${cell.dataset.col + 1}], state ${stateName}`);
  cell.setAttribute('aria-pressed', String(state === CELL_STATES.ALIVE || state === CELL_STATES.NASCENT));
};

if (grid) {
  for (let row = 0; row < 10; row += 1) {
    for (let col = 0; col < 10; col += 1) {
      const cell = document.createElement('button');
      cell.type = 'button';
      cell.className = 'cell is-dead';
      cell.dataset.row = String(row);
      cell.dataset.col = String(col);
      cell.dataset.state = String(CELL_STATES.DEAD);
      updateCellState(cell, CELL_STATES.DEAD);

      cell.addEventListener('click', () => {
        const currentState = Number(cell.dataset.state || CELL_STATES.DEAD);
        const nextState = getNextState(currentState);
        updateCellState(cell, nextState);
      });

      grid.appendChild(cell);
    }
  }
}
