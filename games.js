// --- JUEGOS MEJORADOS MOBILE READY ---

// Tres en Raya PRO
let tttBoard = ['', '', '', '', '', '', '', '', ''];
let tttTurn = '❌'; let tttGameOver = false;

function renderTTT() {
    const boardDiv = document.getElementById('ttt-board');
    if (!boardDiv) return; boardDiv.innerHTML = '';
    tttBoard.forEach((cell, i) => { const cellDiv = document.createElement('div'); cellDiv.className = `ttt-cell ${cell === '❌' ? 'x-mark' : (cell === '⭕' ? 'o-mark' : '')}`; cellDiv.textContent = cell; cellDiv.onclick = () => tttMove(i); boardDiv.appendChild(cellDiv); });
    const turnColor = tttGameOver ? '#fff' : (tttTurn === '❌' ? 'var(--neon-cyan)' : 'var(--neon-pink)');
    document.getElementById('ttt-turn').innerHTML = tttGameOver ?
    'FIN DEL JUEGO' : `Turno <span style="color:${turnColor}; text-shadow: 0 0 10px ${turnColor};">${tttTurn}</span>`;
}
function tttMove(index) { if (tttBoard[index] !== '' || tttGameOver || tttTurn === '⭕') return; playSound('hit'); tttBoard[index] = tttTurn; checkTTTState();
if(!tttGameOver) { tttTurn = '⭕'; renderTTT(); setTimeout(tttAIMove, 600); } }
function tttAIMove() {
    if(tttGameOver) return;
    let available = []; tttBoard.forEach((v,i) => { if(v==='') available.push(i); }); if(available.length === 0) return;
    let move = -1;
    const lines = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
    for(let player of ['⭕', '❌']) { if(move !== -1) break;
    for(let line of lines) { let [a,b,c] = line; let vals = [tttBoard[a], tttBoard[b], tttBoard[c]];
    if(vals.filter(v => v === player).length === 2 && vals.includes('')) { move = line[vals.indexOf('')]; break;
    } } }
    if (move === -1 && tttBoard[4] === '') move = 4;
    if (move === -1) move = available[Math.floor(Math.random() * available.length)];
    playSound('hit'); tttBoard[move] = '⭕'; checkTTTState(); if(!tttGameOver) { tttTurn = '❌'; renderTTT();
    }
}
function checkTTTState() {
    const winLine = checkWinnerInfo();
    if (winLine) { renderTTT(); const cells = document.getElementById('ttt-board').children;
    winLine.forEach(idx => cells[idx].classList.add('winning-cell')); showTTTOverlay(tttTurn === '❌' ? `¡Ganaste a la IA!` : `¡La IA venció!`); tttGameOver = true;
    playSound(tttTurn === '❌' ? 'win' : 'die'); autoRestartTTT(); } 
    else if (!tttBoard.includes('')) { showTTTOverlay('¡Empate!');
    tttGameOver = true; renderTTT(); playSound('die'); autoRestartTTT(); } 
}
function autoRestartTTT() { setTimeout(() => { tttBoard = ['', '', '', '', '', '', '', '', '']; tttTurn = '❌'; tttGameOver = false; document.getElementById('ttt-overlay').classList.add('hidden'); renderTTT(); }, 2500);
}
function checkWinnerInfo() { const lines = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]]; for (let line of lines) { if (tttBoard[line[0]] && tttBoard[line[0]] === tttBoard[line[1]] && tttBoard[line[1]] === tttBoard[line[2]]) return line;
} return null; }
function showTTTOverlay(msg) { const overlay = document.getElementById('ttt-overlay'); document.getElementById('ttt-result').innerText = msg; overlay.classList.remove('hidden');
}
document.getElementById('ttt-reset')?.addEventListener('click', () => { tttBoard = ['', '', '', '', '', '', '', '', '']; tttTurn = '❌'; tttGameOver = false; document.getElementById('ttt-overlay').classList.add('hidden'); renderTTT(); });

// --- NEON SNAKE ---
let snakeCanvas = document.getElementById('snake-canvas'), snakeCtx = snakeCanvas?.getContext('2d');
let snake, direction, food, score, gameInterval, snakeLevel = 1, snakeWalls = [];
const snakeSkins = ['#00f3ff', '#bc13fe', '#f1c40f', '#ff0055', '#34C759'];
function initSnake() { 
    if (!snakeCanvas) return; document.addEventListener('keydown', handleSnakeKey); document.getElementById('snake-start-btn')?.addEventListener('click', startNextSnakeLevel);
    let touchStartX = 0, touchStartY = 0;
    snakeCanvas.addEventListener('touchstart', e => { touchStartX = e.touches[0].clientX; touchStartY = e.touches[0].clientY; if(e.cancelable) e.preventDefault(); }, {passive:false});
    snakeCanvas.addEventListener('touchmove', e => {
        if(!touchStartX || !touchStartY) return; let dx = e.touches[0].clientX - touchStartX; let dy = e.touches[0].clientY - touchStartY;
        if(Math.abs(dx) > 30 || Math.abs(dy) > 30) { 
            if(Math.abs(dx) > Math.abs(dy)) {
                if(dx > 0 && direction.x === 0) direction = {x:1, y:0}; else if(dx < 0 && direction.x === 0) direction = {x:-1, y:0};
            } else {
                if(dy > 0 && direction.y === 0) direction = {x:0, y:1}; else if(dy < 0 && direction.y === 0) direction = {x:0, y:-1};
            } touchStartX = 0; touchStartY = 0; 
        } if(e.cancelable) e.preventDefault(); 
    }, {passive:false});
}

function getWallsForLevel(level) {
    let walls = [];
    if(level === 1) { for(let i=0; i<30; i++) { if(i < 10 || i > 19) { walls.push({x: i, y: 0});
    walls.push({x: i, y: 29}); walls.push({x: 0, y: i}); walls.push({x: 29, y: i});
    } } } 
    else if(level === 2) { for(let i=5; i<25; i++) { if(i < 13 || i > 16) { walls.push({x:i, y:10});
    walls.push({x:i, y:19}); } } } 
    else if (level === 3) { for(let i=5; i<12; i++) { walls.push({x:15, y:i});
    walls.push({x:15, y:i+12}); } for(let i=5; i<12; i++) { walls.push({x:i, y:15}); walls.push({x:i+12, y:15});
    } } 
    else if (level === 4) { let crosses = [[8,8], [22,8], [8,22], [22,22]];
    crosses.forEach(c => { walls.push({x:c[0], y:c[1]}); walls.push({x:c[0]-1, y:c[1]}); walls.push({x:c[0]+1, y:c[1]}); walls.push({x:c[0], y:c[1]-1}); walls.push({x:c[0], y:c[1]+1}); });
    } 
    else if (level === 5) { for(let i=2; i<28; i++) { walls.push({x:i, y:2}); walls.push({x:27, y:i});
    walls.push({x:i, y:27}); } for(let i=5; i<25; i++) { walls.push({x:5, y:i}); } for(let i=5; i<23; i++) { walls.push({x:i, y:5});
    } }
    return walls;
}
function startNextSnakeLevel() {
    document.getElementById('snake-overlay').classList.add('hidden');
    snake = [{x:15, y:15}, {x:14, y:15}, {x:13, y:15}]; direction = {x:1, y:0}; snakeWalls = getWallsForLevel(snakeLevel); food = generateFood();
    score = 0;
    document.getElementById('snake-score').textContent = '0'; document.getElementById('snake-level-display').textContent = snakeLevel + "/5";
    let baseSpeed = 110 - (snakeLevel * 10);
    if (gameInterval) clearInterval(gameInterval); gameInterval = setInterval(moveSnake, baseSpeed);
}
function generateFood() { let newFood; while(true) { newFood = {x: Math.floor(Math.random()*30), y: Math.floor(Math.random()*30)};
    let inWall = snakeWalls.some(w => w.x === newFood.x && w.y === newFood.y);
    let inSnake = snake.some(s => s.x === newFood.x && s.y === newFood.y); if(!inWall && !inSnake) break; } return newFood;
}
function handleSnakeKey(e) {
    let win = document.getElementById('window-snake');
    if(win && !win.classList.contains('hidden')) {
        if (e.key === 'ArrowUp' && direction.y === 0) direction = {x:0, y:-1};
        if (e.key === 'ArrowDown' && direction.y === 0) direction = {x:0, y:1};
        if (e.key === 'ArrowLeft' && direction.x === 0) direction = {x:-1, y:0};
        if (e.key === 'ArrowRight' && direction.x === 0) direction = {x:1, y:0};
    }
}
function moveSnake() {
    if (!snakeCtx) return; let head = {x: snake[0].x + direction.x, y: snake[0].y + direction.y};
    if (head.x < 0) head.x = 29; else if (head.x >= 30) head.x = 0;
    if (head.y < 0) head.y = 29; else if (head.y >= 30) head.y = 0;
    let hitWall = snakeWalls.some(w => w.x === head.x && w.y === head.y);
    let hitSelf = snake.some(seg => seg.x === head.x && seg.y === head.y);
    if (hitWall || hitSelf) { clearInterval(gameInterval); playSound('die');
        document.getElementById('snake-overlay-title').innerText = "SISTEMA CAÍDO"; document.getElementById('snake-overlay-title').style.color = "var(--neon-pink)"; document.getElementById('snake-overlay-desc').innerText = "Impacto detectado."; document.getElementById('snake-start-btn').innerText = "Reintentar Nivel " + snakeLevel; document.getElementById('snake-overlay').classList.remove('hidden'); return;
    }
    snake.unshift(head);
    if (head.x === food.x && head.y === food.y) { score += 10; document.getElementById('snake-score').textContent = score;
        food = generateFood(); playSound('eat');
        if(score >= 100) { clearInterval(gameInterval); playSound('win'); if(snakeLevel < 5) { snakeLevel++; document.getElementById('snake-overlay-title').innerText = "¡FASE SUPERADA!";
            document.getElementById('snake-overlay-title').style.color = "var(--neon-cyan)"; document.getElementById('snake-overlay-desc').innerText = "Pasaste al nivel " + snakeLevel; document.getElementById('snake-start-btn').innerText = "Siguiente Nivel";
            } else { snakeLevel = 1; document.getElementById('snake-overlay-title').innerText = "¡HACKEO MAESTRO!"; document.getElementById('snake-overlay-title').style.color = "var(--neon-yellow)"; document.getElementById('snake-overlay-desc').innerText = "¡Terminaste los 5 niveles!";
            document.getElementById('snake-start-btn').innerText = "Jugar de nuevo"; } document.getElementById('snake-overlay').classList.remove('hidden'); }
    } else { snake.pop(); } drawSnake();
}
function drawSnake() {
    snakeCtx.fillStyle = '#050508'; snakeCtx.fillRect(0,0,450,450); snakeCtx.strokeStyle = 'rgba(0, 243, 255, 0.05)'; snakeCtx.lineWidth = 1;
    for(let i=0; i<=450; i+=15) { snakeCtx.beginPath(); snakeCtx.moveTo(i,0); snakeCtx.lineTo(i,450); snakeCtx.stroke(); snakeCtx.beginPath(); snakeCtx.moveTo(0,i); snakeCtx.lineTo(450,i); snakeCtx.stroke();
    }
    snakeCtx.fillStyle = 'rgba(255, 0, 85, 0.8)'; snakeCtx.shadowBlur = 5; snakeCtx.shadowColor = '#ff0055';
    snakeWalls.forEach(w => snakeCtx.fillRect(w.x*15, w.y*15, 15, 15));
    let currentSkin = snakeSkins[(snakeLevel - 1) % snakeSkins.length]; snakeCtx.shadowBlur = 10; snakeCtx.shadowColor = currentSkin;
    snake.forEach((seg, index) => { snakeCtx.fillStyle = (index === 0) ? '#ffffff' : currentSkin; snakeCtx.fillRect(seg.x*15+1, seg.y*15+1, 13,13); });
    snakeCtx.shadowBlur = 15;
    snakeCtx.shadowColor = '#bc13fe'; snakeCtx.fillStyle = '#bc13fe'; snakeCtx.fillRect(food.x*15+1, food.y*15+1, 13,13); snakeCtx.shadowBlur = 0;
}

// --- NEON PONG ---
let pongCanvas = document.getElementById('pong-canvas'), pongCtx = pongCanvas?.getContext('2d');
let pongLoop, pongBalls = [], pongPlayer, pongAI, pScore = 0, aiScore = 0, pongActive = false, pongLevel = 1, isPongPaused = false;
function initPong() { 
    if(!pongCanvas) return; document.getElementById('pong-start-btn').addEventListener('click', resetPong);
    const handlePongMove = (e) => { if(pongActive && !isPongPaused) { if(e.cancelable) e.preventDefault(); let rect = pongCanvas.getBoundingClientRect();
    let clientY = e.touches ? e.touches[0].clientY : e.clientY; let scaleY = pongCanvas.height / rect.height;
    pongPlayer.y = (clientY - rect.top) * scaleY - pongPlayer.h/2; } };
    pongCanvas.addEventListener('mousemove', handlePongMove); pongCanvas.addEventListener('touchmove', handlePongMove, {passive: false});
}
function resetPong() {
    document.getElementById('pong-overlay').classList.add('hidden'); document.getElementById('pong-level-display').innerText = pongLevel;
    let pHeight = 80 - (pongLevel * 5);
    let ballSpeed = 5 + (pongLevel * 0.8); 
    pongPlayer = {x: 10, y: 160, w: 10, h: Math.max(30, pHeight)};
    pongAI = {x: 580, y: 160, w: 10, h: Math.max(30, pHeight)}; pongBalls = [];
    pongBalls.push({x: 300, y: 200, r: 8, dx: ballSpeed, dy: ballSpeed});
    if(pongLevel >= 3) { pongBalls.push({x: 300, y: 150, r: 8, dx: -ballSpeed, dy: -ballSpeed});
    }
    pScore = 0; aiScore = 0; updatePongScore(); pongActive = true; isPongPaused = false; if(pongLoop) cancelAnimationFrame(pongLoop); runPong();
}
function updatePongScore() { document.getElementById('pong-player-score').innerText = pScore; document.getElementById('pong-ai-score').innerText = aiScore; }
function runPong() { if(!pongActive) return; let win = document.getElementById('window-pong');
    if(win && !win.classList.contains('hidden') && !isPongPaused) { updatePong(); } drawPong(); pongLoop = requestAnimationFrame(runPong);
}
function scorePointPause(scorerBall, who) { if(who === 'ai') { aiScore++; playSound('die'); } else { pScore++; playSound('win'); } updatePongScore(); isPongPaused = true;
    setTimeout(() => { if(pScore >= 5 || aiScore >= 5) { checkPongEnd(); } else { resetBall(scorerBall); isPongPaused = false; } }, 1000);
}
function checkPongEnd() { pongActive = false; document.getElementById('pong-overlay').classList.remove('hidden'); if(pScore >= 5) { playSound('win'); pongLevel++; document.getElementById('pong-result-text').innerText = '¡NIVEL SUPERADO!';
    document.getElementById('pong-start-btn').innerText = `Siguiente (${pongLevel})`; } else { playSound('die'); document.getElementById('pong-result-text').innerText = 'SISTEMA CAÍDO'; document.getElementById('pong-start-btn').innerText = 'Reintentar ' + pongLevel;
    } }
function updatePong() {
    pongBalls.forEach(ball => {
        ball.x += ball.dx; ball.y += ball.dy;
        if(ball.y - ball.r < 0 || ball.y + ball.r > 400) { ball.dy *= -1; playSound('hit'); }
        if (pongBalls.indexOf(ball) === 0) { let aiSpeed = 0.08 + (pongLevel * 0.02); pongAI.y += (ball.y - (pongAI.y + pongAI.h/2)) * aiSpeed; }
        if(pongPlayer.y < 0) pongPlayer.y = 0; if(pongPlayer.y > 400 - pongPlayer.h) pongPlayer.y = 400 - pongPlayer.h;
        if(pongAI.y < 0) pongAI.y = 0; if(pongAI.y > 400 - pongAI.h) pongAI.y = 400 - pongAI.h;
        
        let p = (ball.x < 300) ? pongPlayer : pongAI;
        if(ball.x - ball.r < p.x + p.w && ball.x + ball.r > p.x && ball.y + ball.r > p.y && ball.y - ball.r < p.y + p.h) { 
            playSound('hit'); ball.dx *= -1.05; 
            let hitPoint = (ball.y - (p.y + p.h/2)) / (p.h/2); ball.dy = hitPoint * (5 + pongLevel) + (Math.random() - 0.5); ball.x = (ball.x < 300) ? p.x + p.w + ball.r : p.x - ball.r;
        }
        if(ball.x < 0 && !isPongPaused) { scorePointPause(ball, 'ai');
        } else if(ball.x > 600 && !isPongPaused) { scorePointPause(ball, 'player'); }
    });
}
function resetBall(ball) { ball.x = 300; ball.y = 200; let speed = 5 + (pongLevel*0.8);
    ball.dx = (ball.dx > 0 ? -speed : speed); ball.dy = speed * (Math.random() > 0.5 ? 1 : -1);
}
function drawPong() {
    pongCtx.clearRect(0, 0, 600, 400); pongCtx.setLineDash([10, 10]); pongCtx.beginPath(); pongCtx.moveTo(300, 0); pongCtx.lineTo(300, 400); pongCtx.strokeStyle = 'rgba(255,255,255,0.2)';
    pongCtx.stroke();
    pongCtx.shadowBlur = 10; pongCtx.shadowColor = '#fff'; pongCtx.fillStyle = '#fff';
    pongBalls.forEach(ball => { pongCtx.beginPath(); pongCtx.arc(ball.x, ball.y, ball.r, 0, Math.PI*2); pongCtx.fill(); });
    pongCtx.shadowColor = '#00f3ff'; pongCtx.fillStyle = '#00f3ff';
    pongCtx.fillRect(pongPlayer.x, pongPlayer.y, pongPlayer.w, pongPlayer.h);
    pongCtx.shadowColor = '#bc13fe'; pongCtx.fillStyle = '#bc13fe'; pongCtx.fillRect(pongAI.x, pongAI.y, pongAI.w, pongAI.h); pongCtx.shadowBlur = 0;
}

// --- NEON BREAKOUT ---
let brkCanvas = document.getElementById('breakout-canvas'), brkCtx = brkCanvas?.getContext('2d');
let brkActive = false, brkLoop, brkBalls = [], brkPaddle, brkBricks = [], brkPowerups = [], brkScore = 0, brkLives = 3, brkLevel = 1;
function initBreakout() {
    if(!brkCanvas) return; document.getElementById('breakout-start-btn').addEventListener('click', startBreakout);
    const handleBreakoutMove = (e) => {
        if(brkActive) { if(e.cancelable) e.preventDefault();
            let rect = brkCanvas.getBoundingClientRect(); let clientX = e.touches ? e.touches[0].clientX : e.clientX;
            let scaleX = brkCanvas.width / rect.width;
            let relativeX = (clientX - rect.left) * scaleX; if(relativeX > 0 && relativeX < brkCanvas.width) { brkPaddle.x = relativeX - brkPaddle.w/2;
            } } };
    brkCanvas.addEventListener('mousemove', handleBreakoutMove); brkCanvas.addEventListener('touchmove', handleBreakoutMove, {passive: false});
}
function startBreakout() {
    document.getElementById('breakout-overlay').classList.add('hidden'); document.getElementById('breakout-level-display').innerText = brkLevel;
    let paddleW = Math.max(80, 120 - (brkLevel * 5)); let bSpeed = 4.2 + (brkLevel * 0.4);
    if(!brkActive && brkLives <= 0) { brkScore = 0; brkLives = 3; }
    brkPaddle = { w: paddleW, h: 12, x: 240, y: 480 };
    brkBalls = [{ x: 300, y: 465, r: 8, dx: bSpeed, dy: -bSpeed, fire: false }]; brkBricks = [];
    brkPowerups = [];
    document.getElementById('breakout-score').innerText = brkScore; document.getElementById('breakout-lives').innerText = brkLives; let rows = Math.min(8, 3 + brkLevel);
    let c = ['#00f3ff', '#bc13fe', '#ff0055', '#f1c40f', '#34C759', '#ff9f0a', '#ffffff', '#00f3ff'];
    for(let r=0; r<rows; r++) { for(let col=0; col<8; col++) { brkBricks.push({ x: col*70 + 25, y: r*25 + 40, w: 60, h: 15, status: 1, color: c[r] });
    } }
    brkActive = true; if(brkLoop) cancelAnimationFrame(brkLoop); runBreakout();
}
function runBreakout() { if(!brkActive) return; let win = document.getElementById('window-breakout');
    if(win && !win.classList.contains('hidden')) { updateBreakout(); drawBreakout(); } brkLoop = requestAnimationFrame(runBreakout);
}
function spawnPowerup(x, y) { if(brkLevel >= 2 && Math.random() < 0.25) { let types = ['triple', 'fire', 'expand'];
    let type = types[Math.floor(Math.random() * types.length)]; let color = type === 'triple' ?
    '#34C759' : (type === 'fire' ? '#ff0055' : '#00f3ff'); brkPowerups.push({ x: x+20, y: y, w: 20, h: 20, type: type, color: color });
} }
function activatePowerup(type) { playSound('eat'); if(type === 'triple') { if(brkBalls.length < 5) { let base = brkBalls[0];
    brkBalls.push({ x: base.x, y: base.y, r: 8, dx: -base.dx, dy: base.dy, fire: base.fire });
    brkBalls.push({ x: base.x, y: base.y, r: 8, dx: base.dx*1.2, dy: base.dy, fire: base.fire });
    } } else if(type === 'fire') { brkBalls.forEach(b => b.fire = true); setTimeout(()=>{brkBalls.forEach(b => b.fire = false);}, 8000);
    } else if(type === 'expand') { brkPaddle.w = Math.min(200, brkPaddle.w + 50); setTimeout(()=>{brkPaddle.w = Math.max(80, brkPaddle.w - 50);}, 10000);
    } }
function updateBreakout() {
    for(let i = brkPowerups.length - 1; i >= 0; i--) { let pu = brkPowerups[i];
        pu.y += 2.5; if(pu.y + pu.h > brkPaddle.y && pu.x + pu.w > brkPaddle.x && pu.x < brkPaddle.x + brkPaddle.w) { activatePowerup(pu.type);
        brkPowerups.splice(i, 1); } else if (pu.y > 500) { brkPowerups.splice(i, 1);
        } }
    for(let i = brkBalls.length - 1; i >= 0; i--) { let b = brkBalls[i];
        b.x += b.dx; b.y += b.dy;
        if(b.x + b.r > 600 || b.x - b.r < 0) { b.dx *= -1; playSound('hit'); } if(b.y - b.r < 0) { b.dy *= -1; playSound('hit'); }
        if(b.y + b.r > 500) { brkBalls.splice(i, 1);
            if(brkBalls.length === 0) { brkLives--; document.getElementById('breakout-lives').innerText = brkLives; playSound('die'); if (brkLives > 0) { let speed = 4.2 + (brkLevel * 0.4);
            brkBalls.push({x: 300, y: 465, r: 8, dx: speed, dy: -speed, fire: false}); } else { brkActive = false;
            document.getElementById('breakout-result-text').innerText = 'GAME OVER'; document.getElementById('breakout-start-btn').innerText = 'Reintentar ' + brkLevel; document.getElementById('breakout-overlay').classList.remove('hidden'); return; } } continue;
        }
        if(b.y + b.r > brkPaddle.y && b.x > brkPaddle.x && b.x < brkPaddle.x + brkPaddle.w) { b.dy = -Math.abs(b.dy);
            playSound('hit'); b.dx = ((b.x - (brkPaddle.x + brkPaddle.w/2)) / (brkPaddle.w/2)) * 7;
        }
        for(let br of brkBricks) { if(br.status === 1) { if(b.x > br.x && b.x < br.x+br.w && b.y-b.r < br.y+br.h && b.y+b.r > br.y) { if(!b.fire) b.dy *= -1;
            br.status = 0; brkScore += 10; document.getElementById('breakout-score').innerText = brkScore; playSound('eat'); spawnPowerup(br.x, br.y);
        } } } }
    let allCleared = brkBricks.every(br => br.status === 0); if(allCleared) { brkActive = false;
        playSound('win'); brkLevel++; document.getElementById('breakout-result-text').innerText = `¡NIVEL ${brkLevel-1} SUPERADO!`; document.getElementById('breakout-start-btn').innerText = 'Siguiente Nivel'; document.getElementById('breakout-overlay').classList.remove('hidden'); }
}
function drawBreakout() {
    brkCtx.clearRect(0,0,600,500);
    for(let b of brkBricks) { if(b.status === 1) { brkCtx.shadowBlur = 10; brkCtx.shadowColor = b.color; brkCtx.fillStyle = b.color;
        brkCtx.fillRect(b.x, b.y, b.w, b.h); } }
    brkCtx.shadowBlur = 15; brkCtx.shadowColor = '#00f3ff'; brkCtx.fillStyle = '#00f3ff';
    brkCtx.fillRect(brkPaddle.x, brkPaddle.y, brkPaddle.w, brkPaddle.h);
    brkPowerups.forEach(pu => { brkCtx.shadowBlur = 15; brkCtx.shadowColor = pu.color; brkCtx.fillStyle = pu.color; brkCtx.fillRect(pu.x, pu.y, pu.w, pu.h); brkCtx.shadowBlur = 0; brkCtx.fillStyle = '#000'; brkCtx.font = 'bold 14px Arial'; brkCtx.textAlign = 'center'; brkCtx.fillText(pu.type.charAt(0).toUpperCase(), pu.x+(pu.w/2), pu.y+15); });
    brkBalls.forEach(b => { brkCtx.shadowBlur = 15; brkCtx.shadowColor = b.fire ? '#ff0055' : '#fff'; brkCtx.fillStyle = b.fire ? '#ff0055' : '#fff'; brkCtx.beginPath(); brkCtx.arc(b.x, b.y, b.r, 0, Math.PI*2); brkCtx.fill(); });
    brkCtx.shadowBlur = 0;
}

// --- MEMORAMA ---
let memoryCards = ['🤖','💾','🌐','🎮','⚡','🚀','🔋','📡'];
let memoryBoard = [], memoryFlipped = [], memoryMatched = [], memoryLock = false;
function initMemory() { document.getElementById('memory-reset').addEventListener('click', () => { document.getElementById('memory-overlay').classList.add('hidden'); resetMemory(); });
}
function resetMemory() { memoryBoard = [...memoryCards, ...memoryCards].sort(() => Math.random() - 0.5); memoryFlipped = Array(16).fill(false); memoryMatched = Array(16).fill(false); renderMemory();
}
function renderMemory() { const grid = document.getElementById('memory-grid'); grid.innerHTML = '';
    memoryBoard.forEach((card, i) => { const wrapper = document.createElement('div'); wrapper.className = 'mem-card'; if(memoryMatched[i]) wrapper.classList.add('matched'); else if(memoryFlipped[i]) wrapper.classList.add('flipped'); wrapper.innerHTML = `<div class="mem-card-inner"><div class="mem-card-front"></div><div class="mem-card-back">${card}</div></div>`; wrapper.onclick = () => flipMemory(i); grid.appendChild(wrapper); });
}
function flipMemory(index) {
    if (memoryLock || memoryMatched[index] || memoryFlipped[index]) return; playSound('hit');
    let flipped = memoryFlipped.reduce((acc, val, i) => acc + (val && !memoryMatched[i] ? 1 : 0), 0);
    if (flipped === 2) return;
    memoryFlipped[index] = true; renderMemory(); let flippedIndices = memoryFlipped.reduce((acc, val, i) => val && !memoryMatched[i] ? [...acc, i] : acc, []);
    if (flippedIndices.length === 2) { memoryLock = true;
        if (memoryBoard[flippedIndices[0]] === memoryBoard[flippedIndices[1]]) { playSound('eat'); memoryMatched[flippedIndices[0]] = memoryMatched[flippedIndices[1]] = true;
            memoryFlipped[flippedIndices[0]] = memoryFlipped[flippedIndices[1]] = false; setTimeout(() => { renderMemory(); memoryLock = false; if (memoryMatched.every(v => v)) { document.getElementById('memory-overlay').classList.remove('hidden'); playSound('win'); } }, 500);
        } 
        else { setTimeout(() => { memoryFlipped[flippedIndices[0]] = memoryFlipped[flippedIndices[1]] = false; memoryLock = false; renderMemory(); }, 800);
        } }
}

// --- DECODIFICADOR (AHORCADO ANIME 50 PREGUNTAS) ---
let hangmanDictionary = [ 
    { w: 'NARUTO', h: 'Ninja rubio con un zorro demonio dentro.' }, 
    { w: 'GOKU', h: 'Saiyajin criado en la Tierra.' }, 
    { w: 'LUFFY', h: 'Su cuerpo es de goma, quiere ser el Rey.' }, 
    { w: 'SAITAMA', h: 'Calvo que vence a cualquier enemigo de un golpe.' }, 
    { w: 'MIDORIYA', h: 'Nació sin particularidad pero heredó el One For All.' }, 
    { w: 'LEVI', h: 'El soldado más fuerte de la humanidad (Titan).' }, 
    { w: 'EDWARD', h: 'Alquimista de Acero que perdió extremidades.' }, 
    { w: 'LIGHT', h: 'Encontró un Death Note y quiso ser Dios.' }, 
    { w: 'TANJIRO', h: 'Cazador de demonios que busca curar a su hermana.' }, 
    { w: 'INUYASHA', h: 'Mitad demonio con orejas de perro.' }, 
    { w: 'SEIYA', h: 'Caballero de bronce de Pegaso.' }, 
    { w: 'SHINJI', h: 'Piloto del EVA-01 que huye de sus problemas.' }, 
    { w: 'KIRITO', h: 'Espadachín negro atrapado en un juego VR.' }, 
    { w: 'GON', h: 'Niño de pelo verde que busca a su padre cazador.' }, 
    { w: 'ZORO', h: 'Usa tres espadas y no tiene sentido de la orientación.' },
    { w: 'ITACHI', h: 'Exterminó a su clan para proteger a su hermano menor.' },
    { w: 'EREN', h: 'Protagonista que juró destruir a todos los titanes.' },
    { w: 'GOJO', h: 'Tiene los seis ojos y la técnica de infinito.' },
    { w: 'TOTORO', h: 'Espíritu del bosque amistoso del Studio Ghibli.' },
    { w: 'PIKACHU', h: 'El Pokémon eléctrico más famoso del mundo.' },
    { w: 'ASUKA', h: 'Piloto pelirroja y muy orgullosa del EVA-02.' },
    { w: 'DENJI', h: 'El pibe motosierra.' },
    { w: 'JOTARO', h: 'Su stand se llama Star Platinum (Yare yare daze).' },
    { w: 'MAKI', h: 'Jujutsu sin energía maldita pero con fuerza física extrema.' },
    { w: 'MELIODAS', h: 'El dragón de la ira de los Siete Pecados Capitales.' },
    { w: 'SAKURA', h: 'Kunoichi del equipo 7 con gran fuerza física y médica.' },
    { w: 'VEGETA', h: 'El orgulloso príncipe de los Saiyajin.' },
    { w: 'KILLUA', h: 'Amigo de Gon, perteneciente a una familia de asesinos.' },
    { w: 'HISOKA', h: 'Payaso siniestro que usa cartas como armas (Bungee Gum).' },
    { w: 'CHROLLO', h: 'Líder del Gen\'ei Ryodan (Las Arañas).' },
    { w: 'KAKASHI', h: 'El ninja que copia, siempre lleva máscara.' },
    { w: 'NAMI', h: 'Navegante de los Sombreros de Paja.' },
    { w: 'SANJI', h: 'Cocinero de los Sombreros de Paja, ataca con los pies.' },
    { w: 'ALPHONSE', h: 'Su alma está atada a una inmensa armadura de metal.' },
    { w: 'ROY', h: 'Alquimista de Fuego que no es muy útil cuando llueve.' },
    { w: 'DIO', h: 'Villano vampiro que puede detener el tiempo (Za Warudo).' },
    { w: 'JOLYNE', h: 'Hija de Jotaro, encerrada en la prisión Green Dolphin Street.' },
    { w: 'SHIKAMARU', h: 'Ninja muy inteligente que siempre dice "Qué fastidio".' },
    { w: 'GAARA', h: 'Lleva una gran calabaza llena de arena en la espalda.' },
    { w: 'URARAKA', h: 'Puede hacer flotar las cosas que toca (Gravedad Cero).' },
    { w: 'BAKUGO', h: 'Explosivo amigo y rival de Midoriya.' },
    { w: 'TODOROKI', h: 'Usa fuego en la mitad izquierda y hielo en la derecha.' },
    { w: 'MIKASA', h: 'Guerrera letal de cabello negro, siempre protege a Eren.' },
    { w: 'ARMIN', h: 'Rubio estratega amigo de Eren.' },
    { w: 'SUKUNA', h: 'El Rey de las Maldiciones, vive dentro de Itadori.' },
    { w: 'MEGUMI', h: 'Usa la técnica de las diez sombras y shikigamis.' },
    { w: 'REI', h: 'Primera Niña, piloto del EVA-00 de característico pelo azul.' },
    { w: 'KAGOME', h: 'Chica que viaja al Japón feudal a través de un pozo.' },
    { w: 'SASUKE', h: 'Último sobreviviente de su clan, viaja buscando venganza.' },
    { w: 'BULMA', h: 'Brillante inventora del radar del dragón.' }
];

let currentHangmanObj = null, hangmanGuessed = [], hangmanAttempts = 6, hintsUsed = false;

function initHangman() { 
    document.getElementById('hangman-reset').addEventListener('click', resetHangman); 
    document.getElementById('hangman-hint-btn').addEventListener('click', showHangmanHint);
    resetHangman();
}

function resetHangman() { 
    currentHangmanObj = hangmanDictionary[Math.floor(Math.random() * hangmanDictionary.length)]; 
    hangmanGuessed = []; 
    hangmanAttempts = 6; 
    hintsUsed = false; 
    // MUESTRA LA DESCRIPCIÓN POR DEFECTO AUTOMÁTICAMENTE
    document.getElementById('hangman-hint-text').innerText = "Descripción: " + currentHangmanObj.h;
    
    document.getElementById('hangman-hint-btn').disabled = false; 
    document.getElementById('hangman-overlay').classList.add('hidden'); 
    renderHangman(); 
    drawHangmanVisual(); 
}

function showHangmanHint() { 
    if(!hintsUsed && currentHangmanObj && hangmanAttempts > 1) { 
        // Encuentra las letras que aún no se han adivinado
        let unrevealed = currentHangmanObj.w.split('').filter(l => !hangmanGuessed.includes(l));
        
        if (unrevealed.length > 0) {
            let hintLetter = unrevealed[Math.floor(Math.random() * unrevealed.length)];
            hangmanAttempts--; // Resta una vida por usar la pista
            hintsUsed = true; 
            document.getElementById('hangman-hint-btn').disabled = true; 
            
            // Simula que el usuario presionó la letra
            guessHangman(hintLetter); 
        }
    } 
}

function renderHangman() {
    if(!currentHangmanObj) return;
    let display = currentHangmanObj.w.split('').map(letter => hangmanGuessed.includes(letter) ? letter : '_').join(' ');
    document.getElementById('hangman-word').textContent = display; 
    document.getElementById('hangman-attempts').textContent = `Fallos: ${6 - hangmanAttempts}/6`;
    
    if (!display.includes('_')) gameOverHangman(true); 
    
    let lettersDiv = document.getElementById('hangman-letters'); lettersDiv.innerHTML = '';
    'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').forEach(letter => { 
        let btn = document.createElement('button'); 
        btn.className = 'hangman-key'; 
        btn.textContent = letter; 
        btn.disabled = hangmanGuessed.includes(letter); 
        btn.onclick = () => guessHangman(letter); 
        lettersDiv.appendChild(btn); 
    });
}

function guessHangman(letter) { 
    hangmanGuessed.push(letter); 
    if (!currentHangmanObj.w.includes(letter)) { 
        hangmanAttempts--; 
        playSound('hit'); 
        drawHangmanVisual(); 
    } else { 
        playSound('open'); 
    } 
    renderHangman();
    if (hangmanAttempts === 0) gameOverHangman(false); 
}

function gameOverHangman(win) { 
    const overlay = document.getElementById('hangman-overlay'); 
    document.getElementById('hangman-result-title').innerText = win ? '¡GANASTE!' : 'PERDISTE';
    document.getElementById('hangman-result-title').style.color = win ? 'var(--neon-cyan)' : 'var(--neon-pink)'; 
    document.getElementById('hangman-result-word').innerText = `Palabra: ${currentHangmanObj.w}`; 
    overlay.classList.remove('hidden'); 
    if(win) playSound('win'); else playSound('die');
}

function drawHangmanVisual() {
    const canvas = document.getElementById('hangman-canvas'); const ctx = canvas.getContext('2d'); ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#ff0055'; ctx.lineWidth = 5; ctx.shadowBlur = 10; ctx.shadowColor = '#ff0055'; 
    ctx.beginPath(); ctx.moveTo(20, 180); ctx.lineTo(180, 180); ctx.moveTo(60, 180);
    ctx.lineTo(60, 20); ctx.lineTo(140, 20); ctx.lineTo(140, 40); ctx.stroke(); 
    let mistakes = 6 - hangmanAttempts;
    if(mistakes > 0) { ctx.beginPath();
        ctx.arc(140, 60, 20, 0, Math.PI*2); ctx.stroke(); } 
    if(mistakes > 1) { ctx.beginPath(); ctx.moveTo(140, 80); ctx.lineTo(140, 130);
        ctx.stroke(); } 
    if(mistakes > 2) { ctx.beginPath(); ctx.moveTo(140, 90); ctx.lineTo(110, 110); ctx.stroke();
    } 
    if(mistakes > 3) { ctx.beginPath(); ctx.moveTo(140, 90); ctx.lineTo(170, 110); ctx.stroke();
    } 
    if(mistakes > 4) { ctx.beginPath(); ctx.moveTo(140, 130); ctx.lineTo(115, 170); ctx.stroke();
    } 
    if(mistakes > 5) { ctx.beginPath(); ctx.moveTo(140, 130); ctx.lineTo(165, 170); ctx.stroke();
    } 
    ctx.shadowBlur = 0;
}