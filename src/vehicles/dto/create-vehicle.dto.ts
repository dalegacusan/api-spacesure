import { IsNotEmpty, IsString } from 'class-validator';

export class CreateVehicleDto {
  @IsString()
  @IsNotEmpty()
  vehicle_type: string;

  @IsString()
  @IsNotEmpty()
  year_make_model: string;

  @IsString()
  @IsNotEmpty()
  color: string;

  @IsString()
  @IsNotEmpty()
  plate_number: string;
}
