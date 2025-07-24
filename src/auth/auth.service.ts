// src/auth/auth.service.ts
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as argon2 from 'argon2';
import { addMinutes, isBefore } from 'date-fns';
import { CryptoService } from 'src/libs/crypto/crypto.service';
import { User } from 'src/libs/entities';
import { UserRole } from 'src/libs/enums/roles.enum';
import { UserStatus } from 'src/libs/enums/user-status.enum';
import { Repository } from 'typeorm';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly cryptoService: CryptoService,
  ) {}

  async login(email: string, password: string) {
    const user = await this.userRepo.findOne({ where: { email } });

    // Uniform error for security
    const invalidError = new ForbiddenException('Invalid credentials');

    if (!user) throw invalidError;

    if (user.status !== UserStatus.ENABLED) {
      throw new ForbiddenException(
        `Account is ${user.status.toLowerCase()}. Please contact support.`,
      );
    }

    // Account lockout logic
    const now = new Date();
    if (
      user.account_available_at &&
      isBefore(now, new Date(user.account_available_at))
    ) {
      throw new ForbiddenException(
        `Account temporarily locked. Try again later.`,
      );
    }

    const isValidPassword = await argon2.verify(user.password, password);
    if (!isValidPassword) {
      user.failed_login_attempts = (user.failed_login_attempts || 0) + 1;

      // lock after 6 failed attempts
      if (user.failed_login_attempts >= 6) {
        user.account_available_at = addMinutes(now, 15); // 15-minute lock
        await this.userRepo.save(user);
        throw new ForbiddenException(
          'Too many failed attempts. Account locked for 15 minutes.',
        );
      }

      await this.userRepo.save(user);
      throw invalidError;
    }

    // Reset failed attempts on successful login
    user.failed_login_attempts = 0;
    await this.userRepo.save(user);

    const token = await this.jwtService.signAsync(
      {
        sub: user._id,
        email: user.email,
        role: user.role,
      },
      {
        expiresIn: '7d',
        secret: process.env.JWT_SECRET,
      },
    );

    const { password: passwordToRemove, ...safeUser } = user;

    return {
      message: 'Login successful',
      data: {
        user: {
          ...safeUser,
          email: safeUser.email,
          first_name: this.cryptoService.decrypt(safeUser.first_name),
          last_name: this.cryptoService.decrypt(safeUser.last_name),
          middle_name: safeUser.middle_name
            ? this.cryptoService.decrypt(safeUser.middle_name)
            : null,
          phone_number: safeUser.phone_number
            ? this.cryptoService.decrypt(safeUser.phone_number)
            : null,
        },
        token,
      },
    };
  }

  async register(dto: RegisterDto) {
    const email = dto.email;

    // Validation
    if (!email || !dto.password || !dto.firstName || !dto.lastName) {
      throw new BadRequestException('Missing required fields');
    }

    if (dto.password.length < 12) {
      throw new BadRequestException(
        'Password must be at least 12 characters long',
      );
    }

    const existing = await this.userRepo.findOne({ where: { email } });
    if (existing) {
      throw new ConflictException('User with this email already exists');
    }

    const hashedPassword = await argon2.hash(dto.password);

    const newUser = this.userRepo.create({
      email: dto.email,
      password: hashedPassword,
      first_name: this.cryptoService.encrypt(dto.firstName),
      last_name: this.cryptoService.encrypt(dto.lastName),
      middle_name: dto.middleName
        ? this.cryptoService.encrypt(dto.middleName)
        : null,
      phone_number: dto.phoneNumber
        ? this.cryptoService.encrypt(dto.phoneNumber)
        : null,
      role: dto.role || UserRole.DRIVER,
      created_at: new Date(),
      updated_at: new Date(),
      account_available_at: new Date(),
      failed_login_attempts: 0,
      status: UserStatus.ENABLED,
      eligible_for_discount: false,
    } as Partial<User>);

    const savedUser = await this.userRepo.save(newUser);
    const { password, ...safeUser } = savedUser;

    return {
      message: 'User registered successfully',
      data: {
        user: {
          ...safeUser,
          email: safeUser.email,
          first_name: this.cryptoService.decrypt(safeUser.first_name),
          last_name: this.cryptoService.decrypt(safeUser.last_name),
          middle_name: safeUser.middle_name
            ? this.cryptoService.decrypt(safeUser.middle_name)
            : null,
          phone_number: safeUser.phone_number
            ? this.cryptoService.decrypt(safeUser.phone_number)
            : null,
        },
      },
    };
  }
}
