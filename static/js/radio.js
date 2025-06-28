// JavaScript для страницы радио

let currentAudio = null;
let currentStation = null;
let isMuted = false;
let savedVolume = 0.5;

// Глобальная функция для доступа с других страниц
window.playRadio = function(stationId, stationName, streamUrl) {
    console.log('Воспроизведение радио:', stationName);
    
    // Останавливаем предыдущее воспроизведение
    if (currentAudio) {
        currentAudio.pause();
        currentAudio = null;
    }
    
    try {
        // Показываем статус загрузки
        if (typeof showRadioStatus === 'function') {
            showRadioStatus('Подключение к радиостанции...');
        }
        
        // Создаем новый аудио элемент с реальным потоком
        currentAudio = new Audio(streamUrl);
        currentStation = {
            id: stationId,
            name: stationName,
            url: streamUrl
        };
        
        // Настраиваем аудио
        currentAudio.volume = isMuted ? 0 : savedVolume;
        currentAudio.loop = false;
        currentAudio.preload = 'auto';
        
        // Обработчики событий
        currentAudio.addEventListener('loadstart', function() {
            console.log('Загрузка радиостанции...');
            if (typeof showRadioStatus === 'function') {
                showRadioStatus('Загрузка радиостанции...');
            }
        });
        
        currentAudio.addEventListener('canplay', function() {
            console.log('Радио готово к воспроизведению');
            if (typeof showRadioStatus === 'function') {
                showRadioStatus('Радио готово');
            }
        });
        
        currentAudio.addEventListener('playing', function() {
            console.log('Радио играет');
            if (typeof showRadioStatus === 'function') {
                showRadioStatus('Радио играет');
            }
            if (typeof updateNowPlaying === 'function') {
                updateNowPlaying(stationId, stationName);
            }
            updatePlayerWithRadio(stationName);
        });
        
        currentAudio.addEventListener('waiting', function() {
            console.log('Радио буферизуется...');
            if (typeof showRadioStatus === 'function') {
                showRadioStatus('Буферизация...');
            }
        });
        
        currentAudio.addEventListener('error', function(e) {
            console.error('Ошибка воспроизведения радио:', e);
            if (typeof showRadioStatus === 'function') {
                showRadioStatus('Ошибка воспроизведения');
            }
            
            // Пробуем создать демо-звук
            createDemoAudio(stationName);
        });
        
        currentAudio.addEventListener('ended', function() {
            if (typeof showRadioStatus === 'function') {
                showRadioStatus('Радио остановлено');
            }
        });
        
        currentAudio.addEventListener('stalled', function() {
            console.log('Радио приостановлено');
            if (typeof showRadioStatus === 'function') {
                showRadioStatus('Соединение прервано');
            }
        });
        
        // Начинаем воспроизведение
        currentAudio.play().then(() => {
            console.log('Радио запущено:', stationName);
            showNotification(`Сейчас играет: ${stationName}`, 'success');
        }).catch(error => {
            console.error('Ошибка запуска радио:', error);
            
            // Пробуем создать демо-звук
            createDemoAudio(stationName);
        });
        
    } catch (error) {
        console.error('Ошибка создания аудио элемента:', error);
        
        // Пробуем создать демо-звук
        createDemoAudio(stationName);
    }
};

document.addEventListener('DOMContentLoaded', function() {
    initRadioControls();
    initVolumeSlider();
});

function initRadioControls() {
    // Инициализация элементов управления
    const volumeSlider = document.getElementById('volumeSlider');
    if (volumeSlider) {
        volumeSlider.value = savedVolume * 100;
    }
}

function initVolumeSlider() {
    const volumeSlider = document.getElementById('volumeSlider');
    if (volumeSlider) {
        volumeSlider.addEventListener('input', function() {
            const volume = this.value / 100;
            setVolume(volume);
        });
    }
}

function playRadio(stationId, stationName, streamUrl) {
    // Вызываем глобальную функцию
    window.playRadio(stationId, stationName, streamUrl);
}

function stopRadio() {
    if (currentAudio) {
        currentAudio.pause();
        currentAudio = null;
    }
    
    // Останавливаем демо-звук если он играет
    if (currentStation && currentStation.id === 'demo') {
        // Останавливаем Web Audio API если он активен
        if (window.demoAudioContext) {
            try {
                window.demoAudioContext.close();
                window.demoAudioContext = null;
            } catch (e) {
                console.log('Web Audio API уже закрыт');
            }
        }
    }
    
    currentStation = null;
    
    // Скрываем секцию "Сейчас играет"
    const nowPlayingSection = document.getElementById('nowPlayingSection');
    if (nowPlayingSection) {
        nowPlayingSection.style.display = 'none';
    }
    
    showNotification('Радио остановлено', 'info');
}

function toggleMute() {
    if (!currentAudio) return;
    
    const volumeIcon = document.getElementById('volumeIcon');
    const volumeSlider = document.getElementById('volumeSlider');
    
    if (isMuted) {
        // Включаем звук
        currentAudio.volume = savedVolume;
        isMuted = false;
        volumeIcon.className = 'fas fa-volume-up';
        if (volumeSlider) {
            volumeSlider.value = savedVolume * 100;
        }
        showNotification('Звук включен', 'info');
    } else {
        // Выключаем звук
        savedVolume = currentAudio.volume;
        currentAudio.volume = 0;
        isMuted = true;
        volumeIcon.className = 'fas fa-volume-mute';
        if (volumeSlider) {
            volumeSlider.value = 0;
        }
        showNotification('Звук выключен', 'info');
    }
}

function setVolume(volume) {
    if (!currentAudio) return;
    
    savedVolume = volume;
    if (!isMuted) {
        currentAudio.volume = volume;
    }
    
    // Обновляем иконку громкости
    const volumeIcon = document.getElementById('volumeIcon');
    if (volumeIcon) {
        if (volume === 0) {
            volumeIcon.className = 'fas fa-volume-mute';
        } else if (volume < 0.5) {
            volumeIcon.className = 'fas fa-volume-down';
        } else {
            volumeIcon.className = 'fas fa-volume-up';
        }
    }
}

function updateNowPlaying(stationId, stationName) {
    // Показываем секцию "Сейчас играет"
    const nowPlayingSection = document.getElementById('nowPlayingSection');
    if (nowPlayingSection) {
        nowPlayingSection.style.display = 'block';
    }
    
    // Обновляем информацию о станции
    const currentStationName = document.getElementById('currentStationName');
    const currentStationGenre = document.getElementById('currentStationGenre');
    const currentStationDescription = document.getElementById('currentStationDescription');
    const currentStationImage = document.getElementById('currentStationImage');
    
    if (currentStationName) currentStationName.textContent = stationName;
    
    // Получаем дополнительную информацию о станции
    fetch('/api/radio_stations')
    .then(response => response.json())
    .then(stations => {
        const station = stations.find(s => s.id == stationId);
        if (station) {
            if (currentStationGenre) currentStationGenre.textContent = station.genre;
            if (currentStationDescription) currentStationDescription.textContent = station.description;
            if (currentStationImage) currentStationImage.src = station.image;
        }
    })
    .catch(error => {
        console.error('Ошибка получения информации о станции:', error);
    });
    
    // Обновляем плеер
    updatePlayerWithRadio(stationName);
}

function updatePlayerWithRadio(stationName) {
    const playerTrackInfo = document.querySelector('.player-track-info');
    if (playerTrackInfo) {
        playerTrackInfo.querySelector('h4').textContent = stationName;
        playerTrackInfo.querySelector('p').textContent = 'Радио';
        playerTrackInfo.querySelector('img').src = 'https://via.placeholder.com/60x60/4facfe/ffffff?text=Р';
    }
}

function filterByGenre(genre) {
    // Фильтрация радиостанций по жанру
    const radioCards = document.querySelectorAll('.radio-card');
    
    radioCards.forEach(card => {
        const cardGenre = card.querySelector('.radio-genre').textContent;
        if (genre === 'Все' || cardGenre === genre) {
            card.style.display = 'block';
            card.style.animation = 'fadeIn 0.3s ease-out';
        } else {
            card.style.display = 'none';
        }
    });
    
    // Обновляем заголовок
    const sectionHeader = document.querySelector('.radio-section .section-header h2');
    if (sectionHeader) {
        sectionHeader.textContent = genre === 'Все' ? 'Популярные радиостанции' : `${genre} радиостанции`;
    }
    
    showNotification(`Показаны ${genre} радиостанции`, 'info');
}

function showRadioStatus(status) {
    const statusElement = document.getElementById('radioStatus');
    const statusText = document.getElementById('statusText');
    
    if (statusElement && statusText) {
        statusText.textContent = status;
        statusElement.classList.add('show');
        
        // Скрываем статус через 3 секунды
        setTimeout(() => {
            statusElement.classList.remove('show');
        }, 3000);
    }
    
    console.log('Статус радио:', status);
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

// Добавляем CSS анимации
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
    
    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
    }
    
    .radio-card {
        transition: all 0.3s ease;
    }
    
    .radio-card:hover {
        transform: translateY(-5px);
        box-shadow: 0 10px 30px rgba(0,0,0,0.3);
    }
    
    .play-radio-btn {
        transition: all 0.3s ease;
    }
    
    .play-radio-btn:hover {
        transform: scale(1.1);
    }
    
    .volume-slider {
        width: 100px;
        height: 4px;
        border-radius: 2px;
        background: rgba(255,255,255,0.2);
        outline: none;
        -webkit-appearance: none;
    }
    
    .volume-slider::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 16px;
        height: 16px;
        border-radius: 50%;
        background: #4facfe;
        cursor: pointer;
    }
    
    .volume-slider::-moz-range-thumb {
        width: 16px;
        height: 16px;
        border-radius: 50%;
        background: #4facfe;
        cursor: pointer;
        border: none;
    }
`;
document.head.appendChild(style);

// Обработчик закрытия страницы
window.addEventListener('beforeunload', function() {
    if (currentAudio) {
        currentAudio.pause();
    }
});

// Обработчик потери фокуса (пауза при переключении вкладок)
document.addEventListener('visibilitychange', function() {
    if (document.hidden && currentAudio) {
        // Можно добавить автоматическую паузу при переключении вкладок
        // currentAudio.pause();
    }
});

// Функция для создания демо-звука
function createDemoAudio(stationName) {
    try {
        console.log('Создание демо-звука для:', stationName);
        
        // Создаем Web Audio API контекст
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        window.demoAudioContext = audioContext; // Сохраняем для возможности остановки
        
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        // Настраиваем осциллятор
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(440, audioContext.currentTime); // Ля первой октавы
        
        // Настраиваем громкость
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        
        // Подключаем узлы
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        // Запускаем осциллятор
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.5);
        
        // Обновляем статус
        if (typeof showRadioStatus === 'function') {
            showRadioStatus('Демо-режим');
        }
        
        showNotification(`Демо-режим: ${stationName} (внешний поток недоступен)`, 'info');
        
        // Очищаем текущий аудио
        currentAudio = null;
        currentStation = {
            id: 'demo',
            name: stationName,
            url: 'demo'
        };
        
        // Обновляем UI
        if (typeof updateNowPlaying === 'function') {
            updateNowPlaying('demo', stationName);
        }
        updatePlayerWithRadio(stationName);
        
    } catch (error) {
        console.error('Ошибка создания демо-звука:', error);
        showNotification('Ошибка воспроизведения радиостанции. Попробуйте другую станцию.', 'error');
        
        if (typeof showRadioStatus === 'function') {
            showRadioStatus('Ошибка воспроизведения');
        }
        
        // Очищаем текущий аудио
        currentAudio = null;
        currentStation = null;
    }
} 