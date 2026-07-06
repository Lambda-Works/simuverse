import { Test, TestingModule } from '@nestjs/testing';
import { DeepSeekService } from './deepseek.service';
import axios from 'axios';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('DeepSeekService', () => {
  let service: DeepSeekService;

  beforeEach(async () => {
    // Set env var for API key
    process.env.OPENCODE_ZEN_API_KEY = 'test-api-key';

    const module: TestingModule = await Test.createTestingModule({
      providers: [DeepSeekService],
    }).compile();

    service = module.get<DeepSeekService>(DeepSeekService);
    jest.clearAllMocks();
  });

  afterEach(() => {
    delete process.env.OPENCODE_ZEN_API_KEY;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('chat()', () => {
    it('should send correct request with 60s timeout', async () => {
      const mockResponse = {
        data: {
          choices: [
            {
              message: {
                content: 'Test response from DeepSeek',
              },
            },
          ],
        },
      };

      mockedAxios.post.mockResolvedValueOnce(mockResponse);

      const result = await service.chat('Test prompt', 'Test system');

      expect(result).toBe('Test response from DeepSeek');
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://opencode.ai/zen/v1/chat/completions',
        {
          model: 'mimo-v2.5-free',
          messages: [
            { role: 'system', content: 'Test system' },
            { role: 'user', content: 'Test prompt' },
          ],
          temperature: 0.7,
          max_tokens: 4000,
        },
        {
          headers: {
            'Authorization': 'Bearer test-api-key',
            'Content-Type': 'application/json',
          },
          timeout: 60000,
        },
      );
    });

    it('should retry on timeout error', async () => {
      const timeoutError = new Error('timeout of 60000ms exceeded');
      timeoutError.name = 'AxiosError';

      const mockResponse = {
        data: {
          choices: [
            {
              message: {
                content: 'Response after retry',
              },
            },
          ],
        },
      };

      mockedAxios.post
        .mockRejectedValueOnce(timeoutError)
        .mockResolvedValueOnce(mockResponse);

      const result = await service.chat('Test prompt');

      expect(result).toBe('Response after retry');
      expect(mockedAxios.post).toHaveBeenCalledTimes(2);
    });

    it('should retry on 5xx errors', async () => {
      const serverError = {
        response: {
          status: 500,
          data: { error: 'Internal server error' },
        },
      };

      const mockResponse = {
        data: {
          choices: [
            {
              message: {
                content: 'Response after 500 error',
              },
            },
          ],
        },
      };

      mockedAxios.post
        .mockRejectedValueOnce(serverError)
        .mockResolvedValueOnce(mockResponse);

      const result = await service.chat('Test prompt');

      expect(result).toBe('Response after 500 error');
      expect(mockedAxios.post).toHaveBeenCalledTimes(2);
    });

    it('should throw error after retry fails', async () => {
      const error = new Error('Network error');
      mockedAxios.post.mockRejectedValue(error);

      await expect(service.chat('Test prompt')).rejects.toThrow('Network error');
      expect(mockedAxios.post).toHaveBeenCalledTimes(2);
    });

    it('should throw error for 4xx errors (no retry)', async () => {
      const clientError = {
        response: {
          status: 400,
          data: { error: 'Bad request' },
        },
      };

      mockedAxios.post.mockRejectedValue(clientError);

      await expect(service.chat('Test prompt')).rejects.toThrow();
      expect(mockedAxios.post).toHaveBeenCalledTimes(1);
    });

    it('should use default system prompt when not provided', async () => {
      const mockResponse = {
        data: {
          choices: [
            {
              message: {
                content: 'Response',
              },
            },
          ],
        },
      };

      mockedAxios.post.mockResolvedValueOnce(mockResponse);

      await service.chat('Test prompt');

      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://opencode.ai/zen/v1/chat/completions',
        {
          model: 'mimo-v2.5-free',
          messages: [
            {
              role: 'system',
              content: 'Eres un experto en análisis de documentos educativos del Ministerio de Educación.',
            },
            { role: 'user', content: 'Test prompt' },
          ],
          temperature: 0.7,
          max_tokens: 4000,
        },
        expect.any(Object),
      );
    });
  });
});