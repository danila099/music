// Глобальные переменные
let currentAudio = null;
let currentTrack = null;
let isPlaying = false;
let favorites = [];
let history = [];

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    loadHistory();
    loadFavorites();
    updateStatistics();
    
    // Обновляем каждые 30 секунд
    setInterval(() => {
        loadHistory();
        loadFavorites();
        updateStatistics();
    }, 30000);
});

// Загрузка истории прослушивания
async function loadHistory() {
    try {
        const response = await fetch('/api/history');
        const data = await response.json();
        history = data;
        displayHistory(data);
    } catch (error) {
        console.error('Ошибка загрузки истории:', error);
        showNotification('Ошибка загрузки истории', 'error');
    }
}

// Загрузка любимых треков
async function loadFavorites() {
    try {
        const response = await fetch('/api/favorites');
        const favoritesData = await response.json();
        
        favorites = favoritesData;
        displayFavorites(favoritesData);
    } catch (error) {
        console.error('Ошибка загрузки любимых треков:', error);
        showNotification('Ошибка загрузки любимых треков', 'error');
    }
}

// Проверка, лайкнут ли трек
async function checkIfLiked(trackId, trackType) {
    try {
        const response = await fetch(`/api/is_liked/${trackType}/${trackId}`);
        const data = await response.json();
        return data.liked;
    } catch (error) {
        console.error('Ошибка проверки лайка:', error);
        return false;
    }
}

// Отображение истории
function displayHistory(historyData) {
    const historyList = document.getElementById('history-list');
    const loading = document.getElementById('loading');
    const emptyHistory = document.getElementById('empty-history');
    
    // Скрываем загрузку
    if (loading) loading.style.display = 'none';
    
    if (!historyData || historyData.length === 0) {
        if (emptyHistory) emptyHistory.style.display = 'block';
        if (historyList) historyList.innerHTML = '';
        return;
    }
    
    if (emptyHistory) emptyHistory.style.display = 'none';
    
    if (historyList) {
        historyList.innerHTML = historyData.map(item => {
            const trackInfo = getTrackInfo(item.track_id, item.track_type);
            const playCount = item.play_count || 1;
            const totalDuration = formatDuration(item.total_duration || 0);
            const lastPlayed = formatDate(item.last_played);
            
            return `
                <div class="history-item" data-track-id="${item.track_id}" data-track-type="${item.track_type}">
                    <div class="history-item-info">
                        <div class="track-cover">
                            <i class="fas fa-music"></i>
                        </div>
                        <div class="track-details">
                            <h3 class="track-title">${trackInfo.title}</h3>
                            <p class="track-artist">${trackInfo.artist}</p>
                            <div class="track-meta">
                                <span><i class="fas fa-play"></i> ${playCount} раз</span>
                                <span><i class="fas fa-clock"></i> ${totalDuration}</span>
                                <span><i class="fas fa-calendar"></i> ${lastPlayed}</span>
                            </div>
                        </div>
                    </div>
                    <div class="history-item-actions">
                        <button class="btn-icon" onclick="playTrack('${item.track_type}', '${item.track_id}')" title="Воспроизвести">
                            <i class="fas fa-play"></i>
                        </button>
                        <button class="btn-icon like-btn" onclick="toggleLike('${item.track_type}', '${item.track_id}')" title="Добавить в любимые">
                            <i class="fas fa-heart"></i>
                        </button>
                    </div>
                </div>
            `;
        }).join('');
        
        // Обновляем состояние лайков
        updateLikeStates();
    }
}

// Отображение любимых треков
function displayFavorites(favoritesData) {
    const favoritesGrid = document.getElementById('favorites-grid');
    const favoritesCount = document.getElementById('favorites-count');
    
    if (favoritesCount) {
        favoritesCount.textContent = `${favoritesData.length} треков`;
    }
    
    if (favoritesGrid) {
        if (!favoritesData || favoritesData.length === 0) {
            favoritesGrid.innerHTML = `
                <div class="empty-state" style="grid-column: 1 / -1;">
                    <i class="fas fa-heart"></i>
                    <h3>Нет любимых треков</h3>
                    <p>Добавляйте треки в любимые, чтобы они появились здесь</p>
                </div>
            `;
            return;
        }
        
        favoritesGrid.innerHTML = favoritesData.map(track => {
            const source = track.type === 'playlist' ? `Плейлист: ${track.playlist_name}` : 'Ваша музыка';
            
            return `
                <div class="favorite-item" data-track-id="${track.id}" data-track-type="${track.type}">
                    <div class="favorite-item-header">
                        <div class="favorite-cover">
                            <i class="fas fa-music"></i>
                        </div>
                        <div class="favorite-details">
                            <h3>${track.title}</h3>
                            <p>${track.artist}</p>
                        </div>
                    </div>
                    <div class="favorite-actions">
                        <button class="btn-icon" onclick="playTrack('${track.type}', '${track.id}')" title="Воспроизвести">
                            <i class="fas fa-play"></i>
                        </button>
                        <button class="btn-icon like-btn liked" onclick="toggleLike('${track.type}', '${track.id}')" title="Удалить из любимых">
                            <i class="fas fa-heart"></i>
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }
}

// Получение информации о треке
function getTrackInfo(trackId, trackType) {
    if (trackType === 'user') {
        // Ищем в пользовательских треках
        const userTrack = history.find(h => h.track_type === 'user' && h.track_id === trackId);
        if (userTrack) {
            return {
                title: userTrack.title || 'Неизвестный трек',
                artist: userTrack.artist || 'Неизвестный исполнитель'
            };
        }
    } else if (trackType === 'playlist') {
        // Ищем в плейлистах
        const playlistTrack = history.find(h => h.track_type === 'playlist' && h.track_id === trackId);
        if (playlistTrack) {
            return {
                title: playlistTrack.title || 'Неизвестный трек',
                artist: playlistTrack.artist || 'Неизвестный исполнитель'
            };
        }
    }
    
    return {
        title: 'Неизвестный трек',
        artist: 'Неизвестный исполнитель'
    };
}

// Переключение лайка
async function toggleLike(trackType, trackId) {
    try {
        const response = await fetch('/api/toggle_like', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                track_id: trackId,
                track_type: trackType
            })
        });
        
        const data = await response.json();
        
        if (data.liked) {
            showNotification('Добавлено в любимые', 'success');
        } else {
            showNotification('Удалено из любимых', 'info');
        }
        
        // Обновляем отображение
        loadFavorites();
        updateLikeStates();
        
    } catch (error) {
        console.error('Ошибка переключения лайка:', error);
        showNotification('Ошибка при работе с любимыми', 'error');
    }
}

// Обновление состояния лайков
async function updateLikeStates() {
    const likeButtons = document.querySelectorAll('.like-btn');
    
    for (const button of likeButtons) {
        const trackId = button.closest('[data-track-id]').dataset.trackId;
        const trackType = button.closest('[data-track-type]').dataset.trackType;
        
        const isLiked = await checkIfLiked(trackId, trackType);
        
        if (isLiked) {
            button.classList.add('liked');
        } else {
            button.classList.remove('liked');
        }
    }
}

// Воспроизведение трека
function playTrack(trackType, trackId) {
    if (currentAudio) {
        currentAudio.pause();
        currentAudio = null;
    }
    
    const trackInfo = getTrackInfo(trackId, trackType);
    currentTrack = { id: trackId, type: trackType, ...trackInfo };
    
    if (trackType === 'user') {
        // Пользовательский трек
        const audioUrl = `/play/${trackType}/${trackId}`;
        currentAudio = new Audio(audioUrl);
    } else {
        // Трек из плейлиста (демо)
        showNotification('Воспроизведение треков из плейлистов пока не поддерживается', 'info');
        return;
    }
    
    currentAudio.addEventListener('loadedmetadata', () => {
        updateGlobalPlayer();
        currentAudio.play();
        isPlaying = true;
        updatePlayButton();
    });
    
    currentAudio.addEventListener('ended', () => {
        isPlaying = false;
        updatePlayButton();
        addToHistory(trackId, trackType, currentAudio.duration);
    });
    
    currentAudio.addEventListener('timeupdate', () => {
        updateProgress();
    });
    
    currentAudio.addEventListener('error', (e) => {
        console.error('Ошибка воспроизведения:', e);
        showNotification('Ошибка воспроизведения трека', 'error');
    });
}

// Обновление глобального плеера
function updateGlobalPlayer() {
    const player = document.getElementById('global-player');
    const title = document.getElementById('player-track-title');
    const artist = document.getElementById('player-track-artist');
    
    if (currentTrack) {
        title.textContent = currentTrack.title;
        artist.textContent = currentTrack.artist;
        player.style.display = 'block';
    }
}

// Обновление кнопки воспроизведения
function updatePlayButton() {
    const playButton = document.querySelector('.play-pause-btn');
    if (playButton) {
        const icon = playButton.querySelector('i');
        
        if (isPlaying) {
            icon.className = 'fas fa-pause';
        } else {
            icon.className = 'fas fa-play';
        }
    }
}

// Обновление прогресса
function updateProgress() {
    if (!currentAudio) return;
    
    const progressFill = document.getElementById('player-progress-fill');
    const currentTime = document.getElementById('current-time');
    const totalTime = document.getElementById('total-time');
    
    if (progressFill) {
        const progress = (currentAudio.currentTime / currentAudio.duration) * 100;
        progressFill.style.width = `${progress}%`;
    }
    
    if (currentTime) currentTime.textContent = formatTime(currentAudio.currentTime);
    if (totalTime) totalTime.textContent = formatTime(currentAudio.duration);
}

// Добавление в историю
async function addToHistory(trackId, trackType, duration) {
    try {
        await fetch('/api/add_to_history', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                track_id: trackId,
                track_type: trackType,
                duration: duration
            })
        });
        
        // Обновляем историю и статистику
        loadHistory();
        updateStatistics();
    } catch (error) {
        console.error('Ошибка добавления в историю:', error);
    }
}

// Обновление статистики
async function updateStatistics() {
    try {
        const response = await fetch('/api/history');
        const historyData = await response.json();
        
        // Подсчитываем статистику
        const totalPlays = historyData.reduce((sum, item) => sum + (item.play_count || 1), 0);
        const totalLikes = favorites.length;
        const totalDuration = historyData.reduce((sum, item) => sum + (item.total_duration || 0), 0);
        const uniqueTracks = new Set(historyData.map(item => `${item.track_type}_${item.track_id}`)).size;
        
        const totalPlaysEl = document.getElementById('total-plays');
        const totalLikesEl = document.getElementById('total-likes');
        const totalTimeEl = document.getElementById('total-time');
        const uniqueTracksEl = document.getElementById('unique-tracks');
        
        if (totalPlaysEl) totalPlaysEl.textContent = totalPlays;
        if (totalLikesEl) totalLikesEl.textContent = totalLikes;
        if (totalTimeEl) totalTimeEl.textContent = formatDuration(totalDuration);
        if (uniqueTracksEl) uniqueTracksEl.textContent = uniqueTracks;
        
    } catch (error) {
        console.error('Ошибка обновления статистики:', error);
    }
}

// Форматирование времени
function formatTime(seconds) {
    if (!seconds || isNaN(seconds)) return '0:00';
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

// Форматирование длительности
function formatDuration(seconds) {
    if (!seconds || isNaN(seconds)) return '0 мин';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
        return `${hours}ч ${minutes} мин`;
    } else {
        return `${minutes} мин`;
    }
}

// Форматирование даты
function formatDate(dateString) {
    if (!dateString) return 'Неизвестно';
    
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (minutes < 60) {
        return `${minutes} мин назад`;
    } else if (hours < 24) {
        return `${hours} ч назад`;
    } else if (days < 7) {
        return `${days} дн назад`;
    } else {
        return date.toLocaleDateString('ru-RU');
    }
}

// Показать уведомление
function showNotification(message, type = 'info') {
    // Создаем уведомление, если его нет
    let notification = document.getElementById('notification');
    if (!notification) {
        notification = document.createElement('div');
        notification.id = 'notification';
        notification.className = 'notification';
        notification.innerHTML = `
            <i class="fas fa-info-circle"></i>
            <span id="notification-text"></span>
        `;
        document.body.appendChild(notification);
    }
    
    const text = document.getElementById('notification-text');
    if (text) text.textContent = message;
    
    notification.className = `notification ${type}`;
    notification.classList.add('show');
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

// Обработчики событий для глобального плеера
document.addEventListener('DOMContentLoaded', function() {
    const playPauseBtn = document.getElementById('play-pause-btn');
    const volumeSlider = document.getElementById('volume-slider');
    const volumeIcon = document.getElementById('volume-icon');
    
    playPauseBtn.addEventListener('click', togglePlayPause);
    
    volumeSlider.addEventListener('input', function() {
        if (currentAudio) {
            currentAudio.volume = this.value / 100;
        }
        
        // Обновляем иконку громкости
        if (this.value == 0) {
            volumeIcon.className = 'fas fa-volume-mute';
        } else if (this.value < 50) {
            volumeIcon.className = 'fas fa-volume-down';
        } else {
            volumeIcon.className = 'fas fa-volume-up';
        }
    });
    
    // Обработка прогресса
    const progressBar = document.querySelector('.progress-bar');
    progressBar.addEventListener('click', function(e) {
        if (!currentAudio) return;
        
        const rect = this.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const width = rect.width;
        const percentage = clickX / width;
        
        currentAudio.currentTime = percentage * currentAudio.duration;
    });
}); 