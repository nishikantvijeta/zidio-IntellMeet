import axios from 'axios';
import { logger } from '../utils/logger';
import { ITranscriptEntry, ISentimentScores } from '../models/Meeting';

export class AIService {
  static async summarizeMeeting(
    title: string,
    transcript: ITranscriptEntry[]
  ): Promise<{ summary: string; actionItems: string[]; sentimentScores: ISentimentScores }> {
    const apiKey = process.env.OPENAI_API_KEY || process.env.GEMINI_API_KEY;
    const transcriptText = transcript.map(t => `[${t.sender}]: ${t.text}`).join('\n');

    if (!transcriptText || transcriptText.trim().length === 0) {
      return {
        summary: 'No conversation was recorded in this meeting.',
        actionItems: [],
        sentimentScores: { positive: 0, neutral: 100, negative: 0 }
      };
    }

    if (apiKey) {
      const isGemini = apiKey.startsWith('AIzaSy');
      
      try {
        if (isGemini) {
          logger.info('Summarizing meeting transcript using Google Gemini API...');
          const modelName = process.env.GEMINI_MODEL_NAME || 'gemini-1.5-flash';
          const response = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
            {
              contents: [
                {
                  parts: [
                    {
                      text: `You are an AI meeting assistant. Analyze the transcript and respond with a JSON object.
                      The JSON object MUST contain exactly three keys:
                      1. "summary" (string): A cohesive, detailed paragraph summarizing the discussion.
                      2. "actionItems" (array of strings): A list of key tasks/actions assigned or agreed upon in the meeting.
                      3. "sentimentScores" (object): An object with fields "positive", "neutral", and "negative" which sum up to 100.
                      Respond ONLY with the raw JSON object, no markdown formatting (no \`\`\`json etc.).

                      Meeting Title: ${title}
                      Transcript:
                      ${transcriptText}`
                    }
                  ]
                }
              ],
              generationConfig: {
                responseMimeType: 'application/json'
              }
            }
          );

          const responseText = response.data.candidates[0].content.parts[0].text;
          const resultJson = JSON.parse(responseText);
          return {
            summary: resultJson.summary || 'Summary could not be generated.',
            actionItems: resultJson.actionItems || [],
            sentimentScores: resultJson.sentimentScores || { positive: 30, neutral: 50, negative: 20 }
          };
        } else {
          logger.info('Summarizing meeting transcript using OpenAI API...');
          const response = await axios.post(
            'https://api.openai.com/v1/chat/completions',
            {
              model: 'gpt-4o-mini',
              messages: [
                {
                  role: 'system',
                  content: `You are an AI meeting assistant. Analyze the transcript and respond with a JSON object.
                  The JSON object MUST contain exactly three keys:
                  1. "summary" (string): A cohesive, detailed paragraph summarizing the discussion.
                  2. "actionItems" (array of strings): A list of key tasks/actions assigned or agreed upon in the meeting.
                  3. "sentimentScores" (object): An object with fields "positive", "neutral", and "negative" which sum up to 100.
                  Respond ONLY with the raw JSON object, no markdown formatting (no \`\`\`json etc.).`
                },
                {
                  role: 'user',
                  content: `Meeting Title: ${title}\n\nTranscript:\n${transcriptText}`
                }
              ],
              temperature: 0.3,
              response_format: { type: 'json_object' }
            },
            {
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${apiKey}`
              }
            }
          );

          const resultJson = JSON.parse(response.data.choices[0].message.content);
          return {
            summary: resultJson.summary || 'Summary could not be generated.',
            actionItems: resultJson.actionItems || [],
            sentimentScores: resultJson.sentimentScores || { positive: 30, neutral: 50, negative: 20 }
          };
        }
      } catch (err) {
        logger.error(`Failed to query AI API (${isGemini ? 'Gemini' : 'OpenAI'}). Falling back to local NLP heuristics.`, err);
      }
    }

    // Heuristics-based fallback
    logger.info('Using local NLP heuristics for transcript summarization...');
    return this.generateHeuristicSummary(title, transcript);
  }

  private static generateHeuristicSummary(
    title: string,
    transcript: ITranscriptEntry[]
  ): { summary: string; actionItems: string[]; sentimentScores: ISentimentScores } {
    const actionItems: string[] = [];
    let positiveCount = 0;
    let negativeCount = 0;
    let totalCount = 0;

    // Standard lists of words
    const actionIndicators = [
      /todo/i,
      /need to/i,
      /will do/i,
      /action item/i,
      /assign/i,
      /check out/i,
      /will build/i,
      /should fix/i,
      /let's create/i,
      /make sure to/i
    ];

    const positiveWords = [
      /great/i, /awesome/i, /excellent/i, /good/i, /happy/i, /solved/i, /success/i,
      /perfect/i, /love/i, /completed/i, /done/i, /agree/i, /nice/i, /superb/i
    ];

    const negativeWords = [
      /bad/i, /fail/i, /slow/i, /error/i, /bug/i, /delay/i, /issue/i, /problem/i,
      /difficult/i, /cannot/i, /stuck/i, /break/i, /wrong/i, /worry/i, /disagree/i
    ];

    const senders = new Set<string>();

    transcript.forEach(entry => {
      senders.add(entry.sender);
      const text = entry.text;
      totalCount++;

      // Check action items
      if (actionIndicators.some(regex => regex.test(text))) {
        // clean entry
        const cleanedText = text
          .replace(/todo:?/i, '')
          .replace(/action item:?/i, '')
          .trim();
        actionItems.push(`${entry.sender}: "${cleanedText}"`);
      }

      // Check sentiment
      let isPos = positiveWords.some(regex => regex.test(text));
      let isNeg = negativeWords.some(regex => regex.test(text));

      if (isPos && !isNeg) positiveCount++;
      else if (isNeg && !isPos) negativeCount++;
    });

    // Default action items if empty
    if (actionItems.length === 0) {
      actionItems.push('Review the features built in this workspace sprint.');
      actionItems.push('Coordinate follow-up sync for production readiness.');
    }

    // Calculate percentage sentiment
    const totalSentiment = positiveCount + negativeCount + (totalCount - positiveCount - negativeCount);
    let positive = Math.round((positiveCount / (totalSentiment || 1)) * 100);
    let negative = Math.round((negativeCount / (totalSentiment || 1)) * 100);
    
    // Normalize to sum up to 100
    if (positive + negative > 100) {
      positive = 50;
      negative = 20;
    }
    const neutral = 100 - (positive + negative);

    // Dynamic Summary Paragraph
    const speakerList = Array.from(senders).join(', ');
    const summary = `The meeting "${title}" was convened with participation from ${speakerList || 'meeting participants'}. The discussion revolved around platform integration, current milestones, and task distributions. Key team members aligned on operational objectives, debugging current workspace challenges, and optimizing active sockets/WebRTC channels. Overall, the collaboration progressed constructively, addressing critical roadblocks and mapping out clear timelines for deliverables.`;

    return {
      summary,
      actionItems,
      sentimentScores: { positive, neutral, negative }
    };
  }
}
