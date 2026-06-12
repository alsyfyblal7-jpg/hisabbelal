import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Secure API endpoint for generating AI accounting payment reminders
  app.post('/api/generate-reminder', async (req, res) => {
    try {
      const { customerName, balance, currency, tone, storeName } = req.body;
      
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        // Return a smart template-generated message if key is missing
        const fallbackMsg = getFallbackAiMessage(customerName, balance, currency, tone, storeName);
        return res.json({ text: fallbackMsg, source: 'offline-model' });
      }

      const ai = new GoogleGenAI({ apiKey });
      
      // Choose prompt based on tone
      let toneInstruction = 'لطيفة وودية جداً';
      if (tone === 'official') toneInstruction = 'رسمية، جادة ومحددة تاريخياً لغرض التنظيم المالي والمطالبة الصافية للذمة';
      if (tone === 'urgent') toneInstruction = 'حازمة وسريعة ومستعجلة للغاية تدل على ضرورة الإغلاق المالي العاجل للحساب';

      const prompt = `أنت محاسب مالي ذكي ومحترف لمتجر تسمى "${storeName}". 
  اكتب رسالة مطالبة أو تنبيه باللغة العربية موجهة للعميل "${customerName}".
  المبلغ المالي المترتب عليه كدين مستحق: ${balance} ${currency}.
  النبرة المطلوبة للرسالة: ${toneInstruction}.
  الشروط الهامة التي يجب دمجها في الرسالة:
  1. حث العميل بلطف أو حزم (حسب النبرة المحددة) على سرعة السداد والتنبيه عليه.
  2. ذكر أنه "إذا تم السداد عن طريق التحويل، يرجى إرسال إيصال التحويل مباشرة إلى رقم الهاتف الخاص بالمتجر".
  تأكد من أن الرسالة تكون قصيرة ومؤثرة ومصاغة بأسلوب عربي بليغ ومناسب جداً للمطالبات المحاسبية المالية وتتراوح بين سطرين لثلاثة أسطر كحد أقصى تظهر أسفل الكشف المحاسبي لتنبيهه. لا تضف أي نص تمهيدي أو ختامي، اعطني فقط نص الرسالة المطلوب مباشرة داخل علامتي اقتباس.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
      });

      const aiText = response.text ? response.text.trim().replace(/^"|"$/g, '') : '';
      res.json({ text: aiText, source: 'gemini' });
    } catch (error: any) {
      console.warn('Gemini API high demand or limit hit, falling back gracefully to instant models:', error.message || error);
      const { customerName, balance, currency, tone, storeName } = req.body;
      const fallbackMsg = getFallbackAiMessage(customerName, balance, currency, tone, storeName);
      res.json({ 
        text: fallbackMsg, 
        source: 'high-demand-fallback',
        warning: 'سحابة بلال المالي تواجه ضغطاً مؤقتاً، تم استخدام التوليد الفوري الذكي ✓'
      });
    }
  });

  function getFallbackAiMessage(customerName: string, balance: number, currency: string, tone: string, storeName: string) {
    const currencyName = currency === 'YER' ? 'ريال يمني' : currency === 'SAR' ? 'ريال سعودي' : currency;
    if (tone === 'friendly') {
      return `نسأل الله لكم دوام الصحة والبركة، الأخ العزيز ${customerName}. نود التنويه بلطف بأن لديكم مديونية مستحقة بـ (${balance} ${currencyName}) لدى ${storeName}. يرجى التنسيق للسداد في أقرب وقت متاح لكم، وفي حال السداد عبر التحويل نرجو التكرم بإرسال صورة الإيصال لرقم المتجر لتوثيق السند وجزاكم الله خيراً.`;
    } else if (tone === 'official') {
      return `السيد المحترم ${customerName}، تبياناً للحساب المحاسبي الدوري لمتجر ${storeName}، نطلب منكم التكرم بجدولة سداد مديونيتكم الجارية البالغة (${balance} ${currencyName}). نرجو سرعة السداد والتنبيه، وإذا تم السداد عن طريق التحويل البنكي يرجى إرفاق إيصال السداد وإرساله إلى رقم المتجر لتحديث كشفكم المالي فوراً.`;
    } else {
      return `تنبيه عاجل ومهم: الأخ ${customerName}، نرجو منكم سرعة تصفية حسابكم المستحق البالغ (${balance} ${currencyName}) لصالح ${storeName}. نؤكد على ضرورة السداد العاجل والتنبيه، وفي حال السداد عبر التحويل يرجى إرسال إيصال إثبات التحويل مباشرة لرقم المتجر لاعتماده وتصفية القيد دون تأخير.`;
    }
  }

  // Vite middleware setup
  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
