import { Request, Response } from 'express';
import axios from 'axios';
import { AuthRequest } from '../types/auth';

interface GeminiRequest {
  contents: Array<{
    parts: Array<{
      text: string;
    }>;
  }>;
}

// AI Search Controller
export const aiSearch = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { query, context = 'gigs', filters = {} } = req.body;

    if (!query || typeof query !== 'string') {
      res.status(400).json({
        success: false,
        message: 'Query is required and must be a string'
      });
      return;
    }

    // Construct the AI prompt based on context
    const systemPrompt = `You are an AI assistant for a freelancer marketplace. Your job is to interpret user search queries and convert them into structured search parameters.

Context: User is searching for ${context}

Available categories for gigs: web, mobile, design, data, devops, writing, marketing
Available subcategories:
- web: frontend, backend, fullstack, wordpress, ecommerce
- mobile: ios, android
- design: ui, ux, graphic, logo
- data: analysis, ml, visualization
- devops: cicd, cloud, infrastructure
- writing: copywriting, technical, content
- marketing: seo, social, ads

Available price ranges: 0-50, 50-200, 200-500, 500-1000, 1000+
Available sort options: relevance, price_low, price_high, rating, newest

User query: "${query}"

Please analyze this query and respond with a JSON object containing:
{
  "interpretedQuery": "A clear interpretation of what the user is looking for",
  "suggestedFilters": {
    "category": "best matching category or null",
    "subCategory": "best matching subcategory or null", 
    "priceRange": "best matching price range or null",
    "sortBy": "best matching sort option or 'relevance'",
    "keywords": ["array", "of", "relevant", "keywords"]
  },
  "searchQuery": "cleaned search query for text search",
  "explanation": "Brief explanation of how you interpreted the query"
}

Only respond with valid JSON, no additional text.`;

    // Call Gemini API
    const geminiRequest: GeminiRequest = {
      contents: [
        {
          parts: [
            {
              text: systemPrompt
            }
          ]
        }
      ]
    };

    const geminiResponse = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      geminiRequest,
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    // Extract and parse the AI response
    const aiText = geminiResponse.data.candidates[0]?.content?.parts[0]?.text;
    
    if (!aiText) {
      throw new Error('No response from AI');
    }

    // Clean and parse JSON response
    const cleanedText = aiText.replace(/```json\n?|\n?```/g, '').trim();
    const aiResult = JSON.parse(cleanedText);

    // Validate the response structure
    const response = {
      interpretedQuery: aiResult.interpretedQuery || query,
      suggestedFilters: {
        category: aiResult.suggestedFilters?.category || null,
        subCategory: aiResult.suggestedFilters?.subCategory || null,
        priceRange: aiResult.suggestedFilters?.priceRange || null,
        sortBy: aiResult.suggestedFilters?.sortBy || 'relevance',
        keywords: aiResult.suggestedFilters?.keywords || []
      },
      searchQuery: aiResult.searchQuery || query,
      explanation: aiResult.explanation || 'Processed your search query'
    };

    res.json({
      success: true,
      data: response
    });

  } catch (error) {
    console.error('AI Search Error:', error);
    
    // Fallback response if AI fails
    const fallbackResponse = {
      interpretedQuery: req.body.query,
      suggestedFilters: {
        category: null,
        subCategory: null,
        priceRange: null,
        sortBy: 'relevance',
        keywords: req.body.query.split(' ').filter((word: string) => word.length > 2)
      },
      searchQuery: req.body.query,
      explanation: 'Using basic search due to AI processing error'
    };

    res.json({
      success: true,
      data: fallbackResponse,
      fallback: true
    });
  }
};

// Get AI-powered search suggestions
export const getSearchSuggestions = async (req: Request, res: Response): Promise<void> => {
  try {
    const { q } = req.query;
    
    if (!q || typeof q !== 'string') {
      res.json({ suggestions: [] });
      return;
    }

    const prompt = `Generate 5 search suggestions for a freelancer marketplace based on this partial query: "${q}"

Make the suggestions:
1. Relevant to freelancing/gig work
2. Complete the user's thought
3. Include different variations (services, skills, project types)

Respond with only a JSON array of strings, no additional text.

Example format: ["web development services", "mobile app design", "content writing"]`;

    const geminiRequest: GeminiRequest = {
      contents: [
        {
          parts: [
            {
              text: prompt
            }
          ]
        }
      ]
    };

    const geminiResponse = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      geminiRequest,
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    const aiText = geminiResponse.data.candidates[0]?.content?.parts[0]?.text;
    const cleanedText = aiText?.replace(/```json\n?|\n?```/g, '').trim();
    
    let suggestions: string[] = [];
    try {
      suggestions = JSON.parse(cleanedText || '[]');
    } catch {
      suggestions = [];
    }

    res.json({
      success: true,
      suggestions: suggestions.slice(0, 5)
    });

  } catch (error) {
    console.error('Search Suggestions Error:', error);
    res.json({
      success: true,
      suggestions: []
    });
  }
}; 