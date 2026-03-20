FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create non-root user
RUN useradd -m -u 1000 contexteng && \
    chown -R contexteng:contexteng /app

USER contexteng

# Expose ports
# 8888: AI Guides API
# 9001: Context Engineering API
EXPOSE 8888 9001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:9001/api/stats || exit 1

# Start both services
CMD ["sh", "-c", "python main.py & cd context_engineering && python context_api.py"]
