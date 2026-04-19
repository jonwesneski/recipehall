import { ConfigType, registerAs } from '@nestjs/config';
import { JwtModuleOptions } from '@nestjs/jwt';

export const jwtConfig = registerAs(
  'jwt',
  (): JwtModuleOptions => ({
    secret: process.env.JWT_SECRET,
    signOptions: {
      expiresIn: (process.env.JWT_EXPIRES_IN || '259200') as unknown as number,
    },
  }),
);

export type JwtConfigType = ConfigType<typeof jwtConfig>;
