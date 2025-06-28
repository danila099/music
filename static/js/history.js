// История прослушивания
class HistoryManager {
    constructor() {
        this.history = [];
        this.currentTrack = null;
        this.audio = new Audio();
        this.isPlaying = false;
        this.currentTime = 0;
        this.duration = 0;
        
        this.init();
    }
    
    init() {
        this.loadHistory();
        this.setupEventListeners();
        this.setupAudioEvents();
    }
    
    async loadHistory() {
        try {
            const response = await fetch('/api/history');
            this.history = await response.json();
            this.renderHistory();
            this.updateStatistics();
        } catch (error) {
            console.error('Ошибка загрузки истории:', error);
            this.showEmptyState();
        }
    }
    
    renderHistory() {
        const historyList = document.getElementById('history-list');
        const loading = document.getElementById('loading');
        const emptyHistory = document.getElementById('empty-history');
        
        if (this.history.length === 0) {
            loading.style.display = 'none';
            emptyHistory.style.display = 'block';
            return;
        }
        
        loading.style.display = 'none';
        emptyHistory.style.display = 'none';
        
        historyList.innerHTML = this.history.map(item => this.createHistoryItem(item)).join('');
    }
    
    createHistoryItem(item) {
        const playCount = item.play_count || 1;
        const totalDuration = Math.round((item.total_duration || 0) / 60);
        const lastPlayed = new Date(item.last_played).toLocaleDateString('ru-RU');
        
        return `
            <div class="history-item" data-track-id="${item.track_id}" data-track-type="${item.track_type}">
                <div class="history-item-info">
                    <div class="track-cover">
                        <i class="fas fa-music"></i>
                    </div>
                    <div class="track-details">
                        <h4 class="track-title">${this.getTrackTitle(item)}</h4>
                        <p class="track-artist">${this.getTrackArtist(item)}</p>
                        <div class="track-meta">
                            <span class="play-count">
                                <i class="fas fa-play"></i> ${playCount}
                            </span>
                            <span class="total-duration">
                                <i class="fas fa-clock"></i> ${totalDuration} мин
                            </span>
                            <span class="last-played">
                                <i class="fas fa-calendar"></i> ${lastPlayed}
                            </span>
                        </div>
                    </div>
                </div>
                <div class="history-item-actions">
                    <button class="btn btn-icon play-btn" title="Воспроизвести">
                        <i class="fas fa-play"></i>
                    </button>
                    <button class="btn btn-icon like-btn" title="Лайк">
                        <i class="fas fa-heart"></i>
                    </button>
                    <button class="btn btn-icon comment-btn" title="Комментарий">
                        <i class="fas fa-comment"></i>
                    </button>
                </div>
            </div>
        `;
    }
    
    getTrackTitle(item) {
        // Здесь нужно получить название трека из разных источников
        // Пока возвращаем ID трека
        return `Трек ${item.track_id}`;
    }
    
    getTrackArtist(item) {
        // Здесь нужно получить исполнителя из разных источников
        return 'Неизвестный исполнитель';
    }
    
    updateStatistics() {
        const totalPlays = this.history.reduce((sum, item) => sum + (item.play_count || 1), 0);
        const totalTime = Math.round(this.history.reduce((sum, item) => sum + (item.total_duration || 0), 0) / 60);
        const uniqueTracks = new Set(this.history.map(item => item.track_id)).size;
        
        document.getElementById('total-plays').textContent = totalPlays;
        document.getElementById('total-time').textContent = `${totalTime} мин`;
        document.getElementById('unique-tracks').textContent = uniqueTracks;
        
        // Получаем количество лайков
        this.loadLikesCount();
    }
    
    async loadLikesCount() {
        try {
            let totalLikes = 0;
            for (const item of this.history) {
                const response = await fetch(`/api/statistics/${item.track_type}/${item.track_id}`);
                const stats = await response.json();
                totalLikes += stats.like_count || 0;
            }
            document.getElementById('total-likes').textContent = totalLikes;
        } catch (error) {
            console.error('Ошибка загрузки лайков:', error);
        }
    }
    
    showEmptyState() {
        document.getElementById('loading').style.display = 'none';
        document.getElementById('empty-history').style.display = 'block';
    }
    
    setupEventListeners() {
        // Фильтры
        document.getElementById('sort-filter').addEventListener('change', (e) => {
            this.sortHistory(e.target.value);
        });
        
        document.getElementById('period-filter').addEventListener('change', (e) => {
            this.filterByPeriod(e.target.value);
        });
        
        // Обработчики для элементов истории
        document.addEventListener('click', (e) => {
            if (e.target.closest('.play-btn')) {
                const historyItem = e.target.closest('.history-item');
                const trackId = historyItem.dataset.trackId;
                const trackType = historyItem.dataset.trackType;
                this.playTrack(trackId, trackType);
            }
            
            if (e.target.closest('.like-btn')) {
                const historyItem = e.target.closest('.history-item');
                const trackId = historyItem.dataset.trackId;
                const trackType = historyItem.dataset.trackType;
                this.toggleLike(trackId, trackType, e.target.closest('.like-btn'));
            }
            
            if (e.target.closest('.comment-btn')) {
                const historyItem = e.target.closest('.history-item');
                const trackId = historyItem.dataset.trackId;
                const trackType = historyItem.dataset.trackType;
                this.showCommentDialog(trackId, trackType);
            }
        });
    }
    
    sortHistory(sortBy) {
        const historyList = document.getElementById('history-list');
        
        switch (sortBy) {
            case 'recent':
                this.history.sort((a, b) => new Date(b.last_played) - new Date(a.last_played));
                break;
            case 'popular':
                this.history.sort((a, b) => (b.play_count || 1) - (a.play_count || 1));
                break;
            case 'duration':
                this.history.sort((a, b) => (b.total_duration || 0) - (a.total_duration || 0));
                break;
        }
        
        this.renderHistory();
    }
    
    filterByPeriod(period) {
        const now = new Date();
        let filteredHistory = [...this.history];
        
        switch (period) {
            case 'today':
                const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                filteredHistory = this.history.filter(item => 
                    new Date(item.last_played) >= today
                );
                break;
            case 'week':
                const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                filteredHistory = this.history.filter(item => 
                    new Date(item.last_played) >= weekAgo
                );
                break;
            case 'month':
                const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                filteredHistory = this.history.filter(item => 
                    new Date(item.last_played) >= monthAgo
                );
                break;
        }
        
        this.renderFilteredHistory(filteredHistory);
    }
    
    renderFilteredHistory(filteredHistory) {
        const historyList = document.getElementById('history-list');
        const loading = document.getElementById('loading');
        const emptyHistory = document.getElementById('empty-history');
        
        if (filteredHistory.length === 0) {
            historyList.innerHTML = '';
            emptyHistory.style.display = 'block';
            return;
        }
        
        emptyHistory.style.display = 'none';
        historyList.innerHTML = filteredHistory.map(item => this.createHistoryItem(item)).join('');
    }
    
    async playTrack(trackId, trackType) {
        try {
            this.currentTrack = { id: trackId, type: trackType };
            
            // Получаем прогресс воспроизведения
            const progressResponse = await fetch(`/api/get_progress/${trackType}/${trackId}`);
            const progress = await progressResponse.json();
            
            // Устанавливаем источник аудио
            if (trackType === 'user') {
                this.audio.src = `/play/${trackType}/${trackId}`;
            } else {
                // Для плейлистов нужно получить URL трека
                this.audio.src = `/play/${trackType}/${trackId}`;
            }
            
            // Устанавливаем прогресс
            this.audio.currentTime = progress;
            
            // Воспроизводим
            await this.audio.play();
            this.isPlaying = true;
            this.updatePlayButton();
            
            // Обновляем информацию в плеере
            this.updatePlayerInfo(trackId, trackType);
            
            // Добавляем в историю
            this.addToHistory(trackId, trackType);
            
        } catch (error) {
            console.error('Ошибка воспроизведения:', error);
            this.showNotification('Ошибка воспроизведения трека', 'error');
        }
    }
    
    async toggleLike(trackId, trackType, button) {
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
            
            const result = await response.json();
            
            if (result.liked) {
                button.classList.add('liked');
                this.showNotification('Добавлено в избранное', 'success');
            } else {
                button.classList.remove('liked');
                this.showNotification('Удалено из избранного', 'info');
            }
            
        } catch (error) {
            console.error('Ошибка лайка:', error);
            this.showNotification('Ошибка при работе с лайком', 'error');
        }
    }
    
    showCommentDialog(trackId, trackType) {
        const username = prompt('Введите ваше имя (необязательно):') || 'Аноним';
        const comment = prompt('Введите комментарий:');
        
        if (comment && comment.trim()) {
            this.addComment(trackId, trackType, username, comment.trim());
        }
    }
    
    async addComment(trackId, trackType, username, comment) {
        try {
            const response = await fetch('/api/add_comment', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    track_id: trackId,
                    track_type: trackType,
                    username: username,
                    comment: comment
                })
            });
            
            if (response.ok) {
                this.showNotification('Комментарий добавлен', 'success');
            } else {
                const error = await response.json();
                this.showNotification(error.error || 'Ошибка добавления комментария', 'error');
            }
            
        } catch (error) {
            console.error('Ошибка комментария:', error);
            this.showNotification('Ошибка добавления комментария', 'error');
        }
    }
    
    async addToHistory(trackId, trackType) {
        try {
            await fetch('/api/add_to_history', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    track_id: trackId,
                    track_type: trackType,
                    duration: this.duration
                })
            });
        } catch (error) {
            console.error('Ошибка добавления в историю:', error);
        }
    }
    
    updatePlayerInfo(trackId, trackType) {
        // Здесь нужно получить информацию о треке
        document.getElementById('player-title').textContent = `Трек ${trackId}`;
        document.getElementById('player-artist').textContent = 'Неизвестный исполнитель';
    }
    
    setupAudioEvents() {
        this.audio.addEventListener('loadedmetadata', () => {
            this.duration = this.audio.duration;
            document.getElementById('total-time-display').textContent = this.formatTime(this.duration);
        });
        
        this.audio.addEventListener('timeupdate', () => {
            this.currentTime = this.audio.currentTime;
            const progress = (this.currentTime / this.duration) * 100;
            
            document.getElementById('current-time').textContent = this.formatTime(this.currentTime);
            document.getElementById('progress-fill').style.width = `${progress}%`;
            document.getElementById('progress-slider').value = progress;
            
            // Сохраняем прогресс каждые 5 секунд
            if (Math.floor(this.currentTime) % 5 === 0 && this.currentTrack) {
                this.saveProgress();
            }
        });
        
        this.audio.addEventListener('ended', () => {
            this.isPlaying = false;
            this.updatePlayButton();
        });
        
        this.audio.addEventListener('error', (e) => {
            console.error('Ошибка аудио:', e);
            this.showNotification('Ошибка воспроизведения', 'error');
        });
    }
    
    updatePlayButton() {
        const playBtn = document.getElementById('play-btn');
        const icon = playBtn.querySelector('i');
        
        if (this.isPlaying) {
            icon.className = 'fas fa-pause';
        } else {
            icon.className = 'fas fa-play';
        }
    }
    
    async saveProgress() {
        if (!this.currentTrack) return;
        
        try {
            await fetch('/api/save_progress', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    track_id: this.currentTrack.id,
                    track_type: this.currentTrack.type,
                    progress: this.currentTime
                })
            });
        } catch (error) {
            console.error('Ошибка сохранения прогресса:', error);
        }
    }
    
    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
    
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check' : type === 'error' ? 'exclamation-triangle' : 'info'}"></i>
            <span>${message}</span>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    new HistoryManager();
}); 