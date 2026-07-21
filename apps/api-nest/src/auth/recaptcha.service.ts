import {
  BadRequestException,
  Injectable,
  Logger,
} from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class RecaptchaService {
  private readonly logger = new Logger(RecaptchaService.name);

  async verify(token: string | undefined | null, remoteIp?: string): Promise<void> {
    const secret = process.env.RECAPTCHA_SECRET_KEY;

    // Skip in dev / test / when not configured
    if (!secret || process.env.AUTH_TEST_MODE === 'jwt' || process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'development') {
      this.logger.debug('reCAPTCHA bypassed (dev/test/not configured)');
      return;
    }

    if (!token) {
      throw new BadRequestException('reCAPTCHA token is required');
    }

    try {
      const params = new URLSearchParams();
      params.append('secret', secret);
      params.append('response', token);
      if (remoteIp) params.append('remoteip', remoteIp);

      const { data } = await axios.post(
        'https://www.google.com/recaptcha/api/siteverify',
        params.toString(),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, timeout: 10000 },
      );

      if (!data?.success) {
        this.logger.warn(`reCAPTCHA failed: ${JSON.stringify(data?.['error-codes'] || data)}`);
        throw new BadRequestException('reCAPTCHA verification failed');
      }
    } catch (err) {
      if (err instanceof BadRequestException) throw err;
      this.logger.error('reCAPTCHA siteverify error', err as Error);
      throw new BadRequestException('reCAPTCHA verification failed');
    }
  }
}
