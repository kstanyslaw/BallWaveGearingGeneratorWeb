# Используем официальный образ Python
FROM python:3.9-slim

# Устанавливаем зависимости
RUN apt-get update && apt-get install -y \
    libgl1-mesa-glx \
    && rm -rf /var/lib/apt/lists/*

# Создаем рабочую директорию
WORKDIR /app

# Устанавливаем необходимые Python-пакеты
RUN pip install --no-cache-dir ezdxf matplotlib numpy

# Копируем скрипт в контейнер
COPY calc_vptk.py .

# Запускаем скрипт при старте контейнера
CMD ["python", "calc_vptk.py"]
