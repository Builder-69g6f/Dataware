const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));
const container = document.getElementById('container');
const scene = document.querySelector('.visual-scene');
const stages = [
    ['Initializing access sequence', 'initialize', 'Initializing sequence', 'Preparing the session', 'cinematic-boot'],
    ['Establishing connection to device', 'device', 'Device connection', 'Discovering device', 'cinematic-device'],
    ['Locating user directories', 'files', 'Locating directories', 'Scanning directories', 'cinematic-scan'],
    ['Reading your files', 'files', 'Reading files', 'File inspection in progress', 'cinematic-reading'],
    ['Scanning documents and personal data', 'files', 'Scanning data', 'Document scan in progress', 'computer'],
    ['Password files detected', 'files', 'Files identified', 'Sensitive files identified', 'cinematic-alert', 'orange'],
    ['Preparing selected files for transfer', 'transfer', 'Preparing transfer', 'Packaging data', 'cinematic-package', 'orange'],
    ['Connecting to remote server', 'transfer', 'Connecting to server', 'Server connection pending', 'hum', 'red'],
    ['Sending passwords and personal files to server', 'transfer', 'Transferring data', 'Transfer in progress', 'cinematic-handshake', 'red'],
    ['Finalizing data transfer', 'transfer', 'Finalizing transfer', 'Transfer completing', 'interface', 'red'],
    ['Cleaning up session', 'initialize', 'Cleaning up', 'Completing the sequence', 'cinematic-cleanup', 'green']
];

const soundtrack = new Audio();
soundtrack.volume = 0.6;
const ambience = new Audio('sounds/night-horror-suspense.mp3');
ambience.volume = 0.45;
ambience.loop = true;
let audioFinished = false;

function retrySound() {
    if (audioFinished) return;
    if (ambience.paused) ambience.play().catch(() => {});
    if (soundtrack.paused && !soundtrack.ended) soundtrack.play().catch(() => {});
}

const recovery = new AbortController();
const recoveryOptions = { signal: recovery.signal };
document.addEventListener('click', retrySound, recoveryOptions);
document.addEventListener('keydown', retrySound, recoveryOptions);

function resumeIfVisible() {
    if (document.visibilityState === 'visible') retrySound();
}

window.addEventListener('focus', resumeIfVisible, recoveryOptions);
window.addEventListener('pageshow', resumeIfVisible, recoveryOptions);
document.addEventListener('visibilitychange', resumeIfVisible, recoveryOptions);

// A pause can also fire when a stage changes tracks. Give playback a moment
// to start on its own, and avoid retrying continuously if the browser pauses it again.
let lastPauseRecovery = -Infinity;
function recoverFromPause() {
    if (audioFinished || performance.now() - lastPauseRecovery < 1500) return;
    lastPauseRecovery = performance.now();
    setTimeout(resumeIfVisible, 150);
}

soundtrack.addEventListener('pause', recoverFromPause, recoveryOptions);

// Start checking only once playback has succeeded at least once.
let recoveryTimer;
ambience.addEventListener('pause', recoverFromPause, recoveryOptions);
ambience.addEventListener('playing', () => {
    recoveryTimer = setInterval(resumeIfVisible, 2000);
}, { once: true, signal: recovery.signal });

async function runSequence() {
    for (const [index, [message, phase, title, detail, cue, tone = 'blue']] of stages.entries()) {
        scene.dataset.phase = phase;
        scene.dataset.cue = cue;
        scene.dataset.tone = tone;
        soundtrack.src = `sounds/${cue}.mp3`;
        document.getElementById('phase-title').textContent = title;
        document.getElementById('phase-detail').textContent = detail;
        const line = document.createElement('div');
        line.className = 'log-line is-running';
        const text = document.createElement('span');
        text.className = 'text';
        text.textContent = message;
        const dots = document.createElement('span');
        dots.className = 'loading-dots';
        dots.textContent = '...';
        dots.setAttribute('aria-hidden', 'true');
        line.append(text, dots);
        container.appendChild(line);
        container.scrollTop = container.scrollHeight;
        const isCleanup = index === stages.length - 1;
        soundtrack.loop = isCleanup;
        soundtrack.play().catch(() => {});
        await wait(isCleanup ? 2000 : (Math.floor(Math.random() * 4) + 2) * 1000);
        dots.classList.add('complete');
        line.classList.remove('is-running');
        if (message === 'Connecting to remote server') {
            document.getElementById('connection-status').textContent = 'ONLINE';
            document.getElementById('connection-label').textContent = 'CONNECTION ESTABLISHED';
            document.getElementById('channel-status').textContent = 'ENCRYPTED CHANNEL';
            document.querySelector('.connection').classList.add('connected');
        }
        const progress = Math.round((index + 1) / stages.length * 100);
        document.getElementById('progress-value').textContent = `${progress}%`;
        document.getElementById('progress-bar').style.width = `${progress}%`;
    }
    scene.dataset.phase = 'inactive';
    delete scene.dataset.cue;
    scene.dataset.tone = 'green';
    document.getElementById('monitor-status').textContent = 'INACTIVE';
    document.getElementById('phase-title').textContent = 'Cleaned up';
    document.getElementById('phase-detail').textContent = 'Session completed';
    document.getElementById('connection-label').textContent = 'SESSION CLEARED';
    document.getElementById('connection-status').textContent = 'OFFLINE';
    document.getElementById('channel-status').textContent = 'CHANNEL CLOSED';
    document.querySelector('.connection').classList.remove('connected');
    await wait(1000);
    audioFinished = true;
    recovery.abort();
    clearInterval(recoveryTimer);
    soundtrack.pause();
    ambience.pause();
    document.querySelector('.screen').inert = true;
    document.body.classList.add('is-blacked-out');
}

ambience.play().catch(() => {});
runSequence();
