# Use Python 3.12.2 image based on Debian Bullseye in its slim variant as the base image
FROM python:3.12.2-slim-bullseye

# Set an environment variable to unbuffer Python output, aiding in logging and debugging
ENV PYTHONBUFFERED=1

# Define an environment variable for the web service's port, commonly used in cloud services

# Set the working directory within the container to /app for any subsequent commands
WORKDIR /app

# Create necessary directories for supervisor logs
RUN mkdir -p /var/log/supervisor

# Copy the entire current directory contents into the container at /app
COPY . /app/

# Install gettext and other system dependencies
RUN apt-get update && apt-get install -y gettext && rm -rf /var/lib/apt/lists/*

# Upgrade pip to ensure we have the latest version for installing dependencies
RUN pip install --upgrade pip

# Install dependencies from the requirements.txt file to ensure our Python environment is ready
RUN pip install -r requirements.txt

# Set the command to run our web service using Gunicorn, binding it to 0.0.0.0 and the PORT environment variable
#CMD ["gunicorn", "server.wsgi:application", "--bind", "0.0.0.0:${PORT}"]
#CMD ["python", "manage.py", "runserver", "0.0.0.0:${PORT}"]
#CMD ["daphne", "-b", "0.0.0.0", "-p", "${WS_INTERNAL_PORT}", "leaguer.asgi:application"]
# Use supervisord to run both Django and Daphne
CMD ["supervisord", "-c", "/app/supervisord.conf"]
