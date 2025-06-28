// Простой поиск
class SimpleSearch {
    constructor() {
        this.currentQuery = '';
        this.searchTimeout = null;
        this.results = [];
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.setupAudioPlayer();
    }
    
    setupEventListeners() {
        // Поисковая строка
        const searchInput = document.getElementById('simple-search-input');
        const searchBtn = document.getElementById('simple-search-btn');
        
        searchInput.addEventListener('input', (e) => {
            this.currentQuery = e.target.value.trim();
            this.debounceSearch();
        });
        
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.performSearch();
            }
        });
        
        searchBtn.addEventListener('click', () => {
            this.performSearch();
        });
        
        // Быстрые поиски
        document.querySelectorAll('.quick-search-tag').forEach(tag => {
            tag.addEventListener('click', (e) => {
                const query = e.target.dataset.query;
                document.getElementById('simple-search-input').value = query;
                this.currentQuery = query;
                this.performSearch();
            });
        });
    }
    
    debounceSearch() {
        clearTimeout(this.searchTimeout);
        this.searchTimeout = setTimeout(() => {
            if (this.currentQuery.length >= 2) {
                this.performSearch();
            } else if (this.currentQuery.length === 0) {
                this.showSearchPrompt();
            }
        }, 300);
    }
    
    async performSearch() {
        if (!this.currentQuery) {
            this.showSearchPrompt();
            return;
        }
        
        this.showLoading();
        
        try {
            const params = new URLSearchParams({
                q: this.currentQuery,
                type: 'all',
                sort: 'relevance'
            });
            
            const response = await fetch(`/api/search_advanced?${params}`);
            this.results = await response.json();
            
            this.renderResults();
            
        } catch (error) {
            console.error('Ошибка поиска:', error);
            this.showError('Ошибка при выполнении поиска');
        }
    }
    
    renderResults() {
        const container = document.getElementById('results-container');
        const noResults = document.getElementById('no-results');
        const searchPrompt = document.getElementById('search-prompt');
        
        if (this.results.length === 0) {
            container.innerHTML = '';
            noResults.style.display = 'block';
            searchPrompt.style.display = 'none';
            return;
        }
        
        noResults.style.display = 'none';
        searchPrompt.style.display = 'none';
        
        // Группируем результаты по типу
        const groupedResults = this.groupResultsByType();
        
        container.innerHTML = Object.entries(groupedResults).map(([type, items]) => {
            return this.createResultsSection(type, items);
        }).join('');
        
        // Добавляем обработчики событий
        this.setupResultEventListeners();
    }
    
    groupResultsByType() {
        const grouped = {};
        
        this.results.forEach(result => {
            if (!grouped[result.type]) {
                grouped[result.type] = [];
            }
            grouped[result.type].push(result);
        });
        
        return grouped;
    }
    
    createResultsSection(type, items) {
        const typeLabels = {
            'track': 'Треки',
            'artist': 'Исполнители',
            'playlist': 'Плейлисты'
        };
        
        const typeIcons = {
            'track': 'fas fa-music',
            'artist': 'fas fa-microphone',
            'playlist': 'fas fa-list'
        };
        
        return `
            <div class="results-section">
                <h3 class="section-title">
                    <i class="${typeIcons[type]}"></i>
                    ${typeLabels[type]} (${items.length})
                </h3>
                <div class="results-grid">
                    ${items.slice(0, 6).map(item => this.createResultItem(item)).join('')}
                </div>
                ${items.length > 6 ? `
                    <div class="show-more">
                        <a href="/search_advanced?q=${encodeURIComponent(this.currentQuery)}&type=${type}" class="btn btn-outline">
                            Показать все ${items.length} результатов
                        </a>
                    </div>
                ` : ''}
            </div>
        `;
    }
    
    createResultItem(item) {
        switch (item.type) {
            case 'track':
                return this.createTrackResult(item);
            case 'artist':
                return this.createArtistResult(item);
            case 'playlist':
                return this.createPlaylistResult(item);
            default:
                return '';
        }
    }
    
    createTrackResult(track) {
        return `
            <div class="result-item track-result" data-track-id="${track.id}" data-track-type="${track.source === 'Ваша музыка' ? 'user' : 'playlist'}">
                <div class="result-cover">
                    <img src="https://via.placeholder.com/80x80/${this.getRandomColor()}/ffffff?text=${track.title[0]}" alt="${track.title}">
                    <div class="result-overlay">
                        <button class="play-result-btn">
                            <i class="fas fa-play"></i>
                        </button>
                    </div>
                </div>
                <div class="result-info">
                    <h4 class="result-title">${track.title}</h4>
                    <p class="result-subtitle">${track.artist}</p>
                    <div class="result-meta">
                        <span class="duration">${track.duration}</span>
                        <span class="source">${track.source}</span>
                    </div>
                </div>
                <div class="result-actions">
                    <button class="btn-icon like-btn" title="Лайк">
                        <i class="fas fa-heart"></i>
                    </button>
                    <button class="btn-icon comment-btn" title="Комментарий">
                        <i class="fas fa-comment"></i>
                    </button>
                </div>
            </div>
        `;
    }
    
    createArtistResult(artist) {
        return `
            <div class="result-item artist-result" data-artist-id="${artist.id}">
                <div class="result-cover">
                    <img src="${artist.image}" alt="${artist.name}">
                    <div class="result-overlay">
                        <button class="view-artist-btn">
                            <i class="fas fa-eye"></i>
                        </button>
                    </div>
                </div>
                <div class="result-info">
                    <h4 class="result-title">${artist.name}</h4>
                    <p class="result-subtitle">Исполнитель</p>
                </div>
            </div>
        `;
    }
    
    createPlaylistResult(playlist) {
        return `
            <div class="result-item playlist-result" data-playlist-id="${playlist.id}">
                <div class="result-cover">
                    <img src="${playlist.cover}" alt="${playlist.name}">
                    <div class="result-overlay">
                        <button class="view-playlist-btn">
                            <i class="fas fa-eye"></i>
                        </button>
                    </div>
                </div>
                <div class="result-info">
                    <h4 class="result-title">${playlist.name}</h4>
                    <p class="result-subtitle">${playlist.song_count} треков</p>
                </div>
            </div>
        `;
    }
    
    setupResultEventListeners() {
        // Воспроизведение треков
        document.querySelectorAll('.play-result-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const resultItem = e.target.closest('.track-result');
                const trackId = resultItem.dataset.trackId;
                const trackType = resultItem.dataset.trackType;
                this.playTrack(trackId, trackType);
            });
        });
        
        // Лайки
        document.querySelectorAll('.like-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const resultItem = e.target.closest('.track-result');
                const trackId = resultItem.dataset.trackId;
                const trackType = resultItem.dataset.trackType;
                this.toggleLike(trackId, trackType, btn);
            });
        });
        
        // Комментарии
        document.querySelectorAll('.comment-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const resultItem = e.target.closest('.track-result');
                const trackId = resultItem.dataset.trackId;
                const trackType = resultItem.dataset.trackType;
                this.showCommentDialog(trackId, trackType);
            });
        });
        
        // Просмотр исполнителей
        document.querySelectorAll('.view-artist-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const resultItem = e.target.closest('.artist-result');
                const artistId = resultItem.dataset.artistId;
                window.location.href = `/artist/${artistId}`;
            });
        });
        
        // Просмотр плейлистов
        document.querySelectorAll('.view-playlist-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const resultItem = e.target.closest('.playlist-result');
                const playlistId = resultItem.dataset.playlistId;
                window.location.href = `/playlist/${playlistId}`;
            });
        });
    }
    
    async playTrack(trackId, trackType) {
        try {
            // Получаем прогресс воспроизведения
            const progressResponse = await fetch(`/api/get_progress/${trackType}/${trackId}`);
            const progress = await progressResponse.json();
            
            // Устанавливаем источник аудио
            this.audio.src = `/play/${trackType}/${trackId}`;
            this.audio.currentTime = progress;
            
            // Воспроизводим
            await this.audio.play();
            this.isPlaying = true;
            this.updatePlayButton();
            
            // Добавляем в историю
            this.addToHistory(trackId, trackType);
            
            this.showNotification('Воспроизведение начато', 'success');
            
        } catch (error) {
            console.error('Ошибка воспроизведения:', error);
            this.showNotification('Ошибка воспроизведения', 'error');
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
    
    setupAudioPlayer() {
        this.audio = new Audio();
        this.isPlaying = false;
        this.currentTime = 0;
        this.duration = 0;
        
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
        });
        
        this.audio.addEventListener('ended', () => {
            this.isPlaying = false;
            this.updatePlayButton();
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
    
    showLoading() {
        document.getElementById('loading').style.display = 'block';
        document.getElementById('no-results').style.display = 'none';
        document.getElementById('search-prompt').style.display = 'none';
        document.getElementById('results-container').innerHTML = '';
    }
    
    showSearchPrompt() {
        document.getElementById('loading').style.display = 'none';
        document.getElementById('no-results').style.display = 'none';
        document.getElementById('search-prompt').style.display = 'block';
        document.getElementById('results-container').innerHTML = '';
    }
    
    showError(message) {
        document.getElementById('loading').style.display = 'none';
        this.showNotification(message, 'error');
    }
    
    getRandomColor() {
        const colors = ['ff6b6b', '4ecdc4', '45b7d1', '96ceb4', 'ffeaa7', 'dda0dd'];
        return colors[Math.floor(Math.random() * colors.length)];
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
    new SimpleSearch();
}); 