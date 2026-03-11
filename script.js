// --- UI State ---
let currentSize = 0;
let maxObstacles = 0;
let startCell = null;
let endCell = null;
let obstacles = [];

// DOM Elements
const generateBtn = document.getElementById('generate-btn');
const sizeInput = document.getElementById('grid-size');
const workspace = document.getElementById('workspace');
const gridContainer = document.getElementById('grid');
const gridTitle = document.getElementById('grid-title');
const resultsDiv = document.getElementById('results');

// New Controls
const evalBtnPE = document.getElementById('eval-btn-pe');
const evalBtnVI = document.getElementById('eval-btn-vi');
const gammaSlider = document.getElementById('gamma-slider');
const rewardSlider = document.getElementById('reward-slider');
const gammaVal = document.getElementById('gamma-val');
const rewardVal = document.getElementById('reward-val');

gammaSlider.addEventListener('input', (e) => gammaVal.textContent = e.target.value);
rewardSlider.addEventListener('input', (e) => rewardVal.textContent = e.target.value);

// --- Event Listeners ---
generateBtn.addEventListener('click', () => {
    const size = parseInt(sizeInput.value);
    if (isNaN(size) || size < 5 || size > 9) {
        alert("Please enter a valid number between 5 and 9.");
        return;
    }

    // Init state
    currentSize = size;
    maxObstacles = size - 2;
    startCell = null;
    endCell = null;
    obstacles = [];

    // UI Reset
    gridTitle.textContent = `${size} x ${size} Square:`;
    const numWords = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
    document.getElementById('obs-count-text').textContent = numWords[maxObstacles];
    workspace.style.display = 'block';
    resultsDiv.style.display = 'none';
    gridContainer.innerHTML = '';
    gridContainer.style.gridTemplateColumns = `repeat(${size}, 45px)`;

    let cellNum = 1;
    for (let i = 0; i < size * size; i++) {
        const cell = document.createElement('div');
        cell.className = 'cell';
        cell.textContent = cellNum++;
        cell.addEventListener('click', () => handleCellClick(cell));
        gridContainer.appendChild(cell);
    }
});

evalBtnPE.addEventListener('click', () => runRL('PE'));
evalBtnVI.addEventListener('click', () => runRL('VI'));

function runRL(algo) {
    if (!startCell || !endCell) {
        alert("Please set both a start (green) and an end (red) cell.");
        return;
    }

    const startPos = getCellPos(startCell);
    const endPos = getCellPos(endCell);
    const obsPos = obstacles.map(getCellPos);
    const gamma = parseFloat(gammaSlider.value);
    const stepReward = parseFloat(rewardSlider.value);

    evalBtnPE.disabled = true;
    evalBtnVI.disabled = true;

    // Give UI a moment to show "Evaluating..."
    setTimeout(() => {
        let results;
        let path = [];

        if (algo === 'PE') {
            results = evaluatePolicyPE(currentSize, startPos, endPos, obsPos, gamma, stepReward);
        } else {
            results = runValueIteration(currentSize, startPos, endPos, obsPos, gamma, stepReward);
            path = computeOptimalPath(results.policy, startPos, endPos, obsPos, currentSize);
        }

        displayResults(results.policy, results.values, startPos, endPos, obsPos, path);
        evalBtnPE.disabled = false;
        evalBtnVI.disabled = false;
    }, 50);
}

// --- Helper Functions ---
function handleCellClick(cell) {
    if (cell === startCell) {
        cell.classList.remove('start');
        startCell = null;
        return;
    }
    if (cell === endCell) {
        cell.classList.remove('end');
        endCell = null;
        return;
    }
    if (obstacles.includes(cell)) {
        cell.classList.remove('obstacle');
        obstacles = obstacles.filter(c => c !== cell);
        return;
    }

    if (!startCell) {
        cell.classList.add('start');
        startCell = cell;
    } else if (!endCell) {
        cell.classList.add('end');
        endCell = cell;
    } else if (obstacles.length < maxObstacles) {
        cell.classList.add('obstacle');
        obstacles.push(cell);
    } else {
        alert(`You can only set up to ${maxObstacles} obstacles for a ${currentSize} x ${currentSize} grid.`);
    }
}

function getCellPos(cell) {
    const index = parseInt(cell.textContent) - 1;
    const r = Math.floor(index / currentSize);
    const c = index % currentSize;
    return [r, c];
}

// --- Reinforcement Learning Logic ---

// Action mapping helper
const actionsMap = ['U', 'D', 'L', 'R'];
function getNextState(r, c, a, size, isObstacle) {
    let nr = r, nc = c;
    if (a === 'U') nr -= 1;
    else if (a === 'D') nr += 1;
    else if (a === 'L') nc -= 1;
    else if (a === 'R') nc += 1;

    if (nr < 0 || nr >= size || nc < 0 || nc >= size || isObstacle(nr, nc)) {
        nr = r;
        nc = c;
    }
    return [nr, nc];
}

// HW1-2: Policy Evaluation (Average sum across random 0.25 probability)
function evaluatePolicyPE(size, start, end, obstacles, gamma, stepReward) {
    const policy = {};
    const V = {};
    const theta = 1e-4;

    const isObstacle = (r, c) => obstacles.some(obs => obs[0] === r && obs[1] === c);
    const isEnd = (r, c) => end[0] === r && end[1] === c;

    // 1. Init Random Policy & V
    for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
            const key = `${r},${c}`;
            V[key] = 0.0;
            if (isEnd(r, c) || isObstacle(r, c)) continue;
            policy[key] = actionsMap[Math.floor(Math.random() * actionsMap.length)];
        }
    }

    // 2. Policy Evaluation
    let max_iters = 1000;
    for (let iter = 0; iter < max_iters; iter++) {
        let delta = 0.0;
        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
                if (isEnd(r, c) || isObstacle(r, c)) continue;

                const state_key = `${r},${c}`;
                let v = V[state_key];

                let new_v = 0.0;
                for (let a of actionsMap) {
                    let [nr, nc] = getNextState(r, c, a, size, isObstacle);
                    let reward = isEnd(nr, nc) ? 10.0 : stepReward;
                    let next_state_key = `${nr},${nc}`;
                    // Uniform Probability PE
                    new_v += 0.25 * (reward + gamma * V[next_state_key]);
                }

                V[state_key] = new_v;
                delta = Math.max(delta, Math.abs(v - new_v));
            }
        }
        if (delta < theta) break;
    }

    const formatted_V = {};
    for (const [k, v] of Object.entries(V)) {
        formatted_V[k] = parseFloat(v).toFixed(2);
    }
    return { policy, values: formatted_V };
}

// HW1-3: Value Iteration & Argmax Policy Extraction (MAX operator)
function runValueIteration(size, start, end, obstacles, gamma, stepReward) {
    const policy = {};
    const V = {};
    const theta = 1e-4;

    const isObstacle = (r, c) => obstacles.some(obs => obs[0] === r && obs[1] === c);
    const isEnd = (r, c) => end[0] === r && end[1] === c;

    // Init V
    for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
            V[`${r},${c}`] = 0.0;
        }
    }

    // 1. Value Iteration (Max Operator)
    let max_iters = 1000;
    for (let iter = 0; iter < max_iters; iter++) {
        let delta = 0.0;
        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
                if (isEnd(r, c) || isObstacle(r, c)) continue;

                const state_key = `${r},${c}`;
                let v = V[state_key];

                let max_v = -Infinity;
                for (let a of actionsMap) {
                    let [nr, nc] = getNextState(r, c, a, size, isObstacle);
                    let reward = isEnd(nr, nc) ? 10.0 : stepReward;
                    let next_state_key = `${nr},${nc}`;

                    let action_value = reward + gamma * V[next_state_key];
                    if (action_value > max_v) max_v = action_value;
                }

                V[state_key] = max_v;
                delta = Math.max(delta, Math.abs(v - max_v));
            }
        }
        if (delta < theta) break;
    }

    // 2. Policy Extraction (Argmax)
    for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
            if (isEnd(r, c) || isObstacle(r, c)) continue;
            const state_key = `${r},${c}`;

            let max_v = -Infinity;
            let best_a = 'U';

            for (let a of actionsMap) {
                let [nr, nc] = getNextState(r, c, a, size, isObstacle);
                let reward = isEnd(nr, nc) ? 10.0 : stepReward;
                let next_state_key = `${nr},${nc}`;

                let action_value = reward + gamma * V[next_state_key];
                // Rounding to prevent floating point instability causing inconsistent argmax paths
                action_value = Math.round(action_value * 10000) / 10000;

                if (action_value > max_v) {
                    max_v = action_value;
                    best_a = a;
                }
            }
            policy[state_key] = best_a;
        }
    }

    const formatted_V = {};
    for (const [k, v] of Object.entries(V)) {
        formatted_V[k] = parseFloat(v).toFixed(2);
    }
    return { policy, values: formatted_V };
}

function computeOptimalPath(policy, start, end, obstacles, size) {
    let path = [];
    let curr = start;
    let visited = new Set();
    const isObstacle = (r, c) => obstacles.some(obs => obs[0] === r && obs[1] === c);

    // limit iterations to avoid infinite loops if it gets stuck
    while (curr[0] !== end[0] || curr[1] !== end[1]) {
        let key = `${curr[0]},${curr[1]}`;
        if (visited.has(key)) break; // loop detected
        visited.add(key);
        path.push(curr);

        let a = policy[key];
        if (!a) break;

        let next = getNextState(curr[0], curr[1], a, size, isObstacle);
        curr = next;
    }
    // Note: this array does NOT include the 'end' point intentionally, we only highlight the travel path
    return path;
}

// --- Render Results ---
const svgArrows = {
    'U': '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 2L4 10h5v12h6V10h5L12 2z"/></svg>',
    'D': '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 22l8-8h-5V2h-6v12H4l8 8z"/></svg>',
    'L': '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M2 12l8-8v5h12v6H10v5L2 12z"/></svg>',
    'R': '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M22 12l-8 8v-5H2v-6h12V4l8 8z"/></svg>'
};

function displayResults(policy, values, startPos, endPos, obsPos, optimalPath) {
    resultsDiv.style.display = 'flex';
    const vGrid = document.getElementById('value-grid');
    const pGrid = document.getElementById('policy-grid');

    vGrid.style.gridTemplateColumns = `repeat(${currentSize}, 55px)`;
    pGrid.style.gridTemplateColumns = `repeat(${currentSize}, 55px)`;

    vGrid.innerHTML = '';
    pGrid.innerHTML = '';

    const isPosInArray = (pos, arr) => arr.some(p => p[0] === pos[0] && p[1] === pos[1]);
    const isPosEqual = (p1, p2) => p1[0] === p2[0] && p1[1] === p2[1];

    for (let r = 0; r < currentSize; r++) {
        for (let c = 0; c < currentSize; c++) {
            const key = `${r},${c}`;
            const pos = [r, c];

            const vc = document.createElement('div');
            vc.className = 'cell';
            vc.style.fontSize = '0.9em';
            vc.style.width = '55px';
            vc.style.height = '55px';

            const pc = document.createElement('div');
            pc.className = 'cell';
            pc.style.width = '55px';
            pc.style.height = '55px';

            if (isPosEqual(pos, startPos)) {
                vc.classList.add('start');
                pc.classList.add('start');
                vc.textContent = values[key];
                pc.innerHTML = svgArrows[policy[key]] || '';
            } else if (isPosEqual(pos, endPos)) {
                vc.classList.add('end');
                pc.classList.add('end');
                vc.textContent = '0'; // Terminal state
                pc.innerHTML = '<strong style="font-size:1.3em;">G</strong>'; // Goal
            } else if (isPosInArray(pos, obsPos)) {
                vc.classList.add('obstacle');
                pc.classList.add('obstacle');
            } else {
                vc.textContent = values[key];
                pc.innerHTML = svgArrows[policy[key]] || '';
                // Highlight Path if available
                if (isPosInArray(pos, optimalPath) && !isPosEqual(pos, startPos)) {
                    vc.classList.add('path');
                    pc.classList.add('path');
                }
            }

            vGrid.appendChild(vc);
            pGrid.appendChild(pc);
        }
    }
}
