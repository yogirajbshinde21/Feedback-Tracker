/**
 * Gemini AI Service
 * Handles all interactions with Google's Gemini AI API
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');

/**
 * Gemini AI Service Class
 * 
 * Why create a service class?
 * - Encapsulates all AI-related functionality
 * - Makes code reusable and maintainable
 * - Easy to test and mock
 * - Single point of configuration
 */
class GeminiService {
  constructor() {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is required in environment variables');
    }

    // Initialize the Gemini AI client
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    
    // Get the generative model
    this.model = this.genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash" // Using the latest stable model
    });

    console.log('🤖 Gemini AI Service initialized');
  }

  /**
   * Generate Response Suggestions for Feedback
   * 
   * @param {Object} feedback - The feedback object
   * @returns {Array} Array of response suggestions
   */
  async generateResponseSuggestions(feedback) {
    try {
      const { customerName, subject, message, rating, category } = feedback;

      // Create a detailed prompt for better responses
      const prompt = `
You are a professional customer service representative. Generate 3 helpful response suggestions for the following customer feedback:

Customer: ${customerName}
Subject: ${subject}
Message: ${message}
Rating: ${rating}/5 stars
Category: ${category}

Requirements for responses:
1. Be professional and empathetic
2. Address the specific concerns mentioned
3. Provide actionable solutions when possible
4. Keep responses between 100-200 words each
5. Maintain a positive, helpful tone

Generate 3 different response approaches:
1. Formal and detailed response
2. Friendly and conversational response  
3. Solution-focused brief response

Format each response clearly and separately.
`;

      // Generate content using Gemini
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Parse the response into individual suggestions
      const suggestions = this.parseResponseSuggestions(text);

      console.log(`🎯 Generated ${suggestions.length} suggestions for feedback: ${subject}`);
      return suggestions;

    } catch (error) {
      console.error('❌ Error generating response suggestions:', error);
      throw new Error('Failed to generate AI response suggestions');
    }
  }

  /**
   * Generate Answer for Customer Question
   * 
   * @param {string} question - Customer's question
   * @param {string} context - Additional context (optional)
   * @returns {string} AI-generated answer
   */
  async generateAnswer(question, context = '') {
    try {
      const prompt = `
You are a helpful customer service AI assistant. Answer the following customer question professionally and helpfully:

Question: ${question}

${context ? `Additional Context: ${context}` : ''}

Requirements:
1. Provide a clear, helpful answer
2. Be professional but friendly
3. If you don't know something, say so honestly
4. Keep the response concise (under 300 words)
5. Include actionable steps when applicable

Answer:
`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const answer = response.text();

      console.log(`💬 Generated answer for question: ${question.substring(0, 50)}...`);
      return answer.trim();

    } catch (error) {
      console.error('❌ Error generating answer:', error);
      throw new Error('Failed to generate AI answer');
    }
  }

  /**
   * Analyze Feedback Sentiment
   * 
   * @param {string} message - Feedback message
   * @returns {Object} Sentiment analysis result
   */
  async analyzeSentiment(message) {
    try {
      const prompt = `
Analyze the sentiment of this customer feedback message and provide a JSON response:

Message: "${message}"

Return a JSON object with:
{
  "sentiment": "positive" | "negative" | "neutral",
  "confidence": 0.0-1.0,
  "emotions": ["emotion1", "emotion2"],
  "urgency": "low" | "medium" | "high",
  "keyPoints": ["point1", "point2"]
}

Only return valid JSON, no additional text.
`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Parse JSON response
      const analysis = JSON.parse(text.trim());
      
      console.log(`📊 Analyzed sentiment: ${analysis.sentiment} (${analysis.confidence})`);
      return analysis;

    } catch (error) {
      console.error('❌ Error analyzing sentiment:', error);
      // Return default analysis if AI fails
      return {
        sentiment: 'neutral',
        confidence: 0.5,
        emotions: ['unknown'],
        urgency: 'medium',
        keyPoints: ['Requires manual review']
      };
    }
  }

  /**
   * Parse AI response into individual suggestions
   * 
   * @param {string} text - Raw AI response
   * @returns {Array} Array of suggestion objects
   */
  parseResponseSuggestions(text) {
    try {
      // Split the text into sections (this is a simple implementation)
      // In production, you might want more sophisticated parsing
      const sections = text.split(/\d+\.|Response \d+:|Approach \d+:/i)
        .filter(section => section.trim().length > 50) // Filter out short sections
        .slice(0, 3); // Take only first 3 suggestions

      return sections.map((suggestion, index) => ({
        suggestion: suggestion.trim(),
        confidence: 0.8 + (Math.random() * 0.2), // Random confidence between 0.8-1.0
        type: ['formal', 'friendly', 'solution-focused'][index] || 'general'
      }));

    } catch (error) {
      console.error('❌ Error parsing suggestions:', error);
      return [{
        suggestion: 'Thank you for your feedback. We appreciate you taking the time to share your experience with us.',
        confidence: 0.7,
        type: 'fallback'
      }];
    }
  }

  /**
   * Health Check for AI Service
   * 
   * @returns {boolean} Service health status
   */
  async healthCheck() {
    try {
      const result = await this.model.generateContent('Hello, are you working?');
      const response = await result.response;
      return response.text().length > 0;
    } catch (error) {
      console.error('❌ AI Service health check failed:', error);
      return false;
    }
  }
}

// Export a singleton instance
module.exports = new GeminiService();