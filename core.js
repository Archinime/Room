// --- VARIABLES GLOBALES ---
let zIndexCounter = 10;
let openApps = {};
let maximizedWindows = {};
// Sistema de archivos persistente
let defaultFS = { '/': { type: 'dir', content: { 'home': { type: 'dir', content: {} }, 'README.txt': { type: 'file', content: 'Bienvenido al OS Cyberpunk Mobile' } } } };
let fileSystem = JSON.parse(localStorage.getItem('myOS_fileSystem')) || defaultFS;
function saveFS() { localStorage.setItem('myOS_fileSystem', JSON.stringify(fileSystem)); }

let currentFileDir = '/';
let trashItems = JSON.parse(localStorage.getItem('trash') || '[]');
let desktopIcons = JSON.parse(localStorage.getItem('desktopIcons') || '[]');
let commandHistory = [], historyIndex = -1;
let soundEnabled = true, powerSaver = false, powerSaverTimer;
let matrixEnabled = false, matrixInterval;
let profilePicture = localStorage.getItem('profilePicture') || '';
let selectedIconId = null;
let particlesActive = false;

// FONDOS IMPRESIONANTES Y DIVERSOS (Expandido con más opciones Anime/Neon)
const premiumWallpapers = [
    'https://images.unsplash.com/photo-1555680202-c86f0e12f086?auto=format&fit=crop&w=1920&q=80',
    'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1920&q=80',
    'https://images.unsplash.com/photo-1542831371-29b0f74f9713?auto=format&fit=crop&w=1920&q=80',
    'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?auto=format&fit=crop&w=1920&q=80',
    'https://images.unsplash.com/photo-1605806616949-1e87b487cb2a?auto=format&fit=crop&w=1920&q=80',
    'https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&w=1920&q=80',
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1920&q=80',
    'https://images.unsplash.com/photo-1534067783941-51c9c23ecefd?auto=format&fit=crop&w=1920&q=80',
    'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?auto=format&fit=crop&w=1920&q=80',
    'https://images.unsplash.com/photo-1504333638930-c8787321efa0?auto=format&fit=crop&w=1920&q=80',
    'https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?auto=format&fit=crop&w=1920&q=80',
    'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=1920&q=80',
    'https://images.unsplash.com/photo-1506744626753-1fa44f1c1fcc?auto=format&fit=crop&w=1920&q=80',
    'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1920&q=80',
    'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=1920&q=80',
    'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?auto=format&fit=crop&w=1920&q=80',
    'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1920&q=80',
    'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=1920&q=80',
    'https://images.unsplash.com/photo-1604871000636-074fa5117945?auto=format&fit=crop&w=1920&q=80',
    'https://images.unsplash.com/photo-1482686115713-0fbcaced6e28?auto=format&fit=crop&w=1920&q=80',
    'https://images.unsplash.com/photo-1608501078713-8e445a709b39?auto=format&fit=crop&w=1920&q=80',
    'https://images.unsplash.com/photo-1552083375-1447ce886485?auto=format&fit=crop&w=1920&q=80',
    'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1920&q=80',
    'https://images.unsplash.com/photo-1523821741446-edb2b68bb7a0?auto=format&fit=crop&w=1920&q=80',
    'https://images.unsplash.com/photo-1493246507139-91e8fad9978e?auto=format&fit=crop&w=1920&q=80',
    // NUEVOS AÑADIDOS
    'https://images.unsplash.com/photo-1580136608260-4eb11f4b24fe?auto=format&fit=crop&w=1920&q=80',
    'https://images.unsplash.com/photo-1557672172-298e090bd0f1?auto=format&fit=crop&w=1920&q=80',
    'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=1920&q=80',
    'https://images.unsplash.com/photo-1614729939124-032f0b56c9ce?auto=format&fit=crop&w=1920&q=80',
    'https://images.unsplash.com/photo-1510133768164-a8f7e4d4e3dc?auto=format&fit=crop&w=1920&q=80',
    'https://images.unsplash.com/photo-1558470598-a5dda9640f68?auto=format&fit=crop&w=1920&q=80',
    'https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=1920&q=80',
    'https://images.unsplash.com/photo-1528360983277-13d401cdc186?auto=format&fit=crop&w=1920&q=80',
    'https://images.unsplash.com/photo-1531297484001-80022131f5a1?auto=format&fit=crop&w=1920&q=80',
    'https://images.unsplash.com/photo-1605379399642-870262d3d051?auto=format&fit=crop&w=1920&q=80',
    'https://images.unsplash.com/photo-1554147090-e1221a04a025?auto=format&fit=crop&w=1920&q=80'
];
let currentWallpaperIndex = 0;

// Detector de Dispositivos Móviles (Para cambiar de Doble Click a Un Solo Toque)
const isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || (window.matchMedia("(pointer: coarse)").matches);

// --- SISTEMA DE AUDIO SFX ---
let audioCtxConfigured = false;
let audioCtx;
function initAudioCtx() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    audioCtxConfigured = true;
}
document.addEventListener('click', () => { if(!audioCtxConfigured) initAudioCtx(); });
document.addEventListener('touchstart', () => { if(!audioCtxConfigured) initAudioCtx(); }, {passive: true});

function playSound(type) {
    if (!soundEnabled || !audioCtxConfigured) return;
    const osc = audioCtx.createOscillator(); const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    const now = audioCtx.currentTime;
    
    if (type === 'open') { osc.type = 'sine'; osc.frequency.setValueAtTime(600, now); osc.frequency.exponentialRampToValueAtTime(1200, now+0.1); gain.gain.setValueAtTime(0.05, now); gain.gain.exponentialRampToValueAtTime(0.01, now+0.1); osc.start(now); osc.stop(now+0.1);
    } else if (type === 'eat') { osc.type = 'square'; osc.frequency.setValueAtTime(400, now); osc.frequency.exponentialRampToValueAtTime(600, now+0.1); gain.gain.setValueAtTime(0.05, now); gain.gain.exponentialRampToValueAtTime(0.01, now+0.1); osc.start(now); osc.stop(now+0.1); 
    } else if (type === 'die') { osc.type = 'sawtooth'; osc.frequency.setValueAtTime(300, now); osc.frequency.exponentialRampToValueAtTime(50, now+0.5); gain.gain.setValueAtTime(0.1, now); gain.gain.exponentialRampToValueAtTime(0.01, now+0.5); osc.start(now); osc.stop(now+0.5);
    } else if (type === 'hit') { osc.type = 'square'; osc.frequency.setValueAtTime(800, now); gain.gain.setValueAtTime(0.05, now); gain.gain.exponentialRampToValueAtTime(0.01, now+0.05); osc.start(now); osc.stop(now+0.05); 
    } else if (type === 'win') { osc.type = 'sine'; osc.frequency.setValueAtTime(400, now); osc.frequency.setValueAtTime(500, now+0.1); osc.frequency.setValueAtTime(600, now+0.2); gain.gain.setValueAtTime(0.1, now); gain.gain.linearRampToValueAtTime(0, now+0.4); osc.start(now); osc.stop(now+0.4); }
}

// --- INICIALIZACIÓN INMEDIATA ---
document.addEventListener('DOMContentLoaded', () => {
    const savedBg = localStorage.getItem('customBg') || 'url("fondo_anime.avif")';
    
    if(savedBg === 'particles') { 
        document.body.style.backgroundImage = 'none'; 
        particlesActive = true;
    } else {
        document.body.style.backgroundImage = savedBg;
        particlesActive = false;
        let c = document.getElementById('bg-canvas');
        if(c) c.getContext('2d').clearRect(0,0,c.width,c.height);
    }

    initDesktopIcons();
    initGallery(); initMusicPlayer();
    initBrowser(); 
    renderTTT(); renderFiles();
    renderTrash();
    loadWindowStates(); setupEventListeners();
    initPong(); initBreakout(); initMemory(); initHangman(); initSnake();
    loadProfilePicture(); showToast('Sistema inicializado...');
    startWeatherSimulation(); startBatterySimulation(); checkIdle();
    
    updateClock();
    setInterval(updateClock, 1000);
});

// --- GESTIÓN DE VENTANAS Y ESTADO ---
function updateClock() {
    const d = new Date();
    document.getElementById('clock').innerText = d.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
}

function loadWindowStates() {
    const saved = localStorage.getItem('windowStates');
    if (saved) {
        const states = JSON.parse(saved);
        for (let [id, state] of Object.entries(states)) {
            const win = document.getElementById(id);
            if (win && window.innerWidth > 768) { 
                win.style.top = state.top;
                win.style.left = state.left; win.style.width = state.width; win.style.height = state.height; if (state.maximized) maximizeApp(id.replace('window-',''));
            }
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
            taskItem.onclick = () => { if(windowEl.classList.contains('hidden')) { windowEl.classList.remove('hidden'); windowEl.style.display='flex'; bringToFront(windowEl); } else if (windowEl.style.zIndex == zIndexCounter) { minimizeApp(appId);
            } else { bringToFront(windowEl); } };
            taskbarApps.appendChild(taskItem); openApps[appId] = true;
        }
    }
    document.getElementById('start-menu').classList.add('hidden'); saveWindowState(`window-${appId}`);
}
function closeApp(appId) {
    const win = document.getElementById(`window-${appId}`);
    win.classList.add('hidden'); setTimeout(()=> win.style.display='none', 200);
    const taskItem = document.getElementById(`task-${appId}`); if(taskItem) taskItem.remove();
    delete openApps[appId];
    let states = JSON.parse(localStorage.getItem('windowStates') || '{}'); delete states[`window-${appId}`]; localStorage.setItem('windowStates', JSON.stringify(states));
}
function minimizeApp(appId) { document.getElementById(`window-${appId}`).classList.add('hidden'); const taskItem = document.getElementById(`task-${appId}`);
    if(taskItem) taskItem.classList.remove('active'); }
function maximizeApp(windowId) {
    if(window.innerWidth <= 768) return; 
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

// Drag de Ventanas
function startDrag(e, windowId) {
    if(window.innerWidth <= 768) return;
    if (e.target.classList.contains('win-btn') || e.target.closest('.window-controls')) return;
    const win = document.getElementById(windowId); bringToFront(win);
    if (maximizedWindows[windowId]) maximizeApp(windowId.replace('window-',''));
    
    let isTouch = e.type === 'touchstart';
    let startX = isTouch ? e.touches[0].clientX : e.clientX; let startY = isTouch ? e.touches[0].clientY : e.clientY;
    let shiftX = startX - win.getBoundingClientRect().left;
    let shiftY = startY - win.getBoundingClientRect().top;
    
    function moveAt(pageX, pageY) {
        let newX = pageX - shiftX;
        let newY = pageY - shiftY; const winRect = win.getBoundingClientRect();
        if (newY < 0) newY = 0;
        if (newY > window.innerHeight - 50) newY = window.innerHeight - 50;
        if (newX < -winRect.width + 50) newX = -winRect.width + 50;
        if (newX > window.innerWidth - 50) newX = window.innerWidth - 50;
        win.style.left = newX + 'px';
        win.style.top = newY + 'px';
    }
    
    function onMove(event) { 
        if(!event.cancelable) return;
        let px = event.type.includes('touch') ? event.touches[0].pageX : event.pageX;
        let py = event.type.includes('touch') ? event.touches[0].pageY : event.pageY; 
        moveAt(px, py);
    }
    
    if(isTouch) {
        document.addEventListener('touchmove', onMove, {passive: false});
        document.addEventListener('touchend', function onEnd() { document.removeEventListener('touchmove', onMove); document.removeEventListener('touchend', onEnd); saveWindowState(windowId); }, {once: true});
    } else {
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', function onEnd() { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onEnd); saveWindowState(windowId); }, {once: true});
    }
}
document.querySelectorAll('.window-header').forEach(header => { header.addEventListener('mousedown', (e) => startDrag(e, header.parentElement.id)); header.addEventListener('touchstart', (e) => startDrag(e, header.parentElement.id), {passive: false}); });

function moveToTrash(iconDiv) {
    trashItems.push({ name: iconDiv.querySelector('.icon-label').innerText, icon: iconDiv.querySelector('.icon-img').innerText, appId: iconDiv.getAttribute('data-appid') });
    localStorage.setItem('trash', JSON.stringify(trashItems));
    iconDiv.remove();
    
    const trashDiv = document.getElementById('trash-items');
    if (trashDiv) {
        trashDiv.innerHTML = '';
        trashItems.forEach((item, idx) => { const div = document.createElement('div'); div.className = 'file-item'; div.innerHTML = `<div class="file-icon">${item.icon}</div><div class="file-name">${item.name}</div>`; div.onclick = () => restoreFromTrash(idx); trashDiv.appendChild(div); });
        document.getElementById('trash-count').textContent = trashItems.length;
    }
    showToast('Movido a la papelera');
}

// --- SNAP TO GRID Y UBICACIÓN INTELIGENTE ---
const GRID_CELL_W = 95; 
const GRID_CELL_H = 110;

function getFirstEmptyGridSlot() {
    let cols = Math.max(1, Math.floor((window.innerWidth - 20) / GRID_CELL_W));
    let rows = Math.max(1, Math.floor((window.innerHeight - 100) / GRID_CELL_H));
    
    let occupied = [];
    document.querySelectorAll('.desktop-icon').forEach(icon => {
        if(!icon.classList.contains('dragging')) {
            occupied.push({
                l: parseInt(icon.style.left)||0,
                t: parseInt(icon.style.top)||0
            });
        }
    });

    for(let c = 0; c < cols; c++) {
        for(let r = 0; r < rows; r++) {
            let testL = (c * GRID_CELL_W) + 10;
            let testT = (r * GRID_CELL_H) + 10;
            let isOccupied = occupied.some(pos => Math.abs(pos.l - testL) < 10 && Math.abs(pos.t - testT) < 10);
            if(!isOccupied) return { left: testL + 'px', top: testT + 'px' };
        }
    }
    return { left: '10px', top: '10px' };
}

function snapIconToGrid(iconDiv, origLeft, origTop) {
    let currentLeft = parseInt(iconDiv.style.left) || 0;
    let currentTop = parseInt(iconDiv.style.top) || 0;
    let col = Math.max(0, Math.round(currentLeft / GRID_CELL_W));
    let row = Math.max(0, Math.round(currentTop / GRID_CELL_H));
    let finalLeft = (col * GRID_CELL_W) + 10;
    let finalTop = (row * GRID_CELL_H) + 10;
    
    let isOccupied = false;
    document.querySelectorAll('.desktop-icon').forEach(otherIcon => {
        if(otherIcon !== iconDiv && otherIcon.id !== 'trash-icon') {
            let otherL = parseInt(otherIcon.style.left)||0;
            let otherT = parseInt(otherIcon.style.top)||0;
            if(Math.abs(otherL - finalLeft) < 10 && Math.abs(otherT - finalTop) < 10) isOccupied = true;
        }
    });
    
    if (isOccupied && origLeft !== undefined && origTop !== undefined) {
        iconDiv.style.left = origLeft;
        iconDiv.style.top = origTop;
        showToast("Casilla ocupada");
    } else {
        iconDiv.style.left = finalLeft + 'px';
        iconDiv.style.top = finalTop + 'px';
    }
}

function makeIconDraggable(iconDiv) {
    function handleStart(e) {
        if(!e.type.includes('touch') && e.button !== 0) return;
        let isTouch = e.type === 'touchstart';
        let startX = isTouch ? e.touches[0].clientX : e.clientX; let startY = isTouch ? e.touches[0].clientY : e.clientY;
        let shiftX = startX - iconDiv.getBoundingClientRect().left; let shiftY = startY - iconDiv.getBoundingClientRect().top;
        
        let origLeft = iconDiv.style.left;
        let origTop = iconDiv.style.top;

        iconDiv.classList.add('dragging'); 

        function moveAt(pageX, pageY) { iconDiv.style.left = pageX - shiftX + 'px';
        iconDiv.style.top = pageY - shiftY + 'px'; }
        
        function onMove(event) { 
            let px = event.type.includes('touch') ? event.touches[0].pageX : event.pageX;
            let py = event.type.includes('touch') ? event.touches[0].pageY : event.pageY; 
            moveAt(px, py);
        }
        
        function checkDropAndEnd() {
            iconDiv.classList.remove('dragging');
            let trash = document.getElementById('trash-icon');
            if(trash && iconDiv.id !== 'trash-icon') {
                let rect1 = iconDiv.getBoundingClientRect();
                let rect2 = trash.getBoundingClientRect();
                let overlap = !(rect1.right < rect2.left || rect1.left > rect2.right || rect1.bottom < rect2.top || rect1.top > rect2.bottom);
                if (overlap) {
                    moveToTrash(iconDiv);
                    saveDesktopIconPositions();
                    return;
                }
            }
            snapIconToGrid(iconDiv, origLeft, origTop);
            saveDesktopIconPositions(); 
        }

        if(isTouch) {
            document.addEventListener('touchmove', onMove, {passive: false});
            document.addEventListener('touchend', function onEnd() { 
                document.removeEventListener('touchmove', onMove); document.removeEventListener('touchend', onEnd); 
                checkDropAndEnd();
            }, {once: true});
        } else {
            document.addEventListener('mousemove', onMove);
            document.addEventListener('mouseup', function onEnd() { 
                document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onEnd); 
                checkDropAndEnd();
            }, {once: true});
        }
    }
    iconDiv.addEventListener('mousedown', handleStart);
    iconDiv.addEventListener('touchstart', handleStart, {passive: false});
    iconDiv.ondragstart = function() { return false; };
}

function saveDesktopIconPositions() {
    let saved = [];
    document.querySelectorAll('.desktop-icon').forEach(icon => {
        saved.push({ id: icon.id, name: icon.querySelector('.icon-label').innerText, icon: icon.querySelector('.icon-img').innerText, appId: icon.getAttribute('data-appid'), left: icon.style.left, top: icon.style.top });
    });
    localStorage.setItem('desktopIcons', JSON.stringify(saved));
}

// --- UTILIDADES ---
document.getElementById('start-btn').addEventListener('click', (e) => { e.stopPropagation(); document.getElementById('start-menu').classList.toggle('hidden'); });
document.addEventListener('click', (e) => { const startMenu = document.getElementById('start-menu'), startBtn = document.getElementById('start-btn'); if (!startMenu.contains(e.target) && !startBtn.contains(e.target)) startMenu.classList.add('hidden'); });
document.getElementById('start-search').addEventListener('input', function(e) { const query = e.target.value.toLowerCase(); document.querySelectorAll('.start-app-icon').forEach(app => { const name = app.querySelector('span').textContent.toLowerCase(); app.style.display = name.includes(query) ? 'flex' : 'none'; }); });

function initDesktopIcons() {
    const defaultApps = [
        { name: 'Navegador', icon: '🌐', appId: 'browser' }, { name: 'Notas', icon: '📝', appId: 'notes' }, { name: 'Terminal', icon: '💻', appId: 'terminal' },
        { name: 'Archivos', icon: '📁', appId: 'files' }, { name: 'Galería', icon: '🖼️', appId: 'fotos' }, { name: 'Música', icon: '🎵', appId: 'music' },
        { name: 'Ajustes', icon: '⚙️', appId: 'ajustes' }, { name: 'Calculadora', icon: '🧮', appId: 'calc' },
        { name: 'Tres en Raya', icon: '❌', appId: 'ttt' }, { name: 'Neon Snake', icon: '🐍', appId: 'snake' }, { name: 'Neon Pong', icon: '🏓', appId: 'pong' },
        { name: 'Breakout', icon: '🧱', appId: 'breakout' }, { name: 'Memorama', icon: '🧠', appId: 'memory' }, { name: 'Decodificador', icon: '💀', appId: 'hangman' }
    ];
    const startMenuAppsContainer = document.getElementById('start-menu-apps'); startMenuAppsContainer.innerHTML = ''; 
    defaultApps.forEach(app => {
        const startAppIcon = document.createElement('div'); startAppIcon.className = 'start-app-icon'; startAppIcon.innerHTML = `<div class="app-icon">${app.icon}</div><span>${app.name}</span>`; startAppIcon.onclick = () => { openApp(app.appId, app.icon); }; startMenuAppsContainer.appendChild(startAppIcon);
    });
    
    const savedIcons = JSON.parse(localStorage.getItem('desktopIcons') || '[]');
    let currentIcons = savedIcons.length > 0 ?
    savedIcons : defaultApps.map((a, i) => ({...a, id: 'icon-'+Date.now()+i, left: (10 + (Math.floor(i/4)*GRID_CELL_W))+'px', top: (120 + ((i%4)*GRID_CELL_H))+'px'}));
    
    currentIcons.forEach(icon => {
        if(icon.id !== 'trash-icon') {
            addDesktopIcon(icon.name, icon.icon, icon.appId, icon.id, icon.left, icon.top, false);
        }
    });
    
    let trashIcon = document.getElementById('trash-icon');
    if (trashIcon) {
        let trashSaved = savedIcons.find(i => i.id === 'trash-icon');
        if (trashSaved) {
            trashIcon.style.left = trashSaved.left;
            trashIcon.style.top = trashSaved.top;
        } else {
            trashIcon.style.left = '10px';
            trashIcon.style.top = '10px';
        }
        snapIconToGrid(trashIcon);
        
        let tapCountTrash = 0;
        trashIcon.addEventListener('click', (e) => {
            if(isTouchDevice) {
                openApp('trash', '🗑️');
            } else {
                tapCountTrash++;
                if (tapCountTrash === 1) { setTimeout(() => { tapCountTrash = 0; }, 400); }
                else if (tapCountTrash === 2) { tapCountTrash = 0; openApp('trash', '🗑️'); }
            }
        });
        makeIconDraggable(trashIcon);
    }
}

function addDesktopIcon(name, icon, appId, id = 'icon-'+Date.now(), left = null, top = null, save = true) {
    const container = document.getElementById('desktop-icons');
    const iconDiv = document.createElement('div'); iconDiv.className = 'desktop-icon'; iconDiv.id = id; 
    
    if (left === null || top === null) {
        let slot = getFirstEmptyGridSlot();
        iconDiv.style.left = slot.left;
        iconDiv.style.top = slot.top;
    } else {
        iconDiv.style.left = left; 
        iconDiv.style.top = top;
    }
    
    iconDiv.setAttribute('data-appid', appId);
    let tapCount = 0;
    iconDiv.addEventListener('click', (e) => {
        if(isTouchDevice) {
            openApp(appId, icon);
        } else {
            tapCount++;
            if (tapCount === 1) { setTimeout(() => { tapCount = 0; }, 400); }
            else if (tapCount === 2) { tapCount = 0; openApp(appId, icon); }
        }
    });
    iconDiv.oncontextmenu = (e) => { e.preventDefault(); showContextMenu(e, 'icon', id); return false; };
    iconDiv.innerHTML = `<div class="icon-img">${icon}</div><span class="icon-label">${name}</span>`; 
    container.appendChild(iconDiv); 
    snapIconToGrid(iconDiv); 
    makeIconDraggable(iconDiv);
    if(save) saveDesktopIconPositions();
}

// --- AJUSTES Y TEMAS ---
function changeTheme(color) { document.documentElement.style.setProperty('--accent-color', color); showToast('Color sincronizado'); }

function setWallpaper(type) {
    const canvas = document.getElementById('bg-canvas');
    const ctx = canvas.getContext('2d');
    if (type === 'particles') { 
        localStorage.setItem('customBg', 'particles');
        document.body.style.backgroundImage = 'none'; 
        particlesActive = true;
        initParticles();
    }
    else if (type === 'default') { 
        const url = `url("fondo_anime.avif")`;
        document.body.style.backgroundImage = url;
        localStorage.setItem('customBg', url); 
        particlesActive = false; 
        ctx.clearRect(0,0, canvas.width, canvas.height); 
    }
    showToast('Fondo cambiado');
}

function cyclePremiumWallpapers() {
    currentWallpaperIndex = (currentWallpaperIndex + 1) % premiumWallpapers.length;
    const url = `url(${premiumWallpapers[currentWallpaperIndex]})`;
    
    document.body.style.backgroundImage = url;
    localStorage.setItem('customBg', url);
    particlesActive = false; 
    document.getElementById('bg-canvas').getContext('2d').clearRect(0,0, window.innerWidth, window.innerHeight);
    
    showToast('Fondo Mágico Aplicado');
}

function setWallpaperFromPrompt() { 
    let url = prompt('URL de la imagen:');
    if (url) { 
        const fullUrl = `url(${url})`;
        document.body.style.backgroundImage = fullUrl; 
        localStorage.setItem('customBg', fullUrl);
        particlesActive = false;
        document.getElementById('bg-canvas').getContext('2d').clearRect(0,0, window.innerWidth, window.innerHeight);
        showToast('Fondo actualizado');
    } 
}

function uploadLocalWallpaper(e) {
    const file = e.target.files[0];
    if(file) { 
        if(file.size > 20000000) { showToast('Error: Límite ampliado (Max 20MB)'); return; }
        
        const reader = new FileReader();
        reader.onload = (ev) => { 
            let img = new Image();
            img.onload = function() {
                let canvas = document.createElement('canvas');
                let max_size = 1920;
                let width = img.width, height = img.height;
                if (width > height && width > max_size) { height *= max_size / width; width = max_size;
                }
                else if (height > max_size) { width *= max_size / height;
                height = max_size; }
                canvas.width = width;
                canvas.height = height;
                
                let ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                let dataUrl = canvas.toDataURL('image/jpeg', 0.85);
                try {
                    const url = `url(${dataUrl})`;
                    document.body.style.backgroundImage = url; 
                    localStorage.setItem('customBg', url); 
                    particlesActive = false;
                    document.getElementById('bg-canvas').getContext('2d').clearRect(0,0, window.innerWidth, window.innerHeight);
                    showToast('Fondo optimizado y aplicado localmente');
                } catch(err) {
                    showToast('Error: Imagen aún es muy pesada. Memoria excedida.');
                }
            };
            img.src = ev.target.result;
        }; 
        reader.readAsDataURL(file);
    }
}

function setProfilePicture() { let url = prompt('URL de tu foto:');
    if (url) { localStorage.setItem('profilePicture', url); loadProfilePicture(); } }
function loadProfilePicture() { if (profilePicture) document.getElementById('profile-preview').style.backgroundImage = `url(${profilePicture})`; }
function toggleMatrix() { const canvas = document.getElementById('matrix-canvas'); matrixEnabled = !matrixEnabled;
    canvas.style.display = matrixEnabled ? 'block' : 'none'; if (matrixEnabled) startMatrix();
    else if (matrixInterval) clearInterval(matrixInterval); }
function toggleSound() { soundEnabled = !soundEnabled;
    document.getElementById('sound-status').innerText = soundEnabled ? 'ON' : 'OFF';
    showToast(soundEnabled ? 'Sistema de audio activado' : 'Silencio activado');
}
function startMatrix() {
    const canvas = document.getElementById('matrix-canvas');
    const ctx = canvas.getContext('2d'); canvas.width = window.innerWidth; canvas.height = window.innerHeight;
    const columns = Math.floor(canvas.width / 20); const drops = [];
    for (let i = 0; i < columns; i++) drops[i] = Math.floor(Math.random() * canvas.height);
    matrixInterval = setInterval(() => {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.05)'; ctx.fillRect(0, 0, canvas.width, canvas.height); ctx.fillStyle = '#bc13fe'; ctx.font = '15px monospace';
        for (let i = 0; i < drops.length; i++) { const text = String.fromCharCode(Math.random() * 128); ctx.fillText(text, i * 20, drops[i] * 20); if (drops[i] * 20 > canvas.height && Math.random() > 0.975) drops[i] = 0; drops[i]++; }
    }, 50);
}
function togglePowerSaver() { powerSaver = !powerSaver; document.body.style.filter = powerSaver ? 'brightness(0.5)' : 'brightness(1)';
    showToast('Ahorro de energía: ' + (powerSaver ? 'ON' : 'OFF'));}
function checkIdle() {
    let idleTime = 0;
    if(powerSaverTimer) clearInterval(powerSaverTimer);
    const resetIdle = () => idleTime = 0; document.addEventListener('mousemove', resetIdle); document.addEventListener('touchstart', resetIdle, {passive: true});
    powerSaverTimer = setInterval(() => { idleTime++; if (powerSaver && idleTime > 30) document.body.style.filter = 'brightness(0.3)'; else if (powerSaver) document.body.style.filter = 'brightness(0.5)'; else document.body.style.filter = 'brightness(1)'; }, 1000);
}
function toggleDarkMode() { document.body.classList.toggle('light-mode'); showToast('Esquema Visual Invertido');}

// --- FONDO INTERACTIVO (PARTÍCULAS) ---
const canvas = document.getElementById('bg-canvas'), ctx = canvas.getContext('2d');
let particlesArray = [];
canvas.width = window.innerWidth; canvas.height = window.innerHeight;
let mouse = { x: null, y: null, radius: 150 };
window.addEventListener('mousemove', (e) => { mouse.x = e.x; mouse.y = e.y; });
window.addEventListener('touchmove', (e) => { mouse.x = e.touches[0].clientX; mouse.y = e.touches[0].clientY; }, {passive: true});
window.addEventListener('mouseout', () => { mouse.x = undefined; mouse.y = undefined; });
window.addEventListener('touchend', () => { mouse.x = undefined; mouse.y = undefined; });

class Particle { 
    constructor(x, y, dx, dy, size, color) { this.x = x; this.y = y;
        this.dx = dx; this.dy = dy; this.size = size; this.color = color;
    } 
    draw() { 
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2, false); const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent-color').trim(); ctx.fillStyle = this.color;
        if(mouse.x != undefined && mouse.y != undefined){ 
            let dx = mouse.x - this.x;
            let dy = mouse.y - this.y; let distance = Math.sqrt(dx * dx + dy * dy);
            if(distance < 80) { ctx.fillStyle = accent; this.size = Math.min(3, this.size + 0.5);
            } else { this.size = Math.max(0.5, this.size - 0.1); } 
        } 
        ctx.fill();
    } 
    update() { 
        if (this.x > canvas.width || this.x < 0) this.dx = -this.dx;
        if (this.y > canvas.height || this.y < 0) this.dy = -this.dy;
        if(mouse.x != undefined && mouse.y != undefined){ 
            let dx = mouse.x - this.x;
            let dy = mouse.y - this.y; let distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < mouse.radius) { 
                const forceDirectionX = dx / distance;
                const forceDirectionY = dy / distance; const force = (mouse.radius - distance) / mouse.radius;
                this.x -= forceDirectionX * force * 3; this.y -= forceDirectionY * force * 3;
            } 
        } 
        this.x += this.dx;
        this.y += this.dy; this.draw();
    } 
}

function initParticles() { 
    particlesArray = [];
    let numberOfParticles = (canvas.width * canvas.height) / 8000;
    for (let i = 0; i < numberOfParticles; i++) { 
        let size = Math.random() * 2 + 0.5;
        let x = Math.random() * (innerWidth - size * 2) + size;
        let y = Math.random() * (innerHeight - size * 2) + size; let dx = (Math.random() - 0.5) * 1.5;
        let dy = (Math.random() - 0.5) * 1.5; let color = 'rgba(255, 255, 255, 0.2)';
        particlesArray.push(new Particle(x, y, dx, dy, size, color)); 
    } 
}
    
function animateParticles() { 
    requestAnimationFrame(animateParticles);
    if(!particlesActive) return; 
    
    ctx.fillStyle = 'rgba(15, 17, 26, 0.3)'; ctx.fillRect(0, 0, innerWidth, innerHeight);
    for (let i = 0; i < particlesArray.length; i++) { particlesArray[i].update(); } 
}
window.addEventListener('resize', () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; initParticles(); });
initParticles(); animateParticles();