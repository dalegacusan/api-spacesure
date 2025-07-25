import { IsEnum, IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';
import { AvailabilityStatus } from 'src/libs/enums/availability-status.enum';

export class CreateParkingSpaceDto {
  @IsString()
  @IsNotEmpty()
  city: string;

  @IsString()
  @IsNotEmpty()
  establishment_name: string;

  @IsString()
  @IsNotEmpty()
  address: string;

  @IsNumber()
  @Min(0)
  total_spaces: number;

  @IsNumber()
  @Min(0)
  available_spaces: number;

  @IsNumber()
  @Min(0)
  hourlyRate: number;

  @IsNumber()
  @Min(0)
  whole_day_rate: number;

  @IsEnum(AvailabilityStatus)
  @IsNotEmpty()
  availability_status: AvailabilityStatus;
}
