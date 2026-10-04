const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const highScoreEl = document.getElementById('highScore');
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');

const GRID_SIZE = 20;          // 20x20 grid
const CELL_SIZE = canvas.width / GRID_SIZE;

let snake, direction, nextDirection, food, score, highScore, gameLoop, gameSpeed;
let isRunning = false;
let isPaused = false;

highScore = parseInt(localStorage.getItem('snakeHighScore')) || 0;
highScoreEl.textContent = highScore;

function initGame() {
    snake = [
        { x: 10, y: 10 },
        { x: 9, y: 10 },
        { x: 8, y: 10 }
    ];
    direction = { x: 1, y: 0 };
    nextDirection = { x: 1, y: 0 };
    score = 0;
    gameSpeed = 120;
    scoreEl.textContent = score;
    spawnFood();
}

function spawnFood() {
    while (true) {
        const newFood = {
            x: Math.floor(Math.random() * GRID_SIZE),
            y: Math.floor(Math.random() * GRID_SIZE)
        };
        if (!snake.some(s => s.x === newFood.x && s.y === newFood.y)) {
            food = newFood;
            return;
        }
    }
}

function draw() {
    // Clear canvas
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    for (let i = 0; i <= GRID_SIZE; i++) {
        ctx.beginPath();
        ctx.moveTo(i * CELL_SIZE, 0);
        ctx.lineTo(i * CELL_SIZE, canvas.height);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, i * CELL_SIZE);
        ctx.lineTo(canvas.width, i * CELL_SIZE);
        ctx.stroke();
    }

    // Draw food (apple)
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(
        food.x * CELL_SIZE + CELL_SIZE / 2,
        food.y * CELL_SIZE + CELL_SIZE / 2,
        CELL_SIZE / 2 - 2,
        0, Math.PI * 2
    );
    ctx.fill();
    ctx.shadowColor = '#ef4444';
    ctx.shadowBlur = 15;

    // Draw snake
    snake.forEach((segment, i) => {
        const isHead = i === 0;
        ctx.fillStyle = isHead ? '#4ade80' : '#22c55e';
        ctx.shadowColor = '#4ade80';
        ctx.shadowBlur = isHead ? 15 : 5;

        const padding = 1;
        const radius = 4;
        const x = segment.x * CELL_SIZE + padding;
        const y = segment.y * CELL_SIZE + padding;
        const w = CELL_SIZE - padding * 2;
        const h = CELL_SIZE - padding * 2;

        ctx.beginPath();
        ctx.roundRect(x, y, w, h, radius);
        ctx.fill();
    });

    ctx.shadowBlur = 0;
}

function update() {
    direction = nextDirection;
    const head = { x: snake[0].x + direction.x, y: snake[0].y + direction.y };

    // Wall collision
    if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
        return gameOver();
    }

    // Self collision
    if (snake.some(s => s.x === head.x && s.y === head.y)) {
        return gameOver();
    }

    snake.unshift(head);

    // Food collision
    if (head.x === food.x && head.y === food.y) {
        score += 10;
        scoreEl.textContent = score;
        spawnFood();

        // Speed up every 50 points
        if (score % 50 === 0 && gameSpeed > 60) {
            gameSpeed -= 10;
            clearInterval(gameLoop);
            gameLoop = setInterval(tick, gameSpeed);
        }
    } else {
        snake.pop();
    }
}

function tick() {
    if (isPaused) return;
    update();
    draw();
}

function gameOver() {
    isRunning = false;
    clearInterval(gameLoop);

    if (score > highScore) {
        highScore = score;
        highScoreEl.textContent = highScore;
        localStorage.setItem('snakeHighScore', highScore);
    }

    ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ef4444';
    ctx.font = 'bold 40px Segoe UI';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 20);
    ctx.fillStyle = 'white';
    ctx.font = 'bold 24px Segoe UI';
    ctx.fillText(`Score: ${score}`, canvas.width / 2, canvas.height / 2 + 20);
    startBtn.textContent = 'Play Again';
}

function startGame() {
    initGame();
    isRunning = true;
    isPaused = false;
    pauseBtn.textContent = 'Pause';
    clearInterval(gameLoop);
    gameLoop = setInterval(tick, gameSpeed);
    draw();
}

function togglePause() {
    if (!isRunning) return;
    isPaused = !isPaused;
    pauseBtn.textContent = isPaused ? 'Resume' : 'Pause';

    if (isPaused) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'white';
        ctx.font = 'bold 40px Segoe UI';
        ctx.textAlign = 'center';
        ctx.fillText('PAUSED', canvas.width / 2, canvas.height / 2);
    } else {
        draw();
    }
}

document.addEventListener('keydown', (e) => {
    const key = e.key;

    // Prevent page scrolling on arrow keys
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key)) {
        e.preventDefault();
    }

    if (!isRunning || isPaused) return;

    // Prevent reversing direction
    if ((key === 'ArrowUp' || key === 'w' || key === 'W') && direction.y === 0) {
        nextDirection = { x: 0, y: -1 };
    } else if ((key === 'ArrowDown' || key === 's' || key === 'S') && direction.y === 0) {
        nextDirection = { x: 0, y: 1 };
    } else if ((key === 'ArrowLeft' || key === 'a' || key === 'A') && direction.x === 0) {
        nextDirection = { x: -1, y: 0 };
    } else if ((key === 'ArrowRight' || key === 'd' || key === 'D') && direction.x === 0) {
        nextDirection = { x: 1, y: 0 };
    }
});

startBtn.addEventListener('click', startGame);
pauseBtn.addEventListener('click', togglePause);

// Initialize initial display
initGame();
draw();
