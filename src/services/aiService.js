import { pipeline } from '@xenova/transformers';

let summarizer = null;

export const aiService = {
  /**
   * Initializes the summarization pipeline.
   */
  init: async () => {
    if (!summarizer) {
      summarizer = await pipeline('summarization', 'Xenova/distilbart-cnn-6-6');
    }
    return summarizer;
  },

  /**
   * Summarizes a given text.
   * @param {string} text 
   * @returns {Promise<string>}
   */
  summarize: async (text) => {
    const pipe = await aiService.init();
    
    // Split text into chunks if too long (models usually have a limit)
    const maxLength = 1024;
    const truncatedText = text.slice(0, 4000); // Simple truncation for demo
    
    const output = await pipe(truncatedText, {
      max_new_tokens: 150,
      min_new_tokens: 30,
      boundary_token_id: 1,
    });
    
    return output[0].summary_text;
  }
};
