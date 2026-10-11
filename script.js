const grid = document.getElementById('grid');

if (grid) {
  for (let row = 0; row < 10; row += 1) {
    for (let col = 0; col < 10; col += 1) {
      const cell = document.createElement('button');
      cell.type = 'button';
      cell.className = 'cell';
      cell.setAttribute('aria-label', `cell [${row + 1}, ${col + 1}]`);
      cell.setAttribute('aria-pressed', 'false');
      cell.addEventListener('click', () => {
        const isAlive = cell.classList.toggle('is-alive');
        cell.setAttribute('aria-pressed', String(isAlive));
      });
      grid.appendChild(cell);
    }
  }
}
