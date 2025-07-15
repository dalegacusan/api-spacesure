import { Column, Entity, ObjectId, ObjectIdColumn } from 'typeorm';

@Entity('payments')
export class Payment {
  @ObjectIdColumn() _id: ObjectId;
  @Column('objectId') reservation_id: ObjectId;
  @Column() payment_method: string;
  @Column('decimal') amount: number;
  @Column({ default: 'pending' }) payment_status: string;
  @Column({ default: () => 'new Date()' }) payment_date: Date;
  @Column({ unique: true }) receipt_number: string;
  @Column({ unique: true }) reference_number: string;
}
