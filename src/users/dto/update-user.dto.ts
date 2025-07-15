import { IsEmail, IsOptional, IsPhoneNumber, IsString } from 'class-validator';
import { UserRole } from 'src/libs/enums/roles.enum';
import { UserStatus } from 'src/libs/enums/user-status.enum';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  first_name?: string;

  @IsOptional()
  @IsString()
  middle_name?: string;

  @IsOptional()
  @IsString()
  last_name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsPhoneNumber(undefined)
  phone_number?: string;

  @IsOptional()
  @IsString()
  role?: UserRole;

  @IsOptional()
  @IsString()
  status?: UserStatus;
}
