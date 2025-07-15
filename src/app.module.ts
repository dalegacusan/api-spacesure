import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminModule } from './admin/admin.module';
import { AuthModule } from './auth/auth.module';
import { FeedbacksModule } from './feedbacks/feedbacks.module';
import {
  AdminLog,
  Feedback,
  Notification,
  ParkingSpace,
  ParkingSpaceAdmin,
  Payment,
  Reservation,
  User,
  Vehicle,
} from './libs/entities';
import { NotificationsModule } from './notifications/notifications.module';
import { ParkingSpacesModule } from './parking-spaces/parking-spaces.module';
import { PaymentsModule } from './payments/payments.module';
import { ReservationsModule } from './reservations/reservations.module';
import { SeedModule } from './seed/seed.module';
import { UsersModule } from './users/users.module';
import { VehiclesModule } from './vehicles/vehicles.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forRoot({
      type: 'mongodb',
      url: process.env.DATABASE_URL,
      synchronize: false,
      entities: [__dirname + '/libs/entities/*.entity{.ts,.js}'],
      database: process.env.DATABASE_NAME,
    }),
    TypeOrmModule.forFeature([
      User,
      Vehicle,
      Reservation,
      ParkingSpace,
      Payment,
      Feedback,
      Notification,
      AdminLog,
      ParkingSpaceAdmin,
    ]),
    AuthModule,
    FeedbacksModule,
    NotificationsModule,
    ParkingSpacesModule,
    PaymentsModule,
    ReservationsModule,
    UsersModule,
    VehiclesModule,
    SeedModule,
    AdminModule,
  ],
})
export class AppModule {}
