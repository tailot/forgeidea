import { getPrompt } from '../flows/getPrompt';
import * as fs from 'fs/promises';

// Mock the genkit internal functions and fs/promises
jest.mock('@genkit-ai/ai/evaluator', () => ({
  getEvaluatorContext: jest.fn().mockReturnValue({
    evaluate: jest.fn().mockResolvedValue(undefined),
  }),
}));
jest.mock('fs/promises', () => ({
  readFile: jest.fn(),
}));

describe('getPrompt Flow', () => {
  it('should retrieve content from a prompt file', async () => {
    const mockPromptName = 'testPrompt';
    const mockPromptContent = 'This is a test prompt.';
    (fs.readFile as jest.Mock).mockResolvedValue(mockPromptContent);

    const result = await getPrompt(mockPromptName);
    expect(fs.readFile).toHaveBeenCalledWith(`./prompts/${mockPromptName}.prompt`, 'utf-8');
    expect(result).toBe(mockPromptContent);
  });

  it('should handle errors when a prompt file is not found', async () => {
    const mockPromptName = 'nonExistentPrompt';
    (fs.readFile as jest.Mock).mockRejectedValue(new Error('File not found'));

    await expect(getPrompt(mockPromptName)).rejects.toThrow('File not found');
  });
});
