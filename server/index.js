import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

const GROQ_API_KEY = process.env.GROQ_API_KEY;

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

// Free/fast model on Groq. Swap for "openai/gpt-oss-20b" if you'd rather match your old model.
const MODEL = 'llama-3.3-70b-versatile';

const SYSTEM_PROMPT = `You are a recipe generator. Given a list of ingredients a user has at home, invent one cookable recipe using mostly those ingredients (small common pantry staples like salt, oil, water are OK to add).

If the input has nothing food-related or is empty or nonsensical, set "error" to a short reason and leave other fields empty/default instead of inventing a recipe.

Rules:
- Return ONLY valid JSON.
- No markdown.
- No explanations.
- baseServings: an integer between 1 and 8
- amount: a number scaled for baseServings
- ids are short strings like "ing1","ing2","step1","step2"
- steps: 4 to 10 short, clear, sequential steps
- ingredients: 3 to 12 items
- swaps: 2 to 5 realistic substitutions.

Return exactly this structure:

{
  "error":"",
  "title":"",
  "description":"",
  "baseServings":2,
  "ingredients":[
    {
      "id":"ing1",
      "name":"",
      "amount":1,
      "unit":"cup"
    }
  ],
  "steps":[
    {
      "id":"step1",
      "text":""
    }
  ],
  "swaps":[
    {
      "ingredient":"",
      "alternatives":[]
    }
  ]
}
`;

function validateRecipe(data) {
  if (!data || typeof data !== 'object') return 'Response is not an object';
  if (data.error) return data.error;
  if (typeof data.title !== 'string' || !data.title.trim()) return 'Missing title';
  if (typeof data.baseServings !== 'number' || data.baseServings <= 0) return 'Missing/invalid baseServings';
  if (!Array.isArray(data.ingredients) || data.ingredients.length === 0) return 'Missing ingredients';
  if (!Array.isArray(data.steps) || data.steps.length === 0) return 'Missing steps';

  for (const ing of data.ingredients) {
    if (!ing.id || !ing.name || typeof ing.amount !== 'number')
      return 'Malformed ingredient';
  }

  for (const st of data.steps) {
    if (!st.id || typeof st.text !== 'string' || !st.text.trim())
      return 'Malformed step';
  }

  if (data.swaps && !Array.isArray(data.swaps))
    return 'Malformed swaps';

  return null;
}

// Strips ```json ... ``` or ``` ... ``` fences some models add despite instructions not to.
function stripCodeFences(text) {
  return text
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();
}

app.post('/api/recipe', async (req, res) => {

  const { ingredients } = req.body;

  if (!ingredients || typeof ingredients !== 'string' || !ingredients.trim()) {
    return res.status(400).json({
      error: 'Please describe the ingredients you have.'
    });
  }

  if (!GROQ_API_KEY) {
    return res.status(500).json({
      error: 'Server is missing GROQ_API_KEY. Check server/.env'
    });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25000);

  try {

    const aiRes = await fetch(GROQ_URL, {

      method: 'POST',

      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },

      body: JSON.stringify({

        model: MODEL,

        messages: [

          {
            role: 'system',
            content: SYSTEM_PROMPT
          },

          {
            role: 'user',
            content: `Ingredients I have:\n${ingredients}`
          }

        ],

        temperature: 0.4,

        response_format: {
          type: 'json_object'
        }

      }),

      signal: controller.signal

    });

    clearTimeout(timeout);

    if (!aiRes.ok) {

      const errText = await aiRes.text();

      console.error('Groq API error:', aiRes.status, errText);

      return res.status(502).json({
        error: 'The AI provider returned an error. Please try again.'
      });

    }

    const data = await aiRes.json();

    const rawText = data?.choices?.[0]?.message?.content;

    if (!rawText) {

      console.error('Empty Groq response', JSON.stringify(data));

      return res.status(502).json({
        error: 'The AI returned an empty response. Please try again.'
      });

    }

    let parsed;

    try {

      parsed = JSON.parse(stripCodeFences(rawText));

    } catch (e) {

      console.error('JSON parse failure. Raw text:', rawText);

      return res.status(502).json({
        error: 'The AI returned malformed data. Please try again.'
      });

    }

    const validationError = validateRecipe(parsed);

    if (validationError) {

      console.error('Validation failure:', validationError, parsed);

      return res.status(502).json({
        error: `The AI response didn't match the expected format (${validationError}). Try again or rephrase.`
      });

    }

    return res.json(parsed);

  } catch (err) {

    clearTimeout(timeout);

    if (err.name === 'AbortError') {

      return res.status(504).json({
        error: 'The AI took too long to respond. Please try again.'
      });

    }

    console.error('Unexpected server error:', err);

    return res.status(500).json({
      error: 'Something went wrong on the server.'
    });

  }

});

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.listen(PORT, () =>
  console.log(`Server running on http://localhost:${PORT}`)
);