import { IsString, IsOptional, IsArray } from 'class-validator';

export class ConversationPartDto {
  @IsString()
  text?: string;
}

export class ChatMessageDto {
  @IsString()
  role: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsArray()
  parts?: ConversationPartDto[];
}

export class SendMessageDto {
  @IsOptional()
  @IsString()
  user_id?: string;

  @IsOptional()
  @IsString()
  course_id?: string;

  @IsString()
  message: string;

  @IsOptional()
  @IsArray()
  conversationHistory?: ChatMessageDto[];
}
