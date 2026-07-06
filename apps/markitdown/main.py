from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from markitdown import MarkItDown
import os

app = FastAPI(title="markitdown sidecar", version="1.0.0")

markitdown_converter = MarkItDown()


class ConvertRequest(BaseModel):
    file_path: str


class ConvertResponse(BaseModel):
    markdown: str


@app.post("/convert", response_model=ConvertResponse)
async def convert_file(request: ConvertRequest):
    file_path = request.file_path

    if not os.path.isfile(file_path):
        raise HTTPException(status_code=400, detail=f"File not found: {file_path}")

    try:
        result = markitdown_converter.convert(file_path)
        return ConvertResponse(markdown=result.markdown)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Conversion failed: {str(e)}")


@app.get("/health")
async def health():
    return {"status": "ok"}
