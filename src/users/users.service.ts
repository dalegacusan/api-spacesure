import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as argon2 from 'argon2';
import { ObjectId } from 'mongodb';
import {
  ParkingSpace,
  ParkingSpaceAdmin,
  Payment,
  Reservation,
  User,
  Vehicle,
} from 'src/libs/entities';
import { UserRole } from 'src/libs/enums/roles.enum';
import { UserStatus } from 'src/libs/enums/user-status.enum';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Reservation)
    private readonly reservationRepo: Repository<Reservation>,
    @InjectRepository(Vehicle)
    private readonly vehicleRepo: Repository<Vehicle>,
    @InjectRepository(Payment)
    private readonly paymentRepo: Repository<Payment>,
    @InjectRepository(ParkingSpace)
    private readonly parkingSpaceRepo: Repository<ParkingSpace>,
    @InjectRepository(ParkingSpaceAdmin)
    private readonly parkingSpaceAdminRepo: Repository<ParkingSpaceAdmin>,
  ) {}

  async getOneUserWithDetails(id: string) {
    const objectId = new ObjectId(id);
    const user = await this.userRepo.findOne({ where: { _id: objectId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Get reservations with details
    const reservations = await this.reservationRepo.find({
      where: { user_id: user._id },
      order: { created_at: 'DESC' },
    });

    const reservationsWithDetails = await Promise.all(
      reservations.map(async (res) => {
        const vehicle = res.vehicle_id
          ? await this.vehicleRepo.findOneBy({ _id: res.vehicle_id })
          : null;

        const payments = await this.paymentRepo.find({
          where: { reservation_id: res._id },
          order: { payment_date: 'DESC' },
        });

        const parking_space = res.parking_space_id
          ? await this.parkingSpaceRepo.findOneBy({ _id: res.parking_space_id })
          : null;

        return {
          ...res,
          vehicle,
          payments,
          parking_space,
        };
      }),
    );

    // If ADMIN, get assigned parking spaces via ParkingSpaceAdmin table
    let assignedParkingSpaces: ParkingSpaceAdmin[] = [];
    if (user.role === UserRole.ADMIN) {
      const assignments = await this.parkingSpaceAdminRepo.find({
        where: { user_id: user._id },
      });

      assignedParkingSpaces = await Promise.all(
        assignments.map(async (assignment) => {
          const parkingSpace = await this.parkingSpaceRepo.findOneBy({
            _id: assignment.parking_space_id,
          });

          return {
            ...assignment,
            parking_space: parkingSpace,
          };
        }),
      );
    }

    const {
      password,
      failed_login_attempts,
      account_available_at,
      ...safeUser
    } = user;

    return {
      ...safeUser,
      reservations: reservationsWithDetails,
      assigned_parking_spaces: assignedParkingSpaces,
    };
  }

  async updateUser(
    requestingUserId: string,
    dto: UpdateUserDto,
    targetUserId: string,
    role: UserRole,
  ) {
    const objectId = new ObjectId(targetUserId);
    const user = await this.userRepo.findOne({
      where: { _id: objectId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Only SUPER_ADMIN can update other users
    const isSelfUpdate = requestingUserId === targetUserId;
    if (!isSelfUpdate && role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException(
        'Only SUPER_ADMIN can update other user accounts',
      );
    }

    // Fields allowed to be updated by all roles
    const updatableFields: Partial<User> = {
      first_name: dto.first_name,
      middle_name: dto.middle_name,
      last_name: dto.last_name,
      email: dto.email,
      phone_number: dto.phone_number,
    };

    // Only SUPER_ADMIN can update role and status
    if (role === UserRole.SUPER_ADMIN) {
      if (dto.role) updatableFields.role = dto.role;
      if (dto.status) updatableFields.status = dto.status;
    }

    Object.assign(user, {
      ...updatableFields,
      updated_at: new Date(),
    });

    const updated = await this.userRepo.save(user);
    const { password, ...safeUser } = updated;

    return {
      message: 'User updated successfully',
      data: { user: safeUser },
    };
  }

  async getAllUsersWithDetails() {
    const users = await this.userRepo.find({
      order: { created_at: 'DESC' },
    });

    const sanitizedUsers = await Promise.all(
      users.map(async (user) => {
        const reservations = await this.reservationRepo.find({
          where: { user_id: user._id },
          order: { created_at: 'DESC' },
        });

        const reservationsWithDetails = await Promise.all(
          reservations.map(async (res) => {
            const vehicle = res.vehicle_id
              ? await this.vehicleRepo.findOneBy({ _id: res.vehicle_id })
              : null;

            const payments = await this.paymentRepo.find({
              where: { reservation_id: res._id },
              order: { payment_date: 'DESC' },
            });

            const parking_space = res.parking_space_id
              ? await this.parkingSpaceRepo.findOneBy({
                  _id: res.parking_space_id,
                })
              : null;

            return {
              ...res,
              vehicle,
              payments,
              parking_space,
            };
          }),
        );

        const {
          password,
          failed_login_attempts,
          account_available_at,
          ...safeUser
        } = user;

        return {
          ...safeUser,
          reservations: reservationsWithDetails,
        };
      }),
    );

    return sanitizedUsers;
  }

  async assignParkingSpaceToAdmin(
    userId: string,
    parkingSpaceId: string,
    assignedByUserId: string,
  ) {
    const user = await this.userRepo.findOneBy({ _id: new ObjectId(userId) });
    if (!user) throw new NotFoundException('User not found');

    if (user.role !== UserRole.ADMIN) {
      throw new ForbiddenException(
        'Only SUPER_ADMIN users can be assigned spaces',
      );
    }

    const parkingSpace = await this.parkingSpaceRepo.findOneBy({
      _id: new ObjectId(parkingSpaceId),
    });
    if (!parkingSpace) throw new NotFoundException('Parking space not found');

    // Check if already assigned
    const existing = await this.parkingSpaceAdminRepo.findOneBy({
      user_id: user._id,
      parking_space_id: parkingSpace._id,
    });
    if (existing) {
      throw new ForbiddenException(
        'Parking space is already assigned to this user',
      );
    }

    const assignment = this.parkingSpaceAdminRepo.create({
      user_id: user._id,
      parking_space_id: parkingSpace._id,
      assigned_by_user_id: new ObjectId(assignedByUserId),
      assigned_at: new Date(),
    });

    const saved = await this.parkingSpaceAdminRepo.save(assignment);
    return {
      message: 'Parking space assigned successfully',
      data: saved,
    };
  }

  async unassignParkingSpaceFromAdmin(userId: string, parkingSpaceId: string) {
    const assignment = await this.parkingSpaceAdminRepo.findOneBy({
      user_id: new ObjectId(userId),
      parking_space_id: new ObjectId(parkingSpaceId),
    });

    if (!assignment) {
      throw new NotFoundException('Assignment not found');
    }

    await this.parkingSpaceAdminRepo.remove(assignment);

    return {
      message: 'Parking space unassigned successfully',
      data: {
        user_id: userId,
        parking_space_id: parkingSpaceId,
      },
    };
  }

  async createUser(assignedByUserId: string, dto: CreateUserDto) {
    const email = dto.email;

    if (
      !email ||
      !dto.password ||
      !dto.firstName ||
      !dto.lastName ||
      !dto.role
    ) {
      throw new BadRequestException('Missing required fields');
    }

    if (dto.password.length < 6) {
      throw new BadRequestException(
        'Password must be at least 6 characters long',
      );
    }

    const existing = await this.userRepo.findOne({
      where: { email },
    });

    if (existing) {
      throw new ConflictException('User with this email already exists');
    }

    let hashedPassword;

    try {
      hashedPassword = await argon2.hash(dto.password);
    } catch {
      throw new BadRequestException('Failed to hash password');
    }

    const newUser = this.userRepo.create({
      email,
      password: hashedPassword,
      first_name: dto.firstName,
      middle_name: dto.middleName,
      last_name: dto.lastName,
      phone_number: dto.phoneNumber,
      role: dto.role,
      created_at: new Date(),
      updated_at: new Date(),
      account_available_at: new Date(),
      failed_login_attempts: 0,
      status: UserStatus.ENABLED,
    });

    const savedUser = await this.userRepo.save(newUser);

    if (
      dto.role === UserRole.ADMIN &&
      dto.assignedParkingSpaceIds &&
      dto.assignedParkingSpaceIds.length > 0
    ) {
      const assignments = dto.assignedParkingSpaceIds.map((parkingSpaceId) =>
        this.parkingSpaceAdminRepo.create({
          user_id: savedUser._id,
          parking_space_id: new ObjectId(parkingSpaceId),
          assigned_at: new Date(),
          assigned_by_user_id: new ObjectId(assignedByUserId),
        }),
      );

      await this.parkingSpaceAdminRepo.save(assignments);
    }

    const { password, ...safeUser } = savedUser;

    return {
      message: 'User created successfully',
      data: {
        user: safeUser,
      },
    };
  }
}
