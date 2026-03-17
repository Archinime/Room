// --- APPS BÁSICAS ---
const notepad = document.getElementById('notepad-text');
if (notepad) { notepad.value = localStorage.getItem('mi_pc_notas_pro') || ""; notepad.addEventListener('input', () => { localStorage.setItem('mi_pc_notas_pro', notepad.value); }); }

let calcExp = "";
function calcPress(val) {
    const display = document.getElementById('calc-display');
    if (val === 'C') { calcExp = ""; display.value = ""; } 
    else if (val === '=') { try { let safeExp = calcExp.replace(/×/g, '*').replace(/÷/g, '/'); calcExp = new Function('return ' + safeExp)().toString(); display.value = calcExp; } catch { display.value = "Error"; calcExp = ""; } } 
    else { calcExp += val; display.value = calcExp; }
}

function navigateBrowser() { let url = document.getElementById('browser-url').value; if (!url.startsWith('http')) url = 'https://www.google.com/search?igu=1&q=' + encodeURIComponent(url); document.getElementById('browser-frame').src = url; }

function handleTerminal(e) {
    const inputEl = document.getElementById('term-input'), outputEl = document.getElementById('term-output');
    if (e.key === 'Enter') {
        const fullCmd = inputEl.value.trim(), args = fullCmd.split(' '), cmd = args[0].toLowerCase();
        if (fullCmd) { commandHistory.push(fullCmd); historyIndex = commandHistory.length; }
        const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent-color').trim();
        let response = `<div><span style="color:${accent}">root@sistema:${currentFileDir}$</span> ${fullCmd}</div>`;
        switch(cmd) {
            case 'ayuda': response += `<div style='color:${accent}'>Comandos: ayuda, limpiar, fecha, sistema, ls, cd, mkdir, touch, rm, google, juegos</div>`; break;
            case 'limpiar': case 'clear': outputEl.innerHTML = ""; inputEl.value = ""; return;
            case 'fecha': response += `<div>${new Date().toLocaleString()}</div>`; break;
            case 'sistema': response += `<div style='color:#bc13fe'>OS VIRTUAL CYBERPUNK EDITION (MOBILE READY)</div>`; break;
            case 'google': if (args[1]) { openApp('browser', '🌐'); setTimeout(() => { document.getElementById('browser-url').value = 'https://www.google.com/search?igu=1&q=' + args.slice(1).join('+'); navigateBrowser(); }, 100); response += `<div>Ejecutando script...</div>`; } break;
            case 'juegos': response += `<div>Módulos de ocio: ttt, snake, pong, breakout, memory, hangman</div>`; break;
            case 'ls': const dirContent = listDir(currentFileDir); if (dirContent) { let list = Object.entries(dirContent).map(([name, info]) => info.type === 'dir' ? `<span style="color:#00f3ff;">${name}/</span>` : name).join('  '); response += `<div>${list}</div>`; } else response += `<div>Error 404</div>`; break;
            case 'cd': if (!args[1] || args[1] === '~') currentFileDir = '/'; else if (args[1] === '..') { let parts = currentFileDir.split('/').filter(p => p); parts.pop(); currentFileDir = '/' + parts.join('/'); } else { let newPath = currentFileDir === '/' ? '/' + args[1] : currentFileDir + '/' + args[1]; if (listDir(newPath) !== null) currentFileDir = newPath; else response += `<div>Directorio fantasma</div>`; } break;
            case 'mkdir': if (args[1]) { let parent = listDir(currentFileDir); if (parent) { parent[args[1]] = { type: 'dir', content: {} }; response += `<div>Nodo creado</div>`; renderFiles(); } } break;
            case 'touch': if (args[1]) { let parent = listDir(currentFileDir); if (parent) { parent[args[1]] = { type: 'file', content: '' }; response += `<div>Archivo generado</div>`; renderFiles(); } } break;
            case 'rm': if (args[1]) { let parent = listDir(currentFileDir); if (parent && parent[args[1]]) { delete parent[args[1]]; response += `<div>Elemento purgado</div>`; renderFiles(); } } break;
            default: if (cmd !== '') response += `<div style='color:#ff0055'>Comando no reconocido: ${cmd}</div>`;
        }
        outputEl.innerHTML += response; inputEl.value = ""; outputEl.scrollTop = outputEl.scrollHeight;
    }
}
document.getElementById('term-input')?.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowUp') { e.preventDefault(); if (commandHistory.length > 0) { historyIndex = Math.max(0, historyIndex - 1); e.target.value = commandHistory[historyIndex] || ''; } } 
    else if (e.key === 'ArrowDown') { e.preventDefault(); if (commandHistory.length > 0) { historyIndex = Math.min(commandHistory.length - 1, historyIndex + 1); e.target.value = commandHistory[historyIndex] || ''; } } 
});
function listDir(path) { let parts = path.split('/').filter(p => p); let current = fileSystem['/']; for (let p of parts) { if (current.content && current.content[p] && current.content[p].type === 'dir') current = current.content[p]; else return null; } return current.content; }

function initGallery() { const gallery = document.getElementById('gallery-grid'); if (!gallery) return; const images = ['https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=300','https://images.unsplash.com/photo-1494500764479-0c8f2919a3d8?w=300','https://images.unsplash.com/photo-1511497584788-876760111969?w=300']; gallery.innerHTML = ''; images.forEach(src => { const img = document.createElement('img'); img.src = src; img.onclick = () => showLightbox(src); gallery.appendChild(img); }); }
function showLightbox(src) { const overlay = document.createElement('div'); overlay.style.position = 'fixed'; overlay.style.top = 0; overlay.style.left = 0; overlay.style.width = '100vw'; overlay.style.height = '100vh'; overlay.style.background = 'rgba(0,0,0,0.8)'; overlay.style.zIndex = 200000; overlay.style.display = 'flex'; overlay.style.alignItems = 'center'; overlay.style.justifyContent = 'center'; overlay.style.backdropFilter = 'blur(10px)'; const img = document.createElement('img'); img.src = src; img.style.maxWidth = '90%'; img.style.maxHeight = '90%'; img.style.borderRadius = '10px'; img.style.border = '2px solid var(--neon-cyan)'; overlay.appendChild(img); overlay.onclick = () => overlay.remove(); document.body.appendChild(overlay); }
function renderFiles() { const fileList = document.getElementById('file-list'); if (!fileList) return; document.getElementById('file-path').textContent = '📁 ' + currentFileDir; const dirContent = listDir(currentFileDir); fileList.innerHTML = ''; if (!dirContent) return;
    for (let [name, info] of Object.entries(dirContent)) { const item = document.createElement('div'); item.className = 'file-item'; item.innerHTML = `<div class="file-icon">${info.type === 'dir' ? '📁' : '📄'}</div><div class="file-name">${name}</div>`;
        item.onclick = () => { 
            let tapCount = item.getAttribute('data-tap') || 0; tapCount++; item.setAttribute('data-tap', tapCount);
            if(tapCount == 1) { setTimeout(()=>item.setAttribute('data-tap', 0), 400); }
            else if(tapCount == 2) {
                if (info.type === 'dir') { currentFileDir = currentFileDir === '/' ? '/' + name : currentFileDir + '/' + name; renderFiles(); } 
                else { if (name.endsWith('.txt')) { openApp('notes', '📝'); setTimeout(() => { document.getElementById('notepad-text').value = info.content || ''; }, 100); } else if (name.match(/\.(jpg|png|gif)$/i)) openApp('fotos', '🖼️'); } 
                item.setAttribute('data-tap', 0);
            }
        }; fileList.appendChild(item);
    } 
}

// --- REPRODUCTOR DE MÚSICA CON TUS CANCIONES ---
let playlist = [ { title: 'Plants vs Zombies', src: 'pvz.mp3' }, { title: 'Bad Ice Cream', src: 'bad ice cream.mp3' }, { title: 'Nokia Ringtone', src: 'nokia.mp3' } ];
let currentSongIndex = 0, audio = document.getElementById('audio-player'), playPauseBtn = document.getElementById('play-pause-btn'), playlistEl = document.getElementById('playlist'), visualizerCanvas = document.getElementById('visualizer'), audioPlayerCtx, analyser, source;
function initMusicPlayer() { if (!playlistEl) return; playlistEl.innerHTML = ''; playlist.forEach((song, idx) => { let li = document.createElement('li'); li.innerHTML = `<i class="fas fa-music"></i> ${song.title}`; li.onclick = () => playSong(idx); playlistEl.appendChild(li); });
    playPauseBtn.addEventListener('click', togglePlay); document.getElementById('prev-btn').addEventListener('click', prevSong); document.getElementById('next-btn').addEventListener('click', nextSong); audio.addEventListener('ended', nextSong); setupVisualizer(); }
function setupVisualizer() { if (!audio) return;
    audio.addEventListener('play', () => { if (!audioPlayerCtx) { audioPlayerCtx = new (window.AudioContext || window.webkitAudioContext)(); analyser = audioPlayerCtx.createAnalyser(); analyser.fftSize = 256; source = audioPlayerCtx.createMediaElementSource(audio); source.connect(analyser); analyser.connect(audioPlayerCtx.destination); } if(audioPlayerCtx.state === 'suspended') audioPlayerCtx.resume(); visualize(); });
}
function visualize() { if (!visualizerCanvas || !analyser) return; const ctx = visualizerCanvas.getContext('2d'); const width = visualizerCanvas.width, height = visualizerCanvas.height; const bufferLength = analyser.frequencyBinCount; const dataArray = new Uint8Array(bufferLength); analyser.getByteFrequencyData(dataArray); ctx.fillStyle = '#000'; ctx.fillRect(0, 0, width, height); const barWidth = (width / bufferLength) * 2.5; let x = 0;
    for (let i = 0; i < bufferLength; i++) { let barHeight = dataArray[i] / 2; ctx.fillStyle = `hsl(${280 + (i * 2)}, 100%, 50%)`; ctx.fillRect(x, height - barHeight, barWidth, barHeight); x += barWidth + 1; } requestAnimationFrame(visualize); }
function playSong(idx) { currentSongIndex = idx; audio.src = playlist[idx].src; audio.play().catch(e => showToast("Haz clic en Play para iniciar")); document.getElementById('current-song').textContent = playlist[idx].title; updatePlaylistHighlight(); playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>'; }
function togglePlay() { if (audio.paused) { audio.play(); playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>'; } else { audio.pause(); playPauseBtn.innerHTML = '<i class="fas fa-play"></i>'; } }
function prevSong() { currentSongIndex = (currentSongIndex - 1 + playlist.length) % playlist.length; playSong(currentSongIndex); }
function nextSong() { currentSongIndex = (currentSongIndex + 1) % playlist.length; playSong(currentSongIndex); }
function updatePlaylistHighlight() { document.querySelectorAll('#playlist li').forEach((li, i) => { if (i === currentSongIndex) li.classList.add('playing'); else li.classList.remove('playing'); }); }

// --- FUNCIONES DEL SISTEMA, PAPELERA Y MENÚ CONTEXTUAL ---
function renderTrash() { const trashDiv = document.getElementById('trash-items'); if (!trashDiv) return; trashDiv.innerHTML = ''; trashItems.forEach((item, idx) => { const div = document.createElement('div'); div.className = 'file-item'; div.innerHTML = `<div class="file-icon">${item.icon}</div><div class="file-name">${item.name}</div>`; div.onclick = () => restoreFromTrash(idx); trashDiv.appendChild(div); }); document.getElementById('trash-count').textContent = trashItems.length; }
function restoreFromTrash(index) { if (confirm('¿Restaurar este elemento al escritorio?')) { const item = trashItems.splice(index, 1)[0]; localStorage.setItem('trash', JSON.stringify(trashItems)); addDesktopIcon(item.name, item.icon, item.appId); renderTrash(); showToast('Restaurado'); } }
document.getElementById('empty-trash')?.addEventListener('click', () => { if (confirm('¿Vaciar toda la papelera permanentemente?')) { trashItems = []; localStorage.setItem('trash', JSON.stringify(trashItems)); renderTrash(); showToast('Papelera purgada'); } });
const contextMenu = document.getElementById('context-menu');
document.addEventListener('click', () => contextMenu.classList.add('hidden')); document.addEventListener('touchstart', () => contextMenu.classList.add('hidden'));

function showContextMenu(e, type, id = null) {
    let x = e.pageX || (e.touches && e.touches[0].pageX);
    let y = e.pageY || (e.touches && e.touches[0].pageY);
    contextMenu.style.top = y + 'px'; contextMenu.style.left = x + 'px'; contextMenu.classList.remove('hidden');
    document.getElementById('ctx-desktop-options').style.display = (type === 'desktop') ? 'block' : 'none';
    document.getElementById('ctx-icon-options').style.display = (type === 'icon') ? 'block' : 'none';
    if(type === 'icon') selectedIconId = id;
}

document.getElementById('ctx-new-file')?.addEventListener('click', () => { const fileName = prompt('Nombre de la Nota'); if (fileName) { addDesktopIcon(fileName, '📄', 'notes', 'icon-'+Date.now(), '50px', '50px'); showToast('Archivo creado en Escritorio'); } });
document.getElementById('ctx-new-folder')?.addEventListener('click', () => { const folderName = prompt('Nombre de la Carpeta'); if (folderName) { let parent = listDir('/'); if (parent) { parent[folderName] = { type: 'dir', content: {} }; renderFiles(); } addDesktopIcon(folderName, '📁', 'files', 'icon-'+Date.now(), '50px', '50px'); showToast('Carpeta creada en Escritorio'); } });
document.getElementById('ctx-wallpaper')?.addEventListener('click', () => setRandomWallpaper());

document.getElementById('ctx-rename')?.addEventListener('click', () => { if(!selectedIconId || selectedIconId === 'trash-icon') return; const iconDiv = document.getElementById(selectedIconId); if(iconDiv) { const newName = prompt("Nuevo nombre:"); if(newName) { iconDiv.querySelector('.icon-label').innerText = newName; saveDesktopIconPositions(); } } });
document.getElementById('ctx-delete')?.addEventListener('click', () => { if(!selectedIconId || selectedIconId === 'trash-icon') return; const iconDiv = document.getElementById(selectedIconId); if(iconDiv) { trashItems.push({ name: iconDiv.querySelector('.icon-label').innerText, icon: iconDiv.querySelector('.icon-img').innerText, appId: iconDiv.getAttribute('data-appid') }); localStorage.setItem('trash', JSON.stringify(trashItems)); iconDiv.remove(); renderTrash(); saveDesktopIconPositions(); showToast('Movido a la papelera'); } });

function showShutdownDialog() { if (confirm('¿Apagar el sistema virtual?')) { showToast('Desconectando...'); setTimeout(() => { document.body.innerHTML = '<div style="color:var(--neon-cyan); text-align:center; margin-top:20%; font-size: 2rem; font-family: monospace;">SISTEMA OFFLINE. Vuelva pronto.</div>'; }, 2000); } }
function startWeatherSimulation() { const weather = document.getElementById('weather-widget'); const temps = [22, 24, 26, 23, 21]; let index = 0; setInterval(() => { index = (index + 1) % temps.length; weather.innerHTML = `<i class="fas fa-sun"></i> ${temps[index]}°C`; }, 30000); }
function startBatterySimulation() { const battery = document.getElementById('battery-widget'); let level = 100; setInterval(() => { level = Math.max(0, level - 1); battery.innerHTML = `<i class="fas fa-battery-${level > 75 ? 'full' : level > 50 ? 'three-quarters' : level > 25 ? 'half' : level > 10 ? 'quarter' : 'empty'}"></i> ${level}%`; if (level < 15) showToast('Alerta: Energía Crítica', 3000); }, 60000); }
function setupEventListeners() { document.querySelectorAll('.window').forEach(win => { win.addEventListener('mousedown', () => bringToFront(win)); win.addEventListener('touchstart', () => bringToFront(win), {passive: true}); });
    document.addEventListener('keydown', (e) => { if (e.key === 'e' && e.metaKey) { openApp('files', '📁'); e.preventDefault(); } if (e.key === 'n' && e.metaKey) { openApp('notes', '📝'); e.preventDefault(); } if (e.key === 'c' && e.metaKey) { openApp('calc', '🧮'); e.preventDefault(); } if (e.key === 't' && e.metaKey) { openApp('terminal', '💻'); e.preventDefault(); } if (e.key === 'm' && e.metaKey) { openApp('music', '🎵'); e.preventDefault(); } });
}