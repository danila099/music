from flask import Flask, render_template, request, jsonify, redirect, url_for, send_file, session
import os
import json
from datetime import datetime
import uuid
from werkzeug.utils import secure_filename
import sqlite3
import threading
import time
import requests

app = Flask(__name__)
app.secret_key = 'your-secret-key-here'
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['MAX_CONTENT_LENGTH'] = 50 * 1024 * 1024  # 50MB max file size

# Создаем папку для загрузок
if not os.path.exists(app.config['UPLOAD_FOLDER']):
    os.makedirs(app.config['UPLOAD_FOLDER'])
    print(f"Создана папка для загрузок: {app.config['UPLOAD_FOLDER']}")
else:
    print(f"Папка для загрузок уже существует: {app.config['UPLOAD_FOLDER']}")

# Создаем базу данных
def init_db():
    conn = sqlite3.connect('music.db')
    cursor = conn.cursor()
    
    # Таблица для пользовательских треков
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS user_tracks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            filename TEXT NOT NULL,
            original_name TEXT NOT NULL,
            title TEXT,
            artist TEXT,
            duration REAL,
            upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Таблица для сохранения прогресса
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS playback_progress (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            track_id TEXT NOT NULL,
            track_type TEXT NOT NULL,
            progress REAL DEFAULT 0,
            last_played TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Таблица для плейлистов
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS playlists (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            description TEXT,
            created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Таблица для треков в плейлистах
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS playlist_tracks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            playlist_id INTEGER,
            track_id TEXT NOT NULL,
            track_type TEXT NOT NULL,
            position INTEGER,
            FOREIGN KEY (playlist_id) REFERENCES playlists (id)
        )
    ''')
    
    # Таблица для лайков
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS likes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            track_id TEXT NOT NULL,
            track_type TEXT NOT NULL,
            user_session TEXT NOT NULL,
            created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(track_id, track_type, user_session)
        )
    ''')
    
    # Таблица для истории прослушивания
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS listening_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            track_id TEXT NOT NULL,
            track_type TEXT NOT NULL,
            user_session TEXT NOT NULL,
            play_count INTEGER DEFAULT 1,
            total_duration REAL DEFAULT 0,
            last_played TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Таблица для комментариев
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS comments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            track_id TEXT NOT NULL,
            track_type TEXT NOT NULL,
            user_session TEXT NOT NULL,
            username TEXT DEFAULT 'Аноним',
            comment TEXT NOT NULL,
            created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Таблица для статистики
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS statistics (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            track_id TEXT NOT NULL,
            track_type TEXT NOT NULL,
            play_count INTEGER DEFAULT 0,
            like_count INTEGER DEFAULT 0,
            total_duration REAL DEFAULT 0,
            last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    conn.commit()
    conn.close()

init_db()

# Моковые данные для демонстрации
playlists = [
    {
        'id': 1,
        'name': 'Популярные хиты',
        'cover': 'https://via.placeholder.com/200x200/ff6b6b/ffffff?text=Хиты',
        'songs': [
            {'id': 1, 'title': 'Кукушка', 'artist': 'Кино', 'duration': '4:32'},
            {'id': 2, 'title': 'Группа крови', 'artist': 'Кино', 'duration': '4:45'},
            {'id': 3, 'title': 'Спокойная ночь', 'artist': 'Кино', 'duration': '6:07'}
        ]
    },
    {
        'id': 2,
        'name': 'Русский рок',
        'cover': 'https://via.placeholder.com/200x200/4ecdc4/ffffff?text=Рок',
        'songs': [
            {'id': 4, 'title': 'Выхода нет', 'artist': 'Сплин', 'duration': '3:45'},
            {'id': 5, 'title': 'Линия жизни', 'artist': 'Сплин', 'duration': '4:12'},
            {'id': 6, 'title': 'Орбит без сахара', 'artist': 'Сплин', 'duration': '3:58'}
        ]
    },
    {
        'id': 3,
        'name': 'Электроника',
        'cover': 'https://via.placeholder.com/200x200/45b7d1/ffffff?text=Электро',
        'songs': [
            {'id': 7, 'title': 'Танцы', 'artist': 'Little Big', 'duration': '2:58'},
            {'id': 8, 'title': 'Скажи', 'artist': 'Little Big', 'duration': '3:15'},
            {'id': 9, 'title': 'Удачи', 'artist': 'Little Big', 'duration': '3:42'}
        ]
    }
]

artists = [
    {'id': 1, 'name': 'Кино', 'image': 'https://via.placeholder.com/150x150/ff6b6b/ffffff?text=Кино'},
    {'id': 2, 'name': 'Сплин', 'image': 'https://via.placeholder.com/150x150/4ecdc4/ffffff?text=Сплин'},
    {'id': 3, 'name': 'Little Big', 'image': 'https://via.placeholder.com/150x150/45b7d1/ffffff?text=Little+Big'},
    {'id': 4, 'name': 'Би-2', 'image': 'https://via.placeholder.com/150x150/96ceb4/ffffff?text=Би-2'},
    {'id': 5, 'name': 'ДДТ', 'image': 'https://via.placeholder.com/150x150/ffeaa7/ffffff?text=ДДТ'},
    {'id': 6, 'name': 'Аквариум', 'image': 'https://via.placeholder.com/150x150/dda0dd/ffffff?text=Аквариум'}
]

# Радиостанции с реальными URL
radio_stations_data = {
    1: {
        'name': 'Наше Радио',
        'genre': 'Рок',
        'stream_url': 'https://nashe1.hostingradio.ru/nashe-256',
        'image': 'https://via.placeholder.com/200x200/45b7d1/ffffff?text=Наше',
        'description': 'Русский рок'
    },
    2: {
        'name': 'Джаз Радио',
        'genre': 'Джаз',
        'stream_url': 'https://jazz.hostingradio.ru:8010/jazz-256',
        'image': 'https://via.placeholder.com/200x200/96ceb4/ffffff?text=Джаз',
        'description': 'Классический и современный джаз'
    },
    3: {
        'name': 'Радио Рекорд',
        'genre': 'Поп',
        'stream_url': 'https://air.radiorecord.ru:8101/rr_320',
        'image': 'https://via.placeholder.com/200x200/ff6b6b/ffffff?text=Рекорд',
        'description': 'Популярная музыка'
    },
    4: {
        'name': 'Радио Дача',
        'genre': 'Поп',
        'stream_url': 'https://air.radiorecord.ru:8101/dacha_320',
        'image': 'https://via.placeholder.com/200x200/4ecdc4/ffffff?text=Дача',
        'description': 'Музыка для души'
    },
    5: {
        'name': 'Радио Шансон',
        'genre': 'Шансон',
        'stream_url': 'https://air.radiorecord.ru:8101/shanson_320',
        'image': 'https://via.placeholder.com/200x200/ffeaa7/ffffff?text=Шансон',
        'description': 'Шансон и городской романс'
    },
    6: {
        'name': 'Радио Романтика',
        'genre': 'Романтика',
        'stream_url': 'https://air.radiorecord.ru:8101/romantika_320',
        'image': 'https://via.placeholder.com/200x200/dda0dd/ffffff?text=Романтика',
        'description': 'Романтическая музыка'
    },
    7: {
        'name': 'Радио Дискотека 90-х',
        'genre': 'Ретро',
        'stream_url': 'https://air.radiorecord.ru:8101/disco_320',
        'image': 'https://via.placeholder.com/200x200/ff9ff3/ffffff?text=90-е',
        'description': 'Музыка 90-х годов'
    },
    8: {
        'name': 'Радио Рок',
        'genre': 'Рок',
        'stream_url': 'https://air.radiorecord.ru:8101/rock_320',
        'image': 'https://via.placeholder.com/200x200/ff6b6b/ffffff?text=Рок',
        'description': 'Рок музыка'
    },
    9: {
        'name': 'Радио Электроника',
        'genre': 'Электроника',
        'stream_url': 'https://air.radiorecord.ru:8101/electro_320',
        'image': 'https://via.placeholder.com/200x200/54a0ff/ffffff?text=Электро',
        'description': 'Электронная музыка'
    },
    10: {
        'name': 'Радио Классика',
        'genre': 'Классика',
        'stream_url': 'https://air.radiorecord.ru:8101/classic_320',
        'image': 'https://via.placeholder.com/200x200/5f27cd/ffffff?text=Классика',
        'description': 'Классическая музыка'
    },
    11: {
        'name': 'Радио Европа Плюс',
        'genre': 'Поп',
        'stream_url': 'https://em-cdn.livetrack.in/emgspb/europaplus/emgspb/icecast.audio',
        'image': 'https://via.placeholder.com/200x200/00d2d3/ffffff?text=Европа+',
        'description': 'Европейская поп-музыка'
    },
    12: {
        'name': 'Радио Дорожное',
        'genre': 'Поп',
        'stream_url': 'https://em-cdn.livetrack.in/emgspb/dorozhnoe/emgspb/icecast.audio',
        'image': 'https://via.placeholder.com/200x200/ff9f43/ffffff?text=Дорожное',
        'description': 'Музыка для дороги'
    },
    13: {
        'name': 'Радио Авторадио',
        'genre': 'Поп',
        'stream_url': 'https://em-cdn.livetrack.in/emgspb/avtoradio/emgspb/icecast.audio',
        'image': 'https://via.placeholder.com/200x200/ee5a24/ffffff?text=Авторадио',
        'description': 'Автомобильное радио'
    },
    14: {
        'name': 'Радио Русское',
        'genre': 'Поп',
        'stream_url': 'https://em-cdn.livetrack.in/emgspb/rusradio/emgspb/icecast.audio',
        'image': 'https://via.placeholder.com/200x200/ff3838/ffffff?text=Русское',
        'description': 'Русская поп-музыка'
    },
    15: {
        'name': 'Радио Хит FM',
        'genre': 'Поп',
        'stream_url': 'https://em-cdn.livetrack.in/emgspb/hitfm/emgspb/icecast.audio',
        'image': 'https://via.placeholder.com/200x200/ff6348/ffffff?text=Хит+FM',
        'description': 'Хиты FM'
    }
}

# Демо-радиостанции (работают без внешних зависимостей)
demo_radio_stations = {
    1: {
        'name': 'Демо Радио 1',
        'genre': 'Поп',
        'stream_url': '/static/demo/radio1.mp3',
        'image': 'https://via.placeholder.com/200x200/ff6b6b/ffffff?text=Демо1',
        'description': 'Демо радиостанция 1'
    },
    2: {
        'name': 'Демо Радио 2',
        'genre': 'Рок',
        'stream_url': '/static/demo/radio2.mp3',
        'image': 'https://via.placeholder.com/200x200/4ecdc4/ffffff?text=Демо2',
        'description': 'Демо радиостанция 2'
    },
    3: {
        'name': 'Демо Радио 3',
        'genre': 'Джаз',
        'stream_url': '/static/demo/radio3.mp3',
        'image': 'https://via.placeholder.com/200x200/45b7d1/ffffff?text=Демо3',
        'description': 'Демо радиостанция 3'
    }
}

# Радиостанции для отображения
radio_stations = [
    {
        'id': 1,
        'name': 'Наше Радио',
        'genre': 'Рок',
        'stream_url': 'https://nashe1.hostingradio.ru/nashe-256',
        'image': 'https://via.placeholder.com/200x200/45b7d1/ffffff?text=Наше',
        'description': 'Русский рок'
    },
    {
        'id': 2,
        'name': 'Джаз Радио',
        'genre': 'Джаз',
        'stream_url': 'https://jazz.hostingradio.ru:8010/jazz-256',
        'image': 'https://via.placeholder.com/200x200/96ceb4/ffffff?text=Джаз',
        'description': 'Классический и современный джаз'
    },
    {
        'id': 3,
        'name': 'Радио Рекорд',
        'genre': 'Поп',
        'stream_url': 'https://air.radiorecord.ru:8101/rr_320',
        'image': 'https://via.placeholder.com/200x200/ff6b6b/ffffff?text=Рекорд',
        'description': 'Популярная музыка'
    },
    {
        'id': 4,
        'name': 'Радио Дача',
        'genre': 'Поп',
        'stream_url': 'https://air.radiorecord.ru:8101/dacha_320',
        'image': 'https://via.placeholder.com/200x200/4ecdc4/ffffff?text=Дача',
        'description': 'Музыка для души'
    },
    {
        'id': 5,
        'name': 'Радио Шансон',
        'genre': 'Шансон',
        'stream_url': 'https://air.radiorecord.ru:8101/shanson_320',
        'image': 'https://via.placeholder.com/200x200/ffeaa7/ffffff?text=Шансон',
        'description': 'Шансон и городской романс'
    },
    {
        'id': 6,
        'name': 'Радио Романтика',
        'genre': 'Романтика',
        'stream_url': 'https://air.radiorecord.ru:8101/romantika_320',
        'image': 'https://via.placeholder.com/200x200/dda0dd/ffffff?text=Романтика',
        'description': 'Романтическая музыка'
    },
    {
        'id': 7,
        'name': 'Радио Дискотека 90-х',
        'genre': 'Ретро',
        'stream_url': 'https://air.radiorecord.ru:8101/disco_320',
        'image': 'https://via.placeholder.com/200x200/ff9ff3/ffffff?text=90-е',
        'description': 'Музыка 90-х годов'
    },
    {
        'id': 8,
        'name': 'Радио Рок',
        'genre': 'Рок',
        'stream_url': 'https://air.radiorecord.ru:8101/rock_320',
        'image': 'https://via.placeholder.com/200x200/ff6b6b/ffffff?text=Рок',
        'description': 'Рок музыка'
    },
    {
        'id': 9,
        'name': 'Радио Электроника',
        'genre': 'Электроника',
        'stream_url': 'https://air.radiorecord.ru:8101/electro_320',
        'image': 'https://via.placeholder.com/200x200/54a0ff/ffffff?text=Электро',
        'description': 'Электронная музыка'
    },
    {
        'id': 10,
        'name': 'Радио Классика',
        'genre': 'Классика',
        'stream_url': 'https://air.radiorecord.ru:8101/classic_320',
        'image': 'https://via.placeholder.com/200x200/5f27cd/ffffff?text=Классика',
        'description': 'Классическая музыка'
    },
    {
        'id': 11,
        'name': 'Радио Европа Плюс',
        'genre': 'Поп',
        'stream_url': 'https://em-cdn.livetrack.in/emgspb/europaplus/emgspb/icecast.audio',
        'image': 'https://via.placeholder.com/200x200/00d2d3/ffffff?text=Европа+',
        'description': 'Европейская поп-музыка'
    },
    {
        'id': 12,
        'name': 'Радио Дорожное',
        'genre': 'Поп',
        'stream_url': 'https://em-cdn.livetrack.in/emgspb/dorozhnoe/emgspb/icecast.audio',
        'image': 'https://via.placeholder.com/200x200/ff9f43/ffffff?text=Дорожное',
        'description': 'Музыка для дороги'
    },
    {
        'id': 13,
        'name': 'Радио Авторадио',
        'genre': 'Поп',
        'stream_url': 'https://em-cdn.livetrack.in/emgspb/avtoradio/emgspb/icecast.audio',
        'image': 'https://via.placeholder.com/200x200/ee5a24/ffffff?text=Авторадио',
        'description': 'Автомобильное радио'
    },
    {
        'id': 14,
        'name': 'Радио Русское',
        'genre': 'Поп',
        'stream_url': 'https://em-cdn.livetrack.in/emgspb/rusradio/emgspb/icecast.audio',
        'image': 'https://via.placeholder.com/200x200/ff3838/ffffff?text=Русское',
        'description': 'Русская поп-музыка'
    },
    {
        'id': 15,
        'name': 'Радио Хит FM',
        'genre': 'Поп',
        'stream_url': 'https://em-cdn.livetrack.in/emgspb/hitfm/emgspb/icecast.audio',
        'image': 'https://via.placeholder.com/200x200/ff6348/ffffff?text=Хит+FM',
        'description': 'Хиты FM'
    }
]

def get_user_tracks():
    """Получить пользовательские треки из базы данных"""
    conn = sqlite3.connect('music.db')
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM user_tracks ORDER BY upload_date DESC')
    tracks = cursor.fetchall()
    conn.close()
    
    user_tracks = []
    for track in tracks:
        # Форматируем дату, если она есть
        upload_date = track[6]
        if upload_date:
            try:
                # Если это строка с датой, оставляем как есть
                if isinstance(upload_date, str):
                    formatted_date = upload_date
                else:
                    # Если это объект datetime, форматируем
                    formatted_date = upload_date.strftime('%d.%m.%Y %H:%M')
            except:
                formatted_date = 'Неизвестно'
        else:
            formatted_date = 'Неизвестно'
        
        user_tracks.append({
            'id': track[0],  # Возвращаем числовой ID
            'title': track[3] or track[2].split('.')[0],
            'artist': track[4] or 'Неизвестный исполнитель',
            'duration': f"{int(track[5] or 0)//60}:{int(track[5] or 0)%60:02d}",
            'filename': track[1],
            'upload_date': formatted_date
        })
    
    return user_tracks

def save_progress(track_id, track_type, progress):
    """Сохранить прогресс воспроизведения"""
    conn = sqlite3.connect('music.db')
    cursor = conn.cursor()
    
    # Удаляем старую запись для этого трека
    cursor.execute('DELETE FROM playback_progress WHERE track_id = ? AND track_type = ?', 
                   (track_id, track_type))
    
    # Добавляем новую запись
    cursor.execute('INSERT INTO playback_progress (track_id, track_type, progress) VALUES (?, ?, ?)',
                   (track_id, track_type, progress))
    
    conn.commit()
    conn.close()

def get_progress(track_id, track_type):
    """Получить прогресс воспроизведения"""
    conn = sqlite3.connect('music.db')
    cursor = conn.cursor()
    cursor.execute('SELECT progress FROM playback_progress WHERE track_id = ? AND track_type = ?', 
                   (track_id, track_type))
    result = cursor.fetchone()
    conn.close()
    return result[0] if result else 0

def toggle_like(track_id, track_type, user_session):
    """Переключить лайк для трека"""
    conn = sqlite3.connect('music.db')
    cursor = conn.cursor()
    
    # Проверяем, есть ли уже лайк
    cursor.execute('SELECT id FROM likes WHERE track_id = ? AND track_type = ? AND user_session = ?',
                   (track_id, track_type, user_session))
    existing_like = cursor.fetchone()
    
    if existing_like:
        # Удаляем лайк
        cursor.execute('DELETE FROM likes WHERE id = ?', (existing_like[0],))
        liked = False
    else:
        # Добавляем лайк
        cursor.execute('INSERT INTO likes (track_id, track_type, user_session) VALUES (?, ?, ?)',
                       (track_id, track_type, user_session))
        liked = True
    
    # Обновляем статистику
    cursor.execute('''
        INSERT OR REPLACE INTO statistics (track_id, track_type, like_count)
        SELECT track_id, track_type, COUNT(*) as like_count
        FROM likes 
        WHERE track_id = ? AND track_type = ?
        GROUP BY track_id, track_type
    ''', (track_id, track_type))
    
    conn.commit()
    conn.close()
    return liked

def is_liked(track_id, track_type, user_session):
    """Проверить, лайкнут ли трек"""
    conn = sqlite3.connect('music.db')
    cursor = conn.cursor()
    cursor.execute('SELECT id FROM likes WHERE track_id = ? AND track_type = ? AND user_session = ?',
                   (track_id, track_type, user_session))
    result = cursor.fetchone()
    conn.close()
    return result is not None

def add_to_history(track_id, track_type, user_session, duration=0):
    """Добавить трек в историю прослушивания"""
    conn = sqlite3.connect('music.db')
    cursor = conn.cursor()
    
    # Проверяем, есть ли уже запись в истории
    cursor.execute('SELECT id, play_count, total_duration FROM listening_history WHERE track_id = ? AND track_type = ? AND user_session = ?',
                   (track_id, track_type, user_session))
    existing = cursor.fetchone()
    
    if existing:
        # Обновляем существующую запись
        cursor.execute('''
            UPDATE listening_history 
            SET play_count = play_count + 1, 
                total_duration = total_duration + ?, 
                last_played = CURRENT_TIMESTAMP
            WHERE id = ?
        ''', (duration, existing[0]))
    else:
        # Создаем новую запись
        cursor.execute('''
            INSERT INTO listening_history (track_id, track_type, user_session, total_duration)
            VALUES (?, ?, ?, ?)
        ''', (track_id, track_type, user_session, duration))
    
    # Обновляем общую статистику
    cursor.execute('''
        INSERT OR REPLACE INTO statistics (track_id, track_type, play_count, total_duration)
        SELECT track_id, track_type, SUM(play_count) as play_count, SUM(total_duration) as total_duration
        FROM listening_history 
        WHERE track_id = ? AND track_type = ?
        GROUP BY track_id, track_type
    ''', (track_id, track_type))
    
    conn.commit()
    conn.close()

def get_listening_history(user_session, limit=20):
    """Получить историю прослушивания пользователя"""
    conn = sqlite3.connect('music.db')
    cursor = conn.cursor()
    cursor.execute('''
        SELECT track_id, track_type, play_count, total_duration, last_played
        FROM listening_history 
        WHERE user_session = ?
        ORDER BY last_played DESC
        LIMIT ?
    ''', (user_session, limit))
    history = cursor.fetchall()
    conn.close()
    
    return [{
        'track_id': h[0],
        'track_type': h[1],
        'play_count': h[2],
        'total_duration': h[3],
        'last_played': h[4]
    } for h in history]

def add_comment(track_id, track_type, user_session, username, comment):
    """Добавить комментарий к треку"""
    conn = sqlite3.connect('music.db')
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO comments (track_id, track_type, user_session, username, comment)
        VALUES (?, ?, ?, ?, ?)
    ''', (track_id, track_type, user_session, username, comment))
    conn.commit()
    conn.close()

def get_comments(track_id, track_type, limit=50):
    """Получить комментарии к треку"""
    conn = sqlite3.connect('music.db')
    cursor = conn.cursor()
    cursor.execute('''
        SELECT username, comment, created_date
        FROM comments 
        WHERE track_id = ? AND track_type = ?
        ORDER BY created_date DESC
        LIMIT ?
    ''', (track_id, track_type, limit))
    comments = cursor.fetchall()
    conn.close()
    
    return [{
        'username': c[0],
        'comment': c[1],
        'created_date': c[2]
    } for c in comments]

def get_recommendations(user_session, limit=10):
    """Получить рекомендации на основе истории прослушивания"""
    conn = sqlite3.connect('music.db')
    cursor = conn.cursor()
    
    # Получаем любимых исполнителей пользователя
    cursor.execute('''
        SELECT lh.track_id, lh.track_type, lh.play_count
        FROM listening_history lh
        WHERE lh.user_session = ?
        ORDER BY lh.play_count DESC, lh.last_played DESC
        LIMIT 5
    ''', (user_session,))
    
    favorite_tracks = cursor.fetchall()
    recommendations = []
    
    for track in favorite_tracks:
        track_id, track_type, play_count = track
        
        if track_type == 'playlist':
            # Рекомендуем треки из плейлистов, которые слушает пользователь
            playlist = next((p for p in playlists if str(p['id']) == track_id), None)
            if playlist:
                recommendations.extend(playlist['songs'][:3])
        elif track_type == 'user':
            # Рекомендуем похожие пользовательские треки
            cursor.execute('''
                SELECT id, title, artist, duration
                FROM user_tracks 
                WHERE id != ? 
                ORDER BY RANDOM() 
                LIMIT 2
            ''', (track_id,))
            similar_tracks = cursor.fetchall()
            for t in similar_tracks:
                recommendations.append({
                    'id': f"user_{t[0]}",
                    'title': t[1] or t[0],
                    'artist': t[2] or 'Неизвестный исполнитель',
                    'duration': f"{int(t[3] or 0)//60}:{int(t[3] or 0)%60:02d}"
                })
    
    conn.close()
    
    # Убираем дубликаты и ограничиваем количество
    unique_recommendations = []
    seen_ids = set()
    for rec in recommendations:
        if rec['id'] not in seen_ids:
            unique_recommendations.append(rec)
            seen_ids.add(rec['id'])
        if len(unique_recommendations) >= limit:
            break
    
    return unique_recommendations

def get_statistics(track_id, track_type):
    """Получить статистику трека"""
    conn = sqlite3.connect('music.db')
    cursor = conn.cursor()
    cursor.execute('''
        SELECT play_count, like_count, total_duration
        FROM statistics 
        WHERE track_id = ? AND track_type = ?
    ''', (track_id, track_type))
    result = cursor.fetchone()
    conn.close()
    
    if result:
        return {
            'play_count': result[0] or 0,
            'like_count': result[1] or 0,
            'total_duration': result[2] or 0
        }
    return {'play_count': 0, 'like_count': 0, 'total_duration': 0}

@app.route('/')
def index():
    user_tracks = get_user_tracks()
    return render_template('index.html', playlists=playlists, artists=artists, 
                         radio_stations=radio_stations, user_tracks=user_tracks)

@app.route('/playlist/<int:playlist_id>')
def playlist(playlist_id):
    playlist = next((p for p in playlists if p['id'] == playlist_id), None)
    if playlist:
        return render_template('playlist.html', playlist=playlist)
    return redirect(url_for('index'))

@app.route('/artist/<int:artist_id>')
def artist(artist_id):
    artist = next((a for a in artists if a['id'] == artist_id), None)
    if artist:
        return render_template('artist.html', artist=artist)
    return redirect(url_for('index'))

@app.route('/radio')
def radio():
    return render_template('radio.html', radio_stations=radio_stations)

@app.route('/upload')
def upload():
    user_tracks = get_user_tracks()
    return render_template('upload.html', user_tracks=user_tracks)

@app.route('/history')
def history():
    return render_template('history.html')

@app.route('/search_advanced')
def search_advanced():
    return render_template('search_advanced.html')

@app.route('/upload', methods=['POST'])
def upload_file():
    try:
        if 'file' not in request.files:
            print("Ошибка: файл не найден в запросе")
            return jsonify({'error': 'Файл не выбран'}), 400
        
        file = request.files['file']
        if file.filename == '':
            print("Ошибка: имя файла пустое")
            return jsonify({'error': 'Файл не выбран'}), 400
        
        if file:
            print(f"Загружается файл: {file.filename}")
            
            # Проверяем расширение файла
            allowed_extensions = {'mp3', 'wav', 'flac', 'm4a', 'ogg'}
            file_extension = file.filename.lower().split('.')[-1] if '.' in file.filename else ''
            
            if file_extension not in allowed_extensions:
                print(f"Неподдерживаемый формат: {file_extension}")
                return jsonify({'error': f'Неподдерживаемый формат файла: {file_extension}. Поддерживаются: {", ".join(allowed_extensions)}'}), 400
            
            # Проверяем размер файла
            file.seek(0, 2)  # Перемещаемся в конец файла
            file_size = file.tell()  # Получаем размер
            file.seek(0)  # Возвращаемся в начало
            
            max_size = 50 * 1024 * 1024  # 50MB
            if file_size > max_size:
                print(f"Файл слишком большой: {file_size} байт")
                return jsonify({'error': f'Файл слишком большой. Максимальный размер: 50MB'}), 400
            
            # Сохраняем файл
            filename = secure_filename(file.filename)
            unique_filename = f"{uuid.uuid4().hex}_{filename}"
            filepath = os.path.join(app.config['UPLOAD_FOLDER'], unique_filename)
            
            print(f"Сохраняем файл: {filepath}")
            file.save(filepath)
            
            # Проверяем, что файл действительно сохранен
            if not os.path.exists(filepath):
                print("Ошибка: файл не был сохранен")
                return jsonify({'error': 'Ошибка при сохранении файла'}), 500
            
            # Получаем метаданные из формы
            title = request.form.get('title', '').strip()
            artist = request.form.get('artist', '').strip()
            
            # Если название не указано, используем имя файла
            if not title:
                title = filename.rsplit('.', 1)[0]
            
            if not artist:
                artist = 'Неизвестный исполнитель'
            
            print(f"Метаданные: название='{title}', исполнитель='{artist}'")
            
            # Сохраняем в базу данных
            conn = sqlite3.connect('music.db')
            cursor = conn.cursor()
            cursor.execute('''
                INSERT INTO user_tracks (filename, original_name, title, artist, duration)
                VALUES (?, ?, ?, ?, ?)
            ''', (unique_filename, filename, title, artist, 0))
            conn.commit()
            conn.close()
            
            print("Файл успешно загружен и сохранен в БД")
            return jsonify({'success': True, 'message': 'Файл успешно загружен'})
        
        print("Ошибка: файл не был обработан")
        return jsonify({'error': 'Ошибка при загрузке файла'}), 400
        
    except Exception as e:
        print(f"Ошибка при загрузке файла: {str(e)}")
        return jsonify({'error': f'Внутренняя ошибка сервера: {str(e)}'}), 500

@app.route('/play/<track_type>/<track_id>')
def play_track(track_type, track_id):
    """Воспроизвести трек"""
    if track_type == 'user':
        # Пользовательский трек
        conn = sqlite3.connect('music.db')
        cursor = conn.cursor()
        cursor.execute('SELECT filename FROM user_tracks WHERE id = ?', (track_id,))
        result = cursor.fetchone()
        conn.close()
        
        if result:
            filepath = os.path.join(app.config['UPLOAD_FOLDER'], result[0])
            if os.path.exists(filepath):
                print(f"Воспроизводим файл: {filepath}")
                return send_file(filepath, mimetype='audio/mpeg')
            else:
                print(f"Файл не найден: {filepath}")
        else:
            print(f"Трек не найден в БД: {track_id}")
    
    # Для демонстрации возвращаем заглушку
    return jsonify({'error': 'Трек не найден'}), 404

@app.route('/api/save_progress', methods=['POST'])
def api_save_progress():
    """API для сохранения прогресса"""
    data = request.json
    track_id = data.get('track_id')
    track_type = data.get('track_type')
    progress = data.get('progress', 0)
    
    save_progress(track_id, track_type, progress)
    return jsonify({'success': True})

@app.route('/api/get_progress/<track_type>/<track_id>')
def api_get_progress(track_type, track_id):
    """API для получения прогресса"""
    progress = get_progress(track_id, track_type)
    return jsonify({'progress': progress})

@app.route('/api/user_tracks')
def api_user_tracks():
    """API для получения пользовательских треков"""
    tracks = get_user_tracks()
    return jsonify(tracks)

@app.route('/api/radio_stations')
def api_radio_stations():
    """API для получения радиостанций"""
    return jsonify(radio_stations)

@app.route('/search')
def search():
    query = request.args.get('q', '')
    if query:
        # Поиск по названиям песен и исполнителям
        results = []
        
        # Поиск в плейлистах
        for playlist in playlists:
            for song in playlist['songs']:
                if query.lower() in song['title'].lower() or query.lower() in song['artist'].lower():
                    results.append({
                        'song': song,
                        'playlist': playlist,
                        'type': 'playlist'
                    })
        
        # Поиск в пользовательских треках
        user_tracks = get_user_tracks()
        for track in user_tracks:
            if query.lower() in track['title'].lower() or query.lower() in track['artist'].lower():
                results.append({
                    'song': track,
                    'type': 'user'
                })
        
        return render_template('search.html', results=results, query=query)
    return redirect(url_for('index'))

@app.route('/api/playlists')
def api_playlists():
    return jsonify(playlists)

@app.route('/api/artists')
def api_artists():
    return jsonify(artists)

@app.route('/api/toggle_like', methods=['POST'])
def api_toggle_like():
    data = request.get_json()
    track_id = data.get('track_id')
    track_type = data.get('track_type')
    user_session = session.get('user_id', str(uuid.uuid4()))
    
    if not session.get('user_id'):
        session['user_id'] = user_session
    
    liked = toggle_like(track_id, track_type, user_session)
    stats = get_statistics(track_id, track_type)
    
    return jsonify({
        'liked': liked,
        'like_count': stats['like_count']
    })

@app.route('/api/is_liked/<track_type>/<track_id>')
def api_is_liked(track_type, track_id):
    user_session = session.get('user_id', str(uuid.uuid4()))
    if not session.get('user_id'):
        session['user_id'] = user_session
    
    liked = is_liked(track_id, track_type, user_session)
    return jsonify({'liked': liked})

@app.route('/api/add_to_history', methods=['POST'])
def api_add_to_history():
    data = request.get_json()
    track_id = data.get('track_id')
    track_type = data.get('track_type')
    duration = data.get('duration', 0)
    user_session = session.get('user_id', str(uuid.uuid4()))
    
    if not session.get('user_id'):
        session['user_id'] = user_session
    
    add_to_history(track_id, track_type, user_session, duration)
    return jsonify({'success': True})

@app.route('/api/history')
def api_history():
    user_session = session.get('user_id', str(uuid.uuid4()))
    if not session.get('user_id'):
        session['user_id'] = user_session
    
    history = get_listening_history(user_session)
    return jsonify(history)

@app.route('/api/comments/<track_type>/<track_id>')
def api_get_comments(track_type, track_id):
    comments = get_comments(track_id, track_type)
    return jsonify(comments)

@app.route('/api/add_comment', methods=['POST'])
def api_add_comment():
    data = request.get_json()
    track_id = data.get('track_id')
    track_type = data.get('track_type')
    username = data.get('username', 'Аноним')
    comment = data.get('comment')
    user_session = session.get('user_id', str(uuid.uuid4()))
    
    if not session.get('user_id'):
        session['user_id'] = user_session
    
    if not comment or len(comment.strip()) == 0:
        return jsonify({'error': 'Комментарий не может быть пустым'}), 400
    
    add_comment(track_id, track_type, user_session, username, comment)
    return jsonify({'success': True})

@app.route('/api/recommendations')
def api_recommendations():
    user_session = session.get('user_id', str(uuid.uuid4()))
    if not session.get('user_id'):
        session['user_id'] = user_session
    
    recommendations = get_recommendations(user_session)
    return jsonify(recommendations)

@app.route('/api/statistics/<track_type>/<track_id>')
def api_statistics(track_type, track_id):
    stats = get_statistics(track_id, track_type)
    return jsonify(stats)

@app.route('/api/search_advanced')
def api_search_advanced():
    query = request.args.get('q', '').lower()
    filter_type = request.args.get('type', 'all')  # all, tracks, artists, playlists
    sort_by = request.args.get('sort', 'relevance')  # relevance, popularity, date
    
    if not query:
        return jsonify([])
    
    results = []
    
    # Поиск по трекам
    if filter_type in ['all', 'tracks']:
        # Поиск в плейлистах
        for playlist in playlists:
            for song in playlist['songs']:
                if (query in song['title'].lower() or 
                    query in song['artist'].lower()):
                    results.append({
                        'type': 'track',
                        'id': song['id'],
                        'title': song['title'],
                        'artist': song['artist'],
                        'duration': song['duration'],
                        'source': f"Плейлист: {playlist['name']}"
                    })
        
        # Поиск в пользовательских треках
        user_tracks = get_user_tracks()
        for track in user_tracks:
            if (query in track['title'].lower() or 
                query in track['artist'].lower()):
                results.append({
                    'type': 'track',
                    'id': track['id'],
                    'title': track['title'],
                    'artist': track['artist'],
                    'duration': track['duration'],
                    'source': 'Ваша музыка'
                })
    
    # Поиск по исполнителям
    if filter_type in ['all', 'artists']:
        for artist in artists:
            if query in artist['name'].lower():
                results.append({
                    'type': 'artist',
                    'id': artist['id'],
                    'name': artist['name'],
                    'image': artist['image']
                })
    
    # Поиск по плейлистам
    if filter_type in ['all', 'playlists']:
        for playlist in playlists:
            if query in playlist['name'].lower():
                results.append({
                    'type': 'playlist',
                    'id': playlist['id'],
                    'name': playlist['name'],
                    'cover': playlist['cover'],
                    'song_count': len(playlist['songs'])
                })
    
    # Сортировка результатов
    if sort_by == 'popularity':
        # Сортируем по количеству прослушиваний (если есть статистика)
        for result in results:
            if result['type'] == 'track':
                stats = get_statistics(result['id'], 'playlist' if 'Плейлист:' in result.get('source', '') else 'user')
                result['play_count'] = stats['play_count']
        
        results.sort(key=lambda x: x.get('play_count', 0), reverse=True)
    elif sort_by == 'date':
        # Сортируем по дате (для пользовательских треков)
        results.sort(key=lambda x: x.get('upload_date', ''), reverse=True)
    
    return jsonify(results)

@app.route('/proxy/radio/<int:station_id>')
def proxy_radio(station_id):
    """Прокси для радиостанций"""
    # Находим станцию в списке radio_stations
    station = None
    for s in radio_stations:
        if s['id'] == station_id:
            station = s
            break
    
    if not station:
        return jsonify({'error': 'Станция не найдена'}), 404
    
    try:
        # Делаем запрос к радиостанции
        response = requests.get(station['stream_url'], stream=True, timeout=15, headers={
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'audio/webm,audio/ogg,audio/wav,audio/*;q=0.9,application/ogg;q=0.7,video/*;q=0.6,*/*;q=0.5',
            'Accept-Language': 'ru-RU,ru;q=0.9,en;q=0.8',
            'Accept-Encoding': 'identity',
            'Connection': 'keep-alive',
            'Cache-Control': 'no-cache'
        })
        
        # Проверяем статус ответа
        if response.status_code != 200:
            print(f"Ошибка подключения к радиостанции {station_id}: {response.status_code}")
            return jsonify({'error': f'Ошибка подключения: {response.status_code}'}), response.status_code
        
        # Проверяем, что это аудио поток
        content_type = response.headers.get('Content-Type', '').lower()
        if not any(audio_type in content_type for audio_type in ['audio', 'mpeg', 'ogg', 'aac', 'mp3']):
            print(f"Неверный тип контента для радиостанции {station_id}: {content_type}")
            return jsonify({'error': 'Неверный тип контента'}), 400
        
        # Возвращаем поток
        return response.content, response.status_code, {
            'Content-Type': response.headers.get('Content-Type', 'audio/mpeg'),
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Range',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'Accept-Ranges': 'bytes'
        }
    except requests.exceptions.Timeout:
        print(f"Таймаут подключения к радиостанции {station_id}")
        return jsonify({'error': 'Таймаут подключения к радиостанции'}), 408
    except requests.exceptions.ConnectionError as e:
        print(f"Ошибка подключения к радиостанции {station_id}: {e}")
        return jsonify({'error': 'Ошибка подключения к радиостанции'}), 503
    except requests.exceptions.RequestException as e:
        print(f"Ошибка запроса к радиостанции {station_id}: {e}")
        return jsonify({'error': 'Ошибка подключения к радиостанции'}), 500
    except Exception as e:
        print(f"Неожиданная ошибка проксирования радио {station_id}: {e}")
        return jsonify({'error': 'Ошибка подключения к радиостанции'}), 500

@app.route('/api/delete_track/<int:track_id>', methods=['DELETE'])
def api_delete_track(track_id):
    """API для удаления пользовательского трека"""
    try:
        conn = sqlite3.connect('music.db')
        cursor = conn.cursor()
        
        # Получаем информацию о треке
        cursor.execute('SELECT filename FROM user_tracks WHERE id = ?', (track_id,))
        result = cursor.fetchone()
        
        if not result:
            conn.close()
            return jsonify({'error': 'Трек не найден'}), 404
        
        filename = result[0]
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        
        # Удаляем файл с диска
        if os.path.exists(filepath):
            os.remove(filepath)
            print(f"Файл удален: {filepath}")
        
        # Удаляем запись из базы данных
        cursor.execute('DELETE FROM user_tracks WHERE id = ?', (track_id,))
        conn.commit()
        conn.close()
        
        print(f"Трек {track_id} успешно удален")
        return jsonify({'success': True, 'message': 'Трек успешно удален'})
        
    except Exception as e:
        print(f"Ошибка удаления трека {track_id}: {e}")
        return jsonify({'error': f'Ошибка удаления трека: {str(e)}'}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
