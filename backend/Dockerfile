# backend/Dockerfile

# Usamos una imagen ligera de Python 3.11
FROM python:3.11-slim

# Evita que Python genere archivos .pyc y fuerza logs en tiempo real
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Instalamos dependencias del sistema necesarias para compilar algunas libs de IA
RUN apt-get update && apt-get install -y build-essential curl && rm -rf /var/lib/apt/lists/*

# Copiamos y instalamos las dependencias de Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiamos todo el código del backend
COPY . .

# Exponemos el puerto 8000
EXPOSE 8000

# Comando para iniciar la app (modo reload para desarrollo)
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]