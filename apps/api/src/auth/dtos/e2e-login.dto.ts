import { IsEmail, IsString } from 'class-validator';

export class E2eLoginDto {
  @IsEmail()
  email: string;

  @IsString()
  name: string;
}
