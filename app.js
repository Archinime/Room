// --- VARIABLES GLOBALES ---
let zIndexCounter = 10;
let openApps = {};
let maximizedWindows = {};
let fileSystem = {
    '/': {
        type: 'dir',
        content: {
            'home': { type: 'dir', content: {} },
            'usr': { type: 'dir', content: {} },
            'README.txt': { type: 'file', content: 'Bienvenido al sistema virtual' }
        }
    }
};
let currentFileDir = '/';
let trashItems = JSON.parse(localStorage.getItem('trash') || '[]');
let commandHistory = [];
let historyIndex = -1;
let rainbowInterval = null;
let soundEnabled = true;
let powerSaver = false;
let powerSaverTimer;
let matrixEnabled = false;
let matrixInterval;
let highScore = localStorage.getItem('snakeHighScore') || 0;
let profilePicture = localStorage.getItem('profilePicture') || '';

// --- INICIALIZACIÓN ---
window.onload = () => {
    initDesktopIcons();
    initGallery();
    initMusicPlayer();
    renderTTT();
    renderFiles();
    renderTrash();
    loadWindowStates();
    setupEventListeners();
    init2048();
    initMemory();
    initHangman();
    initEditor();
    initSnake();
    loadProfilePicture();
    showToast('Sistema listo');
    startWeatherSimulation();
    startBatterySimulation();
    checkIdle();
};

// --- PERSISTENCIA ---
function loadWindowStates() {
    const saved = localStorage.getItem('windowStates');
    if (saved) {
        const states = JSON.parse(saved);
        for (let [id, state] of Object.entries(states)) {
            const win = document.getElementById(id);
            if (win) {
                win.style.top = state.top;
                win.style.left = state.left;
                win.style.width = state.width;
                win.style.height = state.height;
                if (state.maximized) maximizeApp(id);
            }
        }
    }
}
function saveWindowState(id) {
    const win = document.getElementById(id);
    if (!win) return;
    const state = {
        top: win.style.top,
        left: win.style.left,
        width: win.style.width,
        height: win.style.height,
        maximized: !!maximizedWindows[id]
    };
    let states = JSON.parse(localStorage.getItem('windowStates') || '{}');
    states[id] = state;
    localStorage.setItem('windowStates', JSON.stringify(states));
}

// --- NOTIFICACIONES ---
function showToast(msg, duration = 2000) {
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.classList.remove('hidden');
    setTimeout(() => toast.classList.add('hidden'), duration);
}

// --- GESTIÓN DE VENTANAS ---
function openApp(appId, icon) {
    const windowEl = document.getElementById(`window-${appId}`);
    if(windowEl) {
        windowEl.classList.remove('hidden');
        bringToFront(windowEl);
        
        if (!openApps[appId]) {
            const taskbarApps = document.getElementById('taskbar-apps');
            const taskItem = document.createElement('div');
            taskItem.className = 'taskbar-item active';
            taskItem.id = `task-${appId}`;
            taskItem.innerHTML = icon;
            taskItem.title = appId.charAt(0).toUpperCase() + appId.slice(1);
            
            taskItem.onmouseenter = (e) => showPreview(appId, e);
            taskItem.onmouseleave = hidePreview;
            taskItem.onclick = () => {
                if(windowEl.classList.contains('hidden')) {
                    windowEl.classList.remove('hidden');
                    bringToFront(windowEl);
                } else if (windowEl.style.zIndex == zIndexCounter) {
                    minimizeApp(appId);
                } else {
                    bringToFront(windowEl);
                }
            };
            taskbarApps.appendChild(taskItem);
            openApps[appId] = true;
        }
        showToast(`Abriendo ${appId}...`);
    }
    document.getElementById('start-menu').classList.add('hidden');
    saveWindowState(`window-${appId}`);
}

function closeApp(appId) {
    const win = document.getElementById(`window-${appId}`);
    win.classList.add('hidden');
    const taskItem = document.getElementById(`task-${appId}`);
    if(taskItem) taskItem.remove();
    delete openApps[appId];
    showToast(`Cerrando ${appId}...`);
    let states = JSON.parse(localStorage.getItem('windowStates') || '{}');
    delete states[`window-${appId}`];
    localStorage.setItem('windowStates', JSON.stringify(states));
}

function minimizeApp(appId) {
    document.getElementById(`window-${appId}`).classList.add('hidden');
    const taskItem = document.getElementById(`task-${appId}`);
    if(taskItem) taskItem.classList.remove('active');
}

function maximizeApp(windowId) {
    const win = document.getElementById(windowId);
    if (!maximizedWindows[windowId]) {
        maximizedWindows[windowId] = {
            top: win.style.top, left: win.style.left,
            width: win.style.width, height: win.style.height,
            borderRadius: win.style.borderRadius
        };
        win.style.top = '0'; win.style.left = '0';
        win.style.width = '100vw'; win.style.height = 'calc(100vh - 85px)';
        win.style.borderRadius = '0';
    } else {
        const state = maximizedWindows[windowId];
        win.style.top = state.top || '15%';
        win.style.left = state.left || '20%';
        win.style.width = state.width || '60%'; 
        win.style.height = state.height || '65%';
        win.style.borderRadius = '16px';
        delete maximizedWindows[windowId];
    }
    bringToFront(win);
    saveWindowState(windowId);
}

function bringToFront(element) {
    zIndexCounter++;
    element.style.zIndex = zIndexCounter;
    
    document.querySelectorAll('.taskbar-item').forEach(item => item.classList.remove('active'));
    const appId = element.id.replace('window-', '');
    const activeTask = document.getElementById(`task-${appId}`);
    if(activeTask) activeTask.classList.add('active');
}

// --- VISTA PREVIA ---
function showPreview(appId, event) {
    const preview = document.getElementById('window-preview');
    const win = document.getElementById(`window-${appId}`);
    if (!win || win.classList.contains('hidden')) return;
    preview.style.left = (event.clientX - 100) + 'px';
    preview.style.top = (event.clientY - 160) + 'px';
    preview.classList.remove('hidden');
}
function hidePreview() {
    document.getElementById('window-preview').classList.add('hidden');
}

// --- DRAG AND DROP ---
function startDrag(e, windowId) {
    if (e.target.classList.contains('win-btn') || e.target.closest('.window-controls')) return; 
    e.preventDefault();
    const win = document.getElementById(windowId);
    bringToFront(win);
    
    if (maximizedWindows[windowId]) maximizeApp(windowId);

    let shiftX = e.clientX - win.getBoundingClientRect().left;
    let shiftY = e.clientY - win.getBoundingClientRect().top;
    
    function moveAt(pageX, pageY) {
        let newX = pageX - shiftX;
        let newY = pageY - shiftY;
        
        const taskbar = document.getElementById('taskbar');
        const taskbarRect = taskbar.getBoundingClientRect();
        const winRect = win.getBoundingClientRect();
        
        if (newY < 0) newY = 0;
        if (newY + winRect.height > taskbarRect.top) newY = taskbarRect.top - winRect.height;
        if (newX < 0) newX = 0;
        if (newX + winRect.width > window.innerWidth) newX = window.innerWidth - winRect.width;
        
        win.style.left = newX + 'px';
        win.style.top = newY + 'px';
    }

    function onMouseMove(event) { moveAt(event.pageX, event.pageY); }
    document.addEventListener('mousemove', onMouseMove);
    document.onmouseup = function() {
        document.removeEventListener('mousemove', onMouseMove);
        document.onmouseup = null;
        saveWindowState(windowId);
    };
}

// --- HORA ---
setInterval(() => {
    const d = new Date();
    document.getElementById('clock').innerText = d.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
}, 1000);

// --- MENÚ INICIO ---
document.getElementById('start-btn').addEventListener('click', (e) => {
    e.stopPropagation();
    document.getElementById('start-menu').classList.toggle('hidden');
});

document.addEventListener('click', (e) => {
    const startMenu = document.getElementById('start-menu');
    const startBtn = document.getElementById('start-btn');
    if (!startMenu.contains(e.target) && !startBtn.contains(e.target)) {
        startMenu.classList.add('hidden');
    }
});

document.getElementById('start-search').addEventListener('input', function(e) {
    const query = e.target.value.toLowerCase();
    const apps = document.querySelectorAll('.start-app-icon');
    apps.forEach(app => {
        const name = app.querySelector('span').textContent.toLowerCase();
        app.style.display = name.includes(query) ? 'flex' : 'none';
    });
});

// --- CAMBIAR TEMA ---
function changeTheme(color) {
    document.documentElement.style.setProperty('--accent-color', color);
    showToast('Tema cambiado');
}

// --- FONDO DE ESCRITORIO ---
function setWallpaper(type) {
    const canvas = document.getElementById('bg-canvas');
    if (type === 'particles') {
        canvas.style.backgroundImage = 'none';
    } else {
        canvas.style.backgroundImage = 'url("https://images.unsplash.com/photo-1506744626753-1fa44f1c1fcc?auto=format&fit=crop&w=1920&q=80")';
        canvas.style.backgroundSize = 'cover';
    }
    showToast('Fondo cambiado');
}

async function setRandomWallpaper() {
    try {
        let response = await fetch('https://source.unsplash.com/random/1920x1080/?cyberpunk');
        document.getElementById('bg-canvas').style.backgroundImage = `url(${response.url})`;
        document.getElementById('bg-canvas').style.backgroundSize = 'cover';
        showToast('Fondo aleatorio');
    } catch (e) {
        showToast('Error al cargar imagen');
    }
}

function setWallpaperFromPrompt() {
    let url = prompt('Introduce la URL de la imagen:');
    if (url) {
        document.getElementById('bg-canvas').style.backgroundImage = `url(${url})`;
        document.getElementById('bg-canvas').style.backgroundSize = 'cover';
        showToast('Fondo actualizado');
    }
}

// --- FOTO DE PERFIL ---
function setProfilePicture() {
    let url = prompt('Introduce la URL de tu foto de perfil:');
    if (url) {
        localStorage.setItem('profilePicture', url);
        loadProfilePicture();
        showToast('Foto de perfil actualizada');
    }
}
function loadProfilePicture() {
    if (profilePicture) {
        document.getElementById('profile-preview').style.backgroundImage = `url(${profilePicture})`;
    }
}

// --- MATRIX EFFECT ---
function toggleMatrix() {
    const canvas = document.getElementById('matrix-canvas');
    matrixEnabled = !matrixEnabled;
    canvas.style.display = matrixEnabled ? 'block' : 'none';
    if (matrixEnabled) {
        startMatrix();
    } else {
        if (matrixInterval) clearInterval(matrixInterval);
    }
}
function startMatrix() {
    const canvas = document.getElementById('matrix-canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const columns = Math.floor(canvas.width / 20);
    const drops = [];
    for (let i = 0; i < columns; i++) {
        drops[i] = Math.floor(Math.random() * canvas.height);
    }
    matrixInterval = setInterval(() => {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#0f0';
        ctx.font = '15px monospace';
        for (let i = 0; i < drops.length; i++) {
            const text = String.fromCharCode(Math.random() * 128);
            ctx.fillText(text, i * 20, drops[i] * 20);
            if (drops[i] * 20 > canvas.height && Math.random() > 0.975) {
                drops[i] = 0;
            }
            drops[i]++;
        }
    }, 50);
}

// --- MODO AHORRO ENERGÍA ---
function togglePowerSaver() {
    powerSaver = !powerSaver;
    if (powerSaver) {
        document.getElementById('bg-canvas').style.filter = 'brightness(0.5)';
    } else {
        document.getElementById('bg-canvas').style.filter = 'brightness(0.8)';
    }
    showToast(powerSaver ? 'Modo ahorro activado' : 'Modo ahorro desactivado');
}
function checkIdle() {
    let idleTime = 0;
    document.addEventListener('mousemove', () => idleTime = 0);
    document.addEventListener('keydown', () => idleTime = 0);
    setInterval(() => {
        idleTime++;
        if (powerSaver && idleTime > 30) {
            document.getElementById('bg-canvas').style.filter = 'brightness(0.3)';
        } else if (powerSaver) {
            document.getElementById('bg-canvas').style.filter = 'brightness(0.5)';
        }
    }, 1000);
}

// --- MODO OSCURO/CLARO (simulado) ---
function toggleDarkMode() {
    document.body.classList.toggle('light-mode');
    showToast('Modo alternado');
}

// --- APPS ---
// Bloc de Notas
const notepad = document.getElementById('notepad-text');
if (notepad) {
    notepad.value = localStorage.getItem('mi_pc_notas_pro') || "";
    notepad.addEventListener('input', () => {
        localStorage.setItem('mi_pc_notas_pro', notepad.value);
    });
}

// Calculadora
let calcExp = "";
function calcPress(val) {
    const display = document.getElementById('calc-display');
    if (val === 'C') { calcExp = ""; display.value = ""; }
    else if (val === '=') { 
        try { 
            let safeExp = calcExp.replace(/×/g, '*').replace(/÷/g, '/');
            calcExp = new Function('return ' + safeExp)().toString();
            display.value = calcExp; 
        } catch { display.value = "Error"; calcExp = ""; }
    } else { 
        calcExp += val;
        display.value = calcExp; 
    }
}

// Navegador
function navigateBrowser() {
    let url = document.getElementById('browser-url').value;
    if (!url.startsWith('http')) {
        url = 'https://www.google.com/search?q=' + encodeURIComponent(url);
    }
    document.getElementById('browser-frame').src = url;
}

// --- TERMINAL MEJORADA ---
function handleTerminal(e) {
    const inputEl = document.getElementById('term-input');
    const outputEl = document.getElementById('term-output');
    
    if (e.key === 'Enter') {
        const fullCmd = inputEl.value.trim();
        const args = fullCmd.split(' ');
        const cmd = args[0].toLowerCase();
        
        if (fullCmd) {
            commandHistory.push(fullCmd);
            historyIndex = commandHistory.length;
        }
        
        const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent-color').trim();
        
        let response = `<div><span style="color:${accent}">root@sistema:${currentFileDir}$</span> ${fullCmd}</div>`;
        
        switch(cmd) {
            case 'ayuda':
                response += `<div style='color:${accent}'>Comandos: ayuda, limpiar, fecha, sistema, tema, ls, cd, pwd, mkdir, touch, cat, rm, whoami, uptime, echo, ping, ipconfig, netstat, google, calc, notas, musica, juegos</div>`;
                break;
            case 'limpiar':
            case 'clear':
                outputEl.innerHTML = ""; inputEl.value = ""; return;
            case 'fecha':
                response += `<div>${new Date().toLocaleString()}</div>`;
                break;
            case 'sistema':
                response += `<div style='color:#27c93f'>OS_VIRTUAL v8.0 | Núcleo Cyberpunk</div>`;
                break;
            case 'tema':
                if (args[1]) {
                    const colorMap = { 'rojo':'#FF5F56', 'azul':'#00C9FF', 'verde':'#34C759', 'rosa':'#FF3366' };
                    const newColor = colorMap[args[1]];
                    if(newColor) { changeTheme(newColor); response += `<div>Tema actualizado.</div>`; }
                    else response += `<div>Colores: rojo, azul, verde, rosa</div>`;
                }
                break;
            case 'whoami':
                response += `<div>root</div>`;
                break;
            case 'uptime':
                response += `<div>uptime: 1h 23m</div>`;
                break;
            case 'echo':
                response += `<div>${args.slice(1).join(' ')}</div>`;
                break;
            case 'ping':
                response += `<div>Haciendo ping a ${args[1] || 'localhost'}... <br>64 bytes: tiempo=42ms</div>`;
                break;
            case 'ipconfig':
                response += `<div>IPv4: 192.168.1.100<br>Máscara: 255.255.255.0</div>`;
                break;
            case 'netstat':
                response += `<div>Conexiones activas: 3</div>`;
                break;
            case 'google':
                if (args[1]) {
                    let query = args.slice(1).join('+');
                    openApp('browser', '🌐');
                    setTimeout(() => {
                        document.getElementById('browser-url').value = 'https://www.google.com/search?q=' + query;
                        navigateBrowser();
                    }, 100);
                    response += `<div>Buscando en Google...</div>`;
                }
                break;
            case 'calc':
                openApp('calc', '🧮');
                response += `<div>Abriendo calculadora</div>`;
                break;
            case 'notas':
                openApp('notes', '📝');
                response += `<div>Abriendo bloc de notas</div>`;
                break;
            case 'musica':
                openApp('music', '🎵');
                response += `<div>Abriendo reproductor</div>`;
                break;
            case 'juegos':
                response += `<div>Juegos: ttt, snake, 2048, memory, hangman</div>`;
                break;
            case 'ls':
                const dirContent = listDir(currentFileDir);
                if (dirContent) {
                    let list = Object.entries(dirContent).map(([name, info]) => 
                        info.type === 'dir' ? `<span style="color:#00C9FF;">${name}/</span>` : name
                    ).join('  ');
                    response += `<div>${list}</div>`;
                } else response += `<div>Error</div>`;
                break;
            case 'cd':
                if (!args[1] || args[1] === '~') currentFileDir = '/';
                else if (args[1] === '..') {
                    let parts = currentFileDir.split('/').filter(p => p);
                    parts.pop();
                    currentFileDir = '/' + parts.join('/');
                } else {
                    let newPath = currentFileDir === '/' ? '/' + args[1] : currentFileDir + '/' + args[1];
                    let target = listDir(newPath);
                    if (target !== null) currentFileDir = newPath;
                    else response += `<div>Error: directorio no existe</div>`;
                }
                break;
            case 'pwd':
                response += `<div>${currentFileDir}</div>`;
                break;
            case 'mkdir':
                if (args[1]) {
                    let parent = listDir(currentFileDir);
                    if (parent) {
                        parent[args[1]] = { type: 'dir', content: {} };
                        response += `<div>Directorio creado</div>`;
                        renderFiles();
                    }
                }
                break;
            case 'touch':
                if (args[1]) {
                    let parent = listDir(currentFileDir);
                    if (parent) {
                        parent[args[1]] = { type: 'file', content: '' };
                        response += `<div>Archivo creado</div>`;
                        renderFiles();
                    }
                }
                break;
            case 'cat':
                if (args[1]) {
                    let parent = listDir(currentFileDir);
                    if (parent && parent[args[1]] && parent[args[1]].type === 'file') {
                        response += `<div>${parent[args[1]].content}</div>`;
                    } else response += `<div>Archivo no encontrado</div>`;
                }
                break;
            case 'rm':
                if (args[1]) {
                    let parent = listDir(currentFileDir);
                    if (parent && parent[args[1]]) {
                        delete parent[args[1]];
                        response += `<div>Eliminado</div>`;
                        renderFiles();
                    }
                }
                break;
            default:
                if (cmd !== '') response += `<div style='color:#ff5f56'>Comando desconocido: ${cmd}</div>`;
        }

        outputEl.innerHTML += response;
        inputEl.value = "";
        outputEl.scrollTop = outputEl.scrollHeight;
    }
}

// Autocompletado con Tab
document.getElementById('term-input')?.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (commandHistory.length > 0) {
            historyIndex = Math.max(0, historyIndex - 1);
            e.target.value = commandHistory[historyIndex] || '';
        }
    } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (commandHistory.length > 0) {
            historyIndex = Math.min(commandHistory.length - 1, historyIndex + 1);
            e.target.value = commandHistory[historyIndex] || '';
        }
    } else if (e.key === 'Tab') {
        e.preventDefault();
        const cmd = e.target.value.trim();
        const commands = ['ayuda', 'limpiar', 'fecha', 'sistema', 'tema', 'ls', 'cd', 'pwd', 'mkdir', 'touch', 'cat', 'rm', 'whoami', 'uptime', 'echo', 'ping', 'ipconfig', 'netstat', 'google', 'calc', 'notas', 'musica', 'juegos'];
        const match = commands.find(c => c.startsWith(cmd));
        if (match) e.target.value = match;
    }
});

function listDir(path) {
    let parts = path.split('/').filter(p => p);
    let current = fileSystem['/'];
    for (let p of parts) {
        if (current.content[p] && current.content[p].type === 'dir') {
            current = current.content[p];
        } else {
            return null;
        }
    }
    return current.content;
}

// --- GALERÍA ---
function initGallery() {
    const gallery = document.getElementById('gallery-grid');
    if (!gallery) return;
    const images = [
        'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=300',
        'https://images.unsplash.com/photo-1494500764479-0c8f2919a3d8?w=300',
        'https://images.unsplash.com/photo-1511497584788-876760111969?w=300',
        'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=300',
        'https://images.unsplash.com/photo-1506744626753-1fa44f1c1fcc?w=300',
        'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=300'
    ];
    gallery.innerHTML = '';
    images.forEach(src => {
        const img = document.createElement('img');
        img.src = src;
        img.onclick = () => showLightbox(src);
        gallery.appendChild(img);
    });
}

function showLightbox(src) {
    const overlay = document.createElement('div');
    overlay.style.position = 'fixed'; overlay.style.top = 0; overlay.style.left = 0; overlay.style.width = '100vw'; overlay.style.height = '100vh';
    overlay.style.background = 'rgba(0,0,0,0.8)'; overlay.style.zIndex = 200000; overlay.style.display = 'flex';
    overlay.style.alignItems = 'center'; overlay.style.justifyContent = 'center';
    overlay.style.backdropFilter = 'blur(10px)';
    const img = document.createElement('img');
    img.src = src;
    img.style.maxWidth = '90%'; img.style.maxHeight = '90%'; img.style.borderRadius = '10px';
    img.style.border = '2px solid var(--neon-cyan)';
    overlay.appendChild(img);
    overlay.onclick = () => overlay.remove();
    document.body.appendChild(overlay);
}

// --- REPRODUCTOR DE MÚSICA ---
let playlist = [
    { title: 'Electro 1', src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
    { title: 'Rock 2', src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' },
    { title: 'Ambient 3', src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3' },
    { title: 'Dance 4', src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3' },
    { title: 'Jazz 5', src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3' }
];
let currentSongIndex = 0;
let audio = document.getElementById('audio-player');
let playPauseBtn = document.getElementById('play-pause-btn');
let prevBtn = document.getElementById('prev-btn');
let nextBtn = document.getElementById('next-btn');
let playlistEl = document.getElementById('playlist');
let visualizerCanvas = document.getElementById('visualizer');
let audioCtx, analyser, source;

function initMusicPlayer() {
    if (!playlistEl) return;
    playlistEl.innerHTML = '';
    playlist.forEach((song, idx) => {
        let li = document.createElement('li');
        li.innerHTML = `<i class="fas fa-music"></i> ${song.title}`;
        li.onclick = () => playSong(idx);
        playlistEl.appendChild(li);
    });
    playPauseBtn.addEventListener('click', togglePlay);
    prevBtn.addEventListener('click', prevSong);
    nextBtn.addEventListener('click', nextSong);
    audio.addEventListener('ended', nextSong);
    setupVisualizer();
}

function setupVisualizer() {
    if (!audio) return;
    audio.addEventListener('play', () => {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            analyser = audioCtx.createAnalyser();
            analyser.fftSize = 256;
            source = audioCtx.createMediaElementSource(audio);
            source.connect(analyser);
            analyser.connect(audioCtx.destination);
        }
        visualize();
    });
}

function visualize() {
    if (!visualizerCanvas || !analyser) return;
    const ctx = visualizerCanvas.getContext('2d');
    const width = visualizerCanvas.width;
    const height = visualizerCanvas.height;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyser.getByteFrequencyData(dataArray);
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);
    const barWidth = (width / bufferLength) * 2.5;
    let x = 0;
    for (let i = 0; i < bufferLength; i++) {
        let barHeight = dataArray[i] / 2;
        ctx.fillStyle = `hsl(${i * 2}, 100%, 50%)`;
        ctx.fillRect(x, height - barHeight, barWidth, barHeight);
        x += barWidth + 1;
    }
    requestAnimationFrame(visualize);
}

function playSong(idx) {
    currentSongIndex = idx;
    audio.src = playlist[idx].src;
    audio.play();
    document.getElementById('current-song').textContent = playlist[idx].title;
    updatePlaylistHighlight();
    playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
}
function togglePlay() {
    if (audio.paused) { audio.play(); playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>'; }
    else { audio.pause(); playPauseBtn.innerHTML = '<i class="fas fa-play"></i>'; }
}
function prevSong() {
    currentSongIndex = (currentSongIndex - 1 + playlist.length) % playlist.length;
    playSong(currentSongIndex);
}
function nextSong() {
    currentSongIndex = (currentSongIndex + 1) % playlist.length;
    playSong(currentSongIndex);
}
function updatePlaylistHighlight() {
    document.querySelectorAll('#playlist li').forEach((li, i) => {
        if (i === currentSongIndex) li.classList.add('playing');
        else li.classList.remove('playing');
    });
}

// --- TRES EN RAYA ---
let tttBoard = ['', '', '', '', '', '', '', '', ''];
let tttTurn = '❌';
let tttGameOver = false;
function renderTTT() {
    const boardDiv = document.getElementById('ttt-board');
    if (!boardDiv) return;
    boardDiv.innerHTML = '';
    tttBoard.forEach((cell, i) => {
        const cellDiv = document.createElement('div');
        cellDiv.textContent = cell;
        cellDiv.onclick = () => tttMove(i);
        boardDiv.appendChild(cellDiv);
    });
    const turnEl = document.getElementById('ttt-turn');
    if (turnEl) turnEl.textContent = tttGameOver ? 'Fin del juego' : `Turno de ${tttTurn}`;
}
function tttMove(index) {
    if (tttBoard[index] !== '' || tttGameOver) return;
    tttBoard[index] = tttTurn;
    if (checkWinner()) {
        showToast(`Gana ${tttTurn}!`);
        tttGameOver = true;
    } else if (!tttBoard.includes('')) {
        showToast('Empate!');
        tttGameOver = true;
    } else {
        tttTurn = tttTurn === '❌' ? '⭕' : '❌';
    }
    renderTTT();
}
function checkWinner() {
    const lines = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
    for (let line of lines) {
        if (tttBoard[line[0]] && tttBoard[line[0]] === tttBoard[line[1]] && tttBoard[line[1]] === tttBoard[line[2]]) {
            return true;
        }
    }
    return false;
}
document.getElementById('ttt-reset')?.addEventListener('click', () => {
    tttBoard = ['', '', '', '', '', '', '', '', ''];
    tttTurn = '❌';
    tttGameOver = false;
    renderTTT();
});

// --- SNAKE (corregido) ---
let snakeCanvas = document.getElementById('snake-canvas');
let snakeCtx = snakeCanvas?.getContext('2d');
let snake, direction, food, score, gameInterval;
document.getElementById('snake-highscore').textContent = highScore;

function initSnake() {
    if (!snakeCanvas) return;
    resetSnake();
    document.addEventListener('keydown', handleSnakeKey);
    document.getElementById('snake-reset')?.addEventListener('click', resetSnake);
}
function resetSnake() {
    if (gameInterval) clearInterval(gameInterval);
    snake = [{x:10, y:10}];
    direction = {x:1, y:0};
    food = {x:15, y:15};
    score = 0;
    document.getElementById('snake-score').textContent = '0';
    gameInterval = setInterval(moveSnake, 150);
}
function handleSnakeKey(e) {
    if (e.key.startsWith('Arrow')) {
        e.preventDefault();
        if (e.key === 'ArrowUp' && direction.y === 0) direction = {x:0, y:-1};
        if (e.key === 'ArrowDown' && direction.y === 0) direction = {x:0, y:1};
        if (e.key === 'ArrowLeft' && direction.x === 0) direction = {x:-1, y:0};
        if (e.key === 'ArrowRight' && direction.x === 0) direction = {x:1, y:0};
    }
}
function moveSnake() {
    if (!snakeCtx) return;
    let head = {x: snake[0].x + direction.x, y: snake[0].y + direction.y};
    if (head.x < 0 || head.x >= 30 || head.y < 0 || head.y >= 30 || snake.some(seg => seg.x === head.x && seg.y === head.y)) {
        clearInterval(gameInterval);
        if (score > highScore) {
            highScore = score;
            localStorage.setItem('snakeHighScore', highScore);
            document.getElementById('snake-highscore').textContent = highScore;
        }
        alert('Game Over');
        return;
    }
    snake.unshift(head);
    if (head.x === food.x && head.y === food.y) {
        score += 10;
        document.getElementById('snake-score').textContent = score;
        food = {x: Math.floor(Math.random()*30), y: Math.floor(Math.random()*30)};
    } else {
        snake.pop();
    }
    drawSnake();
}
function drawSnake() {
    snakeCtx.fillStyle = '#000';
    snakeCtx.fillRect(0,0,300,300);
    snakeCtx.fillStyle = '#0f0';
    snake.forEach(seg => snakeCtx.fillRect(seg.x*10, seg.y*10, 8,8));
    snakeCtx.fillStyle = '#f00';
    snakeCtx.fillRect(food.x*10, food.y*10, 8,8);
}

// --- 2048 ---
let board2048, score2048;
function init2048() {
    const container = document.getElementById('game-2048');
    if (!container) return;
    reset2048();
    document.getElementById('reset-2048').addEventListener('click', reset2048);
    document.addEventListener('keydown', handle2048Key);
}
function reset2048() {
    board2048 = [[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0]];
    addRandom2048();
    addRandom2048();
    score2048 = 0;
    render2048();
}
function addRandom2048() {
    let empty = [];
    for (let i=0; i<4; i++) for (let j=0; j<4; j++) if (board2048[i][j]===0) empty.push([i,j]);
    if (empty.length>0) {
        let [r,c] = empty[Math.floor(Math.random()*empty.length)];
        board2048[r][c] = Math.random()<0.9 ? 2 : 4;
    }
}
function render2048() {
    const container = document.getElementById('game-2048');
    let html = '<table style="background:#333; color:white; border-collapse:collapse;">';
    for (let i=0; i<4; i++) {
        html += '<tr>';
        for (let j=0; j<4; j++) {
            let val = board2048[i][j];
            html += `<td style="width:60px; height:60px; border:1px solid #555; text-align:center; font-size:20px; background:${val? '#666' : '#222'}">${val||''}</td>`;
        }
        html += '</tr>';
    }
    html += '</table>';
    container.innerHTML = html;
    document.getElementById('score-2048').textContent = score2048;
}
function handle2048Key(e) {
    if (!document.getElementById('window-2048').classList.contains('hidden')) {
        let moved = false;
        if (e.key === 'ArrowUp') moved = moveUp2048();
        else if (e.key === 'ArrowDown') moved = moveDown2048();
        else if (e.key === 'ArrowLeft') moved = moveLeft2048();
        else if (e.key === 'ArrowRight') moved = moveRight2048();
        if (moved) {
            addRandom2048();
            render2048();
        }
    }
}
function moveLeft2048() {
    let moved = false;
    for (let i=0; i<4; i++) {
        let row = board2048[i].filter(v => v!==0);
        for (let j=0; j<row.length-1; j++) {
            if (row[j] === row[j+1]) {
                row[j] *= 2;
                score2048 += row[j];
                row.splice(j+1,1);
                moved = true;
            }
        }
        while (row.length < 4) row.push(0);
        if (row.join() !== board2048[i].join()) moved = true;
        board2048[i] = row;
    }
    return moved;
}
function moveRight2048() {
    let moved = false;
    for (let i=0; i<4; i++) {
        let row = board2048[i].filter(v => v!==0);
        for (let j=row.length-1; j>0; j--) {
            if (row[j] === row[j-1]) {
                row[j] *= 2;
                score2048 += row[j];
                row.splice(j-1,1);
                moved = true;
                j--;
            }
        }
        while (row.length < 4) row.unshift(0);
        if (row.join() !== board2048[i].join()) moved = true;
        board2048[i] = row;
    }
    return moved;
}
function moveUp2048() {
    board2048 = transpose(board2048);
    let moved = moveLeft2048();
    board2048 = transpose(board2048);
    return moved;
}
function moveDown2048() {
    board2048 = transpose(board2048);
    let moved = moveRight2048();
    board2048 = transpose(board2048);
    return moved;
}
function transpose(matrix) {
    return matrix[0].map((_, i) => matrix.map(row => row[i]));
}

// --- MEMORAMA ---
let memoryCards = ['🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼'];
let memoryBoard = [];
let memoryFlipped = [];
let memoryMatched = [];
let memoryLock = false;
function initMemory() {
    resetMemory();
    document.getElementById('memory-reset').addEventListener('click', resetMemory);
}
function resetMemory() {
    memoryBoard = [...memoryCards, ...memoryCards].sort(() => Math.random() - 0.5);
    memoryFlipped = Array(16).fill(false);
    memoryMatched = Array(16).fill(false);
    renderMemory();
}
function renderMemory() {
    const grid = document.getElementById('memory-grid');
    grid.innerHTML = '';
    memoryBoard.forEach((card, i) => {
        const div = document.createElement('div');
        div.className = memoryMatched[i] ? 'matched' : (memoryFlipped[i] ? 'flipped' : '');
        div.textContent = memoryFlipped[i] || memoryMatched[i] ? card : '?';
        div.onclick = () => flipMemory(i);
        grid.appendChild(div);
    });
}
function flipMemory(index) {
    if (memoryLock || memoryMatched[index] || memoryFlipped[index]) return;
    let flipped = memoryFlipped.reduce((acc, val, i) => acc + (val && !memoryMatched[i] ? 1 : 0), 0);
    if (flipped === 2) return;
    memoryFlipped[index] = true;
    renderMemory();
    let flippedIndices = memoryFlipped.reduce((acc, val, i) => val && !memoryMatched[i] ? [...acc, i] : acc, []);
    if (flippedIndices.length === 2) {
        memoryLock = true;
        if (memoryBoard[flippedIndices[0]] === memoryBoard[flippedIndices[1]]) {
            memoryMatched[flippedIndices[0]] = memoryMatched[flippedIndices[1]] = true;
            memoryFlipped[flippedIndices[0]] = memoryFlipped[flippedIndices[1]] = false;
            memoryLock = false;
            renderMemory();
            if (memoryMatched.every(v => v)) showToast('¡Ganaste!');
        } else {
            setTimeout(() => {
                memoryFlipped[flippedIndices[0]] = memoryFlipped[flippedIndices[1]] = false;
                memoryLock = false;
                renderMemory();
            }, 1000);
        }
    }
}

// --- AHORCADO ---
let hangmanWords = ['javascript', 'python', 'html', 'css', 'react', 'node', 'terminal', 'computadora'];
let hangmanWord = '';
let hangmanGuessed = [];
let hangmanAttempts = 6;
function initHangman() {
    resetHangman();
    document.getElementById('hangman-reset').addEventListener('click', resetHangman);
}
function resetHangman() {
    hangmanWord = hangmanWords[Math.floor(Math.random() * hangmanWords.length)].toUpperCase();
    hangmanGuessed = [];
    hangmanAttempts = 6;
    renderHangman();
}
function renderHangman() {
    const wordDiv = document.getElementById('hangman-word');
    const lettersDiv = document.getElementById('hangman-letters');
    const attemptsDiv = document.getElementById('hangman-attempts');
    let display = hangmanWord.split('').map(letter => hangmanGuessed.includes(letter) ? letter : '_').join(' ');
    wordDiv.textContent = display;
    attemptsDiv.textContent = `Intentos restantes: ${hangmanAttempts}`;
    if (!display.includes('_')) {
        showToast('¡Ganaste!');
    }
    lettersDiv.innerHTML = '';
    'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').forEach(letter => {
        let btn = document.createElement('button');
        btn.textContent = letter;
        btn.disabled = hangmanGuessed.includes(letter);
        btn.onclick = () => guessHangman(letter);
        lettersDiv.appendChild(btn);
    });
}
function guessHangman(letter) {
    hangmanGuessed.push(letter);
    if (!hangmanWord.includes(letter)) {
        hangmanAttempts--;
    }
    renderHangman();
    if (hangmanAttempts === 0) {
        showToast(`Perdiste, la palabra era ${hangmanWord}`);
    }
}

// --- EXPLORADOR DE ARCHIVOS ---
function renderFiles() {
    const fileList = document.getElementById('file-list');
    const pathEl = document.getElementById('file-path');
    if (!fileList) return;
    pathEl.textContent = '📁 ' + currentFileDir;
    const dirContent = listDir(currentFileDir);
    if (!dirContent) return;
    fileList.innerHTML = '';
    for (let [name, info] of Object.entries(dirContent)) {
        const item = document.createElement('div');
        item.className = 'file-item';
        item.innerHTML = `<div class="file-icon">${info.type === 'dir' ? '📁' : '📄'}</div>
                          <div class="file-name">${name}</div>`;
        item.ondblclick = () => {
            if (info.type === 'dir') {
                currentFileDir = currentFileDir === '/' ? '/' + name : currentFileDir + '/' + name;
                renderFiles();
            } else {
                if (name.endsWith('.txt')) {
                    openApp('notes', '📝');
                    setTimeout(() => {
                        document.getElementById('notepad-text').value = info.content || '';
                    }, 100);
                } else if (name.match(/\.(jpg|png|gif)$/i)) {
                    openApp('fotos', '🖼️');
                }
            }
        };
        fileList.appendChild(item);
    }
}

// --- PAPELERA ---
function renderTrash() {
    const trashDiv = document.getElementById('trash-items');
    const countSpan = document.getElementById('trash-count');
    if (!trashDiv) return;
    trashDiv.innerHTML = '';
    trashItems.forEach((item, idx) => {
        const div = document.createElement('div');
        div.className = 'trash-item';
        div.innerHTML = `<div class="icon-img">${item.icon}</div><span>${item.name}</span>`;
        div.onclick = () => restoreFromTrash(idx);
        trashDiv.appendChild(div);
    });
    if (countSpan) countSpan.textContent = trashItems.length;
}
function restoreFromTrash(index) {
    if (confirm('¿Restaurar este elemento?')) {
        const item = trashItems.splice(index, 1)[0];
        localStorage.setItem('trash', JSON.stringify(trashItems));
        addDesktopIcon(item.name, item.icon, item.appId);
        renderTrash();
        showToast('Restaurado');
    }
}
document.getElementById('empty-trash')?.addEventListener('click', () => {
    if (confirm('¿Vaciar la papelera?')) {
        trashItems = [];
        localStorage.setItem('trash', JSON.stringify(trashItems));
        renderTrash();
        showToast('Papelera vacía');
    }
});

// --- ICONOS DE ESCRITORIO ---
function initDesktopIcons() {
    const defaultApps = [
        { name: 'Navegador', icon: '🌐', appId: 'browser' },
        { name: 'Notas', icon: '📝', appId: 'notes' },
        { name: 'Calculadora', icon: '🧮', appId: 'calc' },
        { name: 'Terminal', icon: '💻', appId: 'terminal' },
        { name: 'Galería', icon: '🖼️', appId: 'fotos' },
        { name: 'Ajustes', icon: '⚙️', appId: 'ajustes' },
        { name: 'Explorador', icon: '📁', appId: 'files' },
        { name: 'Música', icon: '🎵', appId: 'music' },
        { name: 'Tres en Raya', icon: '❌', appId: 'ttt' },
        { name: 'Snake', icon: '🐍', appId: 'snake' },
        { name: '2048', icon: '🎮', appId: '2048' },
        { name: 'Memorama', icon: '🧠', appId: 'memory' },
        { name: 'Ahorcado', icon: '💀', appId: 'hangman' },
        { name: 'Editor', icon: '🎨', appId: 'editor' },
        { name: 'Clima', icon: '🌦️', appId: 'weather' }
    ];
    defaultApps.forEach(app => addDesktopIcon(app.name, app.icon, app.appId));
}

function addDesktopIcon(name, icon, appId) {
    const container = document.getElementById('desktop-icons');
    const iconDiv = document.createElement('div');
    iconDiv.className = 'desktop-icon';
    iconDiv.setAttribute('data-appid', appId);
    iconDiv.ondblclick = () => openApp(appId, icon);
    iconDiv.innerHTML = `<div class="icon-img">${icon}</div><span>${name}</span>`;
    container.appendChild(iconDiv);
}

function sortDesktopIcons() {
    const container = document.getElementById('desktop-icons');
    const icons = Array.from(container.children);
    icons.sort((a, b) => a.querySelector('span').textContent.localeCompare(b.querySelector('span').textContent));
    container.innerHTML = '';
    icons.forEach(icon => container.appendChild(icon));
}

// --- MENÚ CONTEXTUAL ---
const contextMenu = document.getElementById('context-menu');
document.addEventListener('click', () => contextMenu.classList.add('hidden'));
document.getElementById('ctx-new-file')?.addEventListener('click', () => {
    const fileName = prompt('Nombre del archivo (con .txt)');
    if (fileName) {
        addDesktopIcon(fileName, '📄', 'notes');
        showToast('Archivo creado');
    }
});
document.getElementById('ctx-new-folder')?.addEventListener('click', () => {
    const folderName = prompt('Nombre de la carpeta');
    if (folderName) {
        let parent = listDir(currentFileDir);
        if (parent) {
            parent[folderName] = { type: 'dir', content: {} };
            renderFiles();
            showToast('Carpeta creada');
        }
    }
});
document.getElementById('ctx-wallpaper')?.addEventListener('click', () => {
    setWallpaper('image');
});
document.getElementById('ctx-sort')?.addEventListener('click', () => {
    sortDesktopIcons();
});

function showContextMenu(e) {
    contextMenu.style.top = e.pageY + 'px';
    contextMenu.style.left = e.pageX + 'px';
    contextMenu.classList.remove('hidden');
}

// --- APAGADO SIMULADO ---
function showShutdownDialog() {
    if (confirm('¿Apagar el sistema virtual?')) {
        showToast('Apagando...');
        setTimeout(() => {
            document.body.innerHTML = '<div style="color:white; text-align:center; margin-top:20%;">Sistema apagado. Recarga la página.</div>';
        }, 2000);
    }
}

// --- EDITOR DE IMÁGENES ---
let editorCanvas = document.getElementById('editor-canvas');
let ctxEditor = editorCanvas?.getContext('2d');
let originalImageData = null;

function initEditor() {
    if (!ctxEditor) return;
    let img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = 'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=500';
    img.onload = () => {
        ctxEditor.drawImage(img, 0, 0, 500, 300);
        originalImageData = ctxEditor.getImageData(0, 0, 500, 300);
    };
}
function applyFilter(filter) {
    if (!ctxEditor) return;
    const imageData = ctxEditor.getImageData(0, 0, editorCanvas.width, editorCanvas.height);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
        let r = data[i];
        let g = data[i+1];
        let b = data[i+2];
        if (filter === 'grayscale') {
            let gray = 0.3*r + 0.59*g + 0.11*b;
            data[i] = data[i+1] = data[i+2] = gray;
        } else if (filter === 'sepia') {
            data[i] = r*0.393 + g*0.769 + b*0.189;
            data[i+1] = r*0.349 + g*0.686 + b*0.168;
            data[i+2] = r*0.272 + g*0.534 + b*0.131;
        } else if (filter === 'invert') {
            data[i] = 255 - r;
            data[i+1] = 255 - g;
            data[i+2] = 255 - b;
        } else if (filter === 'brightness') {
            data[i] = Math.min(255, r * 1.2);
            data[i+1] = Math.min(255, g * 1.2);
            data[i+2] = Math.min(255, b * 1.2);
        } else if (filter === 'blur') {
            // Simulación simple (promedio con vecinos) - omitido por complejidad
        } else if (filter === 'sharpen') {
            // Simulación simple
        } else if (filter === 'contrast') {
            data[i] = Math.min(255, (r - 128) * 1.2 + 128);
            data[i+1] = Math.min(255, (g - 128) * 1.2 + 128);
            data[i+2] = Math.min(255, (b - 128) * 1.2 + 128);
        }
    }
    ctxEditor.putImageData(imageData, 0, 0);
}
function resetImage() {
    if (originalImageData) {
        ctxEditor.putImageData(originalImageData, 0, 0);
    }
}
document.getElementById('imageUpload')?.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                ctxEditor.drawImage(img, 0, 0, editorCanvas.width, editorCanvas.height);
                originalImageData = ctxEditor.getImageData(0, 0, editorCanvas.width, editorCanvas.height);
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    }
});

// --- CLIMA SIMULADO ---
function startWeatherSimulation() {
    const weather = document.getElementById('weather-widget');
    const temps = [22, 24, 26, 23, 21];
    let index = 0;
    setInterval(() => {
        index = (index + 1) % temps.length;
        weather.innerHTML = `<i class="fas fa-sun"></i> ${temps[index]}°C`;
    }, 30000);
    setInterval(() => {
        if (!document.getElementById('window-weather').classList.contains('hidden')) {
            document.getElementById('weather-info').innerHTML = `
                <i class="fas fa-sun" style="font-size:48px;"></i><br>
                Temperatura: ${temps[index]}°C<br>
                Humedad: 45%<br>
                Viento: 10 km/h
            `;
        }
    }, 1000);
}

function startBatterySimulation() {
    const battery = document.getElementById('battery-widget');
    let level = 100;
    setInterval(() => {
        level = Math.max(0, level - 1);
        battery.innerHTML = `<i class="fas fa-battery-${level > 75 ? 'full' : level > 50 ? 'three-quarters' : level > 25 ? 'half' : level > 10 ? 'quarter' : 'empty'}"></i> ${level}%`;
        if (level < 15) {
            showToast('Batería baja', 3000);
        }
    }, 60000);
}

// --- GESTOS TÁCTILES ---
function setupTouchGestures() {
    let touchStartTime, touchStartY;
    document.addEventListener('touchstart', (e) => {
        touchStartTime = Date.now();
        touchStartY = e.touches[0].clientY;
    });
    document.addEventListener('touchend', (e) => {
        const touchEndTime = Date.now();
        const touchEndY = e.changedTouches[0].clientY;
        const dy = touchEndY - touchStartY;
        const timeDiff = touchEndTime - touchStartTime;
        if (timeDiff < 300 && Math.abs(dy) < 10) {
            const activeWin = document.querySelector('.window:not(.hidden)');
            if (activeWin) maximizeApp(activeWin.id);
        } else if (dy > 50 && timeDiff < 500) {
            const activeWin = document.querySelector('.window:not(.hidden)');
            if (activeWin) closeApp(activeWin.id.replace('window-', ''));
        }
    });
}
setupTouchGestures();

// --- EVENT LISTENERS GLOBALES ---
function setupEventListeners() {
    document.querySelectorAll('.window').forEach(win => {
        win.addEventListener('mousedown', () => bringToFront(win));
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'e' && e.metaKey) { openApp('files', '📁'); e.preventDefault(); }
        if (e.key === 'n' && e.metaKey) { openApp('notes', '📝'); e.preventDefault(); }
        if (e.key === 'c' && e.metaKey) { openApp('calc', '🧮'); e.preventDefault(); }
        if (e.key === 't' && e.metaKey) { openApp('terminal', '💻'); e.preventDefault(); }
        if (e.key === 'm' && e.metaKey) { openApp('music', '🎵'); e.preventDefault(); }
    });
}

// --- FONDO INTERACTIVO (partículas) ---
const canvas = document.getElementById('bg-canvas');
const ctx = canvas.getContext('2d');
let particlesArray = [];
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
let mouse = { x: null, y: null, radius: 180 };

window.addEventListener('mousemove', (e) => { mouse.x = e.x; mouse.y = e.y; });
window.addEventListener('mouseout', () => { mouse.x = undefined; mouse.y = undefined; });

class Particle {
    constructor(x, y, dx, dy, size, color) {
        this.x = x; this.y = y; this.dx = dx; this.dy = dy; this.size = size; this.baseColor = color;
        this.color = color;
    }
    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2, false);
        const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent-color').trim();
        ctx.fillStyle = this.color;
        
        if(mouse.x != undefined && mouse.y != undefined){
            let dx = mouse.x - this.x;
            let dy = mouse.y - this.y;
            let distance = Math.sqrt(dx * dx + dy * dy);
            if(distance < 100) {
                ctx.fillStyle = accent;
                this.size = Math.min(3, this.size + 0.5);
            } else {
                this.size = Math.max(0.5, this.size - 0.1);
            }
        }
        ctx.fill();
    }
    update() {
        if (this.x > canvas.width || this.x < 0) this.dx = -this.dx;
        if (this.y > canvas.height || this.y < 0) this.dy = -this.dy;
        
        if(mouse.x != undefined && mouse.y != undefined){
            let dx = mouse.x - this.x;
            let dy = mouse.y - this.y;
            let distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < mouse.radius) {
                const forceDirectionX = dx / distance;
                const forceDirectionY = dy / distance;
                const force = (mouse.radius - distance) / mouse.radius;
                this.x -= forceDirectionX * force * 3;
                this.y -= forceDirectionY * force * 3;
            }
        }
        this.x += this.dx;
        this.y += this.dy;
        this.draw();
    }
}

function initParticles() {
    particlesArray = [];
    let numberOfParticles = (canvas.width * canvas.height) / 7000;
    for (let i = 0; i < numberOfParticles; i++) {
        let size = Math.random() * 2 + 0.5;
        let x = Math.random() * (innerWidth - size * 2) + size;
        let y = Math.random() * (innerHeight - size * 2) + size;
        let dx = (Math.random() - 0.5) * 1.5;
        let dy = (Math.random() - 0.5) * 1.5;
        let color = 'rgba(255, 255, 255, 0.2)';
        particlesArray.push(new Particle(x, y, dx, dy, size, color));
    }
}

function animateParticles() {
    requestAnimationFrame(animateParticles);
    ctx.fillStyle = 'rgba(15, 17, 26, 0.3)';
    ctx.fillRect(0, 0, innerWidth, innerHeight);
    for (let i = 0; i < particlesArray.length; i++) {
        particlesArray[i].update();
    }
}

window.addEventListener('resize', () => {
    canvas.width = window.innerWidth; canvas.height = window.innerHeight; 
    initParticles();
});

initParticles(); 
animateParticles();