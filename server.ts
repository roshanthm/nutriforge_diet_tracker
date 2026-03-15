import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function startServer() {
  const app = express();
  app.use(express.json());

  // --- API Routes ---

  // Food Search API (Proxied to USDA)
  app.get('/api/search', async (req, res) => {
    const { q } = req.query;
    const apiKey = process.env.USDA_API_KEY || 'DEMO_KEY';
    
    try {
      const usdaResponse = await axios.get(`https://api.nal.usda.gov/fdc/v1/foods/search`, {
        params: {
          query: q,
          pageSize: 10,
          api_key: apiKey
        }
      });

      const results = usdaResponse.data.foods.map((food: any) => {
        const getNutrient = (id: number) => food.foodNutrients.find((n: any) => n.nutrientId === id)?.value || 0;
        return {
          id: food.fdcId,
          name: food.description,
          brand: food.brandOwner,
          calories: getNutrient(1008), // Energy
          protein: getNutrient(1003),
          carbs: getNutrient(1005),
          fat: getNutrient(1004),
          servingSize: 100,
          servingUnit: 'g'
        };
      });

      res.json(results);
    } catch (error) {
      console.error('Search error:', error);
      res.status(500).json({ error: 'Failed to search foods' });
    }
  });

  // --- Vite Integration ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(3000, '0.0.0.0', () => {
    console.log('Server running on http://localhost:3000');
  });
}

startServer();
