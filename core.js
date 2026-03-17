// --- VARIABLES GLOBALES ---
let zIndexCounter = 10;
let openApps = {};
let maximizedWindows = {};
let fileSystem = { '/': { type: 'dir', content: { 'home': { type: 'dir', content: {} }, 'usr': { type: 'dir', content: {} }, 'README.txt': { type: 'file', content: 'Bienvenido al OS Cyberpunk Mobile' } } } };
let currentFileDir = '/';
let trashItems = JSON.parse(localStorage.getItem('trash') || '[]');
let desktopIcons = JSON.parse(localStorage.getItem('desktopIcons') || '[]');
let commandHistory = [], historyIndex = -1;
let soundEnabled = true, powerSaver = false, powerSaverTimer;
let matrixEnabled = false, matrixInterval;
let profilePicture = localStorage.getItem('profilePicture') || '';
let selectedIconId = null;

// --- SISTEMA DE AUDIO SFX ---
let audioCtxConfigured = false;
let audioCtx;
function initAudioCtx() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    audioCtxConfigured = true;
}
document.addEventListener('click', () => { if(!audioCtxConfigured) initAudioCtx(); });
document.addEventListener('touchstart', () => { if(!audioCtxConfigured) initAudioCtx(); });

function playSound(type) {
    if (!soundEnabled || !audioCtxConfigured) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain); gain.connect(audioCtx.destination);
    const now = audioCtx.currentTime;
    
    if (type === 'open') { 
        osc.type = 'sine'; osc.frequency.setValueAtTime(600, now); osc.frequency.exponentialRampToValueAtTime(1200, now+0.1); gain.gain.setValueAtTime(0.05, now); gain.gain.exponentialRampToValueAtTime(0.01, now+0.1); osc.start(now); osc.stop(now+0.1);
    } else if (type === 'eat') { 
        osc.type = 'square'; osc.frequency.setValueAtTime(400, now); osc.frequency.exponentialRampToValueAtTime(600, now+0.1); gain.gain.setValueAtTime(0.05, now); gain.gain.exponentialRampToValueAtTime(0.01, now+0.1); osc.start(now); osc.stop(now+0.1); 
    } else if (type === 'die') { 
        osc.type = 'sawtooth'; osc.frequency.setValueAtTime(300, now); osc.frequency.exponentialRampToValueAtTime(50, now+0.5); gain.gain.setValueAtTime(0.1, now); gain.gain.exponentialRampToValueAtTime(0.01, now+0.5); osc.start(now); osc.stop(now+0.5);
    } else if (type === 'hit') { 
        osc.type = 'square'; osc.frequency.setValueAtTime(800, now); gain.gain.setValueAtTime(0.05, now); gain.gain.exponentialRampToValueAtTime(0.01, now+0.05); osc.start(now); osc.stop(now+0.05); 
    } else if (type === 'win') { 
        osc.type = 'sine'; osc.frequency.setValueAtTime(400, now); osc.frequency.setValueAtTime(500, now+0.1); osc.frequency.setValueAtTime(600, now+0.2); gain.gain.setValueAtTime(0.1, now); gain.gain.linearRampToValueAtTime(0, now+0.4); osc.start(now); osc.stop(now+0.4);
    }
}

// --- INICIALIZACIÓN ---
window.onload = () => {
    initDesktopIcons(); initGallery(); initMusicPlayer();
    renderTTT(); renderFiles(); renderTrash();
    loadWindowStates(); setupEventListeners();
    initPong(); initBreakout(); initMemory(); initHangman(); initSnake();
    loadProfilePicture(); showToast('Sistema inicializado...');
    startWeatherSimulation(); startBatterySimulation(); checkIdle();
    const savedBg = localStorage.getItem('customBg');
    if(savedBg) { document.getElementById('bg-canvas').style.backgroundImage = `url(${savedBg})`; document.getElementById('bg-canvas').style.backgroundSize = 'cover'; }
};

// --- GESTIÓN DE VENTANAS Y ESTADO ---
function loadWindowStates() {
    if(window.innerWidth <= 768) return; // No restaurar posiciones en móvil
    const saved = localStorage.getItem('windowStates');
    if (saved) {
        const states = JSON.parse(saved);
        for (let [id, state] of Object.entries(states)) {
            const win = document.getElementById(id);
            if (win) { win.style.top = state.top; win.style.left = state.left; win.style.width = state.width; win.style.height = state.height; if (state.maximized) maximizeApp(id.replace('window-','')); }
        }
    }
}
function saveWindowState(id) {
    if(window.innerWidth <= 768) return;
    const win = document.getElementById(id);
    if (!win) return;
    const state = { top: win.style.top, left: win.style.left, width: win.style.width, height: win.style.height, maximized: !!maximizedWindows[id] };
    let states = JSON.parse(localStorage.getItem('windowStates') || '{}'); states[id] = state; localStorage.setItem('windowStates', JSON.stringify(states));
}
function showToast(msg, duration = 2000) {
    const toast = document.getElementById('toast'); toast.textContent = msg; toast.classList.remove('hidden');
    setTimeout(() => toast.classList.add('hidden'), duration);
}
function openApp(appId, icon) {
    playSound('open');
    const windowEl = document.getElementById(`window-${appId}`);
    if(windowEl) {
        windowEl.style.display = 'flex'; windowEl.classList.remove('hidden'); bringToFront(windowEl);
        if (!openApps[appId]) {
            const taskbarApps = document.getElementById('taskbar-apps');
            const taskItem = document.createElement('div'); taskItem.className = 'taskbar-item active'; taskItem.id = `task-${appId}`; taskItem.innerHTML = icon; taskItem.title = appId.charAt(0).toUpperCase() + appId.slice(1);
            taskItem.onclick = () => { if(windowEl.classList.contains('hidden')) { windowEl.classList.remove('hidden'); windowEl.style.display='flex'; bringToFront(windowEl); } else if (windowEl.style.zIndex == zIndexCounter) { minimizeApp(appId); } else { bringToFront(windowEl); } };
            taskbarApps.appendChild(taskItem); openApps[appId] = true;
        }
    }
    document.getElementById('start-menu').classList.add('hidden'); saveWindowState(`window-${appId}`);
}
function closeApp(appId) {
    const win = document.getElementById(`window-${appId}`);
    win.classList.add('hidden');
    setTimeout(()=> win.style.display='none', 200);
    const taskItem = document.getElementById(`task-${appId}`); if(taskItem) taskItem.remove(); delete openApps[appId];
    let states = JSON.parse(localStorage.getItem('windowStates') || '{}'); delete states[`window-${appId}`];
    localStorage.setItem('windowStates', JSON.stringify(states));
}
function minimizeApp(appId) { document.getElementById(`window-${appId}`).classList.add('hidden'); const taskItem = document.getElementById(`task-${appId}`); if(taskItem) taskItem.classList.remove('active'); }
function maximizeApp(windowId) {
    if(window.innerWidth <= 768) return; // Móvil siempre está maximizado en CSS
    const realId = windowId.startsWith('window-') ? windowId : `window-${windowId}`;
    const win = document.getElementById(realId);
    if (!maximizedWindows[realId]) {
        maximizedWindows[realId] = { top: win.style.top, left: win.style.left, width: win.style.width, height: win.style.height, borderRadius: win.style.borderRadius };
        win.style.top = '0'; win.style.left = '0'; win.style.width = '100vw'; win.style.height = 'calc(100vh - 85px)'; win.style.borderRadius = '0';
    } else {
        const state = maximizedWindows[realId]; win.style.top = state.top || '15%';
        win.style.left = state.left || '20%'; win.style.width = state.width || '60%'; win.style.height = state.height || '65%'; win.style.borderRadius = '16px'; delete maximizedWindows[realId];
    }
    bringToFront(win); saveWindowState(realId);
}
function bringToFront(element) {
    zIndexCounter++; element.style.zIndex = zIndexCounter;
    document.querySelectorAll('.taskbar-item').forEach(item => item.classList.remove('active'));
    const appId = element.id.replace('window-', ''); const activeTask = document.getElementById(`task-${appId}`); if(activeTask) activeTask.classList.add('active');
}

// Drag adaptado a Mouse y Touch
function startDrag(e, windowId) {
    if(window.innerWidth <= 768) return; // No mover en móvil, CSS controla posición
    if (e.target.classList.contains('win-btn') || e.target.closest('.window-controls')) return; 
    const win = document.getElementById(windowId);
    bringToFront(win);
    if (maximizedWindows[windowId]) maximizeApp(windowId.replace('window-',''));
    
    let isTouch = e.type === 'touchstart';
    let startX = isTouch ? e.touches[0].clientX : e.clientX;
    let startY = isTouch ? e.touches[0].clientY : e.clientY;
    
    let shiftX = startX - win.getBoundingClientRect().left; 
    let shiftY = startY - win.getBoundingClientRect().top;

    function moveAt(pageX, pageY) {
        let newX = pageX - shiftX; let newY = pageY - shiftY; const winRect = win.getBoundingClientRect();
        if (newY < 0) newY = 0; if (newY > window.innerHeight - 50) newY = window.innerHeight - 50;
        if (newX < -winRect.width + 50) newX = -winRect.width + 50; if (newX > window.innerWidth - 50) newX = window.innerWidth - 50;
        win.style.left = newX + 'px'; win.style.top = newY + 'px';
    }
    function onMove(event) { 
        let px = event.type.includes('touch') ? event.touches[0].pageX : event.pageX;
        let py = event.type.includes('touch') ? event.touches[0].pageY : event.pageY;
        moveAt(px, py); 
    }
    
    if(isTouch) {
        document.addEventListener('touchmove', onMove, {passive: false});
        document.addEventListener('touchend', function onEnd() {
            document.removeEventListener('touchmove', onMove); document.removeEventListener('touchend', onEnd); saveWindowState(windowId);
        });
    } else {
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', function onEnd() {
            document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onEnd); saveWindowState(windowId);
        });
    }
}
document.querySelectorAll('.window-header').forEach(header => {
    header.addEventListener('touchstart', (e) => startDrag(e, header.parentElement.id), {passive: false});
});

// Drag para Iconos (Mouse y Touch)
function makeIconDraggable(iconDiv) {
    function handleStart(e) {
        if(!e.type.includes('touch') && e.button !== 0) return;
        let isTouch = e.type === 'touchstart';
        let startX = isTouch ? e.touches[0].clientX : e.clientX;
        let startY = isTouch ? e.touches[0].clientY : e.clientY;
        let shiftX = startX - iconDiv.getBoundingClientRect().left;
        let shiftY = startY - iconDiv.getBoundingClientRect().top;
        
        function moveAt(pageX, pageY) { iconDiv.style.left = pageX - shiftX + 'px'; iconDiv.style.top = pageY - shiftY + 'px'; }
        function onMove(event) { 
            let px = event.type.includes('touch') ? event.touches[0].pageX : event.pageX;
            let py = event.type.includes('touch') ? event.touches[0].pageY : event.pageY;
            moveAt(px, py); 
        }
        
        if(isTouch) {
            document.addEventListener('touchmove', onMove, {passive: false});
            document.addEventListener('touchend', function onEnd() { document.removeEventListener('touchmove', onMove); document.removeEventListener('touchend', onEnd); saveDesktopIconPositions(); });
        } else {
            document.addEventListener('mousemove', onMove);
            document.addEventListener('mouseup', function onEnd() { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onEnd); saveDesktopIconPositions(); });
        }
    }
    iconDiv.addEventListener('mousedown', handleStart);
    iconDiv.addEventListener('touchstart', handleStart, {passive: true});
    iconDiv.ondragstart = function() { return false; };
}

function saveDesktopIconPositions() {
    let saved = [];
    document.querySelectorAll('.desktop-icon').forEach(icon => {
        if(icon.id === 'trash-icon') return;
        saved.push({ id: icon.id, name: icon.querySelector('.icon-label').innerText, icon: icon.querySelector('.icon-img').innerText, appId: icon.getAttribute('data-appid'), left: icon.style.left, top: icon.style.top });
    });
    localStorage.setItem('desktopIcons', JSON.stringify(saved));
}

// --- UTILIDADES ---
setInterval(() => { const d = new Date(); document.getElementById('clock').innerText = d.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}); }, 1000);
document.getElementById('start-btn').addEventListener('click', (e) => { e.stopPropagation(); document.getElementById('start-menu').classList.toggle('hidden'); });
document.addEventListener('click', (e) => { const startMenu = document.getElementById('start-menu'), startBtn = document.getElementById('start-btn'); if (!startMenu.contains(e.target) && !startBtn.contains(e.target)) startMenu.classList.add('hidden'); });
document.getElementById('start-search').addEventListener('input', function(e) { const query = e.target.value.toLowerCase(); document.querySelectorAll('.start-app-icon').forEach(app => { const name = app.querySelector('span').textContent.toLowerCase(); app.style.display = name.includes(query) ? 'flex' : 'none'; }); });

function initDesktopIcons() {
    const defaultApps = [
        { name: 'Navegador', icon: '🌐', appId: 'browser' }, { name: 'Notas', icon: '📝', appId: 'notes' }, { name: 'Terminal', icon: '💻', appId: 'terminal' },
        { name: 'Archivos', icon: '📁', appId: 'files' }, { name: 'Galería', icon: '🖼️', appId: 'fotos' }, { name: 'Música', icon: '🎵', appId: 'music' },
        { name: 'Ajustes', icon: '⚙️', appId: 'ajustes' }, { name: 'Calculadora', icon: '🧮', appId: 'calc' },
        { name: 'Tres en Raya', icon: '❌', appId: 'ttt' }, { name: 'Neon Snake', icon: '🐍', appId: 'snake' }, { name: 'Neon Pong', icon: '🏓', appId: 'pong' },
        { name: 'Breakout', icon: '🧱', appId: 'breakout' }, { name: 'Memorama', icon: '🧠', appId: 'memory' }, { name: 'Ahorcado', icon: '💀', appId: 'hangman' }
    ];
    const startMenuAppsContainer = document.getElementById('start-menu-apps'); startMenuAppsContainer.innerHTML = ''; 
    defaultApps.forEach(app => {
        const startAppIcon = document.createElement('div'); startAppIcon.className = 'start-app-icon'; startAppIcon.innerHTML = `<div class="app-icon">${app.icon}</div><span>${app.name}</span>`; startAppIcon.onclick = () => { openApp(app.appId, app.icon); }; startMenuAppsContainer.appendChild(startAppIcon);
    });
    const savedIcons = JSON.parse(localStorage.getItem('desktopIcons') || '[]');
    let currentIcons = savedIcons.length > 0 ? savedIcons : defaultApps.map((a, i) => ({...a, id: 'icon-'+Date.now()+i, left: (20 + (Math.floor(i/4)*100))+'px', top: (120 + ((i%4)*110))+'px'}));
    currentIcons.forEach(icon => addDesktopIcon(icon.name, icon.icon, icon.appId, icon.id, icon.left, icon.top, false));
    makeIconDraggable(document.getElementById('trash-icon'));
}

function addDesktopIcon(name, icon, appId, id = 'icon-'+Date.now(), left = '20px', top = '20px', save = true) {
    const container = document.getElementById('desktop-icons');
    const iconDiv = document.createElement('div'); 
    iconDiv.className = 'desktop-icon'; iconDiv.id = id; iconDiv.style.left = left; iconDiv.style.top = top; iconDiv.setAttribute('data-appid', appId);
    
    // Tap / Doble click adaptado para movil y PC
    let tapCount = 0;
    iconDiv.addEventListener('click', (e) => {
        tapCount++;
        if (tapCount === 1) { setTimeout(() => { tapCount = 0; }, 400); }
        else if (tapCount === 2) { tapCount = 0; openApp(appId, icon); }
    });
    
    iconDiv.oncontextmenu = (e) => { e.preventDefault(); showContextMenu(e, 'icon', id); return false; };
    iconDiv.innerHTML = `<div class="icon-img">${icon}</div><span class="icon-label">${name}</span>`; 
    container.appendChild(iconDiv); makeIconDraggable(iconDiv);
    if(save) saveDesktopIconPositions();
}

// --- AJUSTES Y TEMAS ---
function changeTheme(color) { document.documentElement.style.setProperty('--accent-color', color); showToast('Color sincronizado'); }
function setWallpaper(type) {
    const canvas = document.getElementById('bg-canvas');
    if (type === 'particles') { canvas.style.backgroundImage = 'none'; localStorage.removeItem('customBg'); }
    else { canvas.style.backgroundImage = 'url("https://images.unsplash.com/photo-1506744626753-1fa44f1c1fcc?auto=format&fit=crop&w=1920&q=80")'; canvas.style.backgroundSize = 'cover'; localStorage.removeItem('customBg'); }
    showToast('Fondo cambiado');
}
async function setRandomWallpaper() {
    try { let response = await fetch('https://source.unsplash.com/random/1920x1080/?cyberpunk,synthwave'); document.getElementById('bg-canvas').style.backgroundImage = `url(${response.url})`; document.getElementById('bg-canvas').style.backgroundSize = 'cover'; showToast('Conectado a la red visual'); localStorage.removeItem('customBg'); } 
    catch (e) { showToast('Error al enlazar imagen'); }
}
function setWallpaperFromPrompt() { let url = prompt('URL de la imagen:'); if (url) { document.getElementById('bg-canvas').style.backgroundImage = `url(${url})`; document.getElementById('bg-canvas').style.backgroundSize = 'cover'; localStorage.setItem('customBg', `url(${url})`); showToast('Fondo actualizado'); } }
function uploadLocalWallpaper(e) {
    const file = e.target.files[0];
    if(file) { const reader = new FileReader(); reader.onload = (ev) => { document.getElementById('bg-canvas').style.backgroundImage = `url(${ev.target.result})`; document.getElementById('bg-canvas').style.backgroundSize = 'cover'; localStorage.setItem('customBg', ev.target.result); showToast('Fondo Local Aplicado'); }; reader.readAsDataURL(file); }
}
function setProfilePicture() { let url = prompt('URL de tu foto:'); if (url) { localStorage.setItem('profilePicture', url); loadProfilePicture(); } }
function loadProfilePicture() { if (profilePicture) document.getElementById('profile-preview').style.backgroundImage = `url(${profilePicture})`; }
function toggleMatrix() { const canvas = document.getElementById('matrix-canvas'); matrixEnabled = !matrixEnabled; canvas.style.display = matrixEnabled ? 'block' : 'none'; if (matrixEnabled) startMatrix(); else if (matrixInterval) clearInterval(matrixInterval); }
function toggleSound() { soundEnabled = !soundEnabled; document.getElementById('sound-status').innerText = soundEnabled ? 'ON' : 'OFF'; showToast(soundEnabled ? 'Sistema de audio activado' : 'Silencio activado'); }
function startMatrix() {
    const canvas = document.getElementById('matrix-canvas'); const ctx = canvas.getContext('2d'); canvas.width = window.innerWidth; canvas.height = window.innerHeight;
    const columns = Math.floor(canvas.width / 20); const drops = [];
    for (let i = 0; i < columns; i++) drops[i] = Math.floor(Math.random() * canvas.height);
    matrixInterval = setInterval(() => {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.05)'; ctx.fillRect(0, 0, canvas.width, canvas.height); ctx.fillStyle = '#bc13fe'; ctx.font = '15px monospace';
        for (let i = 0; i < drops.length; i++) { const text = String.fromCharCode(Math.random() * 128); ctx.fillText(text, i * 20, drops[i] * 20); if (drops[i] * 20 > canvas.height && Math.random() > 0.975) drops[i] = 0; drops[i]++; }
    }, 50);
}
function togglePowerSaver() { powerSaver = !powerSaver; document.getElementById('bg-canvas').style.filter = powerSaver ? 'brightness(0.5)' : 'brightness(1)'; showToast('Ahorro de energía: ' + (powerSaver ? 'ON' : 'OFF'));}
function checkIdle() {
    let idleTime = 0; if(powerSaverTimer) clearInterval(powerSaverTimer);
    const resetIdle = () => idleTime = 0;
    document.addEventListener('mousemove', resetIdle); document.addEventListener('touchstart', resetIdle);
    powerSaverTimer = setInterval(() => { idleTime++; if (powerSaver && idleTime > 30) document.getElementById('bg-canvas').style.filter = 'brightness(0.3)'; else if (powerSaver) document.getElementById('bg-canvas').style.filter = 'brightness(0.5)'; else document.getElementById('bg-canvas').style.filter = 'brightness(1)'; }, 1000);
}
function toggleDarkMode() { document.body.classList.toggle('light-mode'); showToast('Modo de color alternado');}

// --- FONDO INTERACTIVO (PARTÍCULAS) ---
const canvas = document.getElementById('bg-canvas'), ctx = canvas.getContext('2d'); let particlesArray = [];
canvas.width = window.innerWidth; canvas.height = window.innerHeight; let mouse = { x: null, y: null, radius: 150 };
window.addEventListener('mousemove', (e) => { mouse.x = e.x; mouse.y = e.y; });
window.addEventListener('touchmove', (e) => { mouse.x = e.touches[0].clientX; mouse.y = e.touches[0].clientY; }, {passive: true});
window.addEventListener('mouseout', () => { mouse.x = undefined; mouse.y = undefined; });
window.addEventListener('touchend', () => { mouse.x = undefined; mouse.y = undefined; });

class Particle { constructor(x, y, dx, dy, size, color) { this.x = x; this.y = y; this.dx = dx; this.dy = dy; this.size = size; this.color = color; } draw() { ctx.beginPath(); ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2, false); const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent-color').trim(); ctx.fillStyle = this.color; if(mouse.x != undefined && mouse.y != undefined){ let dx = mouse.x - this.x; let dy = mouse.y - this.y; let distance = Math.sqrt(dx * dx + dy * dy); if(distance < 80) { ctx.fillStyle = accent; this.size = Math.min(3, this.size + 0.5); } else { this.size = Math.max(0.5, this.size - 0.1); } } ctx.fill(); } update() { if (this.x > canvas.width || this.x < 0) this.dx = -this.dx; if (this.y > canvas.height || this.y < 0) this.dy = -this.dy; if(mouse.x != undefined && mouse.y != undefined){ let dx = mouse.x - this.x; let dy = mouse.y - this.y; let distance = Math.sqrt(dx * dx + dy * dy); if (distance < mouse.radius) { const forceDirectionX = dx / distance; const forceDirectionY = dy / distance; const force = (mouse.radius - distance) / mouse.radius; this.x -= forceDirectionX * force * 3; this.y -= forceDirectionY * force * 3; } } this.x += this.dx; this.y += this.dy; this.draw(); } }
function initParticles() { particlesArray = []; let numberOfParticles = (canvas.width * canvas.height) / 8000; for (let i = 0; i < numberOfParticles; i++) { let size = Math.random() * 2 + 0.5; let x = Math.random() * (innerWidth - size * 2) + size; let y = Math.random() * (innerHeight - size * 2) + size; let dx = (Math.random() - 0.5) * 1.5; let dy = (Math.random() - 0.5) * 1.5; let color = 'rgba(255, 255, 255, 0.2)'; particlesArray.push(new Particle(x, y, dx, dy, size, color)); } }
function animateParticles() { requestAnimationFrame(animateParticles); ctx.fillStyle = 'rgba(15, 17, 26, 0.3)'; ctx.fillRect(0, 0, innerWidth, innerHeight); for (let i = 0; i < particlesArray.length; i++) { particlesArray[i].update(); } }
window.addEventListener('resize', () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; initParticles(); });
initParticles(); animateParticles();