import express from 'express';
import type { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '25mb' }));

// Shared server-side Gemini client with required User-Agent
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

/**
 * Endpoint 1: Scan Draft Board via Multimodal Gemini Vision
 * Accepts a base64 screenshot or frame grab of the Yahoo Fantasy draft room,
 * inspects the draft board, and returns structured detected picks.
 */
app.post('/api/ai/scan-board', async (req: Request, res: Response) => {
  try {
    const { imageBase64, mimeType = 'image/jpeg', candidatePlayerNames = [] } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: 'Missing imageBase64 payload.' });
    }

    // Strip data url prefix if present
    const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z]+;base64,/, '');

    const candidateHint = candidatePlayerNames.length > 0 
      ? `Here is the list of active NBA player names you should cross-reference and match against: ${candidatePlayerNames.slice(0, 100).join(', ')}.`
      : '';

    const promptText = `
You are an expert Yahoo Fantasy Basketball draft assistant with optical character recognition (OCR) and sports board vision capabilities.
Analyze this screenshot of a Yahoo Fantasy Basketball draft room or draft board.

Your task:
1. Identify all NBA players that appear as DRAFTED, TAKEN, or SELECTED in the draft grid, recent picks ticker, team rosters, or draft chat.
2. If pick numbers (e.g., Round 1 Pick 4, or Overall #12) or team names are visible alongside the player, extract them.
3. Match each detected player to their standard full NBA name.
${candidateHint}

Output the results strictly according to the JSON schema.
If no drafted players are visible or if this is a blank screen, return an empty array with an explanation in rawSummary.
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: cleanBase64,
            },
          },
          {
            text: promptText,
          },
        ],
      },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            detectedDrafted: {
              type: Type.ARRAY,
              description: 'List of drafted players detected on the Yahoo draft board',
              items: {
                type: Type.OBJECT,
                properties: {
                  playerName: {
                    type: Type.STRING,
                    description: 'Exact full NBA player name (e.g. Victor Wembanyama, Nikola Jokic)',
                  },
                  pickNumber: {
                    type: Type.INTEGER,
                    description: 'Overall draft pick number if visible, otherwise 0',
                  },
                  teamName: {
                    type: Type.STRING,
                    description: 'Drafting team name or slot if visible',
                  },
                  confidence: {
                    type: Type.STRING,
                    description: 'Confidence level: high, medium, or low',
                  },
                },
                required: ['playerName'],
              },
            },
            rawSummary: {
              type: Type.STRING,
              description: 'Brief 1-2 sentence human-readable summary of what was spotted on the board',
            },
            totalPicksFound: {
              type: Type.INTEGER,
              description: 'Total number of drafted players detected in this frame',
            },
            overallConfidence: {
              type: Type.STRING,
              description: 'Overall visual clarity: high, medium, or low',
            },
          },
          required: ['detectedDrafted', 'rawSummary', 'totalPicksFound', 'overallConfidence'],
        },
      },
    });

    const jsonText = response.text || '{}';
    const parsedData = JSON.parse(jsonText);
    return res.json(parsedData);
  } catch (error: any) {
    console.error('Error in /api/ai/scan-board:', error);
    return res.status(500).json({
      error: 'Failed to visually analyze draft board.',
      details: error.message || String(error),
    });
  }
});

/**
 * Endpoint 2: AI Co-GM Pick Recommendations
 * Evaluates current user 9-cat roster, active punts, position needs, and available players
 * to deliver tailored expert pick advice.
 */
app.post('/api/ai/recommend', async (req: Request, res: Response) => {
  try {
    const { userRoster = [], availablePlayers = [], puntedCategories = [], currentPickNumber = 1, leagueSize = 12, draftType = '3rr' } = req.body;

    const rosterSummary = userRoster.length > 0 
      ? userRoster.map((p: any) => `${p.name} (${p.positions.join('/')}) - PTS: ${p.stats.pts}, REB: ${p.stats.reb}, AST: ${p.stats.ast}, 3PM: ${p.stats.tpm}, STL: ${p.stats.stl}, BLK: ${p.stats.blk}, FG%: ${p.stats.fgPct}%, FT%: ${p.stats.ftPct}%, TO: ${p.stats.to}`).join('\n')
      : 'No players drafted yet (Round 1 pick).';

    const topAvailable = availablePlayers.slice(0, 18).map((p: any) => 
      `${p.id}|${p.name}|${p.team}|${p.positions.join('/')}|ADP:${p.yahooAdp}|PTS:${p.stats.pts}|REB:${p.stats.reb}|AST:${p.stats.ast}|3PM:${p.stats.tpm}|STL:${p.stats.stl}|BLK:${p.stats.blk}|FG%:${p.stats.fgPct}%|FT%:${p.stats.ftPct}%|TO:${p.stats.to}`
    ).join('\n');

    const promptText = `
You are the world's sharpest Yahoo Fantasy Basketball 9-Category Head-to-Head analyst and draft strategist.
The league format is standard Yahoo 9-Cat H2H:
Categories: Field Goal % (FG%), Free Throw % (FT%), 3-Pointers Made (3PM), Points (PTS), Rebounds (REB), Assists (AST), Steals (STL), Blocks (BLK), Turnovers (TO - lower is better).
Roster Positions: PG, SG, G, SF, PF, F, C, C, Util, Util, BN, BN, BN.

Current Draft Context:
- Current overall pick number: ${currentPickNumber} in a ${leagueSize}-team league.
- Draft order system: ${draftType === '3rr' ? '3rd Round Reversal (3RR - Round 3 reverses direction so the back of round 2 starts round 3)' : 'Standard Snake'}
- Active punted categories: ${puntedCategories.length > 0 ? puntedCategories.join(', ') : 'None (Balanced Build)'}
- User's current drafted roster:
${rosterSummary}

Top available available players on the board:
${topAvailable}

Evaluate:
1. Identify the Top 3 to 4 recommended draft targets right now. Label each with a clear badge: 'Best Overall Fit', 'Category Specialist', 'High-Upside Steal', or 'Positional Need'.
2. Provide concise, high-IQ strategic reasoning tailored specifically to 9-category H2H (not fantasy points or rotisserie).
3. Specify which categories each player bolsters, any negative drag (e.g. low FT% or high turnovers), and which Yahoo roster slot they can fill.
4. Provide a 2-sentence build assessment and a positional alert (e.g. scarcity of remaining assist or block anchors).

Respond strictly using the provided JSON schema.
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: promptText,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            overallAssessment: {
              type: Type.STRING,
              description: 'Analysis of current team strengths and weaknesses across the 9 categories',
            },
            suggestedPuntPath: {
              type: Type.STRING,
              description: 'Actionable advice on category punting strategy for this specific build',
            },
            positionalAlert: {
              type: Type.STRING,
              description: 'Urgent warning about upcoming positional drop-offs or category cliffs',
            },
            recommendations: {
              type: Type.ARRAY,
              description: 'Top 3-4 recommended players to draft',
              items: {
                type: Type.OBJECT,
                properties: {
                  playerId: { type: Type.STRING, description: 'ID of player' },
                  playerName: { type: Type.STRING, description: 'Name of player' },
                  badge: {
                    type: Type.STRING,
                    enum: ['Best Overall Fit', 'Category Specialist', 'High-Upside Steal', 'Positional Need'],
                  },
                  strategicReasoning: {
                    type: Type.STRING,
                    description: 'Why this pick makes mathematical and competitive sense in Yahoo 9-cat',
                  },
                  pros: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: '1-2 key category contributions',
                  },
                  risks: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: '1 potential downside or category drag',
                  },
                  targetCategories: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: 'Categories significantly improved (e.g. "ast", "3pm", "stl")',
                  },
                  rosterFitSlot: {
                    type: Type.STRING,
                    description: 'Which Yahoo roster spot they would slot into (e.g. "PG", "C", "G", "Util")',
                  },
                },
                required: ['playerId', 'playerName', 'badge', 'strategicReasoning', 'pros', 'risks', 'rosterFitSlot'],
              },
            },
          },
          required: ['overallAssessment', 'suggestedPuntPath', 'positionalAlert', 'recommendations'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json(parsed);
  } catch (error: any) {
    console.error('Error in /api/ai/recommend:', error);
    return res.status(500).json({
      error: 'Failed to generate AI pick recommendations.',
      details: error.message || String(error),
    });
  }
});

/**
 * Endpoint 3: Head-to-Head Player Comparison for Draft Decisions
 */
app.post('/api/ai/compare', async (req: Request, res: Response) => {
  try {
    const { players = [], userRoster = [], puntedCategories = [] } = req.body;

    if (players.length < 2) {
      return res.status(400).json({ error: 'Provide at least 2 players to compare.' });
    }

    const playerDescriptions = players.map((p: any) => 
      `${p.name} (${p.team} - ${p.positions.join('/')}) - PTS: ${p.stats.pts}, REB: ${p.stats.reb}, AST: ${p.stats.ast}, 3PM: ${p.stats.tpm}, STL: ${p.stats.stl}, BLK: ${p.stats.blk}, FG%: ${p.stats.fgPct}%, FT%: ${p.stats.ftPct}%, TO: ${p.stats.to}`
    ).join('\n');

    const promptText = `
You are an expert Yahoo Fantasy Basketball 9-Category Head-to-Head consultant.
A user is on the clock and torn between these players:
${playerDescriptions}

User's current team context:
- Roster: ${userRoster.map((p: any) => p.name).join(', ') || 'No players yet'}
- Active punts: ${puntedCategories.join(', ') || 'None'}

Compare these players across:
1. Category-by-category advantages (who wins scoring, assists, blocks, percentages, etc.).
2. Fit with the user's specific roster and punt strategy.
3. Positional eligibility advantage on Yahoo (multi-position tags like PG/SG or PF/C).
4. Final verdict: Which player should the manager draft right now, and why?
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: promptText,
    });

    return res.json({ comparison: response.text });
  } catch (error: any) {
    console.error('Error in /api/ai/compare:', error);
    return res.status(500).json({
      error: 'Failed to run player comparison.',
      details: error.message || String(error),
    });
  }
});

/**
 * Endpoint 4: Interactive Live Draft Co-GM Chat
 */
app.post('/api/ai/chat', async (req: Request, res: Response) => {
  try {
    const { question, userRoster = [], availableTop = [], puntedCategories = [], currentPick = 1 } = req.body;

    if (!question) {
      return res.status(400).json({ error: 'Question is required.' });
    }

    const prompt = `
You are Hardwood IQ, an elite Yahoo 9-Category Fantasy Basketball draft co-GM.
You are helping the user live during their draft.

Current situation:
- Overall Pick #: ${currentPick}
- User's Team: ${userRoster.map((p: any) => `${p.name} (${p.positions.join('/')})`).join(', ') || 'Empty'}
- Punted Categories: ${puntedCategories.join(', ') || 'None'}
- Top Available: ${availableTop.slice(0, 10).map((p: any) => p.name).join(', ')}

User question: "${question}"

Provide a crisp, actionable, high-IQ 9-cat response in 2 to 4 paragraphs. Be direct and give specific names, numbers, and category math.
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
    });

    return res.json({ answer: response.text });
  } catch (error: any) {
    console.error('Error in /api/ai/chat:', error);
    return res.status(500).json({
      error: 'Failed to respond to draft question.',
      details: error.message || String(error),
    });
  }
});

// Mount Vite middleware in development or serve static build in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`Hardwood IQ server listening on port ${PORT}`);
  });
}

startServer();
