import { IsString, IsOptional, IsEnum } from 'class-validator';
import { DocumentTypeEnum } from './create-document.dto';

export class UpdateDocumentDto {
  @IsOptional()
  @IsString()
  document_name?: string;

  @IsOptional()
  @IsEnum(DocumentTypeEnum)
  document_type?: DocumentTypeEnum;

  @IsOptional()
  @IsString()
  document_content?: string;

  @IsOptional()
  @IsString()
  file_url?: string;
}
