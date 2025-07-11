# Диагностика проблем с радио

## Возможные причины проблем

### 1. CORS (Cross-Origin Resource Sharing)
- Браузеры блокируют запросы к внешним радиостанциям из-за политики CORS
- Решение: Используйте прокси-сервер или добавьте CORS заголовки

### 2. Недоступность радиостанций
- Некоторые радиостанции могут быть недоступны в определенных регионах
- Решение: Попробуйте другие радиостанции или используйте VPN

### 3. Проблемы с браузером
- Некоторые браузеры имеют ограничения на автовоспроизведение
- Решение: Разрешите автовоспроизведение в настройках браузера

### 4. Проблемы с интернет-соединением
- Медленное соединение может привести к таймаутам
- Решение: Проверьте скорость интернета

## Тестирование

### 1. Откройте тестовую страницу
```
http://localhost:5000/test_radio
```

### 2. Проверьте консоль браузера
- Откройте Developer Tools (F12)
- Перейдите на вкладку Console
- Попробуйте воспроизвести радиостанцию
- Посмотрите на ошибки в консоли

### 3. Проверьте сетевые запросы
- В Developer Tools перейдите на вкладку Network
- Попробуйте воспроизвести радиостанцию
- Посмотрите на статус запросов к радиостанциям

## Решения

### 1. Демо-режим
Если внешние радиостанции недоступны, приложение автоматически переключается в демо-режим с синтезированным звуком.

### 2. Добавление новых радиостанций
Добавьте новые радиостанции в список `radio_stations` в файле `main.py`:

```python
{
    'id': 9,
    'name': 'Новая радиостанция',
    'genre': 'Жанр',
    'stream_url': 'https://example.com/stream',
    'image': '/static/images/placeholder.svg',
    'description': 'Описание'
}
```

### 3. Использование прокси
Для обхода CORS можно использовать прокси-сервер:

```python
@app.route('/proxy/<path:url>')
def proxy(url):
    import requests
    response = requests.get(f'https://{url}')
    return response.content, response.status_code, response.headers
```

### 4. Локальные тестовые файлы
Добавьте локальные аудио файлы для тестирования:

```python
{
    'id': 10,
    'name': 'Локальный тест',
    'genre': 'Тест',
    'stream_url': '/static/audio/test.mp3',
    'image': '/static/images/placeholder.svg',
    'description': 'Локальный тестовый файл'
}
```

## Логирование

Приложение ведет подробные логи в консоли браузера. Проверьте:
- Сообщения о подключении
- Ошибки CORS
- Таймауты подключения
- Ошибки воспроизведения

## Поддерживаемые форматы

- MP3
- AAC
- OGG
- WAV
- M4A

## Рекомендации

1. Начните с демо-режима для проверки работы аудио
2. Попробуйте разные радиостанции
3. Проверьте настройки браузера
4. Используйте современный браузер (Chrome, Firefox, Safari, Edge)
5. Убедитесь, что звук включен в системе 