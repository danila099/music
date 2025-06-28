// Основной JavaScript файл для музыкального приложения

document.addEventListener('DOMContentLoaded', function() {
    // Инициализация приложения
    initPlayer();
    initSearch();
    initAnimations();
    initMobileMenu();
    initProgressBar();
});

// Инициализация плеера
function initPlayer() {
    const audio = new Audio();
    let isPlaying = false;
    let currentTrack = null;
    let currentProgress = 0;
    
    // Элементы управления
    const playBtn = document.getElementById('play-btn');
    const progressSlider = document.getElementById('progress-slider');
    const progressFill = document.getElementById('progress-fill');
    const currentTimeSpan = document.getElementById('current-time');
    const totalTimeSpan = document.getElementById('total-time-display');
    const volumeSlider = document.getElementById('volume-slider');
    
    if (!playBtn || !progressSlider || !progressFill) {
        console.warn('Элементы плеера не найдены');
        return;
    }
    
    // Функция обновления прогресса
    function updateProgress(progress) {
        if (progressFill) {
            progressFill.style.width = progress + '%';
        }
        if (progressSlider) {
            progressSlider.value = progress;
        }
    }
    
    // Функция воспроизведения
    function playAudio() {
        if (audio.src) {
            audio.play();
            isPlaying = true;
            playBtn.innerHTML = '<i class="fas fa-pause"></i>';
        }
    }
    
    // Функция паузы
    function pauseAudio() {
        audio.pause();
        isPlaying = false;
        playBtn.innerHTML = '<i class="fas fa-play"></i>';
    }
    
    // Функция перемотки
    function seekTo(percentage) {
        if (audio.duration) {
            audio.currentTime = (percentage / 100) * audio.duration;
        }
        
        // Здесь можно добавить логику для перемотки аудио
        console.log('Seek to:', percentage + '%');
    }
    
    // Инициализация прогресса
    updateProgress(currentProgress);
    
    // Обработчики событий
    if (playBtn) {
        playBtn.addEventListener('click', function() {
            if (isPlaying) {
                pauseAudio();
            } else {
                playAudio();
            }
        });
    }
    
    if (progressSlider) {
        progressSlider.addEventListener('input', function() {
            const percentage = this.value;
            updateProgress(percentage);
        });
        
        progressSlider.addEventListener('change', function() {
            seekTo(this.value);
        });
    }
    
    if (volumeSlider) {
        volumeSlider.addEventListener('input', function() {
            audio.volume = this.value / 100;
        });
    }
    
    // События аудио
    audio.addEventListener('timeupdate', function() {
        if (audio.duration) {
            const progress = (audio.currentTime / audio.duration) * 100;
            updateProgress(progress);
            currentTimeSpan.textContent = formatTime(audio.currentTime);
        }
    });
    
    audio.addEventListener('loadedmetadata', function() {
        totalTimeSpan.textContent = formatTime(audio.duration);
    });
    
    audio.addEventListener('ended', function() {
        isPlaying = false;
        playBtn.innerHTML = '<i class="fas fa-play"></i>';
        updateProgress(0);
    });
    
    // Глобальные функции для доступа из других скриптов
    window.playUserTrack = function(trackId) {
        console.log('Воспроизведение пользовательского трека:', trackId);
        
        // Если уже играет этот трек, ставим на паузу
        if (currentTrack && currentTrack.id === trackId && isPlaying) {
            pauseUserTrack(trackId);
            return;
        }
        
        // Если играет другой трек, останавливаем его
        if (currentAudio && currentTrack && currentTrack.id !== trackId) {
            currentAudio.pause();
            updateTrackUI(currentTrack.id, false);
        }
        
        // Извлекаем ID трека из строки "user_123"
        const actualTrackId = trackId.replace('user_', '');
        
        // Создаем новый аудио элемент для воспроизведения
        currentAudio = new Audio(`/play/user/${actualTrackId}`);
        currentTrack = { id: trackId, type: 'user' };
        
        // Загружаем сохраненный прогресс
        loadProgress(trackId, 'user');
        
        // Обработчики событий
        currentAudio.addEventListener('loadedmetadata', function() {
            console.log('Трек загружен:', currentAudio.duration);
            
            // Добавляем трек в историю прослушивания
            addToHistory(trackId, 'user', currentAudio.duration);
            
            // Обновляем статистику
            updateTrackStatistics(trackId, 'user');
        });
        
        currentAudio.addEventListener('timeupdate', function() {
            // Сохраняем прогресс каждые 5 секунд
            if (Math.floor(currentAudio.currentTime) % 5 === 0) {
                const progress = (currentAudio.currentTime / currentAudio.duration) * 100;
                saveProgress(trackId, 'user', progress);
                
                // Обновляем прогресс в UI
                updateTrackProgress(trackId, progress);
            }
        });
        
        currentAudio.addEventListener('ended', function() {
            saveProgress(trackId, 'user', 0); // Сбрасываем прогресс
            updateTrackProgress(trackId, 0);
            isPlaying = false;
            updateTrackUI(trackId, false);
            currentAudio = null;
            currentTrack = null;
        });
        
        currentAudio.addEventListener('play', function() {
            isPlaying = true;
            updateTrackUI(trackId, true);
            updatePlayer(trackId, 'user');
        });
        
        currentAudio.addEventListener('pause', function() {
            isPlaying = false;
            updateTrackUI(trackId, false);
        });
        
        // Воспроизводим трек
        currentAudio.play().catch(error => {
            console.error('Ошибка воспроизведения:', error);
            showNotification('Ошибка воспроизведения трека', 'error');
            isPlaying = false;
            updateTrackUI(trackId, false);
        });
    };
    
    window.playRadio = function(stationId, stationName, streamUrl) {
        console.log('Воспроизведение радио:', stationName);
        
        // Останавливаем текущее воспроизведение
        if (isPlaying) {
            pauseAudio();
        }
        
        // Устанавливаем источник радио
        audio.src = streamUrl;
        
        // Воспроизводим
        playAudio();
        
        // Обновляем информацию в плеере
        updatePlayerInfo(stationId, 'radio', stationName);
        
        // Сохраняем текущий трек
        currentTrack = { id: stationId, type: 'radio' };
        
        // Показываем уведомление
        showNotification(`Радио: ${stationName}`, 'success');
    };
}

// Инициализация поиска
function initSearch() {
    const searchInput = document.querySelector('.search-input');
    
    if (searchInput) {
        // Автозаполнение поиска
        searchInput.addEventListener('input', function() {
            const query = this.value.trim();
            
            if (query.length > 2) {
                // Здесь можно добавить живой поиск
                console.log('Searching for:', query);
            }
        });
        
        // Анимация при фокусе
        searchInput.addEventListener('focus', function() {
            this.parentElement.style.transform = 'scale(1.02)';
        });
        
        searchInput.addEventListener('blur', function() {
            this.parentElement.style.transform = 'scale(1)';
        });
    }
}

// Показать подсказки поиска
function showSearchSuggestions(query) {
    // Создаем подсказки на основе запроса
    const suggestions = [
        'Кино - Кукушка',
        'Сплин - Выхода нет',
        'Little Big - Танцы',
        'Би-2 - Полковнику никто не пишет',
        'ДДТ - Что такое осень'
    ].filter(item => item.toLowerCase().includes(query));
    
    // Здесь можно создать выпадающий список с подсказками
    console.log('Подсказки:', suggestions);
}

// Скрыть подсказки поиска
function hideSearchSuggestions() {
    // Скрыть выпадающий список
}

// Инициализация анимаций
function initAnimations() {
    // Анимация появления элементов при скролле
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);
    
    // Наблюдаем за карточками плейлистов и исполнителей
    document.querySelectorAll('.playlist-card, .artist-card, .action-card').forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        card.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
        observer.observe(card);
    });
}

// Инициализация мобильного меню
function initMobileMenu() {
    const sidebar = document.querySelector('.sidebar');
    const mainContent = document.querySelector('.main-content');
    
    // Добавляем кнопку мобильного меню
    const mobileMenuBtn = document.createElement('button');
    mobileMenuBtn.className = 'mobile-menu-btn';
    mobileMenuBtn.innerHTML = '<i class="fas fa-bars"></i>';
    mobileMenuBtn.style.cssText = `
        position: fixed;
        top: 20px;
        left: 20px;
        z-index: 1001;
        width: 40px;
        height: 40px;
        border: none;
        border-radius: 50%;
        background: #ff6b6b;
        color: white;
        cursor: pointer;
        display: none;
    `;
    
    document.body.appendChild(mobileMenuBtn);
    
    // Показать/скрыть мобильное меню
    mobileMenuBtn.addEventListener('click', function() {
        sidebar.classList.toggle('open');
    });
    
    // Скрыть меню при клике вне его
    document.addEventListener('click', function(e) {
        if (!sidebar.contains(e.target) && !mobileMenuBtn.contains(e.target)) {
            sidebar.classList.remove('open');
        }
    });
    
    // Адаптивность
    function checkMobile() {
        if (window.innerWidth <= 768) {
            mobileMenuBtn.style.display = 'block';
            sidebar.classList.remove('open');
        } else {
            mobileMenuBtn.style.display = 'none';
            sidebar.classList.remove('open');
        }
    }
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
}

// Функции для работы с треками
function playTrack(trackId) {
    console.log('Воспроизведение трека:', trackId);
    // Здесь можно добавить логику воспроизведения конкретного трека
}

function addToFavorites(trackId) {
    console.log('Добавление в избранное:', trackId);
    // Здесь можно добавить логику добавления в избранное
}

// Функции для работы с плейлистами
function createPlaylist(name) {
    console.log('Создание плейлиста:', name);
    // Здесь можно добавить логику создания плейлиста
}

function addToPlaylist(trackId, playlistId) {
    console.log('Добавление трека в плейлист:', trackId, playlistId);
    // Здесь можно добавить логику добавления трека в плейлист
}

// Утилиты
function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Обработчики событий для кнопок воспроизведения
document.addEventListener('click', function(e) {
    if (e.target.closest('.play-track-btn')) {
        const trackId = e.target.closest('.track-item').dataset.trackId;
        playTrack(trackId);
    }
    
    if (e.target.closest('.play-btn')) {
        const playlistId = e.target.closest('.playlist-card').dataset.playlistId;
        console.log('Воспроизведение плейлиста:', playlistId);
    }
});

// Добавляем обработчики для карточек
document.querySelectorAll('.playlist-card').forEach((card, index) => {
    card.dataset.playlistId = index + 1;
});

document.querySelectorAll('.track-item').forEach((item, index) => {
    item.dataset.trackId = index + 1;
});

// Инициализация прогресс-бара
function initProgressBar() {
    const progressFill = document.querySelector('.player-progress .progress-fill');
    
    if (progressFill) {
        // Симуляция прогресса воспроизведения
        let progress = 0;
        setInterval(() => {
            progress += 0.1;
            if (progress > 100) progress = 0;
            progressFill.style.width = progress + '%';
        }, 1000);
    }
}

// Сохранение прогресса воспроизведения
function saveProgress(trackId, trackType, progress) {
    fetch('/api/save_progress', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            track_id: trackId,
            track_type: trackType,
            progress: progress
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            console.log('Прогресс сохранен');
        }
    })
    .catch(error => {
        console.error('Ошибка сохранения прогресса:', error);
    });
}

// Загрузка прогресса воспроизведения
function loadProgress(trackId, trackType) {
    fetch(`/api/get_progress/${trackType}/${trackId}`)
    .then(response => response.json())
    .then(data => {
        if (data.progress > 0) {
            console.log('Загружен прогресс:', data.progress + '%');
            // Здесь можно установить позицию воспроизведения
        }
    })
    .catch(error => {
        console.error('Ошибка загрузки прогресса:', error);
    });
}

// Обновление информации в плеере
function updatePlayerInfo(trackId, trackType, customName = null) {
    const playerTrackInfo = document.querySelector('.player-track-info');
    const trackElement = document.querySelector(`[data-track-id="${trackId}"]`);
    
    if (playerTrackInfo) {
        if (trackType === 'radio' && customName) {
            // Для радио
            playerTrackInfo.querySelector('h4').textContent = customName;
            playerTrackInfo.querySelector('p').textContent = 'Радио';
            playerTrackInfo.querySelector('img').src = 'https://via.placeholder.com/60x60/4facfe/ffffff?text=Р';
        } else if (trackElement) {
            // Для обычных треков
            const title = trackElement.querySelector('h4').textContent;
            const artist = trackElement.querySelector('p').textContent;
            const img = trackElement.querySelector('img').src;
            
            playerTrackInfo.querySelector('h4').textContent = title;
            playerTrackInfo.querySelector('p').textContent = artist;
            playerTrackInfo.querySelector('img').src = img;
        }
    }
}

// Показ уведомлений
function showNotification(message, type = 'info') {
    // Создаем уведомление
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;
    
    // Добавляем стили
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#4caf50' : type === 'error' ? '#f44336' : '#2196f3'};
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        z-index: 10000;
        display: flex;
        align-items: center;
        gap: 10px;
        animation: slideIn 0.3s ease-out;
        max-width: 300px;
    `;
    
    document.body.appendChild(notification);
    
    // Удаляем через 4 секунды
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 300);
    }, 4000);
}

// Добавляем CSS анимации для уведомлений
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
    
    @keyframes pulse {
        0%, 100% {
            transform: scale(1);
        }
        50% {
            transform: scale(1.05);
        }
    }
`;
document.head.appendChild(style);

// Обработчик закрытия страницы
window.addEventListener('beforeunload', function() {
    if (window.currentAudio) {
        window.currentAudio.pause();
    }
});

// Обработчик потери фокуса (пауза при переключении вкладок)
document.addEventListener('visibilitychange', function() {
    if (document.hidden && window.currentAudio) {
        // Можно добавить автоматическую паузу при переключении вкладок
        // window.currentAudio.pause();
    }
});

// Функция для обновления плеера при воспроизведении радио
function updatePlayerWithRadio(stationName) {
    const playerTitle = document.getElementById('player-title');
    const playerArtist = document.getElementById('player-artist');
    const playerCover = document.getElementById('player-cover');
    
    if (playerTitle) playerTitle.textContent = stationName;
    if (playerArtist) playerArtist.textContent = 'Радио';
    if (playerCover) playerCover.src = 'https://via.placeholder.com/60x60/4facfe/ffffff?text=Р';
}

// Глобальные функции для доступа из других скриптов
window.updatePlayerWithRadio = updatePlayerWithRadio;
window.showNotification = showNotification;

// Функция для обновления прогресса трека в UI
function updateTrackProgress(trackId, progress) {
    const progressFill = document.querySelector(`[data-track-id="${trackId}"] .progress-fill`);
    if (progressFill) {
        progressFill.style.width = `${progress}%`;
    }
}

// Функция для обновления UI трека
function updateTrackUI(trackId, isPlaying) {
    // Обновляем кнопки в списке треков
    const playBtn = document.querySelector(`[data-track-id="${trackId}"] .play-btn`);
    if (playBtn) {
        const icon = playBtn.querySelector('i');
        if (isPlaying) {
            playBtn.classList.add('playing');
            icon.className = 'fas fa-pause';
        } else {
            playBtn.classList.remove('playing');
            icon.className = 'fas fa-play';
        }
    }
    
    // Обновляем кнопку в глобальном плеере
    const globalPlayBtn = document.querySelector('.play-pause-btn i');
    if (globalPlayBtn) {
        if (isPlaying) {
            globalPlayBtn.className = 'fas fa-pause';
        } else {
            globalPlayBtn.className = 'fas fa-play';
        }
    }
}

// Функция для паузы трека
function pauseUserTrack(trackId) {
    console.log('Пауза трека:', trackId);
    // Здесь можно добавить логику паузы
    updateTrackUI(trackId, false);
}

// Функция для добавления трека в историю
function addToHistory(trackId, trackType, duration) {
    fetch('/api/add_to_history', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            track_id: trackId,
            track_type: trackType,
            duration: duration
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            console.log('Трек добавлен в историю');
        }
    })
    .catch(error => {
        console.error('Ошибка добавления в историю:', error);
    });
}

// Функция для обновления статистики трека
function updateTrackStatistics(trackId, trackType) {
    fetch(`/api/statistics/${trackType}/${trackId}`)
    .then(response => response.json())
    .then(data => {
        console.log('Статистика трека:', data);
        // Здесь можно обновить UI со статистикой
    })
    .catch(error => {
        console.error('Ошибка получения статистики:', error);
    });
}

// Функция для переключения лайка
window.toggleLike = function(trackId, trackType) {
    fetch('/api/toggle_like', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            track_id: trackId,
            track_type: trackType
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success !== undefined) {
            const likeBtn = document.querySelector(`[data-track-id="${trackId}"][data-track-type="${trackType}"] .like-btn`);
            if (likeBtn) {
                if (data.liked) {
                    likeBtn.classList.add('liked');
                } else {
                    likeBtn.classList.remove('liked');
                }
            }
            
            // Обновляем счетчик лайков
            const likeCount = document.querySelector(`[data-track-id="${trackId}"][data-track-type="${trackType}"] .like-count .count`);
            if (likeCount) {
                likeCount.textContent = data.like_count || 0;
            }
        }
    })
    .catch(error => {
        console.error('Ошибка переключения лайка:', error);
    });
};

// Глобальные переменные для управления аудио
let currentAudio = null;
let currentTrack = null;
let isPlaying = false;

// Функция для возобновления воспроизведения
window.resumeUserTrack = function(trackId) {
    console.log('Возобновление трека:', trackId);
    
    if (currentAudio && currentTrack && currentTrack.id === trackId && !isPlaying) {
        currentAudio.play().catch(error => {
            console.error('Ошибка возобновления:', error);
            showNotification('Ошибка возобновления трека', 'error');
        });
    }
};

// Функция для остановки трека
window.stopUserTrack = function(trackId) {
    console.log('Остановка трека:', trackId);
    
    if (currentAudio && currentTrack && currentTrack.id === trackId) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
        isPlaying = false;
        updateTrackUI(trackId, false);
        saveProgress(trackId, 'user', 0);
        updateTrackProgress(trackId, 0);
    }
};

// Функция для переключения воспроизведения/паузы
window.togglePlayPause = function(trackId) {
    if (currentTrack && currentTrack.id === trackId) {
        if (isPlaying) {
            pauseUserTrack(trackId);
        } else {
            resumeUserTrack(trackId);
        }
    } else {
        playUserTrack(trackId);
    }
};

// Функция для обновления глобального плеера
function updatePlayer(trackId, trackType) {
    const globalPlayer = document.getElementById('global-player');
    const trackTitle = document.getElementById('player-track-title');
    const trackArtist = document.getElementById('player-track-artist');
    const playPauseBtn = document.querySelector('.play-pause-btn i');
    
    if (trackType === 'user') {
        // Получаем информацию о треке из DOM
        const trackElement = document.querySelector(`[data-track-id="${trackId}"]`);
        if (trackElement) {
            const titleElement = trackElement.querySelector('.track-title');
            const artistElement = trackElement.querySelector('.track-artist');
            
            if (titleElement) trackTitle.textContent = titleElement.textContent;
            if (artistElement) trackArtist.textContent = artistElement.textContent;
        }
    }
    
    // Показываем плеер
    globalPlayer.style.display = 'block';
    
    // Обновляем кнопку воспроизведения
    if (playPauseBtn) {
        playPauseBtn.className = 'fas fa-pause';
    }
    
    // Настраиваем управление громкостью
    setupVolumeControl();
    
    // Настраиваем обновление времени
    setupTimeUpdate();
}

// Функция для настройки управления громкостью
function setupVolumeControl() {
    const volumeSlider = document.getElementById('volume-slider');
    if (volumeSlider && currentAudio) {
        volumeSlider.addEventListener('input', function() {
            currentAudio.volume = this.value / 100;
        });
    }
}

// Функция для настройки обновления времени
function setupTimeUpdate() {
    if (currentAudio) {
        const updateTime = () => {
            const currentTimeEl = document.getElementById('current-time');
            const totalTimeEl = document.getElementById('total-time');
            const progressFill = document.getElementById('player-progress-fill');
            
            if (currentTimeEl) {
                currentTimeEl.textContent = formatTime(currentAudio.currentTime);
            }
            if (totalTimeEl) {
                totalTimeEl.textContent = formatTime(currentAudio.duration);
            }
            if (progressFill) {
                const progress = (currentAudio.currentTime / currentAudio.duration) * 100;
                progressFill.style.width = `${progress}%`;
            }
        };
        
        currentAudio.addEventListener('timeupdate', updateTime);
    }
}

// Функция для форматирования времени
function formatTime(seconds) {
    if (isNaN(seconds)) return '0:00';
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

// Функции для перемотки
window.skipForward = function() {
    if (currentAudio) {
        currentAudio.currentTime = Math.min(currentAudio.currentTime + 10, currentAudio.duration);
    }
};

window.skipBackward = function() {
    if (currentAudio) {
        currentAudio.currentTime = Math.max(currentAudio.currentTime - 10, 0);
    }
}; 