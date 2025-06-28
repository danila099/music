// JavaScript для страницы загрузки музыки

console.log('Upload.js загружен');

// Глобальные переменные для отслеживания состояния
let isUploading = false;
let selectedFile = null;

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM загружен, инициализируем загрузку');
    initUploadForm();
    initDragAndDrop();
    initTrackLikes();
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
            
            // Перезагружаем страницу через 2 секунды
            setTimeout(() => {
                window.location.reload();
            }, 2000);
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
        uploadBtn.disabled = false;
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
    
    // Создаем аудио элемент для воспроизведения
    const audio = new Audio(`/play/user/${actualTrackId}`);
    
    // Загружаем сохраненный прогресс
    loadProgress(trackId, 'user');
    
    // Обработчики событий
    audio.addEventListener('loadedmetadata', function() {
        console.log('Трек загружен:', audio.duration);
    });
    
    audio.addEventListener('timeupdate', function() {
        // Сохраняем прогресс каждые 5 секунд
        if (Math.floor(audio.currentTime) % 5 === 0) {
            saveProgress(trackId, 'user', audio.currentTime / audio.duration * 100);
        }
    });
    
    audio.addEventListener('ended', function() {
        saveProgress(trackId, 'user', 0); // Сбрасываем прогресс
    });
    
    // Воспроизводим трек
    audio.play().catch(error => {
        console.error('Ошибка воспроизведения:', error);
        showNotification('Ошибка воспроизведения трека', 'error');
    });
    
    // Обновляем плеер
    updatePlayer(trackId, 'user');
}

function deleteTrack(trackId) {
    console.log('Удаление трека:', trackId);
    
    // Извлекаем ID трека из строки "user_123"
    const actualTrackId = trackId.replace('user_', '');
    
    if (confirm('Вы уверены, что хотите удалить этот трек?')) {
        // Здесь можно добавить API для удаления трека
        fetch(`/api/delete_track/${actualTrackId}`, {
            method: 'DELETE'
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showNotification('Трек успешно удален', 'success');
                // Удаляем элемент из DOM
                const trackElement = document.querySelector(`[data-track-id="${trackId}"]`);
                if (trackElement) {
                    trackElement.remove();
                }
                // Перезагружаем страницу через 1 секунду
                setTimeout(() => {
                    window.location.reload();
                }, 1000);
            } else {
                showNotification(data.error || 'Ошибка при удалении трека', 'error');
            }
        })
        .catch(error => {
            console.error('Ошибка удаления трека:', error);
            showNotification('Ошибка при удалении трека', 'error');
        });
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