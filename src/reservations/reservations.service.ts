// src/reservations/reservations.service.ts
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import axios from 'axios';
import { ObjectId } from 'mongodb';
import { ParkingSpace, Payment } from 'src/libs/entities';
import { Reservation } from 'src/libs/entities/reservation.entity';
import { Vehicle } from 'src/libs/entities/vehicle.entity';
import { AvailabilityStatus } from 'src/libs/enums/availability-status.enum';
import { PaymentStatus } from 'src/libs/enums/payment-status.enum';
import { ReservationStatus } from 'src/libs/enums/reservation-status.enum';
import { In, Repository } from 'typeorm';
import { CreateReservationDto } from './dto/create-reservation.dto';

@Injectable()
export class ReservationsService {
  constructor(
    @InjectRepository(Reservation)
    private readonly reservationRepo: Repository<Reservation>,
    @InjectRepository(Vehicle)
    private readonly vehicleRepo: Repository<Vehicle>,
    @InjectRepository(ParkingSpace)
    private readonly parkingSpaceRepo: Repository<ParkingSpace>,
    @InjectRepository(Payment)
    private readonly paymentRepo: Repository<Payment>,
  ) {}

  async getDriverHistory(userId: string) {
    const userObjectId = new ObjectId(userId);

    const reservations = await this.reservationRepo.find({
      where: { user_id: userObjectId },
      order: { created_at: 'DESC' },
    });

    const vehicleIds = Array.from(
      new Set(reservations.map((r) => r.vehicle_id.toString())),
    ).map((id) => new ObjectId(id));

    const parkingSpaceIds = Array.from(
      new Set(reservations.map((r) => r.parking_space_id.toString())),
    ).map((id) => new ObjectId(id));

    const vehicles = await this.vehicleRepo.find({
      where: {
        _id: { $in: vehicleIds },
      } as any,
    });

    const spaces = await this.parkingSpaceRepo.find({
      where: {
        _id: { $in: parkingSpaceIds },
      } as any,
    });

    // Map full vehicle record by vehicle_id
    const vehicleMap = new Map(vehicles.map((v) => [v._id.toString(), v]));

    const spaceMap = new Map(
      spaces.map((s) => [s._id.toString(), s.establishment_name]),
    );

    return reservations.map((r) => {
      const start = new Date(r.start_time);
      const end = new Date(r.end_time);

      const durationMs = end.getTime() - start.getTime();
      const hours = Math.round(durationMs / (1000 * 60 * 60));

      const formatTime = (date: Date) =>
        date.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        });

      return {
        id: r._id.toString(),
        establishment: spaceMap.get(r.parking_space_id.toString()) || 'Unknown',
        vehicle: vehicleMap.get(r.vehicle_id.toString()) || null,
        date: start.toISOString().split('T')[0],
        time: `${formatTime(start)} - ${formatTime(end)}`,
        duration: `${hours} hour${hours !== 1 ? 's' : ''}`,
        amount: `₱${r.total_price.toFixed(2)}`,
        status: r.status,
      };
    });
  }

  async getAllReservations() {
    const reservations = await this.reservationRepo.find({
      order: { created_at: 'DESC' },
    });

    const userIds = [...new Set(reservations.map((r) => r.user_id.toString()))];
    const vehicleIds = [
      ...new Set(reservations.map((r) => r.vehicle_id.toString())),
    ];
    const parkingSpaceIds = [
      ...new Set(reservations.map((r) => r.parking_space_id.toString())),
    ];

    const users = await this.vehicleRepo.manager
      .getMongoRepository('User')
      .find({
        where: { _id: { $in: userIds.map((id) => new ObjectId(id)) } } as any,
      });

    const vehicles = await this.vehicleRepo.find({
      where: { _id: { $in: vehicleIds.map((id) => new ObjectId(id)) } } as any,
    });

    const parkingSpaces = await this.parkingSpaceRepo.find({
      where: {
        _id: { $in: parkingSpaceIds.map((id) => new ObjectId(id)) },
      } as any,
    });

    const payments = await this.paymentRepo.find({
      where: {
        reservation_id: {
          $in: reservations.map((r) => r._id),
        },
      } as any,
    });

    const userMap = new Map(users.map((u) => [u._id.toString(), u]));
    const vehicleMap = new Map(vehicles.map((v) => [v._id.toString(), v]));
    const spaceMap = new Map(parkingSpaces.map((s) => [s._id.toString(), s]));
    const paymentMap = new Map();

    for (const p of payments) {
      const key = p.reservation_id.toString();
      if (!paymentMap.has(key)) paymentMap.set(key, []);
      paymentMap.get(key).push(p);
    }

    return reservations.map((r) => ({
      ...r,
      user: userMap.get(r.user_id.toString()) || null,
      vehicle: vehicleMap.get(r.vehicle_id.toString()) || null,
      parking_space: spaceMap.get(r.parking_space_id.toString()) || null,
      payments: paymentMap.get(r._id.toString()) || [],
    }));
  }

  async createReservation(userId: string, dto: CreateReservationDto) {
    const start = new Date(dto.start_time);
    const end = new Date(dto.end_time);

    // TODO - FIX must not be less than current datetime
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const startDate = new Date(
      start.getFullYear(),
      start.getMonth(),
      start.getDate(),
    );

    if (startDate.getTime() < today.getTime()) {
      throw new BadRequestException('Reservation date cannot be in the past.');
    }

    if (end.getTime() <= start.getTime()) {
      throw new BadRequestException('End time must be after start time.');
    }

    // COMPLETED and CANCELLED reservation status means no more reservations
    const existingActiveReservation = await this.reservationRepo.findOneBy({
      user_id: new ObjectId(userId),
      status: In([ReservationStatus.PAID]),
    });

    if (existingActiveReservation) {
      throw new BadRequestException('You already have an active reservation.');
    }

    // Validate parking space availability
    const parkingSpace = await this.parkingSpaceRepo.findOneBy({
      _id: new ObjectId(dto.parking_space_id),
      is_deleted: false,
    });

    if (!parkingSpace) {
      throw new NotFoundException('Parking space not found.');
    }

    if (
      parkingSpace.availability_status === AvailabilityStatus.CLOSED ||
      parkingSpace.available_spaces <= 0
    ) {
      throw new BadRequestException(
        'This parking space cannot be reserved at the moment.',
      );
    }

    const newReservation = this.reservationRepo.create({
      ...dto,
      user_id: new ObjectId(userId),
      parking_space_id: new ObjectId(dto.parking_space_id),
      vehicle_id: new ObjectId(dto.vehicle_id),
      discount: dto.discount ?? 0,
      tax: dto.tax ?? 0,
      status: ReservationStatus.CREATED,
    });

    const savedReservation = await this.reservationRepo.save(newReservation);

    const referenceNumber = savedReservation._id.toString();

    const newPayment = this.paymentRepo.create({
      reservation_id: savedReservation._id,
      payment_method: 'paymaya',
      amount: savedReservation.total_price,
      payment_status: PaymentStatus.PENDING,
      payment_date: new Date(),
      receipt_number: undefined,
      reference_number: referenceNumber,
    });

    await this.paymentRepo.save(newPayment);

    const checkoutUrl = await this.createCheckout(savedReservation);

    return {
      reservationId: savedReservation._id.toString(),
      checkoutUrl,
    };
  }

  private async createCheckout(reservation: Reservation): Promise<string> {
    const PAYMAYA_API_URL =
      'https://pg-sandbox.paymaya.com/checkout/v1/checkouts';
    const PUBLIC_KEY = process.env.PAYMAYA_PUBLIC_KEY;

    const requestReferenceNumber = reservation._id.toString();

    const payload = {
      totalAmount: {
        value: reservation.total_price,
        currency: 'PHP',
      },
      requestReferenceNumber,
      redirectUrl: {
        success: `${process.env.FRONTEND_URL}/payment/success?requestReferenceNumber=${requestReferenceNumber}`,
        failure: `${process.env.FRONTEND_URL}/payment/failure?requestReferenceNumber=${requestReferenceNumber}`,
        cancel: `${process.env.FRONTEND_URL}/payment/cancel?requestReferenceNumber=${requestReferenceNumber}`,
      },
    };

    const auth = Buffer.from(`${PUBLIC_KEY}`).toString('base64');

    const response = await axios.post(PAYMAYA_API_URL, payload, {
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });

    return response.data.redirectUrl;
  }

  async cancelReservation(reservationId: string) {
    const reservation = await this.reservationRepo.findOneBy({
      _id: new ObjectId(reservationId),
    });

    if (!reservation) {
      throw new NotFoundException('Reservation not found.');
    }

    if (reservation.status !== ReservationStatus.CREATED) {
      throw new BadRequestException(
        'Only reservations with CREATED status can be cancelled.',
      );
    }

    const now = new Date();

    reservation.status = ReservationStatus.CANCELLED;
    reservation.updated_at = now;
    await this.reservationRepo.save(reservation);

    const payments = await this.paymentRepo.find({
      where: { reservation_id: reservation._id },
    });

    for (const payment of payments) {
      payment.payment_status = PaymentStatus.FAILED;
      payment.payment_date = now;
      await this.paymentRepo.save(payment);
    }

    return {
      message: 'Reservation and associated payments cancelled successfully.',
      reservationId: reservation._id.toString(),
      status: reservation.status,
      updated_at: reservation.updated_at,
    };
  }

  async completeReservation(reservationId: string) {
    const reservation = await this.reservationRepo.findOneBy({
      _id: new ObjectId(reservationId),
    });

    if (!reservation) {
      throw new NotFoundException('Reservation not found.');
    }

    if (reservation.status !== ReservationStatus.PAID) {
      throw new BadRequestException(
        'Only PAID reservations can be marked as COMPLETED.',
      );
    }

    const parkingSpace = await this.parkingSpaceRepo.findOneBy({
      _id: reservation.parking_space_id,
    });

    if (!parkingSpace) {
      throw new NotFoundException('Related parking space not found.');
    }

    reservation.status = ReservationStatus.COMPLETED;
    reservation.updated_at = new Date();
    await this.reservationRepo.save(reservation);

    // Increment available_spaces (but not beyond total_spaces)
    parkingSpace.available_spaces = Math.min(
      parkingSpace.total_spaces,
      parkingSpace.available_spaces + 1,
    );
    await this.parkingSpaceRepo.save(parkingSpace);

    return {
      message: 'Reservation marked as completed.',
      reservationId: reservation._id.toString(),
      updated_at: reservation.updated_at,
    };
  }
}
