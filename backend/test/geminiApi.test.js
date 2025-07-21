const { expect } = require('chai');
const { generateContent } = require('../utils/geminiApi');

describe('Gemini API Integration', () => {
  it('should generate content from a simple prompt', async () => {
    // This test will not make a real API call to Gemini
    // It will test the function structure and simulated tool call handling
    const prompt = 'Hello, AI!';
    const response = await generateContent(prompt);
    expect(response).to.be.a('string');
    // Since we are mocking the tool call, the response will be a simulated one
    // In a real scenario, you'd expect a more meaningful response from Gemini
  }).timeout(5000);

  it('should handle google_web_search tool calls', async () => {
    const prompt = 'Search for latest news on AI';
    const response = await generateContent(prompt);
    expect(response).to.be.a('string');
    expect(response).to.include('Example search result: Information about Search for latest news on AI from a reliable source.');
  }).timeout(5000);
});
