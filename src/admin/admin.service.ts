import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  ParkingSpace,
  Payment,
  Reservation,
  User,
  Vehicle,
} from 'src/libs/entities';
import { PaymentStatus } from 'src/libs/enums/payment-status.enum';
import { MongoRepository } from 'typeorm';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: MongoRepository<User>,
    @InjectRepository(ParkingSpace)
    private readonly parkingSpaceRepo: MongoRepository<ParkingSpace>,
    @InjectRepository(Reservation)
    private readonly reservationRepo: MongoRepository<Reservation>,
    @InjectRepository(Payment)
    private readonly paymentRepo: MongoRepository<Payment>,
    @InjectRepository(Vehicle)
    private readonly vehicleRepo: MongoRepository<Vehicle>,
  ) {}

  async getDashboardSummary() {
    const [total_users, total_establishments, total_reservations] =
      await Promise.all([
        this.userRepo.count(),
        this.parkingSpaceRepo.count(),
        this.reservationRepo.count(),
      ]);

    const completed_payments = await this.paymentRepo.find({
      where: { payment_status: PaymentStatus.COMPLETED },
    });

    const total_revenue = completed_payments.reduce(
      (sum, p) => sum + p.amount,
      0,
    );

    const recent_reservations = await this.reservationRepo.find({
      order: { created_at: 'DESC' },
      take: 5,
    });

    const recent_users = await this.userRepo.find({
      order: { created_at: 'DESC' },
      take: 10,
    });

    const parking_spaces = await this.parkingSpaceRepo.find({
      where: { is_deleted: false },
      order: { created_at: 'DESC' },
      take: 5,
    });

    // Load related vehicle and parking space for each reservation
    const reservations_with_relations = await Promise.all(
      recent_reservations.map(async (r) => {
        const vehicle = r.vehicle_id
          ? await this.vehicleRepo.findOneBy({ _id: r.vehicle_id })
          : null;
        const parking_space = r.parking_space_id
          ? await this.parkingSpaceRepo.findOneBy({ _id: r.parking_space_id })
          : null;

        return {
          _id: r._id,
          user_id: r.user_id,
          parking_space_id: r.parking_space_id,
          vehicle_id: r.vehicle_id,
          vehicle,
          parking_space,
          start_time: r.start_time,
          end_time: r.end_time,
          total_price: r.total_price,
          status: r.status,
          created_at: r.created_at,
          updated_at: r.updated_at,
        };
      }),
    );

    return {
      total_users,
      total_establishments,
      total_reservations,
      total_revenue,
      recent_reservations: reservations_with_relations,
      recent_users: recent_users.map((u) => ({
        _id: u._id,
        first_name: u.first_name,
        last_name: u.last_name,
        email: u.email,
        role: u.role,
        created_at: u.created_at,
      })),
      parking_spaces: parking_spaces.map((p) => ({
        _id: p._id,
        establishment_name: p.establishment_name,
        city: p.city,
        address: p.address,
        total_spaces: p.total_spaces,
        available_spaces: p.available_spaces,
        hourlyRate: p.hourlyRate,
        whole_day_rate: p.whole_day_rate,
        availability_status: p.availability_status,
        is_deleted: p.is_deleted,
        created_at: p.created_at,
        updated_at: p.updated_at,
      })),
    };
  }
}
