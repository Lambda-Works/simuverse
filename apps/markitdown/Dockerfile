FROM python:3.11-slim

WORKDIR /markitdown_app

COPY apps/markitdown/requirements.txt .

RUN --mount=type=cache,target=/root/.cache/pip \
    pip install -r requirements.txt

COPY apps/markitdown/main.py .

EXPOSE 5000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "5000"]
