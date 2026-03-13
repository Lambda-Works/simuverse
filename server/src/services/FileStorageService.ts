import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

/**
 * Servicio de almacenamiento de archivos para Fichas Técnicas
 * Soporta: PDF, DOC, DOCX, PNG, JPG, CSV, TXT
 * 
 * Almacena archivos en disco en lugar de en BD para evitar límites de tamaño
 */
export class FileStorageService {
  private uploadDir: string;
  private allowedMimeTypes = {
    'application/pdf': 'pdf',
    'application/msword': 'doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
    'application/vnd.ms-excel': 'xls',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
    'text/csv': 'csv',
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'text/plain': 'txt'
  };

  private maxFileSize = 50 * 1024 * 1024; // 50 MB

  constructor() {
    // Directorio: /server/uploads/tech-sheets/
    this.uploadDir = path.join(__dirname, '../../uploads/tech-sheets');
    this.ensureUploadDirExists();
  }

  /**
   * Asegura que el directorio de uploads existe
   */
  private ensureUploadDirExists(): void {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
      console.log(`✅ Upload directory created: ${this.uploadDir}`);
    }
  }

  /**
   * Valida el tipo MIME del archivo
   */
  isAllowedMimeType(mimeType: string): boolean {
    return mimeType in this.allowedMimeTypes;
  }

  /**
   * Valida el tamaño del archivo
   */
  isAllowedSize(sizeInBytes: number): boolean {
    return sizeInBytes <= this.maxFileSize;
  }

  /**
   * Guarda un archivo en disco
   * Retorna objeto con path relativo, uuid, nombre original, tipo
   */
  async saveFile(
    fileBuffer: Buffer,
    originalFileName: string,
    mimeType: string
  ): Promise<{
    id: string;
    filename: string;
    original_filename: string;
    mime_type: string;
    size_bytes: number;
    file_path: string;  // Ruta relativa: tech-sheets/uuid.ext
    stored_at: Date;
  }> {
    // Validaciones
    if (!this.isAllowedMimeType(mimeType)) {
      throw new Error(
        `Tipo de archivo no permitido: ${mimeType}. Permite: PDF, DOC, DOCX, XLS, XLSX, CSV, PNG, JPG, TXT`
      );
    }

    if (!this.isAllowedSize(fileBuffer.length)) {
      throw new Error(
        `Archivo demasiado grande. Máximo: ${this.maxFileSize / (1024 * 1024)}MB, Recibido: ${(fileBuffer.length / (1024 * 1024)).toFixed(2)}MB`
      );
    }

    // Generar nombre único
    const fileId = uuidv4();
    const extension = this.allowedMimeTypes[mimeType as keyof typeof this.allowedMimeTypes];
    const fileName = `${fileId}.${extension}`;
    const filePath = path.join(this.uploadDir, fileName);
    const relativePath = `tech-sheets/${fileName}`;

    // Guardar archivo
    await fs.promises.writeFile(filePath, fileBuffer);
    console.log(`✅ Archivo guardado: ${relativePath} (${(fileBuffer.length / 1024).toFixed(2)} KB)`);

    return {
      id: fileId,
      filename: fileName,
      original_filename: originalFileName,
      mime_type: mimeType,
      size_bytes: fileBuffer.length,
      file_path: relativePath,
      stored_at: new Date(),
    };
  }

  /**
   * Lee un archivo desde disco
   */
  async readFile(filePath: string): Promise<Buffer> {
    const fullPath = path.join(this.uploadDir, filePath);

    // Seguridad: evitar path traversal
    const normalizedPath = path.normalize(fullPath);
    if (!normalizedPath.startsWith(this.uploadDir)) {
      throw new Error('Invalid file path');
    }

    if (!fs.existsSync(fullPath)) {
      throw new Error(`Archivo no encontrado: ${filePath}`);
    }

    return await fs.promises.readFile(fullPath);
  }

  /**
   * Elimina un archivo del disco
   */
  async deleteFile(filePath: string): Promise<void> {
    const fullPath = path.join(this.uploadDir, filePath);

    // Seguridad
    const normalizedPath = path.normalize(fullPath);
    if (!normalizedPath.startsWith(this.uploadDir)) {
      throw new Error('Invalid file path');
    }

    if (fs.existsSync(fullPath)) {
      await fs.promises.unlink(fullPath);
      console.log(`✅ Archivo eliminado: ${filePath}`);
    }
  }

  /**
   * Obtiene info del archivo sin leerlo completo
   */
  async getFileInfo(filePath: string): Promise<fs.Stats> {
    const fullPath = path.join(this.uploadDir, filePath);

    // Seguridad
    const normalizedPath = path.normalize(fullPath);
    if (!normalizedPath.startsWith(this.uploadDir)) {
      throw new Error('Invalid file path');
    }

    if (!fs.existsSync(fullPath)) {
      throw new Error(`Archivo no encontrado: ${filePath}`);
    }

    return await fs.promises.stat(fullPath);
  }

  /**
   * URL relativa para descargar archivo
   */
  getDownloadUrl(filePath: string): string {
    return `/api/tech-sheets/files/download/${filePath}`;
  }

  /**
   * Obtiene la extensión de archivo según MIME type
   */
  getExtension(mimeType: string): string {
    return this.allowedMimeTypes[mimeType as keyof typeof this.allowedMimeTypes] || 'bin';
  }

  /**
   * Obtiene el tipo MIME según extensión
   */
  getMimeType(extension: string): string | null {
    extension = extension.toLowerCase();
    for (const [mime, ext] of Object.entries(this.allowedMimeTypes)) {
      if (ext === extension) {
        return mime;
      }
    }
    return null;
  }
}

export const fileStorageService = new FileStorageService();
