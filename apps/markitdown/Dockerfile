FROM python:3.11-slim

WORKDIR /markitdown_app

COPY apps/markitdown/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY apps/markitdown/main.py .

EXPOSE 5000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "5000"]
