import {
  IsArray,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsPhoneNumber,
  MinLength,
} from 'class-validator';
import { UserRole } from 'src/libs/enums/roles.enum';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @MinLength(6)
  password: string;

  @IsNotEmpty()
  firstName: string;

  @IsOptional()
  middleName?: string;

  @IsNotEmpty()
  lastName: string;

  @IsOptional()
  @IsPhoneNumber('PH')
  phoneNumber?: string;

  @IsEnum(UserRole)
  role: UserRole;

  @IsArray()
  assignedParkingSpaceIds?: string[]; // Add this
}
