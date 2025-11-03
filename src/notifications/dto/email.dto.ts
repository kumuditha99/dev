import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';

export class EmailDto {
  @ApiProperty({
    description: 'Recipient email address',
    example: 'alice@example.com',
  })
  @IsEmail()
  recipient: string;

  @ApiProperty({
    description: 'HTML message (optional)',
    example: '<h1>Hello</h1>',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  message?: string;

  @ApiProperty({
    description: 'Plain text fallback (optional)',
    example: 'Hello',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  text?: string;

  @ApiProperty({
    description: 'Subject (optional)',
    example: 'Test email Subject',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  subject?: string;
}
