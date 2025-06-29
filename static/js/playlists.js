// JavaScript для управления плейлистами

let currentPlaylists = [];
let selectedTrackForPlaylist = null;

document.addEventListener('DOMContentLoaded', function() {
    console.log('Playlists.js загружен');
    initPlaylists();
});

function initPlaylists() {
    console.log('Инициализация плейлистов');
    
    // Загружаем плейлисты
    loadPlaylists();
    
    // Инициализируем форму создания плейлиста
    initCreatePlaylistForm();
}

function initCreatePlaylistForm() {
    const form = document.getElementById('createPlaylistForm');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            createPlaylist();
        });
    }
}

function createPlaylist() {
    const nameInput = document.getElementById('playlistName');
    const descriptionInput = document.getElementById('playlistDescription');
    const publicCheckbox = document.getElementById('playlistPublic');
    
    const name = nameInput.value.trim();
    const description = descriptionInput.value.trim();
    const isPublic = publicCheckbox.checked;
    
    if (!name) {
        showNotification('Введите название плейлиста', 'error');
        return;
    }
    
    const formData = {
        name: name,
        description: description,
        is_public: isPublic
    };
    
    fetch('/api/playlists/create', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showNotification('Плейлист создан успешно!', 'success');
            
            // Очищаем форму
            nameInput.value = '';
            descriptionInput.value = '';
            publicCheckbox.checked = true;
            
            // Перезагружаем плейлисты
            loadPlaylists();
        } else {
            showNotification(data.error || 'Ошибка создания плейлиста', 'error');
        }
    })
    .catch(error => {
        console.error('Ошибка создания плейлиста:', error);
        showNotification('Ошибка создания плейлиста', 'error');
    });
}

function loadPlaylists() {
    console.log('Загрузка плейлистов');
    
    fetch('/api/user/playlists')
    .then(response => response.json())
    .then(playlists => {
        currentPlaylists = playlists;
        displayPlaylists(playlists);
    })
    .catch(error => {
        console.error('Ошибка загрузки плейлистов:', error);
        showNotification('Ошибка загрузки плейлистов', 'error');
    });
}

function displayPlaylists(playlists) {
    const playlistsGrid = document.getElementById('playlistsGrid');
    if (!playlistsGrid) return;
    
    if (playlists.length === 0) {
        playlistsGrid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-list"></i>
                <h3>У вас пока нет плейлистов</h3>
                <p>Создайте свой первый плейлист выше</p>
            </div>
        `;
        return;
    }
    
    playlistsGrid.innerHTML = playlists.map(playlist => `
        <div class="playlist-card" data-playlist-id="${playlist.id}">
            <div class="playlist-cover">
                <img src="/static/images/placeholder.svg" alt="${playlist.name}">
                <div class="playlist-overlay">
                    <button class="play-btn" onclick="playPlaylist('${playlist.id}')">
                        <i class="fas fa-play"></i>
                    </button>
                </div>
            </div>
            <div class="playlist-info">
                <h3>${playlist.name}</h3>
                <p class="playlist-description">${playlist.description || 'Без описания'}</p>
                <div class="playlist-meta">
                    <span class="track-count">
                        <i class="fas fa-music"></i> ${playlist.track_count} треков
                    </span>
                    <span class="playlist-visibility">
                        <i class="fas fa-${playlist.is_public ? 'globe' : 'lock'}"></i>
                        ${playlist.is_public ? 'Публичный' : 'Приватный'}
                    </span>
                </div>
                <div class="playlist-actions">
                    <button class="action-btn" onclick="openPlaylist('${playlist.id}')" title="Открыть">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="action-btn" onclick="editPlaylist('${playlist.id}')" title="Редактировать">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn delete-btn" onclick="deletePlaylist('${playlist.id}')" title="Удалить">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

function openPlaylist(playlistId) {
    window.location.href = `/playlist/${playlistId}`;
}

function editPlaylist(playlistId) {
    // TODO: Реализовать редактирование плейлиста
    showNotification('Редактирование плейлистов будет добавлено в следующем обновлении', 'info');
}

function deletePlaylist(playlistId) {
    if (!confirm('Вы уверены, что хотите удалить этот плейлист? Это действие нельзя отменить.')) {
        return;
    }
    
    fetch(`/api/playlists/${playlistId}`, {
        method: 'DELETE'
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showNotification('Плейлист удален', 'success');
            loadPlaylists();
        } else {
            showNotification(data.error || 'Ошибка удаления плейлиста', 'error');
        }
    })
    .catch(error => {
        console.error('Ошибка удаления плейлиста:', error);
        showNotification('Ошибка удаления плейлиста', 'error');
    });
}

function playPlaylist(playlistId) {
    // TODO: Реализовать воспроизведение плейлиста
    showNotification('Воспроизведение плейлистов будет добавлено в следующем обновлении', 'info');
}

// Функции для добавления треков в плейлист
function showAddToPlaylistModal(trackId, trackType) {
    selectedTrackForPlaylist = { trackId, trackType };
    
    const modal = document.getElementById('addToPlaylistModal');
    const playlistsList = document.getElementById('playlistsList');
    
    if (currentPlaylists.length === 0) {
        playlistsList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-list"></i>
                <h3>У вас нет плейлистов</h3>
                <p>Создайте плейлист, чтобы добавить в него треки</p>
                <button class="create-btn" onclick="closeModal('addToPlaylistModal')">
                    <i class="fas fa-plus"></i> Создать плейлист
                </button>
            </div>
        `;
    } else {
        playlistsList.innerHTML = currentPlaylists.map(playlist => `
            <div class="playlist-item" onclick="addTrackToPlaylist('${playlist.id}')">
                <div class="playlist-item-info">
                    <h4>${playlist.name}</h4>
                    <p>${playlist.track_count} треков</p>
                </div>
                <button class="add-btn">
                    <i class="fas fa-plus"></i>
                </button>
            </div>
        `).join('');
    }
    
    modal.style.display = 'block';
}

function addTrackToPlaylist(playlistId) {
    if (!selectedTrackForPlaylist) return;
    
    const { trackId, trackType } = selectedTrackForPlaylist;
    
    fetch(`/api/playlists/${playlistId}/tracks`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            track_id: trackId,
            track_type: trackType
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showNotification('Трек добавлен в плейлист!', 'success');
            closeModal('addToPlaylistModal');
        } else {
            showNotification(data.error || 'Ошибка добавления трека', 'error');
        }
    })
    .catch(error => {
        console.error('Ошибка добавления трека:', error);
        showNotification('Ошибка добавления трека', 'error');
    });
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
    }
    selectedTrackForPlaylist = null;
}

// Глобальные функции для доступа с других страниц
window.showAddToPlaylistModal = showAddToPlaylistModal;
window.addTrackToPlaylist = addTrackToPlaylist;
window.closeModal = closeModal;

// Функция для показа уведомлений
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
    
    // Добавляем стили для уведомлений
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