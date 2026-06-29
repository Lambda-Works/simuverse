import { IsString, IsOptional, IsEnum, MinLength } from 'class-validator';

export enum DocumentTypeEnum {
  case = 'case',
  contract = 'contract',
  policy = 'policy',
  legal = 'legal',
  procedure = 'procedure',
  other = 'other',
}

export class CreateDocumentDto {
  @IsString()
  @MinLength(1)
  course_id: string;

  @IsString()
  @MinLength(1)
  document_name: string;

  @IsOptional()
  @IsEnum(DocumentTypeEnum)
  document_type?: DocumentTypeEnum;

  @IsOptional()
  @IsString()
  document_content?: string;

  @IsOptional()
  @IsString()
  file_url?: string;

  @IsOptional()
  @IsString()
  uploaded_by?: string;
}
