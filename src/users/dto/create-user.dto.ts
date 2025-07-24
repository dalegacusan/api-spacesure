import {
  IsArray,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsPhoneNumber,
  MinLength,
} from 'class-validator';
import { DiscountLevel } from 'src/libs/enums/discount-eligiblity.enum';
import { UserRole } from 'src/libs/enums/roles.enum';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @MinLength(12)
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

  @IsOptional()
  @IsEnum(DiscountLevel)
  discount_level?: DiscountLevel;

  @IsOptional()
  discount_id?: string;
}
