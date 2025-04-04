
FROM python:3.10-slim

# Install Slither and its dependencies
RUN apt-get update && apt-get install -y git python3-pip
RUN pip3 install slither-analyzer

# Set working directory
WORKDIR /app

# Copy requirements and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Expose port
EXPOSE 8000

# Start the application (bind to all interfaces)
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
