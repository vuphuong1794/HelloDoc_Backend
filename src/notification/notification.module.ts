import { Module } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Notification, NotificationSchema } from 'src/schemas/notification.schema';

@Module({
  imports: [
        MongooseModule.forFeature([
          {name: Notification.name,schema: NotificationSchema},
        ])],
  controllers: [NotificationController],
  providers: [NotificationService],
})
export class NotificationModule {}
