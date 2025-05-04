FROM python:3.9-slim

WORKDIR /app

# Install required system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    python3-dev \
    && rm -rf /var/lib/apt/lists/*

# Install solc (Solidity compiler) for Slither
RUN pip install solc-select && \
    solc-select install 0.8.20 && \
    solc-select use 0.8.20

# Install Slither
RUN pip install slither-analyzer

# Copy requirements file
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Expose the port
EXPOSE 8000

# Command to run the application
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]