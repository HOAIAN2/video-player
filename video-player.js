/**
 * Author: Lê Hoài Ân an69tm@gmail.com
 * Description: Custom Video Player with enhanced controls.
 */

/**
 * Creates a custom video player with controls including play, pause, skip, fullscreen, and progress tracking.
 * 
 * @param {Object} config - Configuration options for the player.
 * @param {Array<{src:string,label:string}>} [config.sources] - The source URL of the video.
 * @param {number} [config.skipSeconds=5] - Number of seconds to skip forward or backward.
 * @param {number} [config.autoHideControllerAfter=3000] - Time in milliseconds before the controller hides automatically.
 * @param {boolean} [config.forceLandscape=true] - Auto rotate to landscape when active fullscreen.
 * @param {Array<number>}[config.speedSettings] -List of speed setting, eg: 0.5,1,1.5,2
 * @param {{source:string,speed:string,subtitle:string}}[config.settingLabels] - Custom labels for settings.
 * @returns {DocumentFragment} - The player element containing the video and custom controls.
 */
function createVideoPlayer(config) {
    function createElement(htmlString) {
        const fragment = document.createDocumentFragment();
        const template = document.createElement('template');
        template.innerHTML = htmlString.trim();
        fragment.append(...template.content.childNodes);
        return fragment;
    }
    function createSVGElement(string) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(string, 'image/svg+xml');
        const svg = doc.querySelector('svg');
        return svg;
    }
    function toHHMMSS(secs) {
        const secNum = parseInt(secs, 10);
        const hours = Math.floor(secNum / 3600);
        const minutes = Math.floor(secNum / 60) % 60;
        const seconds = secNum % 60;
        return [hours, minutes, seconds]
            .map(v => v < 10 ? '0' + v : v)
            .filter((v, i) => v !== '00' || i > 0)
            .join(':');
    }

    const IGNORE_FOCUS_ELEMENTS = ['INPUT', 'TEXTAREA'];
    const PLAY_SVG =
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
            <polygon points="25, 15 80, 50 25, 85"/>
        </svg>`;
    const PAUSE_SVG =
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
            <rect width="25" height="70" x="15" y="15"/>
            <rect width="25" height="70" x="60" y="15"/>
        </svg>`;
    const FORWARD_SVG =
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
            <polygon points="10,10 50,50 10,90"/>
            <polygon points="50,10 90,50 50,90"/>
        </svg>`;
    const BACKWARD_SVG =
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
            <polygon points="90,10 50,50 90,90"/>
            <polygon points="50,10 10,50 50,90"/>
        </svg>`;
    const EXPAND_SVG =
        `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M10 40V10H40" fill="none" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M90 40V10H60" fill="none" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M10 60V90H40" fill="none" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M90 60V90H60" fill="none" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>`;
    const VOLUME_SVG =
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
            <polygon points="10,30 30,30 50,10 50,90 30,70 10,70"/>
            <path d="M60,30 Q80,50 60,70" fill="none" stroke-width="8"/>
            <path d="M70,20 Q100,50 70,80" fill="none" stroke-width="8"/>
        </svg>`;
    const VOLUME_MUTED_SVG =
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
            <polygon points="10,30 30,30 50,10 50,90 30,70 10,70"/>
            <line x1="60" y1="30" x2="90" y2="70" stroke-width="8"/>
            <line x1="60" y1="70" x2="90" y2="30" stroke-width="8"/>
        </svg>`;
    const SETTING_SVG =
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
            <polygon points="50,5 90,25 90,75 50,95 10,75 10,25" fill="none" stroke-width="8"/>
            <circle cx="50" cy="50" r="20" fill="none" stroke-width="8"/>
        </svg>`;
    const PLAY_SPEED_SVG =
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
            <circle cx="50" cy="50" r="40" stroke="currentColor" stroke-width="8" fill="none" />
            <line x1="50" y1="50" x2="50" y2="30" stroke="currentColor" stroke-width="6" stroke-linecap="round" />
            <line x1="50" y1="50" x2="65" y2="50" stroke="currentColor" stroke-width="6" stroke-linecap="round" />
            <path d="M80 50 A30 30 0 0 1 70 70" stroke="currentColor" stroke-width="6" fill="none" stroke-linecap="round" />
        </svg>`;
    const SOURCE_SVG =
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
            <rect x="5" y="5" width="90" height="90" rx="10" fill="none" stroke="currentColor" stroke-width="5"/>
            <rect x="20" y="30" width="60" height="6" rx="2" fill="currentColor"/>
            <rect x="20" y="50" width="60" height="6" rx="2" fill="currentColor"/>
            <rect x="20" y="70" width="60" height="6" rx="2" fill="currentColor"/>
            <circle cx="50" cy="33" r="5" fill="currentColor"/>
            <circle cx="30" cy="53" r="5" fill="currentColor"/>
            <circle cx="60" cy="73" r="5" fill="currentColor"/>
        </svg>`;
    const SUBTITLE_SVG =
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
            <rect x="10" y="25" width="80" height="50" rx="8" fill="none" stroke="currentColor" stroke-width="5"/>
            <rect x="20" y="40" width="25" height="8" rx="2" fill="currentColor"/>
            <rect x="55" y="40" width="25" height="8" rx="2" fill="currentColor"/>
            <rect x="20" y="55" width="15" height="8" rx="2" fill="currentColor"/>
            <rect x="40" y="55" width="40" height="8" rx="2" fill="currentColor"/>
        </svg>`;

    const speedSettingsHTML = config.speedSettings.map(setting => {
        return (
            `
            <div class="setting-value" data-setting-type="speed" data-setting-value="${setting}" >
                ${setting}x
            </div>
            `
        );
    }).join('');
    const sourceSettingsHTML = config.sources.map(source => {
        return (
            `
            <div class="setting-value" data-setting-type="source" data-setting-value="${source.label}">
                ${source.label}
            </div>
            `
        );
    }).join('');

    const PLAYER_ELEMENT = createElement(
        `
        <div class="player-container">
            <div class="setting-container hide">
                <div class="setting-types">
                    <div data-type="speed">
                        ${PLAY_SPEED_SVG}
                        <p>${config.settingLabels.speed}</p>
                        <p>1x</p>
                    </div>
                    <div data-type="source">
                        ${SOURCE_SVG}
                        <p>${config.settingLabels.source}</p>
                        <p>${config.sources[0].label}</p>
                    </div>
                    <div data-type="subtitle">
                        ${SUBTITLE_SVG}
                        <p>${config.settingLabels.subtitle}</p>
                        <p>Off</p>
                    </div>
                </div>
                <div class="setting-content hide">
                    <div class="setting-content-back"> < </div>
                    <div class="setting-values">
                        <!-- Replace children here -->
                    </div>
                </div>
            </div>
            <div class="action-overlay"></div>
            <video class="player-video" src="${config.sources[0].src}"></video>
            <div class="player-controller hide">
                <div class="hover-time hide"></div>
                <div class="wrap-buttons">
                    <div class="player-controller-progress-overlay"></div>
                    <div class="player-controller-progress-background"></div>
                    <div class="player-controller-progress"></div>
                    <div class="player-controller-buttons">
                        <div class="buttons-left">
                            <button title="play" type="button" class="button-play">${PLAY_SVG}</button>
                            <button title="volume" type="button" class="button-volume">${VOLUME_SVG}</button>
                            <div class="volume-master">
                                <input type="range" min="0" max="100" value="100"/>
                            </div>
                            <div type="button" class="video-timestamp">
                                <p>00:00 / 00:00</p>
                            </div>
                        </div>
                        <div class="buttons-right">
                            <button title="backward" type="button" class="button-backward">${BACKWARD_SVG}</button>
                            <button title="forward" type="button" class="button-forward">${FORWARD_SVG}</button>
                            <button title="setting" type="button" class="button-setting">${SETTING_SVG}</button>
                            <button title="fullscreen" type="button" class="button-fullscreen">${EXPAND_SVG}</button>
                        </div>
                    </div>
                </div>
            </div>
        </di>
        `
    );

    const PLAYER_CONTAINER = PLAYER_ELEMENT.querySelector('.player-container');
    const PLAYER_CONTROLLER = PLAYER_ELEMENT.querySelector('.player-controller');

    const HOVER_TIME = PLAYER_ELEMENT.querySelector('.hover-time');
    const SETTING_CONTAINER = PLAYER_ELEMENT.querySelector('.setting-container');
    const PLAYER_PROGRESS_OVERLAY = PLAYER_ELEMENT.querySelector('.player-controller-progress-overlay');
    const PLAYER_PROGRESS = PLAYER_ELEMENT.querySelector('.player-controller-progress');

    const ACTION_OVERLAY = PLAYER_ELEMENT.querySelector('.action-overlay');
    const VIDEO_ELEMENT = PLAYER_ELEMENT.querySelector('video');

    const PLAY_BUTTON = PLAYER_ELEMENT.querySelector('.button-play');
    const VOLUME_BUTTON = PLAYER_ELEMENT.querySelector('.button-volume');
    const VOLUME_INPUT = PLAYER_ELEMENT.querySelector('.volume-master>input');
    const FORWARD_BUTTON = PLAYER_ELEMENT.querySelector('.button-forward');
    const BACKWARD_BUTTON = PLAYER_ELEMENT.querySelector('.button-backward');
    const SETTING_BUTTON = PLAYER_ELEMENT.querySelector('.button-setting');
    const FULLSCREEN_BUTTON = PLAYER_ELEMENT.querySelector('.button-fullscreen');

    const VIDEO_TIMESTAMP = PLAYER_ELEMENT.querySelector('.video-timestamp');

    const BACK_SETTING_BUTTON = PLAYER_ELEMENT.querySelector('.setting-content-back');
    const SETTING_TYPES = PLAYER_ELEMENT.querySelector('.setting-types');
    const SETTING_CONTENT = PLAYER_ELEMENT.querySelector('.setting-content');
    const SETTING_VALUES = PLAYER_ELEMENT.querySelector('.setting-values');

    function showAction(svgString) {
        const svg = createSVGElement(svgString);
        ACTION_OVERLAY.replaceChildren(svg);
    }
    function handleAutoHideController() {
        let timeoutId = 0;
        if (PLAYER_CONTROLLER.classList.contains('hide')) {
            PLAYER_CONTROLLER.classList.remove('hide');
            timeoutId = setTimeout(() => {
                PLAYER_CONTROLLER.classList.add('hide');
            }, config.autoHideControllerAfter);
        }
        else {
            clearTimeout(timeoutId);
        }
    };
    function toggleFullScreen() {
        if (document.fullscreenElement == PLAYER_CONTAINER) {
            document.exitFullscreen();
        }
        else {
            PLAYER_CONTAINER.requestFullscreen();

            if (config.forceLandscape && screen.orientation && screen.orientation.lock) {
                screen.orientation.lock("landscape").catch((err) => {
                    console.error("Failed to lock orientation:", err);
                });
            }
        }
    }
    function forward() {
        VIDEO_ELEMENT.currentTime += config.skipSeconds;
        showAction(FORWARD_SVG);
    };
    function backward() {
        VIDEO_ELEMENT.currentTime -= config.skipSeconds;
        showAction(BACKWARD_SVG);
    };
    function playOrPauseVideo() {
        if (VIDEO_ELEMENT.paused) {
            VIDEO_ELEMENT.play();
            showAction(PLAY_SVG);
        }
        else {
            VIDEO_ELEMENT.pause();
            showAction(PAUSE_SVG);
        }
    };
    function backSetting() {
        SETTING_TYPES.classList.remove('hide');
        SETTING_CONTENT.classList.add('hide');
        // SETTING_VALUES.replaceChildren();
    };

    PLAYER_CONTAINER.addEventListener('pointermove', handleAutoHideController);

    PLAYER_CONTAINER.addEventListener('pointerdown', handleAutoHideController);

    PLAYER_PROGRESS_OVERLAY.addEventListener('pointermove', (e) => {
        const rect = PLAYER_PROGRESS_OVERLAY.getBoundingClientRect();
        const offsetX = e.clientX - rect.left;
        const width = rect.width;
        const percent = (offsetX / width);
        HOVER_TIME.style.left = offsetX + 'px';
        HOVER_TIME.textContent = toHHMMSS(percent * VIDEO_ELEMENT.duration);

        let timeoutId = 0;
        if (HOVER_TIME.classList.contains('hide')) {
            HOVER_TIME.classList.remove('hide');
            timeoutId = setTimeout(() => {
                HOVER_TIME.classList.add('hide');
            }, 1000);
        }
        else {
            clearTimeout(timeoutId);
        }
    });

    PLAY_BUTTON.addEventListener('pointerdown', playOrPauseVideo);

    VOLUME_BUTTON.addEventListener('pointerdown', (e) => {
        VIDEO_ELEMENT.muted = !VIDEO_ELEMENT.muted;
    });

    VOLUME_INPUT.addEventListener('input', (e) => {
        const value = e.target.valueAsNumber;
        VIDEO_ELEMENT.volume = value / 100;
    });

    VIDEO_ELEMENT.addEventListener('volumechange', (e) => {
        if (VIDEO_ELEMENT.muted || VIDEO_ELEMENT.volume === 0) {
            const svg = createSVGElement(VOLUME_MUTED_SVG);
            VOLUME_BUTTON.replaceChildren(svg);
        }
        else {
            const svg = createSVGElement(VOLUME_SVG);
            VOLUME_BUTTON.replaceChildren(svg);
        }
        VOLUME_INPUT.value = VIDEO_ELEMENT.volume * 100;
    });

    VIDEO_ELEMENT.addEventListener('pointerdown', (e) => {
        if (e.pointerType === 'mouse') {
            playOrPauseVideo();
        }
    });

    VIDEO_ELEMENT.addEventListener('timeupdate', () => {
        if (VIDEO_ELEMENT.duration) {
            const percent = (VIDEO_ELEMENT.currentTime / VIDEO_ELEMENT.duration);
            PLAYER_PROGRESS.style.transform = `scaleX(${percent})`;
            VIDEO_TIMESTAMP.querySelector('p').textContent = `${toHHMMSS(VIDEO_ELEMENT.currentTime)} / ${toHHMMSS(VIDEO_ELEMENT.duration)}`;
        }
    });

    // Handle progress bar
    PLAYER_PROGRESS_OVERLAY.addEventListener('pointerdown', (e) => {
        e.preventDefault();

        // Pause video when seeking
        const wasPlaying = !VIDEO_ELEMENT.paused;
        VIDEO_ELEMENT.pause();

        function updateProgress(e) {
            const rect = PLAYER_PROGRESS_OVERLAY.getBoundingClientRect();
            const offsetX = e.clientX - rect.left; // Use clientX for mobile basue native offsetX not work on mobile
            const width = rect.width;
            if (VIDEO_ELEMENT.duration) {
                const percent = (offsetX / width);
                if (percent >= 0 && percent <= 1) {
                    PLAYER_PROGRESS.style.transform = `scaleX(${percent})`;
                }
            }
        }
        function handlePointerMove(e) {
            e.preventDefault();
            updateProgress(e);
            const rect = PLAYER_PROGRESS_OVERLAY.getBoundingClientRect();
            const offsetX = e.clientX - rect.left;
            const width = rect.width;
            const percent = (offsetX / width);
            HOVER_TIME.classList.remove('hide');
            if (percent >= 0 && percent <= 1) {
                HOVER_TIME.style.left = offsetX + 'px';
                HOVER_TIME.textContent = toHHMMSS(percent * VIDEO_ELEMENT.duration);
            }
        }
        updateProgress(e);
        document.addEventListener('pointermove', handlePointerMove);
        document.addEventListener('pointerup', (e) => {
            e.preventDefault();
            document.removeEventListener('pointermove', handlePointerMove);
            const rect = PLAYER_PROGRESS_OVERLAY.getBoundingClientRect();
            const offsetX = e.clientX - rect.left;
            const width = rect.width;
            const realTime = (offsetX / width) * VIDEO_ELEMENT.duration;
            VIDEO_ELEMENT.currentTime = Math.max(0, Math.min(realTime, VIDEO_ELEMENT.duration));
            HOVER_TIME.classList.add('hide');

            // Resume video if it was playing before
            if (wasPlaying) VIDEO_ELEMENT.play();
        }, { once: true, passive: false });
    });

    VIDEO_ELEMENT.addEventListener('loadeddata', () => {
        if (VIDEO_ELEMENT.duration) {
            VIDEO_TIMESTAMP.querySelector('p').textContent = `00:00 / ${toHHMMSS(VIDEO_ELEMENT.duration)}`;
        }
    });

    VIDEO_ELEMENT.addEventListener('play', () => {
        const svg = createSVGElement(PAUSE_SVG);
        PLAY_BUTTON.replaceChildren(svg);
    });

    VIDEO_ELEMENT.addEventListener('pause', () => {
        const svg = createSVGElement(PLAY_SVG);
        PLAY_BUTTON.replaceChildren(svg);
    });

    FULLSCREEN_BUTTON.addEventListener('pointerdown', toggleFullScreen);
    VIDEO_ELEMENT.addEventListener('dblclick', toggleFullScreen);

    FORWARD_BUTTON.addEventListener('pointerdown', forward);
    BACKWARD_BUTTON.addEventListener('pointerdown', backward);

    SETTING_BUTTON.addEventListener('pointerdown', (e) => {
        SETTING_CONTAINER.classList.toggle('hide');
        const rect = PLAYER_CONTROLLER.getBoundingClientRect();
        SETTING_CONTAINER.style.bottom = `${rect.height + 10}px`;
        backSetting();
    });

    SETTING_CONTAINER.addEventListener('pointerdown', (e) => {
        // Handle switch setting tab
        if (SETTING_TYPES.querySelector('[data-type="speed"]')?.contains(e.target)) {
            SETTING_TYPES.classList.add('hide');
            SETTING_CONTENT.classList.remove('hide');
            SETTING_VALUES.replaceChildren(createElement(speedSettingsHTML));
            BACK_SETTING_BUTTON.textContent = `< ${config.settingLabels.speed}`;
        }
        if (SETTING_TYPES.querySelector('[data-type="source"]')?.contains(e.target)) {
            SETTING_TYPES.classList.add('hide');
            SETTING_CONTENT.classList.remove('hide');
            SETTING_VALUES.replaceChildren(createElement(sourceSettingsHTML));
            BACK_SETTING_BUTTON.textContent = `< ${config.settingLabels.source}`;
        }
        if (SETTING_TYPES.querySelector('[data-type="subtitle"]')?.contains(e.target)) {
            return;
            SETTING_TYPES.classList.add('hide');
            SETTING_CONTENT.classList.remove('hide');
        }
        if (e.target === BACK_SETTING_BUTTON) {
            backSetting();
        }
        if (e.target.classList.contains('setting-value')) {
            const settingType = e.target.getAttribute('data-setting-type');
            const settingValue = e.target.getAttribute('data-setting-value');

            if (settingType === 'speed') {
                const speedValue = Number(settingValue);
                if (speedValue) {
                    VIDEO_ELEMENT.playbackRate = speedValue;
                    const settingValueElement = SETTING_TYPES.querySelector(`[data-type="speed"]>p:last-child`);
                    if (settingValueElement) settingValueElement.textContent = speedValue + 'x';
                    backSetting();
                }
            }

            if (settingType === 'source') {
                const source = config.sources.find(source => source.label === settingValue);

                const currentTime = VIDEO_ELEMENT.currentTime;
                const currentPaused = VIDEO_ELEMENT.paused;
                const currentSpeed = VIDEO_ELEMENT.playbackRate;

                VIDEO_ELEMENT.pause();
                VIDEO_ELEMENT.src = source.src;
                VIDEO_ELEMENT.playbackRate = currentSpeed;
                VIDEO_ELEMENT.currentTime = currentTime;
                if (!currentPaused) VIDEO_ELEMENT.play();
                const settingValueElement = SETTING_TYPES.querySelector(`[data-type="source"]>p:last-child`);
                if (settingValueElement) settingValueElement.textContent = source.label;
                backSetting();
            }
        }
    });

    window.addEventListener('pointerdown', function (e) {
        if (SETTING_BUTTON.contains(e.target)) return;
        if (!SETTING_CONTAINER.contains(e.target)) {
            SETTING_CONTAINER.classList.add('hide');
        }
    });

    window.addEventListener('keydown', (e) => {
        if (IGNORE_FOCUS_ELEMENTS.includes(e.target.tagName)) return;
        if (e.target.role === 'textbox') return;
        if (e.ctrlKey) return;
        if (e.code === 'ArrowRight') {
            forward();
        }
        if (e.code === 'ArrowLeft') {
            backward();
        }
        if (e.code === 'Space') {
            playOrPauseVideo();
        }
    });

    return PLAYER_ELEMENT;
}