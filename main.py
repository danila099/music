from flask import Flask, render_template, request, jsonify, redirect, url_for, send_file, session
import os
import json
from datetime import datetime, timedelta
import uuid
from werkzeug.utils import secure_filename
import sqlite3
import threading
import time
import requests
import hashlib
import secrets

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
    
    # Таблица для пользователей
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            bio TEXT,
            avatar TEXT,
            created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            last_login TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Таблица для сессий пользователей
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS user_sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            session_id TEXT UNIQUE NOT NULL,
            created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            expires_date TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    ''')
    
    # Таблица для пользовательских треков
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS user_tracks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            filename TEXT NOT NULL,
            original_name TEXT NOT NULL,
            title TEXT,
            artist TEXT,
            duration REAL,
            upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    ''')
    
    # Таблица для сохранения прогресса
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS playback_progress (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            track_id TEXT NOT NULL,
            track_type TEXT NOT NULL,
            progress REAL DEFAULT 0,
            last_played TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    ''')
    
    # Таблица для плейлистов
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS playlists (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            description TEXT,
            is_public BOOLEAN DEFAULT 1,
            created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
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
            user_id INTEGER NOT NULL,
            track_id TEXT NOT NULL,
            track_type TEXT NOT NULL,
            created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id),
            UNIQUE(user_id, track_id, track_type)
        )
    ''')
    
    # Таблица для истории прослушивания
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS listening_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            track_id TEXT NOT NULL,
            track_type TEXT NOT NULL,
            play_count INTEGER DEFAULT 1,
            total_duration REAL DEFAULT 0,
            last_played TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    ''')
    
    # Таблица для комментариев
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS comments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            track_id TEXT NOT NULL,
            track_type TEXT NOT NULL,
            comment TEXT NOT NULL,
            created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
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

# Функции для работы с пользователями
def hash_password(password):
    """Хеширование пароля"""
    return hashlib.sha256(password.encode()).hexdigest()

def verify_password(password, password_hash):
    """Проверка пароля"""
    return hash_password(password) == password_hash

def create_session(user_id):
    """Создание сессии пользователя"""
    session_id = secrets.token_urlsafe(32)
    expires_date = datetime.now() + timedelta(days=30)
    
    conn = sqlite3.connect('music.db')
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO user_sessions (user_id, session_id, expires_date)
        VALUES (?, ?, ?)
    ''', (user_id, session_id, expires_date))
    conn.commit()
    conn.close()
    
    return session_id

def get_user_by_session(session_id):
    """Получение пользователя по сессии"""
    if not session_id:
        return None
    
    conn = sqlite3.connect('music.db')
    cursor = conn.cursor()
    cursor.execute('''
        SELECT u.id, u.username, u.email, u.bio, u.avatar
        FROM users u
        JOIN user_sessions s ON u.id = s.user_id
        WHERE s.session_id = ? AND s.expires_date > ?
    ''', (session_id, datetime.now()))
    result = cursor.fetchone()
    conn.close()
    
    if result:
        return {
            'id': result[0],
            'username': result[1],
            'email': result[2],
            'bio': result[3],
            'avatar': result[4]
        }
    return None

def register_user(username, email, password):
    """Регистрация нового пользователя"""
    try:
        password_hash = hash_password(password)
        
        conn = sqlite3.connect('music.db')
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO users (username, email, password_hash)
            VALUES (?, ?, ?)
        ''', (username, email, password_hash))
        user_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        return user_id
    except sqlite3.IntegrityError:
        return None  # Пользователь уже существует

def login_user(email, password):
    """Авторизация пользователя"""
    password_hash = hash_password(password)
    
    conn = sqlite3.connect('music.db')
    cursor = conn.cursor()
    cursor.execute('''
        SELECT id, username, email, bio, avatar
        FROM users
        WHERE email = ? AND password_hash = ?
    ''', (email, password_hash))
    result = cursor.fetchone()
    
    if result:
        user_id = result[0]
        # Обновляем время последнего входа
        cursor.execute('UPDATE users SET last_login = ? WHERE id = ?', (datetime.now(), user_id))
        conn.commit()
        conn.close()
        
        return {
            'id': result[0],
            'username': result[1],
            'email': result[2],
            'bio': result[3],
            'avatar': result[4]
        }
    
    conn.close()
    return None

def logout_user(session_id):
    """Выход пользователя"""
    if session_id:
        conn = sqlite3.connect('music.db')
        cursor = conn.cursor()
        cursor.execute('DELETE FROM user_sessions WHERE session_id = ?', (session_id,))
        conn.commit()
        conn.close()

def get_current_user():
    """Получение текущего пользователя из сессии"""
    session_id = session.get('session_id')
    return get_user_by_session(session_id)

# Функции для работы с плейлистами
def create_playlist(user_id, name, description=None, is_public=True):
    """Создание нового плейлиста"""
    try:
        conn = sqlite3.connect('music.db')
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO playlists (user_id, name, description, is_public)
            VALUES (?, ?, ?, ?)
        ''', (user_id, name, description, is_public))
        playlist_id = cursor.lastrowid
        conn.commit()
        conn.close()
        return playlist_id
    except Exception as e:
        print(f"Ошибка создания плейлиста: {e}")
        return None

def get_user_playlists(user_id):
    """Получение плейлистов пользователя"""
    try:
        conn = sqlite3.connect('music.db')
        cursor = conn.cursor()
        cursor.execute('''
            SELECT p.*, u.username as creator_name,
                   (SELECT COUNT(*) FROM playlist_tracks WHERE playlist_id = p.id) as track_count
            FROM playlists p
            JOIN users u ON p.user_id = u.id
            WHERE p.user_id = ? OR p.is_public = 1
            ORDER BY p.created_date DESC
        ''', (user_id,))
        playlists = cursor.fetchall()
        conn.close()
        
        result = []
        for playlist in playlists:
            result.append({
                'id': playlist[0],
                'user_id': playlist[1],
                'name': playlist[2],
                'description': playlist[3],
                'is_public': bool(playlist[4]),
                'created_date': playlist[5],
                'creator_name': playlist[6],
                'track_count': playlist[7]
            })
        return result
    except Exception as e:
        print(f"Ошибка получения плейлистов: {e}")
        return []

def get_playlist_tracks(playlist_id):
    """Получение треков плейлиста"""
    try:
        conn = sqlite3.connect('music.db')
        cursor = conn.cursor()
        cursor.execute('''
            SELECT pt.*, ut.title, ut.artist, ut.duration, ut.filename, u.username as uploader
            FROM playlist_tracks pt
            LEFT JOIN user_tracks ut ON pt.track_id = ut.id AND pt.track_type = 'user'
            LEFT JOIN users u ON ut.user_id = u.id
            WHERE pt.playlist_id = ?
            ORDER BY pt.position, pt.id
        ''', (playlist_id,))
        tracks = cursor.fetchall()
        conn.close()
        
        result = []
        for track in tracks:
            if track[3] == 'user' and track[4]:  # user track
                result.append({
                    'id': track[2],
                    'track_type': track[3],
                    'position': track[4],
                    'title': track[5] or 'Неизвестно',
                    'artist': track[6] or 'Неизвестный исполнитель',
                    'duration': f"{int(track[7] or 0)//60}:{int(track[7] or 0)%60:02d}",
                    'filename': track[8],
                    'uploader': track[9]
                })
        return result
    except Exception as e:
        print(f"Ошибка получения треков плейлиста: {e}")
        return []

def add_track_to_playlist(playlist_id, track_id, track_type, position=None):
    """Добавление трека в плейлист"""
    try:
        conn = sqlite3.connect('music.db')
        cursor = conn.cursor()
        
        # Если позиция не указана, добавляем в конец
        if position is None:
            cursor.execute('''
                SELECT COALESCE(MAX(position), 0) + 1
                FROM playlist_tracks
                WHERE playlist_id = ?
            ''', (playlist_id,))
            position = cursor.fetchone()[0]
        
        cursor.execute('''
            INSERT INTO playlist_tracks (playlist_id, track_id, track_type, position)
            VALUES (?, ?, ?, ?)
        ''', (playlist_id, track_id, track_type, position))
        conn.commit()
        conn.close()
        return True
    except Exception as e:
        print(f"Ошибка добавления трека в плейлист: {e}")
        return False

def remove_track_from_playlist(playlist_id, track_id, track_type):
    """Удаление трека из плейлиста"""
    try:
        conn = sqlite3.connect('music.db')
        cursor = conn.cursor()
        cursor.execute('''
            DELETE FROM playlist_tracks
            WHERE playlist_id = ? AND track_id = ? AND track_type = ?
        ''', (playlist_id, track_id, track_type))
        conn.commit()
        conn.close()
        return True
    except Exception as e:
        print(f"Ошибка удаления трека из плейлиста: {e}")
        return False

def delete_playlist(playlist_id, user_id):
    """Удаление плейлиста"""
    try:
        conn = sqlite3.connect('music.db')
        cursor = conn.cursor()
        
        # Проверяем, что пользователь является владельцем плейлиста
        cursor.execute('SELECT user_id FROM playlists WHERE id = ?', (playlist_id,))
        result = cursor.fetchone()
        if not result or result[0] != user_id:
            conn.close()
            return False
        
        # Удаляем треки плейлиста
        cursor.execute('DELETE FROM playlist_tracks WHERE playlist_id = ?', (playlist_id,))
        # Удаляем плейлист
        cursor.execute('DELETE FROM playlists WHERE id = ?', (playlist_id,))
        conn.commit()
        conn.close()
        return True
    except Exception as e:
        print(f"Ошибка удаления плейлиста: {e}")
        return False

# Функции для работы с лайками
def toggle_like(user_id, track_id, track_type):
    """Переключение лайка трека"""
    try:
        conn = sqlite3.connect('music.db')
        cursor = conn.cursor()
        
        # Проверяем, есть ли уже лайк
        cursor.execute('''
            SELECT id FROM likes
            WHERE user_id = ? AND track_id = ? AND track_type = ?
        ''', (user_id, track_id, track_type))
        
        existing_like = cursor.fetchone()
        
        if existing_like:
            # Удаляем лайк
            cursor.execute('''
                DELETE FROM likes
                WHERE user_id = ? AND track_id = ? AND track_type = ?
            ''', (user_id, track_id, track_type))
            liked = False
        else:
            # Добавляем лайк
            cursor.execute('''
                INSERT INTO likes (user_id, track_id, track_type)
                VALUES (?, ?, ?)
            ''', (user_id, track_id, track_type))
            liked = True
        
        conn.commit()
        conn.close()
        return liked
    except Exception as e:
        print(f"Ошибка переключения лайка: {e}")
        return None

def get_like_count(track_id, track_type):
    """Получение количества лайков трека"""
    try:
        conn = sqlite3.connect('music.db')
        cursor = conn.cursor()
        cursor.execute('''
            SELECT COUNT(*) FROM likes
            WHERE track_id = ? AND track_type = ?
        ''', (track_id, track_type))
        count = cursor.fetchone()[0]
        conn.close()
        return count
    except Exception as e:
        print(f"Ошибка получения количества лайков: {e}")
        return 0

def is_track_liked_by_user(user_id, track_id, track_type):
    """Проверка, лайкнул ли пользователь трек"""
    try:
        conn = sqlite3.connect('music.db')
        cursor = conn.cursor()
        cursor.execute('''
            SELECT id FROM likes
            WHERE user_id = ? AND track_id = ? AND track_type = ?
        ''', (user_id, track_id, track_type))
        result = cursor.fetchone()
        conn.close()
        return result is not None
    except Exception as e:
        print(f"Ошибка проверки лайка: {e}")
        return False

# Плейлисты
playlists = [
    {
        'id': 1,
        'name': 'Популярные хиты',
        'cover': '/static/images/placeholder.svg',
        'songs': [
            {'id': 1, 'title': 'Кукушка', 'artist': 'Кино', 'duration': '4:32'},
            {'id': 2, 'title': 'Группа крови', 'artist': 'Кино', 'duration': '4:45'},
            {'id': 3, 'title': 'Спокойная ночь', 'artist': 'Кино', 'duration': '6:07'}
        ]
    },
    {
        'id': 2,
        'name': 'Рок классика',
        'cover': '/static/images/placeholder.svg',
        'songs': [
            {'id': 4, 'title': 'Nothing Else Matters', 'artist': 'Metallica', 'duration': '6:28'},
            {'id': 5, 'title': 'Stairway to Heaven', 'artist': 'Led Zeppelin', 'duration': '8:02'},
            {'id': 6, 'title': 'Bohemian Rhapsody', 'artist': 'Queen', 'duration': '5:55'}
        ]
    },
    {
        'id': 3,
        'name': 'Электроника',
        'cover': '/static/images/placeholder.svg',
        'songs': [
            {'id': 7, 'title': 'Sandstorm', 'artist': 'Darude', 'duration': '3:45'},
            {'id': 8, 'title': 'Levels', 'artist': 'Avicii', 'duration': '5:38'},
            {'id': 9, 'title': 'Wake Me Up', 'artist': 'Avicii', 'duration': '4:09'}
        ]
    }
]

# Исполнители
artists = [
    {'id': 1, 'name': 'Кино', 'image': '/static/images/placeholder.svg'},
    {'id': 2, 'name': 'Metallica', 'image': '/static/images/placeholder.svg'},
    {'id': 3, 'name': 'Queen', 'image': '/static/images/placeholder.svg'},
    {'id': 4, 'name': 'Led Zeppelin', 'image': '/static/images/placeholder.svg'},
    {'id': 5, 'name': 'ДДТ', 'image': '/static/images/placeholder.svg'},
    {'id': 6, 'name': 'Аквариум', 'image': '/static/images/placeholder.svg'}
]

# Радиостанции
radio_stations = [
    {
        'id': 1,
        'name': 'Наше Радио',
        'genre': 'Рок',
        'stream_url': 'https://nashe1.hostingradio.ru/nashe-256',
        'image': '/static/images/radio1.svg',
        'description': 'Русский рок'
    },
    {
        'id': 2,
        'name': 'Джаз Радио',
        'genre': 'Джаз',
        'stream_url': 'https://jazz.hostingradio.ru:8010/jazz-256',
        'image': '/static/images/placeholder.svg',
        'description': 'Классический и современный джаз'
    },
    {
        'id': 3,
        'name': 'Радио Рекорд',
        'genre': 'Поп',
        'stream_url': 'https://radiorecord.hostingradio.ru/rr_main96.aacp',
        'image': '/static/images/placeholder.svg',
        'description': 'Популярная музыка'
    },
    {
        'id': 4,
        'name': 'Эхо Москвы',
        'genre': 'Разговорное',
        'stream_url': 'https://em-cdn.livetrack.in/emgspb/emgspb/icecast.audio',
        'image': '/static/images/placeholder.svg',
        'description': 'Информационное радио'
    },
    {
        'id': 5,
        'name': 'Дорожное Радио',
        'genre': 'Поп',
        'stream_url': 'https://dorognoe.hostingradio.ru:8000/dorognoe',
        'image': '/static/images/placeholder.svg',
        'description': 'Музыка для дороги'
    },
    {
        'id': 6,
        'name': 'Радио Дача',
        'genre': 'Поп',
        'stream_url': 'http://listen13.vdfm.ru:8000/dacha',
        'image': '/static/images/placeholder.svg',
        'description': 'Популярная музыка'
    },
    {
        'id': 7,
        'name': 'Тестовое радио',
        'genre': 'Тест',
        'stream_url': 'https://stream.radio.co/s2e9b236e3/listen',
        'image': '/static/images/placeholder.svg',
        'description': 'Тестовая радиостанция для проверки'
    },
    {
        'id': 8,
        'name': 'Шансон радио',
        'genre': 'Шансон',
        'stream_url': 'http://www.radioprofusion.com/radio.php',
        'image': '/static/images/placeholder.svg',
        'description': 'Шансон'
    }
]

def get_user_tracks(user_id=None):
    """Получить пользовательские треки из базы данных"""
    try:
        conn = sqlite3.connect('music.db', timeout=20.0)
        cursor = conn.cursor()
        
        if user_id:
            cursor.execute('''
                SELECT ut.*, u.username 
                FROM user_tracks ut 
                JOIN users u ON ut.user_id = u.id 
                WHERE ut.user_id = ? 
                ORDER BY ut.upload_date DESC
            ''', (user_id,))
        else:
            cursor.execute('''
                SELECT ut.*, u.username 
                FROM user_tracks ut 
                JOIN users u ON ut.user_id = u.id 
                ORDER BY ut.upload_date DESC
            ''')
            
        tracks = cursor.fetchall()
        conn.close()
        
        user_tracks = []
        for track in tracks:
            upload_date = track[7]  # upload_date
            if upload_date:
                try:
                    if isinstance(upload_date, str):
                        formatted_date = upload_date
                    else:
                        formatted_date = upload_date.strftime('%d.%m.%Y %H:%M')
                except:
                    formatted_date = 'Неизвестно'
            else:
                formatted_date = 'Неизвестно'
            
            user_tracks.append({
                'id': track[0],
                'user_id': track[1],
                'title': track[4] or track[3].split('.')[0],
                'artist': track[5] or 'Неизвестный исполнитель',
                'duration': f"{int(track[6] or 0)//60}:{int(track[6] or 0)%60:02d}",
                'filename': track[2],
                'upload_date': formatted_date,
                'uploader': track[8]  # username
            })
        
        return user_tracks
    except Exception as e:
        print(f"Ошибка получения пользовательских треков: {e}")
        return []

def get_all_tracks():
    """Получить все треки с информацией о пользователях"""
    try:
        conn = sqlite3.connect('music.db', timeout=20.0)
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT ut.*, u.username 
            FROM user_tracks ut 
            JOIN users u ON ut.user_id = u.id 
            ORDER BY ut.upload_date DESC
        ''')
            
        tracks = cursor.fetchall()
        conn.close()
        
        all_tracks = []
        for track in tracks:
            upload_date = track[7]  # upload_date
            if upload_date:
                try:
                    if isinstance(upload_date, str):
                        formatted_date = upload_date
                    else:
                        formatted_date = upload_date.strftime('%d.%m.%Y %H:%M')
                except:
                    formatted_date = 'Неизвестно'
            else:
                formatted_date = 'Неизвестно'
            
            all_tracks.append({
                'id': track[0],
                'user_id': track[1],
                'title': track[4] or track[3].split('.')[0],
                'artist': track[5] or 'Неизвестный исполнитель',
                'duration': f"{int(track[6] or 0)//60}:{int(track[6] or 0)%60:02d}",
                'filename': track[2],
                'upload_date': formatted_date,
                'uploader': track[8]  # username
            })
        
        return all_tracks
    except Exception as e:
        print(f"Ошибка получения всех треков: {e}")
        return []

# Маршруты
@app.route('/')
def index():
    user = get_current_user()
    all_tracks = get_all_tracks()
    return render_template('index.html', playlists=playlists, artists=artists, 
                         radio_stations=radio_stations, user_tracks=all_tracks, user=user)

@app.route('/register', methods=['GET', 'POST'])
def register():
    """Страница регистрации"""
    if request.method == 'POST':
        username = request.form.get('username', '').strip()
        email = request.form.get('email', '').strip()
        password = request.form.get('password', '')
        confirm_password = request.form.get('confirm_password', '')
        
        # Валидация
        errors = []
        if not username or len(username) < 3:
            errors.append('Имя пользователя должно содержать минимум 3 символа')
        if not email or '@' not in email:
            errors.append('Введите корректный email')
        if not password or len(password) < 6:
            errors.append('Пароль должен содержать минимум 6 символов')
        if password != confirm_password:
            errors.append('Пароли не совпадают')
        
        if errors:
            return render_template('register.html', errors=errors, username=username, email=email)
        
        # Регистрация пользователя
        user_id = register_user(username, email, password)
        if user_id:
            # Создаем сессию
            session_id = create_session(user_id)
            session['session_id'] = session_id
            return redirect(url_for('index'))
        else:
            return render_template('register.html', errors=['Пользователь с таким email уже существует'], username=username, email=email)
    
    return render_template('register.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    """Страница входа"""
    if request.method == 'POST':
        email = request.form.get('email', '').strip()
        password = request.form.get('password', '')
        
        # Валидация
        if not email or not password:
            return render_template('login.html', errors=['Заполните все поля'], email=email)
        
        # Авторизация
        user = login_user(email, password)
        if user:
            # Создаем сессию
            session_id = create_session(user['id'])
            session['session_id'] = session_id
            return redirect(url_for('index'))
        else:
            return render_template('login.html', errors=['Неверный email или пароль'], email=email)
    
    return render_template('login.html')

@app.route('/logout')
def logout():
    """Выход из системы"""
    session_id = session.get('session_id')
    if session_id:
        logout_user(session_id)
    session.clear()
    return redirect(url_for('index'))

@app.route('/profile')
def profile():
    """Страница профиля пользователя"""
    user = get_current_user()
    if not user:
        return redirect(url_for('login'))
    
    user_tracks = get_user_tracks(user['id'])
    return render_template('profile.html', user=user, user_tracks=user_tracks)

@app.route('/upload')
def upload():
    user = get_current_user()
    if not user:
        return redirect(url_for('login'))
    
    user_tracks = get_user_tracks(user['id'])
    return render_template('upload.html', user_tracks=user_tracks, user=user)

@app.route('/radio')
def radio():
    user = get_current_user()
    return render_template('radio.html', user=user)

@app.route('/history')
def history():
    user = get_current_user()
    return render_template('history.html', user=user)

@app.route('/search_advanced')
def search_advanced():
    user = get_current_user()
    return render_template('search_advanced.html', user=user)

@app.route('/playlists')
def playlists_page():
    user = get_current_user()
    if not user:
        return redirect(url_for('login'))
    return render_template('playlists.html', user=user)

@app.route('/playlist/<int:playlist_id>')
def playlist(playlist_id):
    user = get_current_user()
    playlist = next((p for p in playlists if p['id'] == playlist_id), None)
    if playlist:
        return render_template('playlist.html', playlist=playlist, user=user)
    return redirect(url_for('index'))

@app.route('/search')
def search():
    user = get_current_user()
    query = request.args.get('q', '')
    if query:
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
        all_tracks = get_all_tracks()
        for track in all_tracks:
            if query.lower() in track['title'].lower() or query.lower() in track['artist'].lower():
                results.append({
                    'song': track,
                    'type': 'user'
                })
        
        return render_template('search.html', results=results, query=query, user=user)
    return redirect(url_for('index'))

@app.route('/upload', methods=['POST'])
def upload_file():
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Необходима авторизация'}), 401
    
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'Файл не выбран'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'Файл не выбран'}), 400
        
        if file:
            # Проверяем расширение файла
            allowed_extensions = {'mp3', 'wav', 'flac', 'm4a', 'ogg'}
            file_extension = file.filename.lower().split('.')[-1] if '.' in file.filename else ''
            
            if file_extension not in allowed_extensions:
                return jsonify({'error': f'Неподдерживаемый формат файла: {file_extension}'}), 400
            
            # Сохраняем файл
            filename = secure_filename(file.filename)
            unique_filename = f"{uuid.uuid4().hex}_{filename}"
            filepath = os.path.join(app.config['UPLOAD_FOLDER'], unique_filename)
            
            file.save(filepath)
            
            # Получаем метаданные из формы
            title = request.form.get('title', '').strip()
            artist = request.form.get('artist', '').strip()
            
            if not title:
                title = filename.rsplit('.', 1)[0]
            
            if not artist:
                artist = 'Неизвестный исполнитель'
            
            # Сохраняем в базу данных
            conn = sqlite3.connect('music.db')
            cursor = conn.cursor()
            cursor.execute('''
                INSERT INTO user_tracks (user_id, filename, original_name, title, artist, duration)
                VALUES (?, ?, ?, ?, ?, ?)
            ''', (user['id'], unique_filename, filename, title, artist, 0))
            
            track_id = cursor.lastrowid
            conn.commit()
            conn.close()
            
            return jsonify({
                'success': True, 
                'message': 'Файл успешно загружен',
                'track_id': track_id,
                'title': title,
                'artist': artist,
                'filename': filename
            })
        
        return jsonify({'error': 'Ошибка при загрузке файла'}), 400
        
    except Exception as e:
        return jsonify({'error': f'Внутренняя ошибка сервера: {str(e)}'}), 500

@app.route('/play/<track_type>/<track_id>')
def play_track(track_type, track_id):
    """Воспроизвести трек"""
    if track_type == 'user':
        conn = sqlite3.connect('music.db')
        cursor = conn.cursor()
        cursor.execute('SELECT filename FROM user_tracks WHERE id = ?', (track_id,))
        result = cursor.fetchone()
        conn.close()
        
        if result:
            filepath = os.path.join(app.config['UPLOAD_FOLDER'], result[0])
            if os.path.exists(filepath):
                return send_file(filepath, mimetype='audio/mpeg')
    
    return jsonify({'error': 'Трек не найден'}), 404

# API маршруты
@app.route('/api/user_tracks')
def api_user_tracks():
    """API для получения всех пользовательских треков"""
    tracks = get_all_tracks()
    return jsonify(tracks)

@app.route('/api/radio_stations')
def api_radio_stations():
    return jsonify(radio_stations)

@app.route('/api/playlists')
def api_playlists():
    return jsonify(playlists)

@app.route('/api/artists')
def api_artists():
    return jsonify(artists)

@app.route('/test_radio')
def test_radio():
    """Страница для тестирования радио"""
    return send_file('test_radio.html')

# API маршруты для плейлистов
@app.route('/api/playlists/create', methods=['POST'])
def api_create_playlist():
    """API для создания плейлиста"""
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Необходима авторизация'}), 401
    
    data = request.get_json()
    name = data.get('name', '').strip()
    description = data.get('description', '').strip()
    is_public = data.get('is_public', True)
    
    if not name:
        return jsonify({'error': 'Название плейлиста обязательно'}), 400
    
    playlist_id = create_playlist(user['id'], name, description, is_public)
    if playlist_id:
        return jsonify({
            'success': True,
            'playlist_id': playlist_id,
            'message': 'Плейлист создан успешно'
        })
    else:
        return jsonify({'error': 'Ошибка создания плейлиста'}), 500

@app.route('/api/playlists/<int:playlist_id>/tracks', methods=['POST'])
def api_add_track_to_playlist(playlist_id):
    """API для добавления трека в плейлист"""
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Необходима авторизация'}), 401
    
    data = request.get_json()
    track_id = data.get('track_id')
    track_type = data.get('track_type', 'user')
    
    if not track_id:
        return jsonify({'error': 'ID трека обязателен'}), 400
    
    success = add_track_to_playlist(playlist_id, track_id, track_type)
    if success:
        return jsonify({
            'success': True,
            'message': 'Трек добавлен в плейлист'
        })
    else:
        return jsonify({'error': 'Ошибка добавления трека'}), 500

@app.route('/api/playlists/<int:playlist_id>/tracks/<track_id>', methods=['DELETE'])
def api_remove_track_from_playlist(playlist_id, track_id):
    """API для удаления трека из плейлиста"""
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Необходима авторизация'}), 401
    
    track_type = request.args.get('track_type', 'user')
    
    success = remove_track_from_playlist(playlist_id, track_id, track_type)
    if success:
        return jsonify({
            'success': True,
            'message': 'Трек удален из плейлиста'
        })
    else:
        return jsonify({'error': 'Ошибка удаления трека'}), 500

@app.route('/api/playlists/<int:playlist_id>', methods=['DELETE'])
def api_delete_playlist(playlist_id):
    """API для удаления плейлиста"""
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Необходима авторизация'}), 401
    
    success = delete_playlist(playlist_id, user['id'])
    if success:
        return jsonify({
            'success': True,
            'message': 'Плейлист удален'
        })
    else:
        return jsonify({'error': 'Ошибка удаления плейлиста'}), 500

@app.route('/api/user/playlists')
def api_user_playlists():
    """API для получения плейлистов пользователя"""
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Необходима авторизация'}), 401
    
    playlists = get_user_playlists(user['id'])
    return jsonify(playlists)

@app.route('/api/playlists/<int:playlist_id>/tracks')
def api_playlist_tracks(playlist_id):
    """API для получения треков плейлиста"""
    tracks = get_playlist_tracks(playlist_id)
    return jsonify(tracks)

# API маршруты для лайков
@app.route('/api/tracks/<track_id>/like', methods=['POST'])
def api_toggle_like(track_id):
    """API для переключения лайка трека"""
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Необходима авторизация'}), 401
    
    data = request.get_json()
    track_type = data.get('track_type', 'user')
    
    liked = toggle_like(user['id'], track_id, track_type)
    if liked is not None:
        like_count = get_like_count(track_id, track_type)
        return jsonify({
            'success': True,
            'liked': liked,
            'like_count': like_count,
            'message': 'Лайк обновлен'
        })
    else:
        return jsonify({'error': 'Ошибка обновления лайка'}), 500

@app.route('/api/tracks/<track_id>/like')
def api_get_like_status(track_id):
    """API для получения статуса лайка трека"""
    user = get_current_user()
    track_type = request.args.get('track_type', 'user')
    
    if user:
        is_liked = is_track_liked_by_user(user['id'], track_id, track_type)
    else:
        is_liked = False
    
    like_count = get_like_count(track_id, track_type)
    
    return jsonify({
        'liked': is_liked,
        'like_count': like_count
    })

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000) 