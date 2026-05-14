import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Gemini Setup
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "",
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// API routes
app.post("/api/recommend-rewards", async (req, res) => {
  const { points, history } = req.body;
  
  const prompt = `
    Você é um assistente de marketing para a Farmácia Primavera. 
    Um cliente tem ${points} pontos de fidelidade.
    Baseado no histórico de compras: ${JSON.stringify(history)}
    Sugira 3 brindes ou descontos criativos (em português) que ele pode resgatar.
    Retorne apenas um array JSON de objetos com { "name": string, "pointsRequired": number, "description": string }.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ parts: [{ text: prompt }] }],
    });
    
    const text = response.text || "[]";
    // Simple extraction of JSON from markdown backticks if present
    const jsonMatch = text.match(/\[.*\]/s);
    const recommendations = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
    res.json(recommendations);
  } catch (error) {
    console.error("Gemini Error:", error);
    res.status(500).json({ error: "Failed to generate recommendations" });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
