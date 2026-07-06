import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class MarkitdownClient {
  private readonly logger = new Logger(MarkitdownClient.name);
  private readonly sidecarUrl =
    process.env.MARKITDOWN_URL || 'http://markitdown:5000';

  async convert(filePath: string): Promise<string> {
    const url = `${this.sidecarUrl}/convert`;

    this.logger.log(`Calling markitdown sidecar: POST ${url}`);

    const response = await axios.post<{ markdown: string }>(
      url,
      { file_path: filePath },
      { timeout: 30_000 },
    );

    return response.data.markdown;
  }
}
