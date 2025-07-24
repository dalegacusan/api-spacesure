import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ObjectId } from 'mongodb';
import { CryptoService } from 'src/libs/crypto/crypto.service';
import { ParkingSpaceAdmin, Reservation, User } from 'src/libs/entities';
import { ParkingSpace } from 'src/libs/entities/parking-space.entity';
import { PaymentStatus } from 'src/libs/enums/payment-status.enum';
import { UserRole } from 'src/libs/enums/roles.enum';
import { MongoRepository } from 'typeorm';
import { CreateParkingSpaceDto } from './dto/create-parking-space.dto';

@Injectable()
export class ParkingSpacesService {
  constructor(
    @InjectRepository(ParkingSpace)
    private readonly parkingSpaceRepo: MongoRepository<ParkingSpace>,
    @InjectRepository(ParkingSpaceAdmin)
    private readonly parkingSpaceAdminRepo: MongoRepository<ParkingSpaceAdmin>,
    @InjectRepository(User)
    private readonly userRepo: MongoRepository<User>,
    @InjectRepository(Reservation)
    private readonly reservationRepo: MongoRepository<Reservation>,
    private cryptoService: CryptoService,
  ) {}

  async getOne(id: string, userId?: string) {
    const record = await this.parkingSpaceRepo.findOneBy({
      _id: new ObjectId(id),
      is_deleted: false,
    });

    if (!record) return null;

    let feedbackEnabled = false;

    if (userId) {
      const hasReservation = await this.reservationRepo.findOne({
        where: {
          parking_space_id: new ObjectId(id),
          user_id: new ObjectId(userId),
        },
      });

      feedbackEnabled = !!hasReservation;
    }

    return {
      _id: record._id,
      city: record.city,
      establishment_name: record.establishment_name,
      address: record.address,
      total_spaces: record.total_spaces,
      available_spaces: record.available_spaces,
      hourlyRate: record.hourlyRate,
      whole_day_rate: record.whole_day_rate,
      availability_status: record.availability_status,
      slots_status: this.computeAvailabilityStatus(
        record.available_spaces,
        record.total_spaces,
      ),
      is_deleted: record.is_deleted,
      created_at: record.created_at,
      updated_at: record.updated_at,
      feedbackEnabled,
    };
  }

  async getOneWithReservations(id: string) {
    const pipeline = [
      {
        $match: {
          _id: new ObjectId(id),
          is_deleted: false,
        },
      },
      {
        $lookup: {
          from: 'reservations',
          let: { parkingSpaceId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$parking_space_id', '$$parkingSpaceId'] },
              },
            },
            {
              $lookup: {
                from: 'payments',
                localField: '_id',
                foreignField: 'reservation_id',
                as: 'payments',
              },
            },
            {
              $lookup: {
                from: 'vehicles',
                localField: 'vehicle_id',
                foreignField: '_id',
                as: 'vehicle',
              },
            },
            {
              $unwind: {
                path: '$vehicle',
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $lookup: {
                from: 'users',
                localField: 'user_id',
                foreignField: '_id',
                as: 'user',
              },
            },
            {
              $unwind: {
                path: '$user',
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $sort: { created_at: -1 },
            },
          ],
          as: 'reservations',
        },
      },
      {
        $limit: 1,
      },
    ];

    const [lot] = await this.parkingSpaceRepo.aggregate(pipeline).toArray();
    if (!lot) return null;

    // Decrypt user fields
    const decryptedReservations = lot.reservations?.map((res) => {
      const user = res.user || {};
      return {
        ...res,
        user: {
          ...user,
          first_name: user.first_name
            ? this.cryptoService.decrypt(user.first_name)
            : null,
          last_name: user.last_name
            ? this.cryptoService.decrypt(user.last_name)
            : null,
          middle_name: user.middle_name
            ? this.cryptoService.decrypt(user.middle_name)
            : null,
          phone_number: user.phone_number
            ? this.cryptoService.decrypt(user.phone_number)
            : null,
          email: user.email,
        },
      };
    });

    const allPayments = (lot.reservations ?? []).flatMap(
      (r) => r.payments || [],
    );
    const completedPayments = allPayments.filter(
      (p) => p.payment_status === PaymentStatus.COMPLETED,
    );

    const totalRevenue = completedPayments.reduce(
      (sum, p) => sum + p.amount,
      0,
    );
    const totalReservations = lot.reservations?.length || 0;

    const averageOccupancy =
      ((lot.total_spaces - lot.available_spaces) / lot.total_spaces) * 100;

    const hourFrequency: Record<number, number> = {};
    for (const res of lot.reservations ?? []) {
      const hour = new Date(res.start_time).getHours();
      hourFrequency[hour] = (hourFrequency[hour] || 0) + 1;
    }

    let peakHour: string | null = null;
    const mostFrequentHour = Object.entries(hourFrequency).sort(
      (a, b) => b[1] - a[1],
    )[0];
    if (mostFrequentHour) {
      const hour = parseInt(mostFrequentHour[0], 10);
      peakHour = `${hour % 12 === 0 ? 12 : hour % 12}:00 ${hour >= 12 ? 'PM' : 'AM'}`;
    }

    return {
      _id: lot._id,
      city: lot.city,
      establishment_name: lot.establishment_name,
      address: lot.address,
      total_spaces: lot.total_spaces,
      available_spaces: lot.available_spaces,
      hourlyRate: lot.hourlyRate,
      whole_day_rate: lot.whole_day_rate,
      availability_status: lot.availability_status,
      slots_status: this.computeAvailabilityStatus(
        lot.available_spaces,
        lot.total_spaces,
      ),
      reservations: decryptedReservations,
      is_deleted: lot.is_deleted,
      created_at: lot.created_at,
      updated_at: lot.updated_at,
      analytics: {
        totalRevenue,
        totalReservations,
        averageOccupancy: parseFloat(averageOccupancy.toFixed(1)),
        peakHour: peakHour ?? 'N/A',
      },
    };
  }

  async getParkingSpaces(
    reqUserId: string | ObjectId,
    location?: string,
    unassignedOnly: boolean = false,
    userId?: string,
  ) {
    const filter: any = { is_deleted: false };

    if (location) {
      filter.city = { $regex: new RegExp(location, 'i') };
    }

    let order: {
      available_spaces?: 'asc' | 'desc';
      created_at?: 'asc' | 'desc';
    } = { available_spaces: 'desc' };

    const reqUser = await this.userRepo.findOne({
      where: { _id: new ObjectId(reqUserId) },
    });

    if (reqUser?.role === UserRole.SUPER_ADMIN) {
      order = {
        created_at: 'desc',
      };
    }

    const allSpaces = await this.parkingSpaceRepo.find({
      where: filter,
      order,
    });

    if (userId) {
      const user = await this.userRepo.findOne({
        where: { _id: new ObjectId(userId) },
      });
      if (user?.role === UserRole.DRIVER) {
        return allSpaces.map(this.mapParkingSpace.bind(this));
      }
    }

    if (unassignedOnly) {
      const assignedSpaces = await this.parkingSpaceAdminRepo.find({
        select: ['parking_space_id', 'user_id'],
      });

      if (userId) {
        const userObjectId = new ObjectId(userId);

        const userAssignedIds = new Set(
          assignedSpaces
            .filter(
              (a) => a.user_id && new ObjectId(a.user_id).equals(userObjectId),
            )
            .map((a) => new ObjectId(a.parking_space_id).toHexString()),
        );

        return allSpaces
          .filter(
            (space) =>
              !userAssignedIds.has(new ObjectId(space._id).toHexString()),
          )
          .map(this.mapParkingSpace.bind(this));
      }

      const allAssignedIds = new Set(
        assignedSpaces.map((a) =>
          new ObjectId(a.parking_space_id).toHexString(),
        ),
      );

      return allSpaces
        .filter(
          (space) => !allAssignedIds.has(new ObjectId(space._id).toHexString()),
        )
        .map(this.mapParkingSpace.bind(this));
    }

    return allSpaces.map(this.mapParkingSpace.bind(this));
  }

  mapParkingSpace(space: ParkingSpace) {
    return {
      _id: space._id,
      city: space.city,
      establishment_name: space.establishment_name,
      address: space.address,
      total_spaces: space.total_spaces,
      available_spaces: space.available_spaces,
      hourlyRate: space.hourlyRate,
      whole_day_rate: space.whole_day_rate,
      availability_status: space.availability_status,
      slots_status: this.computeAvailabilityStatus(
        space.available_spaces,
        space.total_spaces,
      ),
      is_deleted: space.is_deleted,
      created_at: space.created_at,
      updated_at: space.updated_at,
    };
  }

  async getParkingSpacesByAdminId(adminId: string | ObjectId) {
    const pipeline = [
      {
        $match: {
          user_id: new ObjectId(adminId),
        },
      },
      {
        $lookup: {
          from: 'parking_spaces',
          localField: 'parking_space_id',
          foreignField: '_id',
          as: 'parking_space',
        },
      },
      /* Converts the array field parking_space into a flat object

        {
          "_id": "psa2",
          "user_id": ObjectId("admin123"),
          "parking_space_id": ObjectId("spaceB"),
          "parking_space": [
            {
              "_id": ObjectId("spaceB"),
              "city": "BGC",
              "establishment_name": "SM Aura Parking"
            }
          ]
        }

        to

          {
          "_id": "psa2",
          "user_id": ObjectId("admin123"),
          "parking_space_id": ObjectId("spaceB"),
          "parking_space": {
            "_id": ObjectId("spaceB"),
            "city": "BGC",
            "establishment_name": "SM Aura Parking"
          }
        }

      */
      {
        $unwind: '$parking_space',
      },
      // Only get the parking_space information, not the parking_space_admin properties
      {
        $replaceRoot: { newRoot: '$parking_space' },
      },
      {
        $match: {
          is_deleted: false,
        },
      },
      {
        $sort: {
          created_at: -1,
        },
      },
    ];

    const results = await this.parkingSpaceAdminRepo
      .aggregate(pipeline)
      .toArray();

    return results.map((lot) => ({
      _id: lot._id,
      city: lot.city,
      establishment_name: lot.establishment_name,
      address: lot.address,
      total_spaces: lot.total_spaces,
      available_spaces: lot.available_spaces,
      hourlyRate: lot.hourlyRate,
      whole_day_rate: lot.whole_day_rate,
      availability_status: lot.availability_status,
      slots_status: this.computeAvailabilityStatus(
        lot.available_spaces,
        lot.total_spaces,
      ),
      is_deleted: lot.is_deleted,
      created_at: lot.created_at,
      updated_at: lot.updated_at,
    }));
  }

  async updateOne(id: string, dto: Partial<ParkingSpace>) {
    if (!id) {
      throw new BadRequestException('User ID is not found.');
    }

    // TODO - Check if somethings wrong here
    const space = await this.parkingSpaceRepo.findOneBy({
      _id: new ObjectId(id),
      is_deleted: false,
    });

    if (!space) return null;

    // Edge condition: available_spaces must not exceed total_spaces
    if (
      dto.available_spaces !== undefined &&
      dto.total_spaces !== undefined &&
      dto.available_spaces > dto.total_spaces
    ) {
      throw new Error('Available spaces cannot exceed total spaces.');
    }

    if (
      dto.available_spaces !== undefined &&
      dto.available_spaces > (dto.total_spaces ?? space.total_spaces)
    ) {
      throw new Error('Available spaces cannot exceed total spaces.');
    }

    const updated = this.parkingSpaceRepo.merge(space, {
      ...dto,
      updated_at: new Date(),
    });

    return this.parkingSpaceRepo.save(updated);
  }

  computeAvailabilityStatus(available: number, total: number): string {
    if (available === 0) return 'Full';
    const ratio = available / total;
    if (ratio <= 0.3) return 'Limited';
    return 'Available';
  }

  async createOne(dto: CreateParkingSpaceDto) {
    if (dto.available_spaces > dto.total_spaces) {
      throw new BadRequestException(
        'Available spaces cannot exceed total spaces.',
      );
    }

    const newSpace = this.parkingSpaceRepo.create({
      ...dto,
      is_deleted: false,
      created_at: new Date(),
      updated_at: new Date(),
    });

    const saved = await this.parkingSpaceRepo.save(newSpace);

    return this.mapParkingSpace(saved);
  }
}
