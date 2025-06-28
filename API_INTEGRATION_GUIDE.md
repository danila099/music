# 🚀 Руководство по интеграции внешних API

## 📋 **Что можно добавить:**

### **1. Музыкальные API:**
- **Spotify API** - поиск треков, плейлисты, рекомендации
- **Last.fm API** - статистика прослушивания, похожие треки
- **YouTube Data API** - музыкальные видео, клипы
- **Genius API** - тексты песен, информация об исполнителях
- **Deezer API** - каталог музыки, плейлисты
- **VK Music API** - русская музыка, социальные функции

### **2. Дополнительные API:**
- **OpenWeather API** - рекомендации музыки по погоде
- **News API** - музыкальные новости
- **Translation API** - перевод текстов песен
- **AI/ML API** - умные рекомендации

## 🔧 **Как добавить API:**

### **Шаг 1: Получение API ключей**

#### **Spotify API:**
1. Зайдите на [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Создайте новое приложение
3. Получите `Client ID` и `Client Secret`
4. Добавьте в переменные окружения:
```bash
SPOTIFY_CLIENT_ID=your_client_id
SPOTIFY_CLIENT_SECRET=your_client_secret
```

#### **Last.fm API:**
1. Зайдите на [Last.fm API](https://www.last.fm/api)
2. Создайте аккаунт и получите API ключ
3. Добавьте в переменные окружения:
```bash
LASTFM_API_KEY=your_api_key
```

#### **YouTube Data API:**
1. Зайдите в [Google Cloud Console](https://console.cloud.google.com/)
2. Создайте проект и включите YouTube Data API
3. Получите API ключ
4. Добавьте в переменные окружения:
```bash
YOUTUBE_API_KEY=your_api_key
```

### **Шаг 2: Создание API клиента**

Создайте файл `api_clients.py`:

```python
import os
import requests
from typing import Dict, List, Optional

class SpotifyClient:
    def __init__(self):
        self.client_id = os.getenv('SPOTIFY_CLIENT_ID')
        self.client_secret = os.getenv('SPOTIFY_CLIENT_SECRET')
        self.access_token = None
    
    def authenticate(self):
        # Логика аутентификации
        pass
    
    def search_tracks(self, query: str) -> List[Dict]:
        # Поиск треков
        pass

class LastFMClient:
    def __init__(self):
        self.api_key = os.getenv('LASTFM_API_KEY')
    
    def get_similar_tracks(self, artist: str, track: str) -> List[Dict]:
        # Получение похожих треков
        pass
```

### **Шаг 3: Интеграция в Flask**

Добавьте маршруты в `main.py`:

```python
from api_clients import SpotifyClient, LastFMClient

# Инициализация клиентов
spotify_client = SpotifyClient()
lastfm_client = LastFMClient()

@app.route('/api/spotify/search')
def spotify_search():
    query = request.args.get('q', '')
    if not query:
        return jsonify([])
    
    tracks = spotify_client.search_tracks(query)
    return jsonify(tracks)

@app.route('/api/lastfm/similar/<artist>/<track>')
def lastfm_similar(artist, track):
    similar = lastfm_client.get_similar_tracks(artist, track)
    return jsonify(similar)
```

### **Шаг 4: Обновление фронтенда**

Добавьте JavaScript функции:

```javascript
// Поиск в Spotify
async function searchSpotify(query) {
    try {
        const response = await fetch(`/api/spotify/search?q=${encodeURIComponent(query)}`);
        const tracks = await response.json();
        displaySpotifyResults(tracks);
    } catch (error) {
        console.error('Ошибка поиска Spotify:', error);
    }
}

// Получение похожих треков
async function getSimilarTracks(artist, track) {
    try {
        const response = await fetch(`/api/lastfm/similar/${encodeURIComponent(artist)}/${encodeURIComponent(track)}`);
        const similar = await response.json();
        displaySimilarTracks(similar);
    } catch (error) {
        console.error('Ошибка получения похожих треков:', error);
    }
}
```

## 🎯 **Примеры интеграций:**

### **1. Рекомендации по погоде:**
```python
def get_weather_recommendations(city: str) -> List[str]:
    weather = weather_api.get_weather(city)
    if weather['temp'] > 25:
        return ['Латино', 'Регги', 'Поп']
    elif weather['temp'] < 0:
        return ['Метал', 'Рок', 'Электроника']
    else:
        return ['Поп', 'Джаз', 'Классика']
```

### **2. Умные плейлисты:**
```python
def create_smart_playlist(mood: str, genre: str) -> List[Dict]:
    # Используем несколько API для создания плейлиста
    spotify_tracks = spotify_client.get_tracks_by_mood(mood)
    lastfm_similar = lastfm_client.get_similar_by_genre(genre)
    
    # Объединяем и ранжируем результаты
    return rank_and_merge_tracks(spotify_tracks, lastfm_similar)
```

### **3. Тексты песен:**
```python
def get_lyrics(artist: str, track: str) -> str:
    # Пробуем несколько источников
    lyrics = genius_client.get_lyrics(artist, track)
    if not lyrics:
        lyrics = musixmatch_client.get_lyrics(artist, track)
    return lyrics
```

## 🔒 **Безопасность:**

### **1. Переменные окружения:**
- Никогда не храните API ключи в коде
- Используйте файл `.env` (добавьте в .gitignore)
- Используйте библиотеку `python-dotenv`

### **2. Ограничения запросов:**
```python
from functools import wraps
import time

def rate_limit(max_requests=100, window=3600):
    def decorator(f):
        @wraps(f)
        def wrapper(*args, **kwargs):
            # Логика ограничения запросов
            return f(*args, **kwargs)
        return wrapper
    return decorator
```

### **3. Кэширование:**
```python
import redis

redis_client = redis.Redis(host='localhost', port=6379, db=0)

def cached_api_call(ttl=3600):
    def decorator(f):
        @wraps(f)
        def wrapper(*args, **kwargs):
            cache_key = f"{f.__name__}:{hash(str(args) + str(kwargs))}"
            cached = redis_client.get(cache_key)
            if cached:
                return json.loads(cached)
            
            result = f(*args, **kwargs)
            redis_client.setex(cache_key, ttl, json.dumps(result))
            return result
        return wrapper
    return decorator
```

## 📊 **Мониторинг и логирование:**

```python
import logging
from datetime import datetime

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def log_api_call(api_name: str, endpoint: str, status: str):
    logger.info(f"API Call: {api_name} - {endpoint} - {status} - {datetime.now()}")
```

## 🚀 **Готовые интеграции:**

### **1. Spotify Integration:**
- Поиск треков и альбомов
- Получение плейлистов
- Рекомендации на основе жанров
- Информация об исполнителях

### **2. Last.fm Integration:**
- Статистика прослушивания
- Похожие треки и исполнители
- Топ чарты
- Теги и жанры

### **3. YouTube Integration:**
- Музыкальные видео
- Клипы исполнителей
- Live выступления
- Плейлисты YouTube

### **4. Weather + Music:**
- Рекомендации по погоде
- Сезонные плейлисты
- Настроение-зависимая музыка

## 💡 **Идеи для развития:**

1. **AI рекомендации** - использование машинного обучения
2. **Социальные функции** - обмен плейлистами
3. **Голосовое управление** - интеграция с Alexa/Siri
4. **AR/VR** - визуализация музыки
5. **IoT интеграция** - умные колонки
6. **Блокчейн** - токенизация музыки

## 📚 **Полезные ресурсы:**

- [Spotify Web API](https://developer.spotify.com/documentation/web-api/)
- [Last.fm API](https://www.last.fm/api)
- [YouTube Data API](https://developers.google.com/youtube/v3)
- [Genius API](https://docs.genius.com/)
- [OpenWeather API](https://openweathermap.org/api) 