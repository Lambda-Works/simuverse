import { Test, TestingModule } from '@nestjs/testing';
import { MarkitdownClient } from './markitdown-client.service';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('MarkitdownClient', () => {
  let service: MarkitdownClient;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MarkitdownClient],
    }).compile();

    service = module.get<MarkitdownClient>(MarkitdownClient);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('convert', () => {
    it('should send POST to sidecar and return markdown', async () => {
      const filePath = '/app/uploads/test.pdf';
      const expectedMarkdown = '# Test Document\n\nContent here.';

      mockedAxios.post.mockResolvedValue({
        data: { markdown: expectedMarkdown },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      });

      const result = await service.convert(filePath);

      expect(mockedAxios.post).toHaveBeenCalledWith(
        'http://markitdown:5000/convert',
        { file_path: filePath },
        { timeout: 30_000 },
      );
      expect(result).toBe(expectedMarkdown);
    });

    it('should throw when sidecar returns an error', async () => {
      mockedAxios.post.mockRejectedValue(new Error('Connection refused'));

      await expect(service.convert('/nonexistent.pdf')).rejects.toThrow(
        'Connection refused',
      );
    });
  });
});
