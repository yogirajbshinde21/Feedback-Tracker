/**
 * AI Question Box Component
 * Simple Q&A interface with Gemini AI
 */

import React, { useState } from 'react';
import { aiAPI, handleAPIError } from '../services/api';
import './Components.css';

const AIQuestionBox = () => {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!question.trim()) return;

    setIsLoading(true);
    setError('');
    setAnswer('');

    try {
      const response = await aiAPI.askQuestion(question);
      setAnswer(response.data.data.answer);
      
    } catch (err) {
      setError(handleAPIError(err));
    } finally {
      setIsLoading(false);
    }
  };

  const clearConversation = () => {
    setQuestion('');
    setAnswer('');
    setError('');
  };

  return (
    <div className="ai-question-box">
      <form onSubmit={handleSubmit} className="question-form">
        <div className="form-group">
          <label className="form-label">Ask a Question</label>
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            className="form-textarea"
            placeholder="How can I return a product? What are your business hours?"
            rows="3"
          />
        </div>

        <div className="form-actions">
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isLoading || !question.trim()}
          >
            {isLoading ? 'Thinking...' : 'Ask AI'}
          </button>
          
          {(answer || error) && (
            <button
              type="button"
              className="btn btn-outline"
              onClick={clearConversation}
            >
              Clear
            </button>
          )}
        </div>
      </form>

      {/* AI Response */}
      {isLoading && (
        <div className="ai-response loading">
          <div className="spinner"></div>
          <p>AI is thinking...</p>
        </div>
      )}

      {error && (
        <div className="ai-response error">
          <h4>❌ Error</h4>
          <p>{error}</p>
        </div>
      )}

      {answer && !isLoading && (
        <div className="ai-response success">
          <h4>🤖 AI Response</h4>
          <div className="answer-text">
            {answer.split('\n').map((line, index) => (
              <p key={index}>{line}</p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AIQuestionBox;