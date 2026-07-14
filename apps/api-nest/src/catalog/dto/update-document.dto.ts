import { IsString, IsOptional, IsEnum, IsUrl } from 'class-validator';
import { DocumentTypeEnum } from './create-document.dto';

export class UpdateDocumentDto {
  @IsOptional()
  @IsString()
  document_name?: string;

  @IsOptional()
  @IsEnum(DocumentTypeEnum)
  document_type?: DocumentTypeEnum;

  @IsOptional()
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
  file_url?: string;
}
