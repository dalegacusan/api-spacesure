import { Controller, Post } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ObjectId } from 'mongodb';
import { Public } from 'src/auth/decorators/public.decorator';
import { ParkingSpaceAdmin } from 'src/libs/entities/parking-space-admin.entity';
import { ParkingSpace } from 'src/libs/entities/parking-space.entity';
import { User } from 'src/libs/entities/user.entity';
import { MongoRepository, Repository } from 'typeorm';

@Controller('auth/seed')
export class SeedController {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,

    @InjectRepository(ParkingSpace)
    private readonly parkingSpaceRepo: MongoRepository<ParkingSpace>,

    @InjectRepository(ParkingSpaceAdmin)
    private readonly parkingSpaceAdminRepo: MongoRepository<ParkingSpaceAdmin>,
  ) {}

  @Public()
  @Post()
  async seedParkingSpaceAdmins() {
    const now = new Date();

    // 2. Create and save ParkingSpaceAdmin records using create + save
    const parkingSpaceId1 = new ObjectId('6872b239fac785647417abc5');
    const parkingSpaceId2 = new ObjectId('6872b267976e9e5e8a9d2184');
    const assignedByUserId = new ObjectId('6872874353f5386221c9d41e');

    const assignment1 = this.parkingSpaceAdminRepo.create({
      user_id: new ObjectId('687353108b39cb8c0a33ece1'),
      parking_space_id: parkingSpaceId2,
      assigned_by_user_id: assignedByUserId,
      assigned_at: now,
    });
    const assignment2 = this.parkingSpaceAdminRepo.create({
      user_id: new ObjectId('687353108b39cb8c0a33ece1'),
      parking_space_id: parkingSpaceId1,
      assigned_by_user_id: assignedByUserId,
      assigned_at: now,
    });

    const result = await this.parkingSpaceAdminRepo.save([
      assignment1,
      assignment2,
    ]);

    return {
      message: 'Seeded Parking Space Admins using create + save',
      insertedCount: result.length,
    };
  }
}
