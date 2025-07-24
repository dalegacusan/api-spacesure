import { IsEmail, IsNotEmpty, IsOptional, MinLength } from 'class-validator';
import { UserRole } from 'src/libs/enums/roles.enum';

export class RegisterDto {
  @IsEmail()
  email: string;

  @MinLength(12)
  password: string;

  @IsNotEmpty()
  firstName: string;

  @IsNotEmpty()
  lastName: string;

  @IsOptional()
  middleName?: string;

  @IsNotEmpty()
  phoneNumber: string;

  @IsOptional()
  role?: UserRole.ADMIN | UserRole.DRIVER;
}
