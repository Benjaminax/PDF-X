const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

export const aiService = {
  /**
   * Summarizes a given text using Google Gemini 1.5 Flash via direct fetch for better debugging.
   */
  summarize: async (text) => {
    // Validate API key is configured
    if (!API_KEY) {
      throw new Error('Gemini API key not configured. Please add VITE_GEMINI_API_KEY to your .env file.');
    }

    const prompt = `
      Please provide a concise, professional executive summary of the following text extracted from a PDF. 
      Focus on key takeaways, main arguments, and important data points. 
      Format the output clearly.
      
      TEXT TO SUMMARIZE:
      ${text.slice(0, 30000)} 
    `;

    // Using the exact model name and API version verified for this account
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }]
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData?.error?.message || `HTTP ${response.status}: ${response.statusText}`;
        throw new Error(`API request failed: ${errorMessage}`);
      }

      const data = await response.json();

      if (data.error) {
        console.error('Gemini API Error:', data.error);
        throw new Error(data.error.message || 'API Error');
      }

      if (!data.candidates || !data.candidates[0]?.content?.parts?.[0]?.text) {
        throw new Error('Invalid response format from Gemini API');
      }

      return data.candidates[0].content.parts[0].text;
    } catch (error) {
      console.error('Summarization failed:', error);
      throw new Error(`AI Summarization failed: ${error.message}`);
    }
  },

  init: async () => true
};
