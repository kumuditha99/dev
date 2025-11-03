/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { join } from 'path';

export const getTypeOrmConfig = (
  configService: ConfigService,
): TypeOrmModuleOptions => {
  console.log('TypeORM Config:', {
    host: configService.get('DB_HOST'),
    database: configService.get('DB_DATABASE'),
    sync: configService.get('DB_SYNC'),
    entities: join(__dirname, '..', '**', '*.entity.{ts,js}'),
  });

  return {
    type: 'postgres',
    host: configService.get('DB_HOST', 'localhost'),
    port: configService.get('DB_PORT', 5432),
    username: configService.get('DB_USERNAME', 'postgres'),
    password: configService.get('DB_PASSWORD', 'postgres'),
    database: configService.get('DB_DATABASE', 'notifications_db'),
    entities: [join(__dirname, '..', '**', '*.entity.{ts,js}')],
    migrations: [join(__dirname, '..', 'migrations', '*{.ts,.js}')],
    synchronize: configService.get('DB_SYNC', false), // Now properly handled
    logging: configService.get('DB_LOGGING', false),
    ssl: false,
  };
};
