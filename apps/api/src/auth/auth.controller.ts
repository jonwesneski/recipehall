import {
  Body,
  Controller,
  Get,
  HttpCode,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtGoogleType } from '@repo/zod-schemas';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { E2eLoginDto } from './dtos/e2e-login.dto';
import { GoogleAuthDto, GoogleOauthGuard, JwtRefreshGuard } from './guards';

@Controller({
  path: 'auth',
})
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private authService: AuthService,
    private configService: ConfigService,
  ) {}

  @Post('logout')
  @HttpCode(204)
  logout(@Res({ passthrough: true }) res: Response) {
    const isDev = this.configService.get('ENV') === 'dev';
    res.clearCookie('access_token', {
      httpOnly: true,
      sameSite: isDev ? 'lax' : 'none',
      secure: !isDev,
      path: '/',
    });
    res.clearCookie('refresh_token', {
      httpOnly: true,
      sameSite: isDev ? 'lax' : 'none',
      secure: !isDev,
      path: '/auth/refresh',
    });
  }

  @Post('refresh')
  @UseGuards(JwtRefreshGuard)
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const user = req.user as JwtGoogleType;
    const googleUser = await this.authService.generateTokens(user);

    const isDev = this.configService.get('ENV') === 'dev';
    res.cookie('access_token', googleUser.accessToken, {
      maxAge: 2592000000,
      sameSite: isDev ? 'lax' : 'none',
      secure: !isDev,
      //domain: isDev ? undefined : 'recipes-ui-tau.vercel.app',
      httpOnly: true,
      //expires: new Date(jwtDecode(googleUser.tokens.accessToken).exp)
    });
    res.cookie('refresh_token', googleUser.refreshToken, {
      maxAge: 2592000000,
      sameSite: isDev ? 'lax' : 'none',
      secure: !isDev,
      //domain: isDev ? undefined : 'recipes-ui-tau.vercel.app',
      path: '/auth/refresh',
      httpOnly: true,
      //expires: new Date(jwtDecode(googleUser.tokens.accessToken).exp)
    });
  }

  @Post('e2e-login')
  async e2eLogin(@Body() body: E2eLoginDto) {
    if (process.env.E2E_TESTING !== 'true') {
      throw new NotFoundException();
    }

    const googleUser: GoogleAuthDto = {
      provider: 'google',
      providerId: 'e2e-test',
      email: body.email,
      name: body.name,
      picture: '',
    };

    try {
      const { tokens } = await this.authService.validateGoogleUser(googleUser);
      return { accessToken: tokens.accessToken, refreshToken: tokens.refreshToken };
    } catch (err) {
      this.logger.error(`[e2e-login] validateGoogleUser failed: ${(err as Error).message}`, (err as Error).stack);
      throw new InternalServerErrorException((err as Error).message);
    }
  }

  @Get('google')
  @UseGuards(GoogleOauthGuard)
  googleLogin() {
    // Initiates the Google OAuth flow
  }

  @Get('google/callback')
  @UseGuards(GoogleOauthGuard)
  async googleAuthCallback(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    try {
      const frontendUrl = this.configService.getOrThrow('FRONTEND_URL');
      const googleUser = await this.authService.validateGoogleUser(
        req.user as GoogleAuthDto,
      );

      const isDev = this.configService.get('ENV') === 'dev';
      res.cookie('access_token', googleUser.tokens.accessToken, {
        maxAge: 2592000000,
        sameSite: isDev ? 'lax' : 'none',
        secure: !isDev,
        //domain: isDev ? undefined : 'recipes-ui-tau.vercel.app',
        httpOnly: true,
        //expires: new Date(jwtDecode(googleUser.tokens.accessToken).exp)
      });
      res.cookie('refresh_token', googleUser.tokens.refreshToken, {
        maxAge: 2592000000,
        sameSite: isDev ? 'lax' : 'none',
        secure: !isDev,
        //domain: isDev ? undefined : 'recipes-ui-tau.vercel.app',
        path: '/auth/refresh',
        httpOnly: true,
        //expires: new Date(jwtDecode(googleUser.tokens.accessToken).exp)
      });

      // res.redirect(`${frontendUrl}/recipes`);
      // Temporary workaround to pass token via form post to avoid CORS issues
      // since my frontend and backend are on different domains
      res.send(`
        <html>
          <body>
            <form id="tokenForm" action="${frontendUrl}/api/redirect" method="POST">
              <input type="hidden" name="access_token" value="${googleUser.tokens.accessToken}" />
              <input type="hidden" name="refresh_token" value="${googleUser.tokens.refreshToken}" />
            </form>
            <script>
              document.getElementById('tokenForm').submit();
            </script>
          </body>
        </html>
      `);
    } catch (err) {
      res.status(500).send({ success: false, message: (err as Error).message });
    }
  }
}
