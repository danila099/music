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
    const player = document.querySelector('.player');
    if (!player) {
        console.log('Плеер не найден на этой странице');
        return;
    }
    
    const playPauseBtn = player.querySelector('.play-pause-btn');
    const progressBar = player.querySelector('.progress-bar');
    const progressFill = player.querySelector('.progress-fill');
    
    if (!playPauseBtn || !progressBar || !progressFill) {
        console.log('Элементы плеера не найдены');
        return;
    }
    
    console.log('Плеер инициализирован');
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
        if (!trackId) return;
        playTrack(trackId);
    }
    
    if (e.target.closest('.play-btn')) {
        const playlistId = e.target.closest('.playlist-card').dataset.playlistId;
        if (!playlistId) return;
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
    // Создаем элемент уведомления
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        </div>
        <button class="notification-close" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    // Добавляем стили для уведомлений, если их еще нет
    if (!document.getElementById('notification-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            .notification {
                position: fixed;
                top: 20px;
                right: 20px;
                background: white;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                padding: 16px;
                display: flex;
                align-items: center;
                gap: 12px;
                z-index: 10000;
                animation: slideInRight 0.3s ease;
                max-width: 400px;
            }
            
            .notification-success {
                border-left: 4px solid #4CAF50;
            }
            
            .notification-error {
                border-left: 4px solid #f44336;
            }
            
            .notification-info {
                border-left: 4px solid #2196F3;
            }
            
            .notification-content {
                display: flex;
                align-items: center;
                gap: 8px;
                flex: 1;
            }
            
            .notification-close {
                background: none;
                border: none;
                cursor: pointer;
                color: #666;
                padding: 4px;
            }
            
            .notification-close:hover {
                color: #333;
            }
            
            @keyframes slideInRight {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    document.body.appendChild(notification);
    
    // Автоматически удаляем уведомление через 5 секунд
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

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
    const trackElement = document.querySelector(`[data-track-id="${trackId}"]`);
    if (trackElement) {
        // Обновляем кнопку воспроизведения в overlay
        const overlayBtn = trackElement.querySelector('.track-overlay .play-track-btn');
        if (overlayBtn) {
            overlayBtn.innerHTML = isPlaying ? '<i class="fas fa-pause"></i>' : '<i class="fas fa-play"></i>';
    }
    
        // Обновляем кнопку воспроизведения в controls
        const controlBtn = trackElement.querySelector('.track-controls .play-btn');
        if (controlBtn) {
            controlBtn.innerHTML = isPlaying ? '<i class="fas fa-pause"></i>' : '<i class="fas fa-play"></i>';
        }
        
        // Добавляем/убираем класс playing для визуального эффекта
        if (isPlaying) {
            trackElement.classList.add('playing');
        } else {
            trackElement.classList.remove('playing');
        }
    }
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

// Глобальные переменные для управления аудио (синхронизированы с upload.js)
let currentAudio = null;
let currentTrack = null;
let isPlaying = false;

// Функция для переключения лайка
window.toggleLike = function(trackId, trackType) {
    const userId = document.body.getAttribute('data-user-id');
    if (!userId) {
        showNotification('Необходимо войти в систему для лайков', 'error');
        return;
    }
    
    fetch(`/api/tracks/${trackId}/like`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            track_type: trackType
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Обновляем UI кнопки лайка
            const likeBtn = document.querySelector(`[data-track-id="${trackId}"] .like-btn`);
            if (likeBtn) {
                if (data.liked) {
                    likeBtn.classList.add('liked');
                    likeBtn.innerHTML = '<i class="fas fa-heart"></i>';
                } else {
                    likeBtn.classList.remove('liked');
                    likeBtn.innerHTML = '<i class="far fa-heart"></i>';
                }
            }
            
            // Показываем уведомление
            showNotification(data.message, 'success');
        } else {
            showNotification(data.error || 'Ошибка обновления лайка', 'error');
        }
    })
    .catch(error => {
        console.error('Ошибка переключения лайка:', error);
        showNotification('Ошибка обновления лайка', 'error');
    });
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

// Функция для остановки радио
window.stopRadio = function() {
    console.log('Остановка радио');
    
    // Останавливаем радио если оно играет
    if (window.radioAudio) {
        window.radioAudio.pause();
        window.radioAudio = null;
    }
    
    // Скрываем глобальный плеер
    const globalPlayer = document.getElementById('global-player');
    if (globalPlayer) {
        globalPlayer.style.display = 'none';
    }
    
    showNotification('Радио остановлено', 'info');
};

// Функция для остановки всех типов аудио
window.stopAllAudio = function() {
    console.log('Остановка всех аудио');
    
    // Останавливаем пользовательские треки
    if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
        currentAudio = null;
    }
    
    // Останавливаем радио
    if (window.radioAudio) {
        window.radioAudio.pause();
        window.radioAudio = null;
    }
    
    // Сбрасываем состояние
    currentTrack = null;
    isPlaying = false;
    
    // Скрываем глобальный плеер
    const globalPlayer = document.getElementById('global-player');
    if (globalPlayer) {
        globalPlayer.style.display = 'none';
    }
    
    // Обновляем UI всех треков
    document.querySelectorAll('.track-item, .track-row').forEach(track => {
        const playBtn = track.querySelector('.play-btn, .play-track-btn, .play-track-btn-small');
        if (playBtn) {
            playBtn.innerHTML = '<i class="fas fa-play"></i>';
        }
        track.classList.remove('playing');
    });
    
    showNotification('Воспроизведение остановлено', 'info');
};

// Функция для переключения воспроизведения/паузы (глобальная)
window.togglePlayPause = function(trackId) {
    if (currentTrack && currentTrack.id === trackId) {
        if (isPlaying) {
            if (window.pauseUserTrack) {
                window.pauseUserTrack(trackId);
            }
        } else {
            if (window.resumeUserTrack) {
                window.resumeUserTrack(trackId);
            }
        }
    } else {
        if (window.playUserTrack) {
            window.playUserTrack(trackId);
        }
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
            const titleElement = trackElement.querySelector('.track-title, h4');
            const artistElement = trackElement.querySelector('.track-artist, p');
            
            if (titleElement) trackTitle.textContent = titleElement.textContent;
            if (artistElement) trackArtist.textContent = artistElement.textContent;
        }
    }
    
    // Показываем плеер
    if (globalPlayer) {
    globalPlayer.style.display = 'block';
    }
    
    // Обновляем кнопку воспроизведения
    if (playPauseBtn) {
        playPauseBtn.className = isPlaying ? 'fas fa-pause' : 'fas fa-play';
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

// Функция для переключения мута
window.toggleMute = function() {
    const volumeIcon = document.getElementById('volume-icon');
    const volumeSlider = document.getElementById('volume-slider');
    
    if (currentAudio) {
        if (currentAudio.volume > 0) {
            currentAudio.volume = 0;
            if (volumeSlider) volumeSlider.value = 0;
            if (volumeIcon) volumeIcon.className = 'fas fa-volume-mute';
        } else {
            currentAudio.volume = volumeSlider ? volumeSlider.value / 100 : 1;
            if (volumeIcon) volumeIcon.className = 'fas fa-volume-up';
        }
    }
    
    if (window.radioAudio) {
        if (window.radioAudio.volume > 0) {
            window.radioAudio.volume = 0;
            if (volumeSlider) volumeSlider.value = 0;
            if (volumeIcon) volumeIcon.className = 'fas fa-volume-mute';
        } else {
            window.radioAudio.volume = volumeSlider ? volumeSlider.value / 100 : 1;
            if (volumeIcon) volumeIcon.className = 'fas fa-volume-up';
        }
    }
};

// Инициализация слайдера громкости
document.addEventListener('DOMContentLoaded', function() {
    const volumeSlider = document.getElementById('volume-slider');
    if (volumeSlider) {
        volumeSlider.addEventListener('input', function() {
            const volume = this.value / 100;
            const volumeIcon = document.getElementById('volume-icon');
            
            // Применяем громкость к текущему аудио
            if (currentAudio) {
                currentAudio.volume = volume;
            }
            
            if (window.radioAudio) {
                window.radioAudio.volume = volume;
            }
            
            // Обновляем иконку
            if (volumeIcon) {
                if (volume === 0) {
                    volumeIcon.className = 'fas fa-volume-mute';
                } else if (volume < 0.5) {
                    volumeIcon.className = 'fas fa-volume-down';
                } else {
                    volumeIcon.className = 'fas fa-volume-up';
                }
            }
        });
    }
}); 