import {
  IsString,
  IsNotEmpty,
  IsStrongPassword,
  IsOptional,
  IsEmail,
} from 'class-validator';
import { Role } from 'generated/prisma/enums';

export class RegisterDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  @IsStrongPassword({
    minLength: 8,
    minLowercase: 1,
    minUppercase: 1,
    minNumbers: 1,
    minSymbols: 1,
  })
  password: string;

  @IsOptional()
  @IsString()
  role: Role;
}
