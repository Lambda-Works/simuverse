import { IsString, IsOptional, IsEnum, MinLength } from 'class-validator';
import { DocumentTypeEnum } from './create-document.dto';

export class UpdateDocumentDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  course_id?: string;

  @IsOptional()
  @IsString()
  document_name?: string;

  @IsOptional()
  @IsEnum(DocumentTypeEnum)
  document_type?: DocumentTypeEnum;

  @IsOptional()
  @IsString()
  @MinLength(1)
  file_url?: string;
}
