import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import axios from 'axios';
import { CryptoService } from 'src/libs/crypto/crypto.service';
import { ReservedSlot, User, Vehicle } from 'src/libs/entities';
import { ParkingSpace } from 'src/libs/entities/parking-space.entity';
import { Payment } from 'src/libs/entities/payment.entity';
import { Reservation } from 'src/libs/entities/reservation.entity';
import { PaymentStatus } from 'src/libs/enums/payment-status.enum';
import { ReservationStatus } from 'src/libs/enums/reservation-status.enum';
import { getAllDatesBetween } from 'src/libs/utils/date.utils';
import { Repository } from 'typeorm';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepo: Repository<Payment>,
    @InjectRepository(Reservation)
    private readonly reservationRepo: Repository<Reservation>,
    @InjectRepository(ParkingSpace)
    private readonly parkingSpaceRepo: Repository<ParkingSpace>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Vehicle)
    private readonly vehicleRepo: Repository<Vehicle>,
    @InjectRepository(ReservedSlot)
    private readonly reservedSlotRepo: Repository<ReservedSlot>,
    private cryptoService: CryptoService,
  ) {}

  /*

[
    {
        "id": "f488f979-76c4-46d8-b161-5008879531e3",
        "isPaid": true,
        "status": "PAYMENT_SUCCESS",
        "amount": "180",
        "currency": "PHP",
        "canVoid": true,
        "canRefund": false,
        "canCapture": false,
        "createdAt": "2025-07-12T20:46:50.911Z",
        "updatedAt": "2025-07-12T20:47:16.480Z",
        "description": "Charge for dale test",
        "paymentTokenId": "XDJPv3hqhCcGqDnMdCY69SWbEGan5sRDcwMXkZgcfA2xZrjnZkMKndtI2iKleRvf98QIuIUwb9BXOcGgfdYM3Sa45s3r4PVxaphtLgL1f4HaSzoLaMd1bX2JEVr5VEGrcXvzPMaWBTK8QDpXoD5w8WVgWjLSC7li4VN0",
        "fundSource": {
            "type": "card",
            "id": "XDJPv3hqhCcGqDnMdCY69SWbEGan5sRDcwMXkZgcfA2xZrjnZkMKndtI2iKleRvf98QIuIUwb9BXOcGgfdYM3Sa45s3r4PVxaphtLgL1f4HaSzoLaMd1bX2JEVr5VEGrcXvzPMaWBTK8QDpXoD5w8WVgWjLSC7li4VN0",
            "description": "**** **** **** 2346",
            "details": {
                "scheme": "master-card",
                "last4": "2346",
                "first6": "512345",
                "masked": "512345******2346",
                "issuer": "Others"
            }
        },
        "receipt": {
            "transactionId": "d7067f6b-b8ae-4668-8fe3-027b648d1277",
            "approvalCode": "00001234",
            "receiptNo": "a6be00752969",
            "approval_code": "00001234"
        },
        "approvalCode": "00001234",
        "receiptNumber": "a6be00752969",
        "requestReferenceNumber": "6872c9bc0f61d69e9abae312"
    }
]

[
  {
    "id": "4e3caab5-afa3-4cae-b46c-36582ee493f9",
    "isPaid": false,
    "status": "PENDING_TOKEN",
    "amount": "180",
    "currency": "PHP",
    "canVoid": false,
    "canRefund": false,
    "canCapture": false,
    "createdAt": "2025-07-12T20:25:32.706Z",
    "updatedAt": "2025-07-12T20:25:32.852Z",
    "requestReferenceNumber": "6872c4b8010a9444546da1f6"
  }
]

[
  {
    "id": "9bf61acf-e883-42d7-a9eb-185f8829c13f",
    "isPaid": false,
    "status": "PAYMENT_FAILED",
    "amount": "60",
    "currency": "PHP",
    "canVoid": false,
    "canRefund": false,
    "canCapture": false,
    "createdAt": "2025-07-12T21:11:26.221Z",
    "updatedAt": "2025-07-12T21:11:46.819Z",
    "description": "Charge for dasdas asdas",
    "paymentTokenId": "ILksCmOULCXA8mfXmLROPcmlN53VQN7zjMP2x9ENkHER4blvQ7cD4djZmz8aLshbS1oYPt9Y1FculwJqvJ0LPlN86tL6WD6WwTM2BNvvrIyMbOOKpX8Ichq5Ml3bjZdbAemx3R5LNEKsILIDKXfvcdNyrZBgwgMn5Ka0",
    "fundSource": {
      "type": "card",
      "id": "ILksCmOULCXA8mfXmLROPcmlN53VQN7zjMP2x9ENkHER4blvQ7cD4djZmz8aLshbS1oYPt9Y1FculwJqvJ0LPlN86tL6WD6WwTM2BNvvrIyMbOOKpX8Ichq5Ml3bjZdbAemx3R5LNEKsILIDKXfvcdNyrZBgwgMn5Ka0",
      "description": "**** **** **** 0508",
      "details": {
        "scheme": "visa",
        "last4": "0508",
        "first6": "412345",
        "masked": "412345******0508",
        "issuer": "Others"
      }
    },
    "requestReferenceNumber": "6872cf806397445bd1fd692a",
    "errorCode": "PY0120",
    "errorMessage": "[PY0120] Issuer decline."
  }
]

[
  {
    "id": "4c6c7944-d169-4ee0-9dfc-9f30262988a6",
    "isPaid": false,
    "status": "AUTH_FAILED",
    "amount": "180",
    "currency": "PHP",
    "canVoid": false,
    "canRefund": false,
    "canCapture": false,
    "createdAt": "2025-07-12T21:36:02.929Z",
    "updatedAt": "2025-07-12T21:36:19.430Z",
    "description": "Charge for ret ter",
    "paymentTokenId": "KdN4gqs2Sd6clFw8sH4FWfCqcsnwwgXZSTIeVpjfgomgXhrDQHPfzqADCTz5atgD5FKou7FfhjSAUncKzfeioa7B8YjOr2M9RLveZVyCxpkqJ9VZaAcRV1FoyWpiQQbDs4krRtpGXGD9gI282x0O2qlnZdhkCaKszgc",
    "fundSource": {
      "type": "card",
      "id": "KdN4gqs2Sd6clFw8sH4FWfCqcsnwwgXZSTIeVpjfgomgXhrDQHPfzqADCTz5atgD5FKou7FfhjSAUncKzfeioa7B8YjOr2M9RLveZVyCxpkqJ9VZaAcRV1FoyWpiQQbDs4krRtpGXGD9gI282x0O2qlnZdhkCaKszgc",
      "description": "**** **** **** 1381",
      "details": {
        "scheme": null,
        "last4": "1381",
        "first6": "412345",
        "masked": "412345******1381",
        "issuer": "Others"
      }
    },
    "requestReferenceNumber": "6872d544cb92534fabecca9e",
    "errorCode": "PY0100",
    "errorMessage": "[PY0100] Authentication failed."
  }
]

  */

  async checkAndUpdatePayment(
    referenceNumber: string,
    cancel: boolean = false,
  ) {
    const PAYMAYA_API_URL = `https://pg-sandbox.paymaya.com/payments/v1/payment-rrns/${referenceNumber}`;
    const SECRET_KEY = process.env.PAYMAYA_SECRET_KEY;

    const auth = Buffer.from(`${SECRET_KEY}`).toString('base64');

    let request;

    try {
      request = await axios.get(PAYMAYA_API_URL, {
        headers: {
          Authorization: `Basic ${auth}`,
          Accept: 'application/json',
        },
      });
    } catch {
      throw new NotFoundException({
        message: 'Transaction not found',
        data: { error: 'Transaction not found' },
      });
    }

    const mayaTransaction = request.data[0];

    if (!referenceNumber) {
      throw new BadRequestException('Reference number is required.');
    }

    // Get local payment and reservation
    const payment = await this.paymentRepo.findOne({
      where: { reference_number: referenceNumber },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found in DB');
    }

    const reservation = await this.reservationRepo.findOne({
      where: { _id: payment.reservation_id },
    });

    if (!reservation) {
      throw new NotFoundException('Reservation not found');
    }

    const parkingSpace = await this.parkingSpaceRepo.findOne({
      where: { _id: reservation.parking_space_id },
    });

    if (!parkingSpace) {
      throw new NotFoundException('Parking space not found');
    }

    if (cancel) {
      payment.payment_status = PaymentStatus.FAILED;
      payment.payment_date = new Date();
      await this.paymentRepo.save(payment);

      reservation.status = ReservationStatus.CANCELLED;
      await this.reservationRepo.save(reservation);

      return {
        ...mayaTransaction,
      };
    }

    // Only update if not yet marked as paid
    if (
      mayaTransaction.status === 'PAYMENT_SUCCESS' &&
      payment.payment_status !== PaymentStatus.COMPLETED
    ) {
      payment.payment_status = PaymentStatus.COMPLETED;
      payment.receipt_number = mayaTransaction.receipt?.receiptNo || undefined;
      payment.payment_date = new Date(mayaTransaction.updatedAt);
      await this.paymentRepo.save(payment);

      // Update reservation
      reservation.status = ReservationStatus.PAID;
      await this.reservationRepo.save(reservation);

      const start = new Date(reservation.start_time);
      const end = new Date(reservation.end_time);

      const dates = getAllDatesBetween(start.toISOString(), end.toISOString());

      for (const date of dates) {
        let slot = await this.reservedSlotRepo.findOne({
          where: {
            parking_space_id: parkingSpace._id,
            date,
          },
        });

        if (!slot) {
          slot = this.reservedSlotRepo.create({
            parking_space_id: parkingSpace._id,
            date,
            reserved_count: 0,
          });
        }

        /*

        Even though you already check available slot count during reservation creation, there is a race condition window:

        Multiple users can create reservations for the same date before paying.

        Only the first few who complete payment should consume capacity.

        Others should be rejected once capacity is exceeded.

      */
        if (slot.reserved_count >= parkingSpace.available_spaces) {
          throw new BadRequestException(
            `Slot on ${date} already fully reserved before payment was confirmed.`,
          );
        }

        slot.reserved_count++;
        await this.reservedSlotRepo.save(slot);
      }
    }

    // Handle failure
    else if (
      mayaTransaction.status === 'PAYMENT_FAILED' ||
      mayaTransaction.status === 'AUTH_FAILED'
    ) {
      payment.payment_status = PaymentStatus.FAILED;
      payment.payment_date = new Date(mayaTransaction.updatedAt);
      await this.paymentRepo.save(payment);

      reservation.status = ReservationStatus.CANCELLED;
      await this.reservationRepo.save(reservation);
    }

    return mayaTransaction;
  }

  async getAllWithReservations() {
    const payments = await this.paymentRepo.find();

    const enriched = await Promise.all(
      payments.map(async (payment) => {
        const reservation = await this.reservationRepo.findOne({
          where: { _id: payment.reservation_id },
        });

        if (!reservation) {
          return { ...payment, reservation: null };
        }

        const user = await this.userRepo.findOne({
          where: { _id: reservation.user_id },
        });

        const decryptedUser = user
          ? {
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
            }
          : null;

        const vehicle = await this.vehicleRepo.findOne({
          where: { _id: reservation.vehicle_id },
        });

        const parking_space = await this.parkingSpaceRepo.findOne({
          where: { _id: reservation.parking_space_id },
        });

        return {
          ...payment,
          reservation,
          user: decryptedUser,
          vehicle,
          parking_space,
        };
      }),
    );

    return enriched;
  }
}
