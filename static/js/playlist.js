// JavaScript для воспроизведения треков из плейлистов

console.log('Playlist.js загружен');

// Глобальные переменные для управления аудио
let currentAudio = null;
let currentTrack = null;
let isPlaying = false;

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM загружен, инициализируем плейлист');
    initPlaylistControls();
});

function initPlaylistControls() {
    console.log('Инициализация элементов управления плейлиста');
    
    // Обработчики для кнопок воспроизведения треков
    document.querySelectorAll('.play-track-btn-small').forEach((btn, index) => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const trackRow = this.closest('.track-row');
            const trackId = trackRow.dataset.trackId;
            
            console.log('Воспроизведение трека из плейлиста:', trackId);
            playPlaylistTrack(trackId);
        });
    });
    
    // Обработчик для кнопки "Воспроизвести все"
    const playAllBtn = document.querySelector('.play-all-btn');
    if (playAllBtn) {
        playAllBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            console.log('Воспроизведение всех треков плейлиста');
            playAllTracks();
        });
    }
    
    // Обработчик для кнопки "Перемешать"
    const shuffleBtn = document.querySelector('.shuffle-btn');
    if (shuffleBtn) {
        shuffleBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            console.log('Перемешивание треков плейлиста');
            shuffleTracks();
        });
    }
}

function playPlaylistTrack(trackId) {
    console.log('Воспроизведение трека из плейлиста:', trackId);
    
    // Если уже играет этот трек, просто переключаем пауза/воспроизведение
    if (currentTrack && currentTrack.id === trackId && currentAudio) {
        if (isPlaying) {
            pausePlaylistTrack(trackId);
        } else {
            resumePlaylistTrack(trackId);
        }
        return;
    }
    
    // Если играет другой трек, останавливаем его
    if (currentAudio) {
        currentAudio.pause();
        currentAudio = null;
    }
    
    // Получаем информацию о треке из DOM
    const trackRow = document.querySelector(`[data-track-id="${trackId}"]`);
    if (!trackRow) {
        console.error('Трек не найден в DOM:', trackId);
        return;
    }
    
    const titleElement = trackRow.querySelector('h4');
    const artistElement = trackRow.querySelector('.track-artist-cell');
    const durationElement = trackRow.querySelector('.track-duration-cell');
    
    const title = titleElement ? titleElement.textContent : 'Неизвестный трек';
    const artist = artistElement ? artistElement.textContent : 'Неизвестный исполнитель';
    const duration = durationElement ? durationElement.textContent : '0:00';
    
    // Создаем новый аудио элемент (для демонстрации используем заглушку)
    // В реальном приложении здесь был бы URL к аудиофайлу
    currentAudio = new Audio();
    currentTrack = { 
        id: trackId, 
        type: 'playlist',
        title: title,
        artist: artist,
        duration: duration
    };
    isPlaying = true;
    
    // Для демонстрации создаем заглушку
    createAudioPlaceholder(currentAudio, duration);
    
    // Обработчики событий
    currentAudio.addEventListener('loadedmetadata', function() {
        console.log('Трек загружен:', currentAudio.duration);
    });
    
    currentAudio.addEventListener('timeupdate', function() {
        // Обновляем глобальный плеер
        updateGlobalPlayer();
    });
    
    currentAudio.addEventListener('ended', function() {
        isPlaying = false;
        updateTrackUI(trackId, false);
        updateGlobalPlayer();
    });
    
    currentAudio.addEventListener('pause', function() {
        isPlaying = false;
        updateTrackUI(trackId, false);
        updateGlobalPlayer();
    });
    
    currentAudio.addEventListener('play', function() {
        isPlaying = true;
        updateTrackUI(trackId, true);
        updateGlobalPlayer();
    });
    
    // Воспроизводим трек
    currentAudio.play().catch(error => {
        console.error('Ошибка воспроизведения:', error);
        showNotification('Ошибка воспроизведения трека', 'error');
        isPlaying = false;
        updateTrackUI(trackId, false);
    });
    
    // Обновляем UI
    updateTrackUI(trackId, true);
    updateGlobalPlayer();
    
    // Добавляем в историю
    addToHistory(trackId, 'playlist', 0);
}

function pausePlaylistTrack(trackId) {
    console.log('Пауза трека из плейлиста:', trackId);
    
    if (currentAudio && currentTrack && currentTrack.id === trackId && isPlaying) {
        currentAudio.pause();
        isPlaying = false;
        updateTrackUI(trackId, false);
        updateGlobalPlayer();
    }
}

function resumePlaylistTrack(trackId) {
    console.log('Возобновление трека из плейлиста:', trackId);
    
    if (currentAudio && currentTrack && currentTrack.id === trackId && !isPlaying) {
        currentAudio.play().catch(error => {
            console.error('Ошибка возобновления:', error);
            showNotification('Ошибка возобновления трека', 'error');
        });
        isPlaying = true;
        updateTrackUI(trackId, true);
        updateGlobalPlayer();
    }
}

function playAllTracks() {
    console.log('Воспроизведение всех треков плейлиста');
    
    // Получаем первый трек из списка
    const firstTrack = document.querySelector('.track-row');
    if (firstTrack) {
        const trackId = firstTrack.dataset.trackId;
        playPlaylistTrack(trackId);
    }
}

function shuffleTracks() {
    console.log('Перемешивание треков плейлиста');
    
    // Получаем все треки
    const trackRows = Array.from(document.querySelectorAll('.track-row'));
    
    // Перемешиваем массив
    for (let i = trackRows.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [trackRows[i], trackRows[j]] = [trackRows[j], trackRows[i]];
    }
    
    // Переставляем элементы в DOM
    const tracksList = document.querySelector('.tracks-list');
    if (tracksList) {
        trackRows.forEach((row, index) => {
            // Обновляем номер трека
            const numberCell = row.querySelector('.track-number');
            if (numberCell) {
                numberCell.textContent = index + 1;
            }
            
            // Перемещаем элемент
            tracksList.appendChild(row);
        });
    }
    
    showNotification('Треки перемешаны', 'success');
}

function createAudioPlaceholder(audio, duration) {
    // Создаем заглушку для демонстрации
    // В реальном приложении здесь был бы URL к аудиофайлу
    
    // Парсим длительность (например, "4:32" -> 272 секунды)
    const durationParts = duration.split(':');
    const minutes = parseInt(durationParts[0]) || 0;
    const seconds = parseInt(durationParts[1]) || 0;
    const totalSeconds = minutes * 60 + seconds;
    
    // Создаем простой аудио буфер для демонстрации
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const buffer = audioContext.createBuffer(1, audioContext.sampleRate * totalSeconds, audioContext.sampleRate);
    
    // Заполняем буфер тишиной
    const channelData = buffer.getChannelData(0);
    for (let i = 0; i < channelData.length; i++) {
        channelData[i] = 0;
    }
    
    // Создаем источник
    const source = audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(audioContext.destination);
    
    // Симулируем воспроизведение
    let startTime = 0;
    let isPaused = false;
    let pauseTime = 0;
    
    audio.play = function() {
        if (isPaused) {
            startTime = audioContext.currentTime - pauseTime;
        } else {
            startTime = audioContext.currentTime;
        }
        source.start(startTime);
        isPaused = false;
        return Promise.resolve();
    };
    
    audio.pause = function() {
        source.stop();
        pauseTime = audioContext.currentTime - startTime;
        isPaused = true;
    };
    
    audio.currentTime = 0;
    audio.duration = totalSeconds;
    
    // Симулируем события
    source.onended = function() {
        if (audio.onended) audio.onended();
    };
    
    // Симулируем timeupdate
    setInterval(() => {
        if (!isPaused && audio.ontimeupdate) {
            audio.currentTime = audioContext.currentTime - startTime;
            audio.ontimeupdate();
        }
    }, 100);
}

function updateTrackUI(trackId, isPlaying) {
    const trackRow = document.querySelector(`[data-track-id="${trackId}"]`);
    if (trackRow) {
        // Обновляем кнопку воспроизведения
        const playBtn = trackRow.querySelector('.play-track-btn-small');
        if (playBtn) {
            playBtn.innerHTML = isPlaying ? '<i class="fas fa-pause"></i>' : '<i class="fas fa-play"></i>';
        }
        
        // Добавляем/убираем класс playing для визуального эффекта
        if (isPlaying) {
            trackRow.classList.add('playing');
        } else {
            trackRow.classList.remove('playing');
        }
    }
}

function updateGlobalPlayer() {
    const globalPlayer = document.getElementById('global-player');
    const trackTitle = document.getElementById('player-track-title');
    const trackArtist = document.getElementById('player-track-artist');
    const playPauseBtn = document.querySelector('.play-pause-btn i');
    
    if (globalPlayer && currentTrack) {
        globalPlayer.style.display = 'block';
        
        if (trackTitle) trackTitle.textContent = currentTrack.title;
        if (trackArtist) trackArtist.textContent = currentTrack.artist;
        
        if (playPauseBtn) {
            playPauseBtn.className = isPlaying ? 'fas fa-pause' : 'fas fa-play';
        }
        
        // Обновляем время
        if (currentAudio) {
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
        }
    }
}

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

function formatTime(seconds) {
    if (isNaN(seconds)) return '0:00';
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

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

// Делаем функции глобальными
window.playPlaylistTrack = playPlaylistTrack;
window.pausePlaylistTrack = pausePlaylistTrack;
window.resumePlaylistTrack = resumePlaylistTrack;

// Функция для воспроизведения первого трека из плейлиста
window.playFirstTrackFromPlaylist = function(playlistId) {
    console.log('Воспроизведение первого трека из плейлиста:', playlistId);
    
    // Получаем данные плейлиста
    fetch(`/api/playlists`)
    .then(response => response.json())
    .then(playlists => {
        const playlist = playlists.find(p => p.id == playlistId);
        if (playlist && playlist.songs.length > 0) {
            const firstSong = playlist.songs[0];
            console.log('Первый трек плейлиста:', firstSong);
            
            // Создаем временный трек для воспроизведения
            const tempTrack = {
                id: firstSong.id,
                type: 'playlist',
                title: firstSong.title,
                artist: firstSong.artist,
                duration: firstSong.duration
            };
            
            // Если уже играет этот трек, переключаем пауза/воспроизведение
            if (currentTrack && currentTrack.id === tempTrack.id && currentAudio) {
                if (isPlaying) {
                    pausePlaylistTrack(tempTrack.id);
                } else {
                    resumePlaylistTrack(tempTrack.id);
                }
                return;
            }
            
            // Если играет другой трек, останавливаем его
            if (currentAudio) {
                currentAudio.pause();
                currentAudio = null;
            }
            
            // Создаем новый аудио элемент
            currentAudio = new Audio();
            currentTrack = tempTrack;
            isPlaying = true;
            
            // Создаем заглушку для демонстрации
            createAudioPlaceholder(currentAudio, firstSong.duration);
            
            // Обработчики событий
            currentAudio.addEventListener('loadedmetadata', function() {
                console.log('Трек загружен:', currentAudio.duration);
            });
            
            currentAudio.addEventListener('timeupdate', function() {
                updateGlobalPlayer();
            });
            
            currentAudio.addEventListener('ended', function() {
                isPlaying = false;
                updateGlobalPlayer();
            });
            
            currentAudio.addEventListener('pause', function() {
                isPlaying = false;
                updateGlobalPlayer();
            });
            
            currentAudio.addEventListener('play', function() {
                isPlaying = true;
                updateGlobalPlayer();
            });
            
            // Воспроизводим трек
            currentAudio.play().catch(error => {
                console.error('Ошибка воспроизведения:', error);
                showNotification('Ошибка воспроизведения трека', 'error');
                isPlaying = false;
            });
            
            // Обновляем глобальный плеер
            updateGlobalPlayer();
            
            // Добавляем в историю
            addToHistory(tempTrack.id, 'playlist', 0);
            
            showNotification(`Воспроизводится: ${firstSong.title} - ${firstSong.artist}`, 'success');
        }
    })
    .catch(error => {
        console.error('Ошибка получения данных плейлиста:', error);
        showNotification('Ошибка загрузки плейлиста', 'error');
    });
}; 