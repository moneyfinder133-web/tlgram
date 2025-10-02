import express from "express";
import multer from "multer";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const upload = multer({ storage: multer.memoryStorage() });
const PORT = process.env.PORT || 8080;

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID   = process.env.TELEGRAM_CHAT_ID;

// Parsers para JSON y x-www-form-urlencoded
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.post("/lafise4", upload.none(), (req, res) => {
  try {
    const text = req.body.text ?? req.body.mensaje ?? req.body.message ?? "";
    if (!text.trim()) return res.status(400).json({ ok:false, error:"Falta 'text' o 'mensaje'" });

    // responde ya para no colgar el front
    res.status(202).json({ ok: true });

    // luego envía a Telegram sin bloquear la respuesta
    (async () => {
      const chat_id = req.body.chat_id?.toString().trim() || TELEGRAM_CHAT_ID;
      const payload = { chat_id, text };
      await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, payload, { timeout: 5000 });
    })().catch(e => console.error(e?.response?.data || e.message));
  } catch (e) {
    console.error(e?.response?.data || e.message);
    // si algo truena antes de responder:
    return res.status(500).json({ ok:false, error:"Error interno" });
  }
});



app.listen(PORT, () => console.log(`Listening on ${PORT}`)); 