// JavaScript для страницы загрузки музыки

console.log('Upload.js загружен');

// Глобальные переменные для отслеживания состояния
let isUploading = false;
let selectedFile = null;

// Глобальные переменные для громкости
let userTrackVolume = 1.0; // Громкость по умолчанию
let isMuted = false; // Состояние мута

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM загружен, инициализируем загрузку');
    initUploadForm();
    initDragAndDrop();
    initTrackLikes();
    loadVolumeSettings();
});

function initUploadForm() {
    console.log('Инициализация формы загрузки');
    
    const fileInput = document.getElementById('musicFile');
    const fileUploadArea = document.getElementById('fileUploadArea');
    const trackInfoForm = document.getElementById('trackInfoForm');
    const uploadForm = document.getElementById('uploadForm');
    const uploadBtn = document.getElementById('uploadBtn');
    
    console.log('Элементы найдены:', {
        fileInput: !!fileInput,
        fileUploadArea: !!fileUploadArea,
        trackInfoForm: !!trackInfoForm,
        uploadForm: !!uploadForm,
        uploadBtn: !!uploadBtn
    });
    
    if (!fileInput || !fileUploadArea || !trackInfoForm || !uploadForm) {
        console.error('Не все элементы формы найдены');
        return;
    }
    
    // Обработчик клика по области загрузки
    fileUploadArea.addEventListener('click', function(e) {
        console.log('Клик по области загрузки');
        e.preventDefault();
        e.stopPropagation();
        fileInput.click();
    });
    
    // Обработчик выбора файла
    fileInput.addEventListener('change', function(e) {
        console.log('Файл выбран:', e.target.files[0]?.name);
        const file = e.target.files[0];
        if (file) {
            selectedFile = file;
            handleFileSelect(file);
        }
    });
    
    // Обработчик отправки формы
    uploadForm.addEventListener('submit', function(e) {
        console.log('Отправка формы');
        e.preventDefault();
        e.stopPropagation();
        
        if (isUploading) {
            console.log('Загрузка уже идет, игнорируем повторный запрос');
            return;
        }
        
        uploadFile();
    });
    
    // Обработчик кнопки загрузки
    if (uploadBtn) {
        uploadBtn.addEventListener('click', function(e) {
            console.log('Клик по кнопке загрузки');
            e.preventDefault();
            e.stopPropagation();
            
            if (isUploading) {
                console.log('Загрузка уже идет, игнорируем повторный запрос');
                return;
            }
            
            uploadFile();
        });
    }
}

function initDragAndDrop() {
    console.log('Инициализация drag and drop');
    const fileUploadArea = document.getElementById('fileUploadArea');
    
    if (!fileUploadArea) {
        console.error('Область загрузки не найдена');
        return;
    }
    
    // Предотвращаем стандартное поведение браузера
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        fileUploadArea.addEventListener(eventName, preventDefaults, false);
        document.body.addEventListener(eventName, preventDefaults, false);
    });
    
    // Подсветка области при перетаскивании
    ['dragenter', 'dragover'].forEach(eventName => {
        fileUploadArea.addEventListener(eventName, highlight, false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        fileUploadArea.addEventListener(eventName, unhighlight, false);
    });
    
    // Обработка сброшенного файла
    fileUploadArea.addEventListener('drop', handleDrop, false);
}

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

function highlight(e) {
    const area = document.getElementById('fileUploadArea');
    if (area) area.classList.add('drag-over');
}

function unhighlight(e) {
    const area = document.getElementById('fileUploadArea');
    if (area) area.classList.remove('drag-over');
}

function handleDrop(e) {
    console.log('Файл сброшен');
    const dt = e.dataTransfer;
    const files = dt.files;
    
    if (files.length > 0) {
        selectedFile = files[0];
        handleFileSelect(files[0]);
    }
}

function handleFileSelect(file) {
    console.log('Обработка выбранного файла:', file.name);
    
    // Проверяем тип файла
    const allowedExtensions = ['.mp3', '.wav', '.flac', '.m4a', '.ogg'];
    const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
    
    console.log('Расширение файла:', fileExtension);
    
    if (!allowedExtensions.includes(fileExtension)) {
        showNotification('Неподдерживаемый формат файла. Поддерживаются: MP3, WAV, FLAC, M4A, OGG', 'error');
        return;
    }
    
    // Проверяем размер файла (50MB)
    const maxSize = 50 * 1024 * 1024; // 50MB в байтах
    if (file.size > maxSize) {
        showNotification('Файл слишком большой. Максимальный размер: 50MB', 'error');
        return;
    }
    
    // Показываем форму для ввода информации о треке
    const trackInfoForm = document.getElementById('trackInfoForm');
    if (trackInfoForm) {
        trackInfoForm.style.display = 'block';
    }
    
    // Автоматически заполняем название из имени файла
    const fileName = file.name.replace(/\.[^/.]+$/, ""); // Убираем расширение
    const titleInput = document.getElementById('trackTitle');
    if (titleInput) {
        titleInput.value = fileName;
    }
    
    // Показываем информацию о выбранном файле
    showFileInfo(file);
}

function showFileInfo(file) {
    console.log('Показ информации о файле');
    const fileUploadArea = document.getElementById('fileUploadArea');
    const fileSize = (file.size / (1024 * 1024)).toFixed(2); // Размер в MB
    
    if (fileUploadArea) {
        fileUploadArea.innerHTML = `
            <i class="fas fa-check-circle" style="color: #4caf50; font-size: 48px; margin-bottom: 15px;"></i>
            <p><strong>${file.name}</strong></p>
            <p>Размер: ${fileSize} MB</p>
            <p>Тип: ${file.type || 'Неизвестно'}</p>
        `;
    }
}

function uploadFile() {
    console.log('Начинаем загрузку файла');
    
    // Проверяем, не идет ли уже загрузка
    if (isUploading) {
        console.log('Загрузка уже идет, игнорируем повторный запрос');
        return;
    }
    
    // Проверяем наличие файла
    if (!selectedFile) {
        const fileInput = document.getElementById('musicFile');
        if (!fileInput || !fileInput.files[0]) {
            showNotification('Выберите файл для загрузки', 'error');
            return;
        }
        selectedFile = fileInput.files[0];
    }
    
    const formData = new FormData();
    const titleInput = document.getElementById('trackTitle');
    const artistInput = document.getElementById('trackArtist');
    
    const title = titleInput ? titleInput.value.trim() : selectedFile.name.replace(/\.[^/.]+$/, "");
    const artist = artistInput ? artistInput.value.trim() : 'Неизвестный исполнитель';
    
    console.log('Данные для загрузки:', { fileName: selectedFile.name, title, artist });
    
    formData.append('file', selectedFile);
    formData.append('title', title);
    formData.append('artist', artist);
    
    // Устанавливаем флаг загрузки
    isUploading = true;
    
    // Показываем прогресс загрузки
    const uploadProgress = document.getElementById('uploadProgress');
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');
    const uploadBtn = document.getElementById('uploadBtn');
    
    if (uploadProgress) uploadProgress.style.display = 'block';
    if (uploadBtn) {
        uploadBtn.disabled = true;
        uploadBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Загрузка...';
    }
    
    // Симуляция прогресса загрузки
    let progress = 0;
    const progressInterval = setInterval(() => {
        progress += Math.random() * 15;
        if (progress > 90) progress = 90;
        if (progressFill) progressFill.style.width = progress + '%';
        if (progressText) progressText.textContent = `Загрузка... ${Math.round(progress)}%`;
    }, 200);
    
    console.log('Отправляем запрос на сервер');
    
    // Отправляем файл на сервер
    fetch('/upload', {
        method: 'POST',
        body: formData
    })
    .then(response => {
        console.log('Ответ сервера:', response.status);
        return response.json();
    })
    .then(data => {
        console.log('Данные ответа:', data);
        clearInterval(progressInterval);
        
        if (data.success) {
            if (progressFill) progressFill.style.width = '100%';
            if (progressText) progressText.textContent = 'Загрузка завершена!';
            showNotification('Файл успешно загружен!', 'success');
            
            // Получаем информацию о загруженном треке
            const trackInfo = {
                id: data.track_id || Date.now(),
                title: title,
                artist: artist,
                filename: selectedFile.name,
                upload_date: new Date().toLocaleDateString('ru-RU'),
                duration: '0:00'
            };
            
            // Добавляем трек в список
            addTrackToList(trackInfo);
            
            // Сбрасываем форму
            resetUploadForm();
        } else {
            showNotification(data.error || 'Ошибка при загрузке файла', 'error');
            resetUploadForm();
        }
    })
    .catch(error => {
        console.error('Ошибка загрузки:', error);
        clearInterval(progressInterval);
        showNotification('Ошибка при загрузке файла: ' + error.message, 'error');
        resetUploadForm();
    })
    .finally(() => {
        // Сбрасываем флаг загрузки
        isUploading = false;
    });
}

// Функция для добавления нового трека в список
function addTrackToList(trackInfo) {
    const userTracksList = document.querySelector('.user-tracks-list');
    const emptyState = document.querySelector('.empty-state');
    
    // Убираем пустое состояние если оно есть
    if (emptyState) {
        emptyState.remove();
    }
    
    // Показываем список треков
    if (userTracksList) {
        userTracksList.style.display = 'block';
    }
    
    // Создаем элемент трека
    const trackElement = document.createElement('div');
    trackElement.className = 'user-track-item';
    trackElement.setAttribute('data-track-id', `user_${trackInfo.id}`);
    trackElement.setAttribute('data-track-type', 'user');
    
    // Генерируем случайный цвет для обложки
    const colors = ['ff6b6b', '4ecdc4', '45b7d1', '96ceb4', 'ffeaa7', 'dda0dd'];
    let randomColor = colors[Math.floor(Math.random() * colors.length)];
    if (!randomColor) randomColor = 'ff6b6b';
    
    trackElement.innerHTML = `
        <div class="track-info">
            <div class="track-cover">
                <img src="https://via.placeholder.com/60x60/${randomColor}/ffffff?text=${trackInfo.title[0].toUpperCase()}" alt="Track">
                <div class="track-overlay">
                    <button class="play-track-btn" onclick="togglePlayPause('user_${trackInfo.id}')">
                        <i class="fas fa-play"></i>
                    </button>
                </div>
            </div>
            <div class="track-details">
                <h4>${trackInfo.title}</h4>
                <p>${trackInfo.artist}</p>
                <div class="track-meta">
                    <span class="upload-date">
                        <i class="fas fa-calendar"></i> 
                        ${trackInfo.upload_date}
                    </span>
                    <span class="file-size">
                        <i class="fas fa-file-audio"></i> 
                        ${trackInfo.filename}
                    </span>
                </div>
            </div>
        </div>
        <div class="track-actions">
            <div class="track-stats">
                <span class="duration">${trackInfo.duration}</span>
                <div class="like-count">
                    <i class="fas fa-heart"></i>
                    <span class="count">0</span>
                </div>
            </div>
            <div class="track-controls">
                <button class="play-btn" onclick="togglePlayPause('user_${trackInfo.id}')" data-track-id="user_${trackInfo.id}">
                    <i class="fas fa-play"></i>
                </button>
                <button class="like-btn" onclick="toggleLike('user_${trackInfo.id}')" data-track-id="user_${trackInfo.id}">
                    <i class="fas fa-heart"></i>
                </button>
                <button class="delete-btn" onclick="deleteTrack('user_${trackInfo.id}')" data-track-id="user_${trackInfo.id}">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
            <div class="track-progress">
                <div class="progress-bar">
                    <div class="progress-fill" style="width: 0%"></div>
                </div>
                <span class="progress-text">0%</span>
            </div>
        </div>
    `;
    
    // Добавляем элемент в начало списка с анимацией
    if (userTracksList) {
        trackElement.style.opacity = '0';
        trackElement.style.transform = 'translateY(-20px)';
        userTracksList.insertBefore(trackElement, userTracksList.firstChild);
        
        // Анимация появления
        setTimeout(() => {
            trackElement.style.transition = 'all 0.3s ease';
            trackElement.style.opacity = '1';
            trackElement.style.transform = 'translateY(0)';
        }, 10);
    }
    
    // Обновляем счетчик треков
    updateTrackCount();
}

function resetUploadForm() {
    console.log('Сброс формы загрузки');
    
    // Сбрасываем глобальные переменные
    isUploading = false;
    selectedFile = null;
    
    const uploadProgress = document.getElementById('uploadProgress');
    const uploadBtn = document.getElementById('uploadBtn');
    const fileUploadArea = document.getElementById('fileUploadArea');
    const trackInfoForm = document.getElementById('trackInfoForm');
    
    if (uploadProgress) uploadProgress.style.display = 'none';
    if (uploadBtn) {
        uploadBtn.disabled = true;
        uploadBtn.innerHTML = '<i class="fas fa-upload"></i> Загрузить трек';
    }
    
    if (fileUploadArea) {
        fileUploadArea.innerHTML = `
            <i class="fas fa-music"></i>
            <p>Перетащите файл сюда или нажмите для выбора</p>
        `;
    }
    
    if (trackInfoForm) trackInfoForm.style.display = 'none';
    
    const fileInput = document.getElementById('musicFile');
    const titleInput = document.getElementById('trackTitle');
    const artistInput = document.getElementById('trackArtist');
    
    if (fileInput) fileInput.value = '';
    if (titleInput) titleInput.value = '';
    if (artistInput) artistInput.value = '';
}

function playUserTrack(trackId) {
    console.log('Воспроизведение пользовательского трека:', trackId);
    
    // Извлекаем ID трека из строки "user_123"
    const actualTrackId = trackId.replace('user_', '');
    
    // Если уже играет этот трек, просто возобновляем
    if (currentTrack && currentTrack.id === trackId && currentAudio) {
        if (!isPlaying) {
            currentAudio.play().catch(error => {
                console.error('Ошибка возобновления:', error);
                showNotification('Ошибка возобновления трека', 'error');
            });
            isPlaying = true;
            updateTrackUI(trackId, true);
            updatePlayer(trackId, 'user');
        }
        return;
    }
    
    // Если играет другой трек, останавливаем его
    if (currentAudio) {
        currentAudio.pause();
        currentAudio = null;
    }
    
    // Создаем новый аудио элемент
    currentAudio = new Audio(`/play/user/${actualTrackId}`);
    currentTrack = { id: trackId, type: 'user' };
    isPlaying = true;
    
    // Применяем настройки громкости
    applyVolumeSettings();
    
    // Загружаем сохраненный прогресс
    loadProgress(trackId, 'user');
    
    // Обработчики событий
    currentAudio.addEventListener('loadedmetadata', function() {
        console.log('Трек загружен:', currentAudio.duration);
    });
    
    currentAudio.addEventListener('timeupdate', function() {
        // Сохраняем прогресс каждые 5 секунд
        if (Math.floor(currentAudio.currentTime) % 5 === 0) {
            saveProgress(trackId, 'user', currentAudio.currentTime / currentAudio.duration * 100);
        }
        
        // Обновляем глобальный плеер
        updateGlobalPlayer();
    });
    
    currentAudio.addEventListener('ended', function() {
        saveProgress(trackId, 'user', 0); // Сбрасываем прогресс
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
    updatePlayer(trackId, 'user');
    updateGlobalPlayer();
    
    // Настраиваем управление громкостью
    setupVolumeControl();
}

// Функция для паузы трека
function pauseUserTrack(trackId) {
    console.log('Пауза трека:', trackId);
    
    if (currentAudio && currentTrack && currentTrack.id === trackId && isPlaying) {
        currentAudio.pause();
        isPlaying = false;
        updateTrackUI(trackId, false);
        updateGlobalPlayer();
    }
}

// Функция для возобновления трека
function resumeUserTrack(trackId) {
    console.log('Возобновление трека:', trackId);
    
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

// Функция для переключения воспроизведения/паузы
function togglePlayPause(trackId) {
    if (currentTrack && currentTrack.id === trackId) {
        if (isPlaying) {
            pauseUserTrack(trackId);
        } else {
            resumeUserTrack(trackId);
        }
    } else {
        playUserTrack(trackId);
    }
}

// Функция для обновления глобального плеера
function updateGlobalPlayer() {
    const globalPlayer = document.getElementById('global-player');
    const playPauseBtn = document.querySelector('.play-pause-btn i');
    
    if (globalPlayer && currentTrack) {
        globalPlayer.style.display = 'block';
        
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

// Функция для форматирования времени
function formatTime(seconds) {
    if (isNaN(seconds)) return '0:00';
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

// Делаем функции глобальными
window.playUserTrack = playUserTrack;
window.pauseUserTrack = pauseUserTrack;
window.resumeUserTrack = resumeUserTrack;
window.togglePlayPause = togglePlayPause;

function deleteTrack(trackId) {
    console.log('Удаление трека:', trackId);
    
    // Извлекаем ID трека из строки "user_123"
    const actualTrackId = trackId.replace('user_', '');
    
    // Проверяем, не играет ли этот трек
    if (currentTrack && currentTrack.id === trackId) {
        if (currentAudio) {
            currentAudio.pause();
            currentAudio = null;
        }
        currentTrack = null;
        isPlaying = false;
        
        // Скрываем глобальный плеер
        const globalPlayer = document.getElementById('global-player');
        if (globalPlayer) {
            globalPlayer.style.display = 'none';
        }
    }
    
    if (confirm('Вы уверены, что хотите удалить этот трек? Это действие нельзя отменить.')) {
        // Показываем индикатор загрузки
        const trackElement = document.querySelector(`[data-track-id="${trackId}"]`);
        if (trackElement) {
            trackElement.style.opacity = '0.5';
            trackElement.style.pointerEvents = 'none';
        }
        
        fetch(`/api/delete_track/${actualTrackId}`, {
            method: 'DELETE'
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showNotification('Трек успешно удален', 'success');
                
                // Удаляем элемент из DOM с анимацией
                if (trackElement) {
                    trackElement.style.transition = 'all 0.3s ease';
                    trackElement.style.transform = 'translateX(-100%)';
                    trackElement.style.opacity = '0';
                    
                    setTimeout(() => {
                        trackElement.remove();
                        
                        // Обновляем счетчик треков
                        updateTrackCount();
                        
                        // Проверяем, есть ли еще треки
                        const remainingTracks = document.querySelectorAll('.user-track-item');
                        if (remainingTracks.length === 0) {
                            showEmptyState();
                        }
                    }, 300);
                }
            } else {
                showNotification(data.error || 'Ошибка при удалении трека', 'error');
                
                // Восстанавливаем элемент
                if (trackElement) {
                    trackElement.style.opacity = '1';
                    trackElement.style.pointerEvents = 'auto';
                }
            }
        })
        .catch(error => {
            console.error('Ошибка удаления трека:', error);
            showNotification('Ошибка при удалении трека', 'error');
            
            // Восстанавливаем элемент
            if (trackElement) {
                trackElement.style.opacity = '1';
                trackElement.style.pointerEvents = 'auto';
            }
        });
    }
}

// Функция для обновления счетчика треков
function updateTrackCount() {
    const trackCountElement = document.querySelector('.track-count');
    const tracks = document.querySelectorAll('.user-track-item');
    
    if (trackCountElement) {
        const count = tracks.length;
        trackCountElement.textContent = `${count} ${count === 1 ? 'трек' : count < 5 ? 'трека' : 'треков'}`;
    }
}

// Функция для показа пустого состояния
function showEmptyState() {
    const userTracksSection = document.querySelector('.user-tracks-section');
    if (userTracksSection) {
        const emptyState = document.createElement('div');
        emptyState.className = 'empty-state';
        emptyState.innerHTML = `
            <i class="fas fa-music"></i>
            <h3>У вас пока нет загруженных треков</h3>
            <p>Загрузите свой первый трек выше</p>
        `;
        
        const tracksList = userTracksSection.querySelector('.user-tracks-list');
        if (tracksList) {
            tracksList.style.display = 'none';
        }
        
        userTracksSection.appendChild(emptyState);
    }
}

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

function updatePlayer(trackId, trackType) {
    // Обновляем информацию в плеере
    const playerTrackInfo = document.querySelector('.player-track-info');
    const trackElement = document.querySelector(`[data-track-id="${trackId}"]`);
    
    if (playerTrackInfo && trackElement) {
        const title = trackElement.querySelector('h4').textContent;
        const artist = trackElement.querySelector('p').textContent;
        const img = trackElement.querySelector('img').src;
        
        playerTrackInfo.querySelector('h4').textContent = title;
        playerTrackInfo.querySelector('p').textContent = artist;
        playerTrackInfo.querySelector('img').src = img;
    }
}

function showNotification(message, type = 'info') {
    console.log('Показ уведомления:', message, type);
    
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
if (!document.getElementById('upload-notification-styles')) {
    const style = document.createElement('style');
    style.id = 'upload-notification-styles';
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
        
        .drag-over {
            background: rgba(79, 172, 254, 0.2) !important;
            border-color: #4facfe !important;
            transform: scale(1.02);
        }
    `;
    document.head.appendChild(style);
}

console.log('Upload.js полностью загружен');

function initTrackLikes() {
    console.log('Инициализация лайков треков');
    
    // Получаем все треки на странице
    const trackElements = document.querySelectorAll('.user-track-item');
    
    trackElements.forEach(trackElement => {
        const trackId = trackElement.getAttribute('data-track-id');
        const trackType = trackElement.getAttribute('data-track-type');
        
        if (trackId && trackType) {
            // Проверяем, лайкнут ли трек
            checkTrackLike(trackId, trackType);
            
            // Загружаем прогресс воспроизведения
            loadTrackProgress(trackId, trackType);
        }
    });
}

function checkTrackLike(trackId, trackType) {
    fetch(`/api/is_liked/${trackType}/${trackId}`)
    .then(response => response.json())
    .then(data => {
        const likeBtn = document.querySelector(`[data-track-id="${trackId}"][data-track-type="${trackType}"] .like-btn`);
        if (likeBtn && data.liked) {
            likeBtn.classList.add('liked');
        }
    })
    .catch(error => {
        console.error('Ошибка проверки лайка:', error);
    });
}

function loadTrackProgress(trackId, trackType) {
    fetch(`/api/get_progress/${trackType}/${trackId}`)
    .then(response => response.json())
    .then(data => {
        if (data.progress > 0) {
            updateTrackProgress(trackId, data.progress);
        }
    })
    .catch(error => {
        console.error('Ошибка загрузки прогресса:', error);
    });
}

function updateTrackProgress(trackId, progress) {
    const trackElement = document.querySelector(`[data-track-id="${trackId}"]`);
    if (trackElement) {
        const progressFill = trackElement.querySelector('.progress-fill');
        const progressText = trackElement.querySelector('.progress-text');
        
        if (progressFill) {
            progressFill.style.width = progress + '%';
        }
        
        if (progressText) {
            progressText.textContent = Math.round(progress) + '%';
        }
    }
}

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

// Функция для настройки управления громкостью
function setupVolumeControl() {
    const volumeSlider = document.getElementById('volume-slider');
    const volumeIcon = document.getElementById('volume-icon');
    
    if (volumeSlider && currentAudio) {
        // Устанавливаем начальное значение
        volumeSlider.value = userTrackVolume * 100;
        
        // Обработчик изменения громкости
        volumeSlider.addEventListener('input', function() {
            const volume = this.value / 100;
            setVolume(volume);
        });
        
        // Обработчик клика по иконке громкости
        if (volumeIcon) {
            volumeIcon.addEventListener('click', function() {
                toggleMute();
            });
        }
    }
}

// Функция для установки громкости
function setVolume(volume) {
    if (currentAudio) {
        userTrackVolume = volume;
        currentAudio.volume = isMuted ? 0 : volume;
        
        // Обновляем иконку громкости
        updateVolumeIcon(volume);
        
        // Сохраняем настройки в localStorage
        localStorage.setItem('userTrackVolume', volume);
        localStorage.setItem('userTrackMuted', isMuted);
    }
}

// Функция для переключения мута
function toggleMute() {
    isMuted = !isMuted;
    
    if (currentAudio) {
        currentAudio.volume = isMuted ? 0 : userTrackVolume;
        
        // Обновляем иконку
        updateVolumeIcon(isMuted ? 0 : userTrackVolume);
        
        // Обновляем слайдер
        const volumeSlider = document.getElementById('volume-slider');
        if (volumeSlider) {
            volumeSlider.value = isMuted ? 0 : userTrackVolume * 100;
        }
        
        // Сохраняем настройки
        localStorage.setItem('userTrackMuted', isMuted);
    }
}

// Функция для обновления иконки громкости
function updateVolumeIcon(volume) {
    const volumeIcon = document.getElementById('volume-icon');
    if (volumeIcon) {
        if (volume === 0 || isMuted) {
            volumeIcon.className = 'fas fa-volume-mute';
        } else if (volume < 0.5) {
            volumeIcon.className = 'fas fa-volume-down';
        } else {
            volumeIcon.className = 'fas fa-volume-up';
        }
    }
}

// Функция для загрузки сохраненных настроек громкости
function loadVolumeSettings() {
    const savedVolume = localStorage.getItem('userTrackVolume');
    const savedMuted = localStorage.getItem('userTrackMuted');
    
    if (savedVolume !== null) {
        userTrackVolume = parseFloat(savedVolume);
    }
    
    if (savedMuted !== null) {
        isMuted = savedMuted === 'true';
    }
}

// Функция для применения настроек громкости к текущему аудио
function applyVolumeSettings() {
    if (currentAudio) {
        currentAudio.volume = isMuted ? 0 : userTrackVolume;
        updateVolumeIcon(isMuted ? 0 : userTrackVolume);
        
        const volumeSlider = document.getElementById('volume-slider');
        if (volumeSlider) {
            volumeSlider.value = isMuted ? 0 : userTrackVolume * 100;
        }
    }
} 