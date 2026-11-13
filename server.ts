import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json());

// Server-side Gemini AI Client
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;
if (apiKey) {
  ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// API endpoint for generating additional quiz questions for Informatika Kelas X
app.post('/api/generate-questions', async (req, res) => {
  try {
    const { buildingCode, submateri, count = 5 } = req.body;
    const requestedCount = Math.min(Math.max(parseInt(count, 10) || 5, 1), 10);

    if (ai && apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
      const prompt = `Buatlah ${requestedCount} soal pilihan ganda HOTS (Higher Order Thinking Skills) dalam bahasa Indonesia untuk siswa SMA/SMK Kelas X mata pelajaran Informatika Bab 2 (Perancangan Algoritma dan Strategi Pengelolaan Data) dengan topik spesifik "${submateri || buildingCode}". 
Pastikan setiap soal memiliki 4 pilihan (A, B, C, D), kunci jawaban yang jelas (satu huruf: A, B, C, atau D), dan pembahasan edukatif yang mendalam.`;

      const genPromise = ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction:
            'Anda adalah guru ahli Informatika SMA/SMK Kurikulum Merdeka yang merancang bank soal berkualitas tinggi tentang algoritma, diagram alir, penelusuran (tracing), pseudocode, variabel, array, dan operator.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                question: { type: Type.STRING, description: 'Teks pertanyaan' },
                optionA: { type: Type.STRING, description: 'Pilihan A' },
                optionB: { type: Type.STRING, description: 'Pilihan B' },
                optionC: { type: Type.STRING, description: 'Pilihan C' },
                optionD: { type: Type.STRING, description: 'Pilihan D' },
                answer: { type: Type.STRING, description: 'Kunci jawaban: A, B, C, atau D' },
                explanation: { type: Type.STRING, description: 'Penjelasan atau pembahasan solusi' },
              },
              required: ['question', 'optionA', 'optionB', 'optionC', 'optionD', 'answer', 'explanation'],
            },
          },
        },
      });

      const timeoutPromise = new Promise<null>((_, reject) =>
        setTimeout(() => reject(new Error('AI Generation Timeout')), 8000)
      );

      try {
        const response: any = await Promise.race([genPromise, timeoutPromise]);
        const text = response?.text;
        if (text) {
          const parsed = JSON.parse(text);
          return res.json({ success: true, questions: parsed });
        }
      } catch (genErr) {
        console.warn('Gemini API call skipped or timed out, using curricular fallback:', genErr);
      }
    }

    // Fallback if AI key is unavailable or generation fails
    const fallbackList = [
      {
        question: `Dalam konsep ${submateri || 'Algoritma'}, mengapa perancangan langkah yang sistematis sangat menentukan efektivitas program?`,
        optionA: 'Membuat alur logika runtut, terstruktur, dan meminimalkan kesalahan logika sebelum penulisan kode',
        optionB: 'Menghilangkan keharusan komputer memiliki memori utama dan prosesor',
        optionC: 'Menjadikan program dapat dieksekusi tanpa membutuhkan input maupun output',
        optionD: 'Menggantikan peran bahasa pemrograman tingkat tinggi',
        answer: 'A',
        explanation: 'Perancangan yang sistematis memastikan seluruh alur dan percabangan terdefinisi secara logis sehingga meminimalkan galat saat dikodekan.',
      },
      {
        question: `Manakah representasi yang paling tepat ketika ingin menggambarkan alur keputusan bersyarat pada ${submateri || 'Materi Bab 2'}?`,
        optionA: 'Simbol belah ketupat (decision) dengan cabang Ya dan Tidak',
        optionB: 'Simbol oval terminator untuk setiap kondisi percabangan',
        optionC: 'Simbol jajar genjang untuk proses komputasi aritmetika',
        optionD: 'Garis alir tanpa arah panah',
        answer: 'A',
        explanation: 'Simbol belah ketupat digunakan khusus untuk evaluasi kondisi (keputusan) yang menghasilkan cabang alur alternatif seperti Ya atau Tidak.',
      },
      {
        question: `Pada penelusuran (tracing) rancangan ${submateri || 'algoritma'}, kolom nilai variabel berfungsi untuk ....`,
        optionA: 'Mencatat perubahan nilai variabel secara bertahap di setiap iterasi atau baris langkah',
        optionB: 'Menyimpan identitas nomor komputer siswa',
        optionC: 'Menampilkan pesan galat sintaksis compiler',
        optionD: 'Menghapus data awal masukan pengguna',
        answer: 'A',
        explanation: 'Tabel penelusuran melacak pergeseran nilai variabel pada setiap langkah eksekusi demi membuktikan kebenaran logika algoritma.',
      },
    ];

    res.json({ success: true, questions: fallbackList.slice(0, requestedCount) });
  } catch (error: any) {
    console.error('Error generating questions:', error);
    res.status(500).json({ success: false, error: error.message || 'Internal error' });
  }
});

async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const vite = await createViteServer({
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

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`EduBlox City server running on port ${PORT}`);
  });
}

startServer();
