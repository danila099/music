// JavaScript для страницы радио

let radioAudio = null;
let radioStation = null;
let radioIsMuted = false;
let radioSavedVolume = 0.5;

// Глобальная функция для доступа с других страниц
window.playRadio = function(stationId, stationName, streamUrl) {
    console.log('Воспроизведение радио:', stationName, 'URL:', streamUrl);
    
    // Останавливаем предыдущее воспроизведение
    if (radioAudio) {
        radioAudio.pause();
        radioAudio = null;
    }
    
    // Проверяем, является ли это демо-режимом
    if (streamUrl === 'demo') {
        console.log('Запуск демо-режима');
        createDemoAudio(stationName);
        return;
    }
    
    try {
        // Показываем статус загрузки
        if (typeof showRadioStatus === 'function') {
            showRadioStatus('Подключение к радиостанции...');
        }
        
        // Создаем новый аудио элемент
        radioAudio = new Audio();
        radioStation = {
            id: stationId,
            name: stationName,
            url: streamUrl
        };
        
        // Настраиваем аудио
        radioAudio.volume = radioIsMuted ? 0 : radioSavedVolume;
        radioAudio.loop = false;
        radioAudio.preload = 'auto';
        
        // Добавляем обработчики событий
        radioAudio.addEventListener('loadstart', function() {
            console.log('Загрузка радиостанции началась...');
            if (typeof showRadioStatus === 'function') {
                showRadioStatus('Загрузка радиостанции...');
            }
        });
        
        radioAudio.addEventListener('canplay', function() {
            console.log('Радио готово к воспроизведению');
            if (typeof showRadioStatus === 'function') {
                showRadioStatus('Радио готово');
            }
        });
        
        radioAudio.addEventListener('playing', function() {
            console.log('Радио играет');
            if (typeof showRadioStatus === 'function') {
                showRadioStatus('Радио играет');
            }
            if (typeof updateNowPlaying === 'function') {
                updateNowPlaying(stationId, stationName);
            }
            updatePlayerWithRadio(stationName);
        });
        
        radioAudio.addEventListener('waiting', function() {
            console.log('Радио буферизуется...');
            if (typeof showRadioStatus === 'function') {
                showRadioStatus('Буферизация...');
            }
        });
        
        radioAudio.addEventListener('error', function(e) {
            console.error('Ошибка воспроизведения радио:', e);
            console.error('Код ошибки:', radioAudio.error ? radioAudio.error.code : 'неизвестно');
            console.error('Сообщение ошибки:', radioAudio.error ? radioAudio.error.message : 'неизвестно');
            
            if (typeof showRadioStatus === 'function') {
                showRadioStatus('Ошибка воспроизведения');
            }
            
            // Показываем уведомление об ошибке
            showNotification(`Ошибка подключения к ${stationName}. Проверьте интернет-соединение.`, 'error');
            
            // Пробуем создать демо-звук
            createDemoAudio(stationName);
        });
        
        radioAudio.addEventListener('ended', function() {
            console.log('Радио остановлено');
            if (typeof showRadioStatus === 'function') {
                showRadioStatus('Радио остановлено');
            }
        });
        
        radioAudio.addEventListener('stalled', function() {
            console.log('Радио приостановлено');
            if (typeof showRadioStatus === 'function') {
                showRadioStatus('Соединение прервано');
            }
        });
        
        radioAudio.addEventListener('suspend', function() {
            console.log('Радио приостановлено (suspend)');
        });
        
        radioAudio.addEventListener('abort', function() {
            console.log('Радио прервано (abort)');
        });
        
        // Устанавливаем источник
        console.log('Устанавливаем источник аудио:', streamUrl);
        
        // Добавляем обработку CORS
        radioAudio.crossOrigin = 'anonymous';
        
        radioAudio.src = streamUrl;
        
        // Добавляем таймаут для проверки подключения
        const connectionTimeout = setTimeout(() => {
            if (radioAudio && radioAudio.readyState === 0) {
                console.log('Таймаут подключения к радиостанции');
                showNotification('Не удалось подключиться к радиостанции. Включаем демо-режим.', 'warning');
                createDemoAudio(stationName);
            }
        }, 15000); // 15 секунд
        
        radioAudio.addEventListener('canplay', function() {
            clearTimeout(connectionTimeout);
        });
        
        // Начинаем воспроизведение
        console.log('Пытаемся запустить воспроизведение...');
        radioAudio.play().then(() => {
            console.log('Радио успешно запущено:', stationName);
            showNotification(`Сейчас играет: ${stationName}`, 'success');
        }).catch(error => {
            console.error('Ошибка запуска радио:', error);
            console.error('Тип ошибки:', error.name);
            console.error('Сообщение ошибки:', error.message);
            clearTimeout(connectionTimeout);
            
            // Показываем уведомление об ошибке
            showNotification(`Ошибка запуска ${stationName}: ${error.message}`, 'error');
            
            // Пробуем создать демо-звук
            createDemoAudio(stationName);
        });
        
    } catch (error) {
        console.error('Ошибка создания аудио элемента:', error);
        showNotification(`Ошибка создания аудио: ${error.message}`, 'error');
        
        // Пробуем создать демо-звук
        createDemoAudio(stationName);
    }
};

document.addEventListener('DOMContentLoaded', function() {
    initRadioControls();
    initVolumeSlider();
    loadRadioStations();
});

function initRadioControls() {
    // Инициализация элементов управления
    const volumeSlider = document.getElementById('volumeSlider');
    if (volumeSlider) {
        volumeSlider.value = radioSavedVolume * 100;
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
    if (radioAudio) {
        radioAudio.pause();
        radioAudio = null;
    }
    
    // Останавливаем демо-звук если он играет
    if (radioStation && radioStation.id === 'demo') {
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
    
    radioStation = null;
    
    // Скрываем секцию "Сейчас играет"
    const nowPlayingSection = document.getElementById('nowPlayingSection');
    if (nowPlayingSection) {
        nowPlayingSection.style.display = 'none';
    }
    
    // Обновляем статус
    if (typeof showRadioStatus === 'function') {
        showRadioStatus('Радио остановлено');
    }
    
    showNotification('Радио остановлено', 'info');
}

function toggleMute() {
    if (!radioAudio) return;
    
    const volumeIcon = document.getElementById('volumeIcon');
    const volumeSlider = document.getElementById('volumeSlider');
    
    if (radioIsMuted) {
        // Включаем звук
        radioAudio.volume = radioSavedVolume;
        radioIsMuted = false;
        volumeIcon.className = 'fas fa-volume-up';
        if (volumeSlider) {
            volumeSlider.value = radioSavedVolume * 100;
        }
        showNotification('Звук включен', 'info');
    } else {
        // Выключаем звук
        radioSavedVolume = radioAudio.volume;
        radioAudio.volume = 0;
        radioIsMuted = true;
        volumeIcon.className = 'fas fa-volume-mute';
        if (volumeSlider) {
            volumeSlider.value = 0;
        }
        showNotification('Звук выключен', 'info');
    }
}

function setVolume(volume) {
    if (!radioAudio) return;
    
    radioSavedVolume = volume;
    if (!radioIsMuted) {
        radioAudio.volume = volume;
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
const radioStyle = document.createElement('style');
radioStyle.textContent = `
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
document.head.appendChild(radioStyle);

// Обработчик закрытия страницы
window.addEventListener('beforeunload', function() {
    if (radioAudio) {
        radioAudio.pause();
    }
});

// Обработчик потери фокуса (пауза при переключении вкладок)
document.addEventListener('visibilitychange', function() {
    if (document.hidden && radioAudio) {
        // Можно добавить автоматическую паузу при переключении вкладок
        // radioAudio.pause();
    }
});

// Функция для создания демо-звука
function createDemoAudio(stationName) {
    try {
        console.log('Создание демо-звука для:', stationName);
        
        // Создаем Web Audio API контекст
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        window.demoAudioContext = audioContext; // Сохраняем для возможности остановки
        
        // Создаем несколько осцилляторов для более богатого звука
        const oscillators = [];
        const frequencies = [220, 330, 440, 550]; // Аккорд
        const gains = [0.05, 0.03, 0.04, 0.02]; // Разная громкость
        
        for (let i = 0; i < frequencies.length; i++) {
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            // Настраиваем осциллятор
            oscillator.type = i % 2 === 0 ? 'sine' : 'triangle';
            oscillator.frequency.setValueAtTime(frequencies[i], audioContext.currentTime);
            
            // Настраиваем громкость с затуханием
            gainNode.gain.setValueAtTime(gains[i], audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 2);
            
            // Подключаем узлы
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillators.push({ oscillator, gainNode });
        }
        
        // Запускаем все осцилляторы
        oscillators.forEach(({ oscillator }) => {
            oscillator.start();
            oscillator.stop(audioContext.currentTime + 2);
        });
        
        // Создаем повторяющийся паттерн
        const repeatPattern = () => {
            if (window.demoAudioContext && window.demoAudioContext.state === 'running') {
                setTimeout(() => {
                    if (window.demoAudioContext && window.demoAudioContext.state === 'running') {
                        createDemoAudio(stationName);
                    }
                }, 2000);
            }
        };
        
        repeatPattern();
        
        // Обновляем статус
        if (typeof showRadioStatus === 'function') {
            showRadioStatus('Демо-режим');
        }
        
        showNotification(`Демо-режим: ${stationName} (внешний поток недоступен)`, 'info');
        
        // Очищаем текущий аудио
        radioAudio = null;
        radioStation = {
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
        radioAudio = null;
        radioStation = null;
    }
}

// Экспорт функций в глобальную область видимости
window.playRadio = window.playRadio;
window.stopRadio = stopRadio;
window.toggleMute = toggleMute;
window.setVolume = setVolume;
window.filterByGenre = filterByGenre;
window.showRadioStatus = showRadioStatus;
window.showNotification = showNotification;
window.updateNowPlaying = updateNowPlaying;
window.updatePlayerWithRadio = updatePlayerWithRadio;
window.loadRadioStations = loadRadioStations;
window.displayRadioStations = displayRadioStations;
window.refreshRadioStations = refreshRadioStations;

// Функция для загрузки радиостанций
function loadRadioStations() {
    fetch('/api/radio_stations')
        .then(response => response.json())
        .then(stations => {
            displayRadioStations(stations);
        })
        .catch(error => {
            console.error('Ошибка загрузки радиостанций:', error);
            showNotification('Ошибка загрузки радиостанций', 'error');
        });
}

// Функция для отображения радиостанций
function displayRadioStations(stations) {
    const radioGrid = document.getElementById('radioGrid');
    if (!radioGrid) return;
    
    radioGrid.innerHTML = '';
    
    stations.forEach(station => {
        const stationCard = document.createElement('div');
        stationCard.className = 'radio-card';
        stationCard.setAttribute('data-station-id', station.id);
        
        stationCard.innerHTML = `
            <div class="radio-cover">
                <img src="${station.image}" alt="${station.name}">
                <div class="radio-overlay">
                    <button class="play-radio-btn" 
                            onclick="playRadio('${station.id}', '${station.name}', '${station.stream_url}')">
                        <i class="fas fa-play"></i>
                    </button>
                </div>
            </div>
            <div class="radio-info">
                <h3>${station.name}</h3>
                <p class="radio-genre">${station.genre}</p>
                <p class="radio-description">${station.description}</p>
                <div class="radio-status">
                    <span class="status-text">Нажмите для воспроизведения</span>
                </div>
            </div>
        `;
        
        radioGrid.appendChild(stationCard);
        
        // Добавляем обработчик для проверки доступности при наведении
        stationCard.addEventListener('mouseenter', function() {
            checkStationAvailability(station.stream_url, stationCard);
        });
    });
}

// Функция для проверки доступности радиостанции
function checkStationAvailability(streamUrl, stationCard) {
    const statusElement = stationCard.querySelector('.status-text');
    if (!statusElement) return;
    
    statusElement.textContent = 'Проверка доступности...';
    
    // Создаем временный аудио элемент для проверки
    const testAudio = new Audio();
    let timeoutId;
    
    const cleanup = () => {
        clearTimeout(timeoutId);
        testAudio.removeEventListener('canplay', onCanPlay);
        testAudio.removeEventListener('error', onError);
        testAudio.src = '';
    };
    
    const onCanPlay = () => {
        cleanup();
        statusElement.textContent = 'Доступно';
        statusElement.style.color = '#4CAF50';
    };
    
    const onError = () => {
        cleanup();
        statusElement.textContent = 'Недоступно';
        statusElement.style.color = '#f44336';
    };
    
    testAudio.addEventListener('canplay', onCanPlay);
    testAudio.addEventListener('error', onError);
    
    // Устанавливаем таймаут
    timeoutId = setTimeout(() => {
        cleanup();
        statusElement.textContent = 'Проверка не завершена';
        statusElement.style.color = '#ff9800';
    }, 5000);
    
    // Пытаемся загрузить поток
    testAudio.src = streamUrl;
}

// Функция для обновления радиостанций
function refreshRadioStations() {
    const refreshBtn = document.querySelector('.refresh-btn');
    if (refreshBtn) {
        refreshBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Обновление...';
        refreshBtn.disabled = true;
    }
    
    loadRadioStations();
    
    setTimeout(() => {
        if (refreshBtn) {
            refreshBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Обновить';
            refreshBtn.disabled = false;
        }
    }, 3000);
} 