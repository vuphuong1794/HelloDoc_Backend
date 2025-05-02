import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as dotenv from 'dotenv';
import * as admin from 'firebase-admin';
import * as serviceAccount from './firebase-service-account.json';

async function bootstrap() {
  dotenv.config();

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
  });

  const app = await NestFactory.create(AppModule);
  app.enableCors();
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true
  }));
  await app.listen(process.env.PORT ?? 4000, '0.0.0.0');

  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
}
bootstrap();
