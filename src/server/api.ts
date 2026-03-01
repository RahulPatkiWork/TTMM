import { Router } from 'express';
import { db } from '../lib/db/index.js';
import { simplifyDebts, Debt } from '../lib/algorithms/settlement.js';
import { GoogleGenAI, Type } from '@google/genai';

export const apiRouter = Router();

// Gemini Vision
apiRouter.post('/receipts/scan', async (req, res) => {
  const { imageBase64, mimeType } = req.body;

  if (!imageBase64 || !mimeType) {
    return res.status(400).json({ error: 'Missing imageBase64 or mimeType' });
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          {
            inlineData: {
              data: imageBase64,
              mimeType: mimeType,
            },
          },
          {
            text: 'Extract the receipt details into the exact JSON structure defined by the schema. All monetary values MUST be converted to integer paise/cents (e.g. ₹10.50 becomes 1050).',
          },
        ],
      },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            merchant_name: { type: Type.STRING },
            items: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  price_cents: { type: Type.INTEGER },
                },
                required: ['name', 'price_cents'],
              },
            },
            tax_cents: { type: Type.INTEGER },
            tip_or_service_charge_cents: { type: Type.INTEGER },
            total_cents: { type: Type.INTEGER },
          },
          required: ['merchant_name', 'items', 'tax_cents', 'tip_or_service_charge_cents', 'total_cents'],
        },
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error('No text returned from Gemini');
    }

    const parsed = JSON.parse(text);
    res.json(parsed);
  } catch (error) {
    console.error('Gemini Vision Error:', error);
    res.status(500).json({ error: 'Failed to scan receipt' });
  }
});

// Location Geocode
apiRouter.post('/location/geocode', async (req, res) => {
  const { lat, lng } = req.body;
  if (!lat || !lng) {
    return res.status(400).json({ error: 'Missing lat or lng' });
  }

  try {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (apiKey) {
      // Use Google Maps API
      const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`);
      const data = await response.json();

      if (data.results && data.results.length > 0) {
        const poi = data.results.find((r: any) => r.types.includes('point_of_interest') || r.types.includes('establishment'));
        const name = poi ? poi.address_components[0].long_name : data.results[0].formatted_address;
        return res.json({ name });
      }
    } else {
      // Fallback to OpenStreetMap (Nominatim)
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`, {
        headers: {
          'User-Agent': 'TTMM-App/1.0'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data && data.address) {
          // Try to get the most specific name
          const name = data.address.amenity || data.address.shop || data.address.building || data.address.road || data.display_name.split(',')[0];
          return res.json({ name });
        }
      }
    }
    
    // Final fallback if both fail or return no results
    res.json({ name: 'Unknown Location' });
  } catch (error) {
    console.error('Geocoding Error:', error);
    // Graceful degradation
    res.json({ name: 'Mock Location: 123 Main St' });
  }
});

// Users
apiRouter.get('/users', (req, res) => {
  const users = db.prepare('SELECT * FROM users').all();
  res.json(users);
});

apiRouter.post('/users', (req, res) => {
  const { id, name, email } = req.body;
  const stmt = db.prepare('INSERT INTO users (id, name, email, created_at) VALUES (?, ?, ?, ?)');
  stmt.run(id, name, email, Date.now());
  res.json({ success: true });
});

// Groups
apiRouter.get('/groups', (req, res) => {
  const groups = db.prepare('SELECT * FROM groups').all();
  res.json(groups);
});

apiRouter.post('/groups', (req, res) => {
  const { id, name } = req.body;
  const stmt = db.prepare('INSERT INTO groups (id, name, created_at) VALUES (?, ?, ?)');
  stmt.run(id, name, Date.now());
  res.json({ success: true });
});

// Group Members
apiRouter.post('/groups/:id/members', (req, res) => {
  const { id } = req.params;
  const { user_id } = req.body;
  const stmt = db.prepare('INSERT INTO group_members (group_id, user_id) VALUES (?, ?)');
  stmt.run(id, user_id);
  res.json({ success: true });
});

// Expenses
apiRouter.post('/expenses', (req, res) => {
  const { id, group_id, payer_id, description, amount_cents, splits, location_lat, location_lng, location_name, receipt_url } = req.body;

  // Validation Barrier: sum(splits) === total_amount_cents
  const totalSplits = splits.reduce((sum: number, split: any) => sum + split.amount_cents, 0);
  if (totalSplits !== amount_cents) {
    return res.status(400).json({ error: 'Bad Request: Sum of splits must exactly equal total amount_cents.' });
  }

  const insertExpense = db.prepare(`
    INSERT INTO expenses (id, group_id, payer_id, description, amount_cents, location_lat, location_lng, location_name, receipt_url, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertSplit = db.prepare(`
    INSERT INTO expense_splits (id, expense_id, user_id, amount_cents)
    VALUES (?, ?, ?, ?)
  `);

  const insertDebt = db.prepare(`
    INSERT INTO debts (debtor_id, creditor_id, group_id, amount_cents)
    VALUES (?, ?, ?, ?)
  `);

  // Transaction
  const transaction = db.transaction(() => {
    insertExpense.run(id, group_id, payer_id, description, amount_cents, location_lat || null, location_lng || null, location_name || null, receipt_url || null, Date.now());

    for (const split of splits) {
      insertSplit.run(split.id, id, split.user_id, split.amount_cents);

      // If the split is not the payer, they owe the payer
      if (split.user_id !== payer_id && split.amount_cents > 0) {
        // Check if debt exists
        const existingDebt = db.prepare('SELECT amount_cents FROM debts WHERE debtor_id = ? AND creditor_id = ? AND group_id = ?').get(split.user_id, payer_id, group_id) as { amount_cents: number } | undefined;
        
        if (existingDebt) {
          db.prepare('UPDATE debts SET amount_cents = amount_cents + ? WHERE debtor_id = ? AND creditor_id = ? AND group_id = ?').run(split.amount_cents, split.user_id, payer_id, group_id);
        } else {
          // Also check reverse debt to offset
          const reverseDebt = db.prepare('SELECT amount_cents FROM debts WHERE debtor_id = ? AND creditor_id = ? AND group_id = ?').get(payer_id, split.user_id, group_id) as { amount_cents: number } | undefined;
          
          if (reverseDebt) {
             // If payer owes the split user, offset it
             if (reverseDebt.amount_cents > split.amount_cents) {
                db.prepare('UPDATE debts SET amount_cents = amount_cents - ? WHERE debtor_id = ? AND creditor_id = ? AND group_id = ?').run(split.amount_cents, payer_id, split.user_id, group_id);
             } else if (reverseDebt.amount_cents < split.amount_cents) {
                db.prepare('DELETE FROM debts WHERE debtor_id = ? AND creditor_id = ? AND group_id = ?').run(payer_id, split.user_id, group_id);
                insertDebt.run(split.user_id, payer_id, group_id, split.amount_cents - reverseDebt.amount_cents);
             } else {
                db.prepare('DELETE FROM debts WHERE debtor_id = ? AND creditor_id = ? AND group_id = ?').run(payer_id, split.user_id, group_id);
             }
          } else {
             insertDebt.run(split.user_id, payer_id, group_id, split.amount_cents);
          }
        }
      }
    }
  });

  try {
    transaction();
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Dynamic Settlement for a Group
apiRouter.get('/groups/:id/balances', (req, res) => {
  const { id } = req.params;
  
  // Fetch raw debts for the group
  const rawDebts = db.prepare('SELECT debtor_id as "from", creditor_id as "to", amount_cents as amount FROM debts WHERE group_id = ?').all(id) as Debt[];

  // Run through settlement engine
  const simplifiedDebts = simplifyDebts(rawDebts);

  res.json({
    group_id: id,
    simplified_debts: simplifiedDebts
  });
});
