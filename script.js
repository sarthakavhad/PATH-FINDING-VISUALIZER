const gridElement = document.getElementById('grid');
const startButton = document.getElementById('start');
const clearButton = document.getElementById('clear');
const randomizeButton = document.getElementById('randomize');
const setStartButton = document.getElementById('set-start');
const setEndButton = document.getElementById('set-end');
const algorithmSelect = document.getElementById('algorithm');
const rows = 30;
const cols = 50;
let grid = [];
let startNode = null;
let endNode = null;
let isSettingStart = false;
let isSettingEnd = false;
const delay = 100; 
function createGrid() {
    grid = [];
    gridElement.innerHTML = '';
    for (let r = 0; r < rows; r++) {
        grid[r] = [];
        for (let c = 0; c < cols; c++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            cell.dataset.row = r;
            cell.dataset.col = c;
            cell.addEventListener('click', handleCellClick);
            gridElement.appendChild(cell);
            grid[r][c] = cell;
        }
    }
}

// Handle cell clicks for setting start/end points and obstacles
function handleCellClick(e) {
    const cell = e.target;
    const row = parseInt(cell.dataset.row);
    const col = parseInt(cell.dataset.col);
    
    if (isSettingStart) {
        if (startNode) startNode.classList.remove('start');
        startNode = cell;
        cell.classList.add('start');
        isSettingStart = false;
    } else if (isSettingEnd) {
        if (endNode) endNode.classList.remove('end');
        endNode = cell;
        cell.classList.add('end');
        isSettingEnd = false;
    } else {
        if (cell !== startNode && cell !== endNode) {
            cell.classList.toggle('obstacle');
        }
    }
}

// Start the selected algorithm
async function runAlgorithm() {
    clearPath();
    if (!startNode || !endNode) {
        alert('Please set both start and end points.');
        return;
    }
    const selectedAlgorithm = algorithmSelect.value;
    switch (selectedAlgorithm) {
        case 'a-star':
            await aStar();
            break;
        case 'dijkstra':
            await dijkstra();
            break;
        case 'bfs':
            await bfs();
            break;
        case 'dfs':
            await dfs();
            break;
    }
}

// Clear the grid
function clearGrid() {
    createGrid();
    startNode = null;
    endNode = null;
}

// Randomize obstacles
function randomizeObstacles() {
    clearGrid();
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            if (Math.random() < 0.3) { // 30% chance to be an obstacle
                grid[r][c].classList.add('obstacle');
            }
        }
    }
}

// Helper function to add delay for animations
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// A* algorithm
async function aStar() {
    if (!startNode || !endNode) return;
    const start = { row: parseInt(startNode.dataset.row), col: parseInt(startNode.dataset.col) };
    const end = { row: parseInt(endNode.dataset.row), col: parseInt(endNode.dataset.col) };
    
    const openSet = [start];
    const cameFrom = {};
    const gScore = {};
    const fScore = {};
    
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            gScore[`${r},${c}`] = Infinity;
            fScore[`${r},${c}`] = Infinity;
        }
    }
    
    gScore[`${start.row},${start.col}`] = 0;
    fScore[`${start.row},${start.col}`] = heuristic(start, end);
    
    function heuristic(a, b) {
        return Math.abs(a.row - b.row) + Math.abs(a.col - b.col);
    }
    
    while (openSet.length > 0) {
        openSet.sort((a, b) => fScore[`${a.row},${a.col}`] - fScore[`${b.row},${b.col}`]);
        const current = openSet.shift();
        
        if (current.row === end.row && current.col === end.col) {
            await reconstructPath(cameFrom, current);
            return;
        }
        
        const neighbors = getNeighbors(current);
        
        for (const neighbor of neighbors) {
            if (neighbor.row < 0 || neighbor.row >= rows || neighbor.col < 0 || neighbor.col >= cols) continue;
            const neighborCell = grid[neighbor.row][neighbor.col];
            if (neighborCell.classList.contains('obstacle')) continue;
            
            const tentativeGScore = gScore[`${current.row},${current.col}`] + 1;
            
            if (tentativeGScore < gScore[`${neighbor.row},${neighbor.col}`]) {
                cameFrom[`${neighbor.row},${neighbor.col}`] = current;
                gScore[`${neighbor.row},${neighbor.col}`] = tentativeGScore;
                fScore[`${neighbor.row},${neighbor.col}`] = tentativeGScore + heuristic(neighbor, end);
                if (!openSet.some(cell => cell.row === neighbor.row && cell.col === neighbor.col)) {
                    openSet.push(neighbor);
                    neighborCell.classList.add('visited');
                    await sleep(delay); // Add a delay for animation
                }
            }
        }
    }
    
    async function reconstructPath(cameFrom, current) {
        while (current) {
            grid[current.row][current.col].classList.add('path');
            current = cameFrom[`${current.row},${current.col}`];
            await sleep(delay); // Add a delay for animation
        }
    }
}

// Dijkstra's algorithm
async function dijkstra() {
    if (!startNode || !endNode) return;
    const start = { row: parseInt(startNode.dataset.row), col: parseInt(startNode.dataset.col) };
    const end = { row: parseInt(endNode.dataset.row), col: parseInt(endNode.dataset.col) };
    
    const openSet = [start];
    const cameFrom = {};
    const gScore = {};
    
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            gScore[`${r},${c}`] = Infinity;
        }
    }
    
    gScore[`${start.row},${start.col}`] = 0;
    
    while (openSet.length > 0) {
        openSet.sort((a, b) => gScore[`${a.row},${a.col}`] - gScore[`${b.row},${b.col}`]);
        const current = openSet.shift();
        
        if (current.row === end.row && current.col === end.col) {
            await reconstructPath(cameFrom, current);
            return;
        }
        
        const neighbors = getNeighbors(current);
        
        for (const neighbor of neighbors) {
            if (neighbor.row < 0 || neighbor.row >= rows || neighbor.col < 0 || neighbor.col >= cols) continue;
            const neighborCell = grid[neighbor.row][neighbor.col];
            if (neighborCell.classList.contains('obstacle')) continue;
            
            const tentativeGScore = gScore[`${current.row},${current.col}`] + 1;
            
            if (tentativeGScore < gScore[`${neighbor.row},${neighbor.col}`]) {
                cameFrom[`${neighbor.row},${neighbor.col}`] = current;
                gScore[`${neighbor.row},${neighbor.col}`] = tentativeGScore;
                if (!openSet.some(cell => cell.row === neighbor.row && cell.col === neighbor.col)) {
                    openSet.push(neighbor);
                    neighborCell.classList.add('visited');
                    await sleep(delay); // Add a delay for animation
                }
            }
        }
    }
    
    async function reconstructPath(cameFrom, current) {
        while (current) {
            grid[current.row][current.col].classList.add('path');
            current = cameFrom[`${current.row},${current.col}`];
            await sleep(delay); // Add a delay for animation
        }
    }
}

// BFS algorithm
async function bfs() {
    if (!startNode || !endNode) return;
    const start = { row: parseInt(startNode.dataset.row), col: parseInt(startNode.dataset.col) };
    const end = { row: parseInt(endNode.dataset.row), col: parseInt(endNode.dataset.col) };
    
    const queue = [start];
    const cameFrom = {};
    const visited = new Set();
    
    visited.add(`${start.row},${start.col}`);
    
    while (queue.length > 0) {
        const current = queue.shift();
        
        if (current.row === end.row && current.col === end.col) {
            await reconstructPath(cameFrom, current);
            return;
        }
        
        const neighbors = getNeighbors(current);
        
        for (const neighbor of neighbors) {
            if (neighbor.row < 0 || neighbor.row >= rows || neighbor.col < 0 || neighbor.col >= cols) continue;
            const neighborCell = grid[neighbor.row][neighbor.col];
            if (neighborCell.classList.contains('obstacle')) continue;
            
            if (!visited.has(`${neighbor.row},${neighbor.col}`)) {
                visited.add(`${neighbor.row},${neighbor.col}`);
                cameFrom[`${neighbor.row},${neighbor.col}`] = current;
                queue.push(neighbor);
                neighborCell.classList.add('visited');
                await sleep(delay); // Add a delay for animation
            }
        }
    }
    
    async function reconstructPath(cameFrom, current) {
        while (current) {
            grid[current.row][current.col].classList.add('path');
            current = cameFrom[`${current.row},${current.col}`];
            await sleep(delay); // Add a delay for animation
        }
    }
}

// DFS algorithm
async function dfs() {
    if (!startNode || !endNode) return;
    const start = { row: parseInt(startNode.dataset.row), col: parseInt(startNode.dataset.col) };
    const end = { row: parseInt(endNode.dataset.row), col: parseInt(endNode.dataset.col) };
    
    const stack = [start];
    const cameFrom = {};
    const visited = new Set();
    
    visited.add(`${start.row},${start.col}`);
    
    while (stack.length > 0) {
        const current = stack.pop();
        
        if (current.row === end.row && current.col === end.col) {
            await reconstructPath(cameFrom, current);
            return;
        }
        
        const neighbors = getNeighbors(current);
        
        for (const neighbor of neighbors) {
            if (neighbor.row < 0 || neighbor.row >= rows || neighbor.col < 0 || neighbor.col >= cols) continue;
            const neighborCell = grid[neighbor.row][neighbor.col];
            if (neighborCell.classList.contains('obstacle')) continue;
            
            if (!visited.has(`${neighbor.row},${neighbor.col}`)) {
                visited.add(`${neighbor.row},${neighbor.col}`);
                cameFrom[`${neighbor.row},${neighbor.col}`] = current;
                stack.push(neighbor);
                neighborCell.classList.add('visited');
                await sleep(delay); // Add a delay for animation
            }
        }
    }
    
    async function reconstructPath(cameFrom, current) {
        while (current) {
            grid[current.row][current.col].classList.add('path');
            current = cameFrom[`${current.row},${current.col}`];
            await sleep(delay); // Add a delay for animation
        }
    }
}

// Get neighbors for a given cell
function getNeighbors(cell) {
    const neighbors = [];
    const directions = [
        { row: -1, col: 0 }, // Up
        { row: 1, col: 0 },  // Down
        { row: 0, col: -1 }, // Left
        { row: 0, col: 1 }   // Right
    ];
    
    for (const direction of directions) {
        const newRow = cell.row + direction.row;
        const newCol = cell.col + direction.col;
        neighbors.push({ row: newRow, col: newCol });
    }
    
    return neighbors;
}

// Clear path and visited nodes
function clearPath() {
    document.querySelectorAll('.path, .visited').forEach(cell => {
        cell.classList.remove('path', 'visited');
    });
}

// Event listeners for buttons
startButton.addEventListener('click', runAlgorithm);
clearButton.addEventListener('click', clearGrid);
randomizeButton.addEventListener('click', randomizeObstacles);
setStartButton.addEventListener('click', () => { isSettingStart = true; isSettingEnd = false; });
setEndButton.addEventListener('click', () => { isSettingEnd = true; isSettingStart = false; });

// Initial grid creation
createGrid();

