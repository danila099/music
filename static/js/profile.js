// JavaScript для страницы профиля

console.log('Profile.js загружен');

// Глобальные переменные
let currentTab = 'overview';
let listeningChart = null;

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM загружен, инициализируем профиль');
    initProfile();
    loadTabContent(currentTab);
    initCharts();
    initSettings();
});

function initProfile() {
    console.log('Инициализация профиля');
    
    // Загружаем данные пользователя
    loadUserData();
    
    // Инициализируем обработчики событий
    initEventHandlers();
}

function initEventHandlers() {
    // Обработчик для формы редактирования профиля
    const editProfileForm = document.getElementById('edit-profile-form');
    if (editProfileForm) {
        editProfileForm.addEventListener('submit', function(e) {
            e.preventDefault();
            saveProfileChanges();
        });
    }
    
    // Обработчик для формы создания плейлиста
    const createPlaylistForm = document.getElementById('create-playlist-form');
    if (createPlaylistForm) {
        createPlaylistForm.addEventListener('submit', function(e) {
            e.preventDefault();
            createNewPlaylist();
        });
    }
    
    // Обработчики для настроек
    document.querySelectorAll('.switch input[type="checkbox"]').forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            saveSetting(this.id, this.checked);
        });
    });
    
    // Обработчик для слайдера громкости
    const volumeSlider = document.getElementById('default-volume');
    if (volumeSlider) {
        volumeSlider.addEventListener('input', function() {
            document.getElementById('volume-value').textContent = this.value + '%';
            saveSetting('default_volume', this.value);
        });
    }
}

function loadUserData() {
    console.log('Загрузка данных пользователя');
    
    fetch('/api/user/profile')
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            updateProfileUI(data.user);
        } else {
            console.error('Ошибка загрузки профиля:', data.error);
        }
    })
    .catch(error => {
        console.error('Ошибка загрузки профиля:', error);
    });
}

function updateProfileUI(user) {
    // Обновляем статистику
    document.querySelectorAll('.stat-number').forEach((stat, index) => {
        const values = [user.tracks_count, user.playlists_count, user.favorites_count, user.listening_time];
        if (values[index] !== undefined) {
            stat.textContent = values[index];
        }
    });
    
    // Обновляем имя пользователя и email
    const usernameElements = document.querySelectorAll('h1, #username, #edit-username');
    usernameElements.forEach(el => {
        if (el.tagName === 'H1') {
            el.textContent = user.username;
        } else {
            el.value = user.username;
        }
    });
    
    const emailElements = document.querySelectorAll('.user-email, #email, #edit-email');
    emailElements.forEach(el => {
        if (el.classList.contains('user-email')) {
            el.textContent = user.email;
        } else {
            el.value = user.email;
        }
    });
    
    // Обновляем био
    const bioElements = document.querySelectorAll('#bio, #edit-bio');
    bioElements.forEach(el => {
        el.value = user.bio || '';
    });
}

function switchTab(tabName) {
    console.log('Переключение на вкладку:', tabName);
    
    // Убираем активный класс со всех вкладок
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    // Добавляем активный класс к выбранной вкладке
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    document.getElementById(tabName).classList.add('active');
    
    currentTab = tabName;
    loadTabContent(tabName);
}

function loadTabContent(tabName) {
    console.log('Загрузка содержимого вкладки:', tabName);
    
    switch(tabName) {
        case 'tracks':
            loadUserTracks();
            break;
        case 'playlists':
            loadUserPlaylists();
            break;
        case 'favorites':
            loadFavorites();
            break;
        case 'history':
            loadHistory();
            break;
        case 'settings':
            loadSettings();
            break;
    }
}

function loadUserTracks() {
    console.log('Загрузка пользовательских треков');
    
    fetch('/api/user/tracks')
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            displayUserTracks(data.tracks);
        } else {
            console.error('Ошибка загрузки треков:', data.error);
        }
    })
    .catch(error => {
        console.error('Ошибка загрузки треков:', error);
    });
}

function displayUserTracks(tracks) {
    const tracksList = document.getElementById('user-tracks-list');
    
    if (tracks.length === 0) {
        tracksList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-music"></i>
                <h3>У вас пока нет загруженных треков</h3>
                <p>Загрузите свой первый трек и начните слушать любимую музыку</p>
                <a href="/upload" class="upload-btn">
                    <i class="fas fa-upload"></i> Загрузить музыку
                </a>
            </div>
        `;
        return;
    }
    
    tracksList.innerHTML = tracks.map(track => `
        <div class="track-item user-track-item" data-track-id="user_${track.id}" data-track-type="user">
            <div class="track-info">
                <div class="track-cover">
                    <img src="https://via.placeholder.com/50x50/${getRandomColor()}/ffffff?text=${track.title[0].toUpperCase()}" alt="Track">
                    <div class="track-overlay">
                        <button class="play-track-btn" onclick="togglePlayPause('user_${track.id}')">
                            <i class="fas fa-play"></i>
                        </button>
                    </div>
                </div>
                <div class="track-details">
                    <h4>${track.title}</h4>
                    <p>${track.artist}</p>
                    <span class="track-meta">
                        <i class="fas fa-clock"></i> ${track.duration}
                        <i class="fas fa-calendar"></i> ${track.upload_date}
                    </span>
                </div>
            </div>
            <div class="track-controls">
                <button class="play-btn" onclick="togglePlayPause('user_${track.id}')" data-track-id="user_${track.id}">
                    <i class="fas fa-play"></i>
                </button>
                <button class="like-btn" onclick="toggleLike('user_${track.id}', 'user')" data-track-id="user_${track.id}">
                    <i class="fas fa-heart"></i>
                </button>
                <button class="delete-btn" onclick="deleteTrack('user_${track.id}')" data-track-id="user_${track.id}">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

function loadUserPlaylists() {
    console.log('Загрузка пользовательских плейлистов');
    
    fetch('/api/user/playlists')
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            displayUserPlaylists(data.playlists);
        } else {
            console.error('Ошибка загрузки плейлистов:', data.error);
        }
    })
    .catch(error => {
        console.error('Ошибка загрузки плейлистов:', error);
    });
}

function displayUserPlaylists(playlists) {
    const playlistsGrid = document.getElementById('user-playlists');
    
    if (playlists.length === 0) {
        playlistsGrid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-list"></i>
                <h3>У вас пока нет плейлистов</h3>
                <p>Создайте свой первый плейлист и организуйте любимую музыку</p>
                <button class="create-playlist-btn" onclick="createPlaylist()">
                    <i class="fas fa-plus"></i> Создать плейлист
                </button>
            </div>
        `;
        return;
    }
    
    playlistsGrid.innerHTML = playlists.map(playlist => `
        <div class="playlist-card" onclick="openPlaylist(${playlist.id})">
            <div class="playlist-cover">
                <img src="${playlist.cover || 'https://via.placeholder.com/200x200/4facfe/ffffff?text=' + playlist.name[0].toUpperCase()}" alt="${playlist.name}">
                <div class="playlist-overlay">
                    <button class="play-btn" onclick="event.stopPropagation(); playFirstTrackFromPlaylist('${playlist.id}')">
                        <i class="fas fa-play"></i>
                    </button>
                </div>
            </div>
            <div class="playlist-info">
                <h3>${playlist.name}</h3>
                <p>${playlist.tracks_count} треков</p>
                <p class="playlist-description">${playlist.description || ''}</p>
            </div>
        </div>
    `).join('');
}

function loadFavorites() {
    console.log('Загрузка любимых треков');
    
    fetch('/api/favorites')
    .then(response => response.json())
    .then(data => {
        displayFavorites(data);
    })
    .catch(error => {
        console.error('Ошибка загрузки любимых треков:', error);
    });
}

function displayFavorites(favorites) {
    const favoritesList = document.getElementById('favorites-list');
    
    if (favorites.length === 0) {
        favoritesList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-heart"></i>
                <h3>У вас пока нет любимых треков</h3>
                <p>Добавляйте треки в избранное, нажимая на сердечко</p>
            </div>
        `;
        return;
    }
    
    favoritesList.innerHTML = favorites.map(track => `
        <div class="track-item favorite-track-item" data-track-id="${track.id}" data-track-type="${track.type}">
            <div class="track-info">
                <div class="track-cover">
                    <img src="https://via.placeholder.com/50x50/${getRandomColor()}/ffffff?text=${track.title[0].toUpperCase()}" alt="Track">
                    <div class="track-overlay">
                        <button class="play-track-btn" onclick="togglePlayPause('${track.id}')">
                            <i class="fas fa-play"></i>
                        </button>
                    </div>
                </div>
                <div class="track-details">
                    <h4>${track.title}</h4>
                    <p>${track.artist}</p>
                    <span class="track-meta">
                        <i class="fas fa-clock"></i> ${track.duration}
                        ${track.type === 'playlist' ? `<i class="fas fa-list"></i> ${track.playlist_name}` : ''}
                    </span>
                </div>
            </div>
            <div class="track-controls">
                <button class="play-btn" onclick="togglePlayPause('${track.id}')" data-track-id="${track.id}">
                    <i class="fas fa-play"></i>
                </button>
                <button class="like-btn liked" onclick="toggleLike('${track.id}', '${track.type}')" data-track-id="${track.id}">
                    <i class="fas fa-heart"></i>
                </button>
                <button class="remove-btn" onclick="removeFromFavorites('${track.id}', '${track.type}')" data-track-id="${track.id}">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        </div>
    `).join('');
}

function loadHistory() {
    console.log('Загрузка истории прослушивания');
    
    const period = document.getElementById('history-period').value;
    
    fetch(`/api/user/history?period=${period}`)
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            displayHistory(data.history);
        } else {
            console.error('Ошибка загрузки истории:', data.error);
        }
    })
    .catch(error => {
        console.error('Ошибка загрузки истории:', error);
    });
}

function displayHistory(history) {
    const historyList = document.getElementById('history-list');
    
    if (history.length === 0) {
        historyList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-history"></i>
                <h3>История прослушивания пуста</h3>
                <p>Начните слушать музыку, чтобы увидеть историю</p>
            </div>
        `;
        return;
    }
    
    historyList.innerHTML = history.map(item => `
        <div class="history-item">
            <div class="history-track-info">
                <img src="https://via.placeholder.com/40x40/${getRandomColor()}/ffffff?text=${item.title[0].toUpperCase()}" alt="Track">
                <div>
                    <h4>${item.title}</h4>
                    <p>${item.artist}</p>
                    <span class="history-meta">
                        <i class="fas fa-play"></i> ${item.play_count} раз
                        <i class="fas fa-clock"></i> ${item.total_duration} мин
                        <i class="fas fa-calendar"></i> ${item.last_played}
                    </span>
                </div>
            </div>
            <div class="history-actions">
                <button class="play-btn" onclick="playHistoryTrack('${item.track_id}', '${item.track_type}')">
                    <i class="fas fa-play"></i>
                </button>
                <button class="like-btn" onclick="toggleLike('${item.track_id}', '${item.track_type}')">
                    <i class="fas fa-heart"></i>
                </button>
            </div>
        </div>
    `).join('');
}

function initCharts() {
    console.log('Инициализация графиков');
    
    // Создаем график прослушивания
    const ctx = document.getElementById('listeningChart');
    if (ctx) {
        listeningChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'],
                datasets: [{
                    label: 'Часы прослушивания',
                    data: [2, 3, 1.5, 4, 2.5, 5, 3.5],
                    borderColor: '#4facfe',
                    backgroundColor: 'rgba(79, 172, 254, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: '#ffffff'
                        }
                    },
                    x: {
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: '#ffffff'
                        }
                    }
                }
            }
        });
    }
}

function initSettings() {
    console.log('Инициализация настроек');
    
    // Загружаем текущие настройки
    loadUserSettings();
}

function loadUserSettings() {
    fetch('/api/user/settings')
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            applySettings(data.settings);
        }
    })
    .catch(error => {
        console.error('Ошибка загрузки настроек:', error);
    });
}

function applySettings(settings) {
    // Применяем настройки к переключателям
    Object.keys(settings).forEach(key => {
        const element = document.getElementById(key);
        if (element) {
            if (element.type === 'checkbox') {
                element.checked = settings[key];
            } else if (element.type === 'range') {
                element.value = settings[key];
                const valueDisplay = document.getElementById(key.replace('default_', '') + '-value');
                if (valueDisplay) {
                    valueDisplay.textContent = settings[key] + '%';
                }
            }
        }
    });
}

function saveSetting(settingName, value) {
    console.log('Сохранение настройки:', settingName, value);
    
    fetch('/api/user/settings', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            setting: settingName,
            value: value
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showNotification('Настройка сохранена', 'success');
        } else {
            console.error('Ошибка сохранения настройки:', data.error);
            showNotification('Ошибка сохранения настройки', 'error');
        }
    })
    .catch(error => {
        console.error('Ошибка сохранения настройки:', error);
        showNotification('Ошибка сохранения настройки', 'error');
    });
}

function saveProfileChanges() {
    console.log('Сохранение изменений профиля');
    
    const formData = new FormData(document.getElementById('edit-profile-form'));
    const data = Object.fromEntries(formData);
    
    fetch('/api/user/profile', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showNotification('Профиль обновлен', 'success');
            closeModal('edit-profile-modal');
            loadUserData();
        } else {
            console.error('Ошибка обновления профиля:', data.error);
            showNotification('Ошибка обновления профиля', 'error');
        }
    })
    .catch(error => {
        console.error('Ошибка обновления профиля:', error);
        showNotification('Ошибка обновления профиля', 'error');
    });
}

function createNewPlaylist() {
    console.log('Создание нового плейлиста');
    
    const formData = new FormData(document.getElementById('create-playlist-form'));
    const data = Object.fromEntries(formData);
    
    fetch('/api/playlists', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showNotification('Плейлист создан', 'success');
            closeModal('create-playlist-modal');
            loadUserPlaylists();
        } else {
            console.error('Ошибка создания плейлиста:', data.error);
            showNotification('Ошибка создания плейлиста', 'error');
        }
    })
    .catch(error => {
        console.error('Ошибка создания плейлиста:', error);
        showNotification('Ошибка создания плейлиста', 'error');
    });
}

// Функции для работы с модальными окнами
function editProfile() {
    openModal('edit-profile-modal');
}

function createPlaylist() {
    openModal('create-playlist-modal');
}

function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'flex';
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
    }
}

// Функции для работы с треками
function playHistoryTrack(trackId, trackType) {
    if (trackType === 'user') {
        if (window.playUserTrack) {
            window.playUserTrack(trackId);
        }
    } else if (trackType === 'playlist') {
        if (window.playPlaylistTrack) {
            window.playPlaylistTrack(trackId);
        }
    }
}

function removeFromFavorites(trackId, trackType) {
    console.log('Удаление из любимых:', trackId, trackType);
    
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
            showNotification('Трек удален из любимых', 'success');
            loadFavorites(); // Перезагружаем список
        }
    })
    .catch(error => {
        console.error('Ошибка удаления из любимых:', error);
        showNotification('Ошибка удаления из любимых', 'error');
    });
}

function openPlaylist(playlistId) {
    window.location.href = `/playlist/${playlistId}`;
}

function sortFavorites() {
    const sortBy = document.getElementById('favorites-sort').value;
    console.log('Сортировка любимых по:', sortBy);
    
    // Здесь можно добавить логику сортировки
    loadFavorites(); // Перезагружаем с новой сортировкой
}

function filterHistory() {
    console.log('Фильтрация истории');
    loadHistory(); // Перезагружаем с новым фильтром
}

function changeAvatar() {
    console.log('Смена аватара');
    
    // Создаем input для выбора файла
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    
    input.onchange = function(e) {
        const file = e.target.files[0];
        if (file) {
            uploadAvatar(file);
        }
    };
    
    input.click();
}

function uploadAvatar(file) {
    console.log('Загрузка аватара:', file.name);
    
    const formData = new FormData();
    formData.append('avatar', file);
    
    fetch('/api/user/avatar', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showNotification('Аватар обновлен', 'success');
            // Обновляем изображение аватара
            const avatarImg = document.querySelector('.profile-avatar img');
            if (avatarImg) {
                avatarImg.src = data.avatar_url;
            }
        } else {
            console.error('Ошибка загрузки аватара:', data.error);
            showNotification('Ошибка загрузки аватара', 'error');
        }
    })
    .catch(error => {
        console.error('Ошибка загрузки аватара:', error);
        showNotification('Ошибка загрузки аватара', 'error');
    });
}

// Утилиты
function getRandomColor() {
    const colors = ['ff6b6b', '4ecdc4', '45b7d1', '96ceb4', 'ffeaa7', 'dda0dd', '4facfe', '00f2fe'];
    return colors[Math.floor(Math.random() * colors.length)];
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
window.editProfile = editProfile;
window.createPlaylist = createPlaylist;
window.openModal = openModal;
window.closeModal = closeModal;
window.switchTab = switchTab;
window.sortFavorites = sortFavorites;
window.filterHistory = filterHistory;
window.changeAvatar = changeAvatar;
window.playHistoryTrack = playHistoryTrack;
window.removeFromFavorites = removeFromFavorites;
window.openPlaylist = openPlaylist; 