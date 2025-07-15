import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UserRole } from 'src/libs/enums/roles.enum';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { FeedbacksService } from './feedbacks.service';

@Controller('feedback')
export class FeedbacksController {
  constructor(private readonly feedbacksService: FeedbacksService) {}

  @Post()
  @Roles(UserRole.DRIVER)
  async submitFeedback(@Body() dto: CreateFeedbackDto) {
    return this.feedbacksService.createFeedback(dto);
  }

  @Get('parking-space/:id')
  async getAllFeedbackForParkingSpace(@Param('id') parkingSpaceId: string) {
    return this.feedbacksService.getFeedbacksByParkingSpace(parkingSpaceId);
  }
}
