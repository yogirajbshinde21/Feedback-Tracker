/**
 * AI Routes
 * Handles AI-powered features using Gemini API
 */

const express = require('express');
const router = express.Router();
const geminiService = require('../services/geminiService');
const Feedback = require('../models/Feedback');

/**
 * POST /api/ai/ask-question
 * Get AI answer for customer questions
 * 
 * Request Body:
 * {
 *   "question": "How do I return a product?",
 *   "context": "I bought a shirt last week" (optional)
 * }
 */
router.post('/ask-question', async (req, res) => {
  try {
    console.log('📥 POST /api/ai/ask-question - Generating AI answer');

    const { question, context } = req.body;

    // Validate input
    if (!question || question.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Question is required'
      });
    }

    if (question.length > 500) {
      return res.status(400).json({
        success: false,
        message: 'Question is too long (max 500 characters)'
      });
    }

    console.log(`🤖 Processing question: ${question.substring(0, 50)}...`);

    // Generate AI answer
    const answer = await geminiService.generateAnswer(question, context);

    console.log('✅ Generated AI answer successfully');

    res.status(200).json({
      success: true,
      data: {
        question,
        answer,
        timestamp: new Date().toISOString(),
        model: 'gemini-1.5-flash'
      }
    });

  } catch (error) {
    console.error('❌ Error generating AI answer:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate AI answer',
      error: error.message
    });
  }
});

/**
 * POST /api/ai/generate-responses/:feedbackId
 * Generate response suggestions for specific feedback
 */
router.post('/generate-responses/:feedbackId', async (req, res) => {
  try {
    const { feedbackId } = req.params;
    console.log(`📥 POST /api/ai/generate-responses/${feedbackId}`);

    // Find the feedback
    const feedback = await Feedback.findById(feedbackId);

    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: 'Feedback not found'
      });
    }

    console.log(`🤖 Generating responses for: ${feedback.subject}`);

    // Generate AI suggestions
    const suggestions = await geminiService.generateResponseSuggestions(feedback);

    // Update feedback with new suggestions
    feedback.aiSuggestions = suggestions;
    await feedback.save();

    console.log(`✅ Generated ${suggestions.length} response suggestions`);

    res.status(200).json({
      success: true,
      message: 'Response suggestions generated successfully',
      data: {
        feedbackId,
        suggestions,
        generatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Error generating response suggestions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate response suggestions',
      error: error.message
    });
  }
});

/**
 * POST /api/ai/analyze-sentiment/:feedbackId
 * Analyze sentiment of feedback message
 */
router.post('/analyze-sentiment/:feedbackId', async (req, res) => {
  try {
    const { feedbackId } = req.params;
    console.log(`📥 POST /api/ai/analyze-sentiment/${feedbackId}`);

    // Find the feedback
    const feedback = await Feedback.findById(feedbackId);

    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: 'Feedback not found'
      });
    }

    console.log(`📊 Analyzing sentiment for: ${feedback.subject}`);

    // Analyze sentiment
    const analysis = await geminiService.analyzeSentiment(feedback.message);

    console.log(`✅ Sentiment analysis complete: ${analysis.sentiment}`);

    res.status(200).json({
      success: true,
      data: {
        feedbackId,
        analysis,
        message: feedback.message,
        analyzedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Error analyzing sentiment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to analyze sentiment',
      error: error.message
    });
  }
});

/**
 * GET /api/ai/health
 * Check AI service health
 */
router.get('/health', async (req, res) => {
  try {
    console.log('📥 GET /api/ai/health - Checking AI service');

    const isHealthy = await geminiService.healthCheck();

    if (isHealthy) {
      console.log('✅ AI service is healthy');
      res.status(200).json({
        success: true,
        message: 'AI service is operational',
        service: 'Google Gemini API',
        model: 'gemini-1.5-flash',
        timestamp: new Date().toISOString()
      });
    } else {
      console.log('⚠️ AI service health check failed');
      res.status(503).json({
        success: false,
        message: 'AI service is not available',
        service: 'Google Gemini API'
      });
    }

  } catch (error) {
    console.error('❌ Error checking AI health:', error);
    res.status(503).json({
      success: false,
      message: 'AI service health check failed',
      error: error.message
    });
  }
});

module.exports = router;