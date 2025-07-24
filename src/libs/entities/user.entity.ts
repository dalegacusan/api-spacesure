import {
  Column,
  CreateDateColumn,
  Entity,
  ObjectId,
  ObjectIdColumn,
  UpdateDateColumn,
} from 'typeorm';
import { DiscountLevel } from '../enums/discount-eligiblity.enum';
import { UserRole } from '../enums/roles.enum';
import { UserStatus } from '../enums/user-status.enum';

@Entity('users')
export class User {
  @ObjectIdColumn()
  _id: ObjectId;

  @Column() first_name: string;
  @Column({ nullable: true }) middle_name?: string;
  @Column() last_name: string;
  @Column({ unique: true }) email: string;
  @Column() password: string;
  @Column() role: UserRole;
  @Column({ nullable: true }) phone_number?: string;
  @Column() failed_login_attempts: number;
  @Column({ default: false }) eligible_for_discount: boolean;
  @Column({ nullable: true }) discount_level?: DiscountLevel | null;
  @Column({ nullable: true }) discount_id?: string | null;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  account_available_at: Date;

  @CreateDateColumn() created_at: Date;
  @UpdateDateColumn() updated_at: Date;
  @Column() status: UserStatus;
}
