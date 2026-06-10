export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { topic, count, level } = req.body;
  if (!topic || !count || !level) {
    return res.status(400).json({ error: 'topic, count, level required' });
  }

  const prompt = `Sen o'zbek tilida test tayyorlovchi yordamchisan.
Quyidagi parametrlar asosida test tuzing:
- Mavzu: ${topic}
- Savollar soni: ${count}
- Qiyinlik: ${level}

FAQAT JSON qaytarilsin, hech qanday qo'shimcha matn yo'q, markdown ham yo'q.
Format:
{
  "questions": [
    {
      "q": "Savol matni",
      "options": ["A) ...", "B) ...", "C) ...", "D) ..."],
      "answer": 0
    }
  ]
}
"answer" bu to'g'ri javobning indeksi (0=A, 1=B, 2=C, 3=D).
Barcha savollar va javoblar O'zbek tilida bo'lsin.`;

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        max_tokens: 2000,
        temperature: 0.7,
        messages: [
          {
            role: 'system',
            content: "Siz faqat JSON formatida javob beradigan test yaratuvchi yordamchisiz. Hech qanday qo'shimcha matn yozmang."
          },
          { role: 'user', content: prompt }
        ]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(500).json({ error: 'Groq API xatosi', detail: data });
    }

    const raw = data.choices[0].message.content;
    const clean = raw.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);
    return res.status(200).json(parsed);

  } catch (err) {
    return res.status(500).json({ error: 'Server xatosi', detail: err.message });
  }
}
