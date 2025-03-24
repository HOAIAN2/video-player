/**
 * Author: Lê Hoài Ân an69tm@gmail.com
 * Description: Custom Video Player with enhanced controls.
 */

/**
 * Creates a custom video player with controls including play, pause, skip, fullscreen, and progress tracking.
 * 
 * @param {Object} config - Configuration options for the player.
 * @param {Array<{src:string,label:string}>} [config.sources] - The source URL of the video.
 * @param {string} [config.poster] - Video poster.
 * @param {number} [config.skipSeconds=5] - Number of seconds to skip forward or backward.
 * @param {number} [config.autoHideControllerAfter=3000] - Time in milliseconds before the controller hides automatically.
 * @param {boolean} [config.forceLandscape=true] - Auto rotate to landscape when active fullscreen.
 * @param {boolean} [config.enablePIP=true] - Show PIP button.
 * @param {number} [config.defaultVolume=1] - Default video volume.
 * @param {number} [config.defaultTime=1] - Default video current time of video.
 * @param {Array<number>}[config.speedSettings] -List of speed setting, eg: 0.5,1,1.5,2
 * @param {{source:string,speed:string,caption:string,off:string}}[config.settingLabels] - Custom labels for settings.
 * @param  {Array<{src:string,srclang:string,default:boolean}>} [config.captions] - Captions /subtitles in *.vtt format
 * @returns {DocumentFragment} - The player element containing the video and custom controls.
 */
function createVideoPlayer(config = {}) {
    const defaultSettingLabels = {
        source: 'Source',
        speed: 'Speed',
        caption: 'Captions',
        off: 'Off',
    };
    const {
        sources = [],
        poster = undefined,
        skipSeconds = 5,
        autoHideControllerAfter = 3000,
        forceLandscape = true,
        enablePIP = true,
        defaultVolume = 1,
        defaultTime = 0,
        speedSettings = [0.5, 1, 1.5, 2],
        settingLabels: settingLabelsParam = {},
        captions = [],
    } = config;
    const settingLabels = { ...defaultSettingLabels, ...settingLabelsParam, };
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
    function debounce(func, delay) {
        let timeout;
        function debounced(...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => { func(...args); }, delay);
        }
        debounced.cancel = () => {
            clearTimeout(timeout);
        };
        return debounced;
    }

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
    const PIP_SVG =
        `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" fill="none"
            stroke-width="8" stroke-linecap="round" stroke-linejoin="round">
            <rect x="10" y="20" width="80" height="60" rx="5" ry="5" fill="none" />
            <rect x="45" y="45" width="30" height="20" rx="2" ry="2" />
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
            <rect x="5" y="5" width="90" height="90" rx="10" fill="none" stroke="currentColor" stroke-width="5"></rect>
            <rect x="20" y="25" width="60" height="6" rx="2" fill="currentColor"></rect>
            <rect x="20" y="48" width="60" height="6" rx="2" fill="currentColor"></rect>
            <rect x="20" y="70" width="60" height="6" rx="2" fill="currentColor"></rect>
            <circle cx="50" cy="28" r="5" fill="currentColor"></circle>
            <circle cx="30" cy="51" r="5" fill="currentColor"></circle>
            <circle cx="60" cy="73" r="5" fill="currentColor"></circle>
        </svg>`;
    const CAPTION_SVG =
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
            <rect x="10" y="25" width="80" height="60" rx="8" fill="none" stroke="currentColor" stroke-width="5"></rect>
            <rect x="20" y="40" width="25" height="8" rx="2" fill="currentColor"></rect>
            <rect x="55" y="40" width="25" height="8" rx="2" fill="currentColor"></rect>
            <rect x="20" y="60" width="15" height="8" rx="2" fill="currentColor"></rect>
            <rect x="40" y="60" width="40" height="8" rx="2" fill="currentColor"></rect>
        </svg>`;
    const BACK_SVG =
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none" stroke-width="8" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="60,20 30,50 60,80"/>
        </svg>`;

    const speedSettingsHTML = speedSettings.map(setting => {
        return (
            `
            <div class="setting-value" data-setting-type="speed" data-setting-value="${setting}" >
                ${setting}x
            </div>
            `
        );
    }).join('');
    const sourceSettingsHTML = sources.map(source => {
        return (
            `
            <div class="setting-value" data-setting-type="source" data-setting-value="${source.label}">
                ${source.label}
            </div>
            `
        );
    }).join('');
    const captionSettingsHTML =
        `<div class="setting-value" data-setting-type="caption" data-setting-value="">${settingLabels.off || ''}</div>
            ${captions.map(caption => {
            const label = new Intl.DisplayNames([caption.srclang], { type: 'language' }).of(caption.srclang);
            return (
                `<div class="setting-value" data-setting-type="caption" data-setting-value="${caption.srclang}">
                    ${label}
                </div>`
            );
        }).join('')}`;

    const tracksHTML = captions.map(caption => {
        const label = new Intl.DisplayNames([caption.srclang], {
            type: 'language'
        }).of(caption.srclang);
        return (
            `<track
                label="${label}"
                kind="subtitles"
                srclang="${caption.srclang}"
                src="${caption.src}"
                ${caption.default ? 'default' : ''}
             />`
        );
    }).join('');

    const defaultCaption = captions.find(caption => caption.default);
    let defaultLanguageLabel = '';
    if (defaultCaption) {
        defaultLanguageLabel = new Intl.DisplayNames([defaultCaption?.srclang], {
            type: 'language'
        }).of(defaultCaption.srclang);
    }

    const PLAYER_ELEMENT = createElement(
        `
        <div class="player-container">
            <div class="setting-container hide">
                <div class="setting-types">
                    <div data-type="speed">
                        ${PLAY_SPEED_SVG}
                        <p>${settingLabels.speed || ''}</p>
                        <p>1x</p>
                    </div>
                    <div data-type="source">
                        ${SOURCE_SVG}
                        <p>${settingLabels.source || ''}</p>
                        <p>${sources[0].label}</p>
                    </div>
                    <div data-type="caption">
                        ${CAPTION_SVG}
                        <p>${settingLabels.caption || ''}</p>
                        <p>${defaultCaption ? defaultLanguageLabel : settingLabels.off || ''}</p>
                    </div>
                </div>
                <div class="setting-content hide">
                    <div class="setting-content-back"></div>
                    <div class="setting-values">
                        <!-- Replace children here -->
                    </div>
                </div>
            </div>
            <div class="action-overlay"></div>
            <div class="loading-spinner"></div>
            <video class="player-video" src="${sources[0].src}" tabindex="-1" ${poster ? `poster="${poster}"` : ''}>
                ${tracksHTML}
            </video>
            <div class="player-controller hide">
                <div class="hover-time hide"></div>
                <div class="wrap-buttons">
                    <div class="player-controller-progress-overlay">
                        <div class="player-controller-progress-background"></div>
                        <div class="player-controller-progress"></div>
                    </div>
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
                            ${enablePIP ? `<button title="picture in picture" type="button" class="button-pip">${PIP_SVG}</button>` : ''}
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
    const LOADING_SPINNER = PLAYER_ELEMENT.querySelector('.loading-spinner');
    const VIDEO_ELEMENT = PLAYER_ELEMENT.querySelector('video');

    const PLAY_BUTTON = PLAYER_ELEMENT.querySelector('.button-play');
    const VOLUME_BUTTON = PLAYER_ELEMENT.querySelector('.button-volume');
    const VOLUME_INPUT = PLAYER_ELEMENT.querySelector('.volume-master>input');
    const FORWARD_BUTTON = PLAYER_ELEMENT.querySelector('.button-forward');
    const BACKWARD_BUTTON = PLAYER_ELEMENT.querySelector('.button-backward');
    const SETTING_BUTTON = PLAYER_ELEMENT.querySelector('.button-setting');
    const PIP_BUTTON = PLAYER_ELEMENT.querySelector('.button-pip');
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
    const hideControllerDebounce = debounce(() => {
        PLAYER_CONTROLLER.classList.add('hide');
    }, autoHideControllerAfter);
    function toggleFullScreen() {
        if (document.fullscreenElement == PLAYER_CONTAINER) {
            document.exitFullscreen();
        }
        else {
            PLAYER_CONTAINER.requestFullscreen();

            if (forceLandscape && screen.orientation && screen.orientation.lock) {
                screen.orientation.lock('landscape').catch((err) => {
                    console.error('Failed to lock orientation:', err);
                });
            }
        }
    }
    function forward() {
        VIDEO_ELEMENT.currentTime += skipSeconds;
        PLAYER_PROGRESS.style.transform = `scaleX(${VIDEO_ELEMENT.currentTime / VIDEO_ELEMENT.duration})`;
        showAction(FORWARD_SVG);
    };
    function backward() {
        VIDEO_ELEMENT.currentTime -= skipSeconds;
        PLAYER_PROGRESS.style.transform = `scaleX(${VIDEO_ELEMENT.currentTime / VIDEO_ELEMENT.duration})`;
        showAction(BACKWARD_SVG);
    };
    function playOrPauseVideo() {
        if (VIDEO_ELEMENT.readyState < 3) { // 3 means "can play"
            console.log('Cannot play, video is still buffering...');
            return;
        }
        if (VIDEO_ELEMENT.paused) {
            VIDEO_ELEMENT.play()
                .then(() => {
                    showAction(PLAY_SVG);
                })
                .catch((e) => {
                    console.log(e);
                });
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
    function handleHideSetting(e) {
        if (!document.body.contains(PLAYER_CONTAINER)) {
            return document.removeEventListener('pointerdown', handleHideSetting);
        }
        if (SETTING_BUTTON.contains(e.target)) return;
        if (!SETTING_CONTAINER.contains(e.target)) {
            SETTING_CONTAINER.classList.add('hide');
        }
    }
    function handleKeyDownEvents(e) {
        if (!document.body.contains(PLAYER_CONTAINER)) {
            return window.removeEventListener('keydown', handleKeyDownEvents);
        }
        if (document.activeElement !== VIDEO_ELEMENT) return;
        e.preventDefault();
        if (e.code === 'ArrowRight') {
            forward();
        }
        if (e.code === 'ArrowLeft') {
            backward();
        }
        if (e.code === 'ArrowUp') {
            if (VIDEO_ELEMENT.volume >= 0.95) VIDEO_ELEMENT.volume = 1;
            else VIDEO_ELEMENT.volume += .05;
        }
        if (e.code === 'ArrowDown') {
            if (VIDEO_ELEMENT.volume <= 0.05) VIDEO_ELEMENT.volume = 0;
            else VIDEO_ELEMENT.volume -= .05;
        }
        if (e.code === 'Space') {
            playOrPauseVideo();
        }
    }
    function switchCaption(langCode) {
        const tracks = VIDEO_ELEMENT.textTracks;
        for (let i = 0; i < tracks.length; i++) {
            tracks[i].mode = tracks[i].language === langCode ? 'showing' : 'hidden';
        }
    }
    function disableCaption() {
        const tracks = VIDEO_ELEMENT.textTracks;
        for (let i = 0; i < tracks.length; i++) {
            tracks[i].mode = 'hidden';
        }
    }
    const seekingDebounce = debounce((time) => {
        VIDEO_ELEMENT.currentTime = time;
    }, 300);

    VIDEO_ELEMENT.volume = defaultVolume;
    VIDEO_ELEMENT.currentTime = defaultTime;

    PLAYER_CONTAINER.addEventListener('pointermove', (e) => {
        PLAYER_CONTROLLER.classList.remove('hide');
        hideControllerDebounce();
    });

    PLAYER_CONTAINER.addEventListener('pointerdown', (e) => {
        PLAYER_CONTROLLER.classList.remove('hide');
        hideControllerDebounce();
    });

    PLAYER_CONTAINER.addEventListener('pointerleave', (e) => {
        if (e.pointerType !== 'mouse') return;
        PLAYER_CONTROLLER.classList.add('hide');
    });

    PLAYER_CONTAINER.addEventListener('pointerover', (e) => {
        if (PLAYER_PROGRESS_OVERLAY.contains(e.target)) {
            HOVER_TIME.classList.remove('hide');
        }
        else {
            HOVER_TIME.classList.add('hide');
        }
    });

    PLAYER_PROGRESS_OVERLAY.addEventListener('pointermove', (e) => {
        if (!VIDEO_ELEMENT.duration) return;
        const rect = PLAYER_PROGRESS_OVERLAY.getBoundingClientRect();
        const offsetX = e.clientX - rect.left;
        const width = rect.width;
        const percent = (offsetX / width);
        if (percent >= 0 && percent <= 1) {
            HOVER_TIME.textContent = toHHMMSS(percent * VIDEO_ELEMENT.duration);
            const left = offsetX + (rect.width * 0.02);
            const minLeft = width * 0.02 + HOVER_TIME.getBoundingClientRect().width * 0.5;
            const maxLeft = width + width * 0.02 - HOVER_TIME.getBoundingClientRect().width * 0.5;
            if (left < minLeft) {
                HOVER_TIME.style.left = minLeft + 'px';
            }
            else if (left > maxLeft) {
                HOVER_TIME.style.left = maxLeft + 'px';
            }
            else {
                HOVER_TIME.style.left = left + 'px';
            }
        }
    });

    PLAY_BUTTON.addEventListener('pointerdown', (e) => {
        if (e.pointerType === 'mouse' && e.button === 2) return;
        playOrPauseVideo();
    });

    VOLUME_BUTTON.addEventListener('pointerdown', (e) => {
        if (e.pointerType === 'mouse' && e.button === 2) return;
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
        if (e.pointerType === 'mouse' && e.button === 2) return;
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

    VIDEO_ELEMENT.addEventListener('waiting', () => {
        setTimeout(() => {
            if (VIDEO_ELEMENT.readyState < 3) {
                LOADING_SPINNER.style.display = 'block';
            }
        }, 500);
    });

    VIDEO_ELEMENT.addEventListener('canplaythrough', () => {
        LOADING_SPINNER.style.display = 'none';
    });

    // Handle progress bar
    PLAYER_PROGRESS_OVERLAY.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        if (e.pointerType === 'mouse' && e.button === 2) return;

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
                HOVER_TIME.textContent = toHHMMSS(percent * VIDEO_ELEMENT.duration);
                const left = offsetX + (rect.width * 0.02);
                const minLeft = width * 0.02 + HOVER_TIME.getBoundingClientRect().width * 0.5;
                const maxLeft = width + width * 0.02 - HOVER_TIME.getBoundingClientRect().width * 0.5;
                if (left < minLeft) {
                    HOVER_TIME.style.left = minLeft + 'px';
                }
                else if (left > maxLeft) {
                    HOVER_TIME.style.left = maxLeft + 'px';
                }
                else {
                    HOVER_TIME.style.left = left + 'px';
                }
                seekingDebounce(percent * VIDEO_ELEMENT.duration);
            }
        }
        updateProgress(e);
        document.addEventListener('pointermove', handlePointerMove);
        document.addEventListener('pointerup', (e) => {
            e.preventDefault();
            updateProgress(e);
            document.removeEventListener('pointermove', handlePointerMove);
            seekingDebounce.cancel();
            const rect = PLAYER_PROGRESS_OVERLAY.getBoundingClientRect();
            const offsetX = e.clientX - rect.left;
            const width = rect.width;
            const realTime = (offsetX / width) * VIDEO_ELEMENT.duration;
            VIDEO_ELEMENT.currentTime = realTime;
            HOVER_TIME.classList.add('hide');

            // Resume video if it was playing before
            if (wasPlaying) VIDEO_ELEMENT.play();
        }, { once: true, passive: false });
    });

    VIDEO_ELEMENT.addEventListener('loadeddata', () => {
        if (VIDEO_ELEMENT.duration) {
            VIDEO_TIMESTAMP.querySelector('p').textContent = `${toHHMMSS(VIDEO_ELEMENT.currentTime)} / ${toHHMMSS(VIDEO_ELEMENT.duration)}`;
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

    // This button can be null by pass "false" to "enablePIP" prop
    PIP_BUTTON?.addEventListener('pointerdown', (e) => {
        if (e.pointerType === 'mouse' && e.button === 2) return;
        if (document.pictureInPictureElement === VIDEO_ELEMENT) {
            document.exitPictureInPicture();
        }
        else {
            VIDEO_ELEMENT.requestPictureInPicture();
        }
    });

    FULLSCREEN_BUTTON.addEventListener('pointerdown', (e) => {
        if (e.pointerType === 'mouse' && e.button === 2) return;
        toggleFullScreen();
    });
    VIDEO_ELEMENT.addEventListener('dblclick', toggleFullScreen);

    FORWARD_BUTTON.addEventListener('pointerdown', (e) => {
        if (e.pointerType === 'mouse' && e.button === 2) return;
        forward();
    });
    BACKWARD_BUTTON.addEventListener('pointerdown', (e) => {
        if (e.pointerType === 'mouse' && e.button === 2) return;
        backward();
    });

    SETTING_BUTTON.addEventListener('pointerdown', (e) => {
        if (e.pointerType === 'mouse' && e.button === 2) return;
        SETTING_CONTAINER.classList.toggle('hide');
        const rect = PLAYER_CONTROLLER.getBoundingClientRect();
        SETTING_CONTAINER.style.bottom = `${rect.height + 10}px`;
        backSetting();
    });

    SETTING_CONTAINER.addEventListener('pointerdown', (e) => {
        if (e.pointerType === 'mouse' && e.button === 2) return;
        // Handle switch setting tab
        if (SETTING_TYPES.querySelector('[data-type="speed"]')?.contains(e.target)) {
            SETTING_TYPES.classList.add('hide');
            SETTING_CONTENT.classList.remove('hide');
            SETTING_VALUES.replaceChildren(createElement(speedSettingsHTML));
            BACK_SETTING_BUTTON.replaceChildren(createSVGElement(BACK_SVG), settingLabels.speed);
        }
        if (SETTING_TYPES.querySelector('[data-type="source"]')?.contains(e.target)) {
            SETTING_TYPES.classList.add('hide');
            SETTING_CONTENT.classList.remove('hide');
            SETTING_VALUES.replaceChildren(createElement(sourceSettingsHTML));
            BACK_SETTING_BUTTON.replaceChildren(createSVGElement(BACK_SVG), settingLabels.source);
        }
        if (SETTING_TYPES.querySelector('[data-type="caption"]')?.contains(e.target)) {
            SETTING_TYPES.classList.add('hide');
            SETTING_CONTENT.classList.remove('hide');
            SETTING_VALUES.replaceChildren(createElement(captionSettingsHTML));
            BACK_SETTING_BUTTON.replaceChildren(createSVGElement(BACK_SVG), settingLabels.caption);
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
                const source = sources.find(source => source.label === settingValue);

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

            if (settingType === 'caption') {
                const caption = captions.find(caption => caption.srclang === settingValue);
                const settingValueElement = SETTING_TYPES.querySelector(`[data-type="caption"]>p:last-child`);
                if (caption) {
                    switchCaption(caption.srclang);
                    const label = new Intl.DisplayNames([caption.srclang], {
                        type: 'language'
                    }).of(caption.srclang);
                    if (settingValueElement) settingValueElement.textContent = label;
                }
                else {
                    disableCaption();
                    if (settingValueElement) settingValueElement.textContent = settingLabels.off || '';
                }
                backSetting();
            }
        }
    });

    document.addEventListener('pointerdown', handleHideSetting);

    window.addEventListener('keydown', handleKeyDownEvents);

    return PLAYER_ELEMENT;
}