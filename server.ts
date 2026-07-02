import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Crucial: Increase JSON limits for larger budgets, if necessary
  app.use(express.json({ limit: "5mb" }));

  // API endpoint for generating bespoke budget recommendations using Gemini
  app.post("/api/insights", async (req, res) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
        return res.status(200).json([
          {
            title: "Connect Gemini for Custom AI Insights",
            category: "Savings",
            description: "Your offline-first budgeting workspace is set up. Connect your Gemini API Key in the Settings panel to unlock personalized, high-quality, actionable budgeting suggestions computed directly on your metrics.",
            impact: "High"
          },
          {
            title: "Rule of Thumb: Pay Yourself First",
            category: "Savings",
            description: "Aim to allocate at least 20% of your net income directly to savings or assets before budgeting expenses. Your current savings rate is updated dynamically in your performance reports.",
            impact: "Medium"
          },
          {
            title: "Budget Optimization Guide",
            category: "Expense Budgeting",
            description: "Fixed expenses are recurring commitments (e.g., rent, insurance) while variable expenses are flexible (e.g., dining, leisure). Categorizing these helps identify immediate cost-cutting avenues.",
            impact: "Medium"
          }
        ]);
      }

      const { budgetData } = req.body;
      if (!budgetData) {
        return res.status(400).json({ error: "No financial budget data provided." });
      }

      const ai = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });

      const incomeSummary = budgetData.income && budgetData.income.length > 0
        ? budgetData.income.map((i: any) => `- Source: ${i.source}, Amount: ${budgetData.currencySymbol}${i.amount}, Type: ${i.type}`).join("\n")
        : "None recorded";

      const expenseSummary = budgetData.expenses && budgetData.expenses.length > 0
        ? budgetData.expenses.map((e: any) => `- Category: ${e.category || "General"}, Item: ${e.item || "Unspecified"}, Amount: ${budgetData.currencySymbol}${e.amount}, Type: ${e.type}`).join("\n")
        : "None recorded";

      const totalIncomeVal = budgetData.income?.reduce((acc: number, i: any) => acc + (Number(i.amount) || 0), 0) || 0;
      const totalExpenseVal = budgetData.expenses?.reduce((acc: number, e: any) => acc + (Number(e.amount) || 0), 0) || 0;
      const savingsRate = totalIncomeVal > 0 ? ((totalIncomeVal - totalExpenseVal) / totalIncomeVal) * 100 : 0;

      const prompt = `You are a certified professional financial coach and strategic budget optimizer.
Analyze the user's detailed personal financial status and deliver 3 to 4 professional-grade, contextualized, highly actionable insights. Use a supportive, encouraging, yet mathematically sound financial planning voice. Focus on improving savings rate, optimizing current allocations, and building long-term net worth.

### USER PORTFOLIO:
- Preferred Currency: ${budgetData.currencyCode || "USD"} (${budgetData.currencySymbol || "$"})
- Monthly Income Streams:
${incomeSummary}
- Total Recorded Monthly Income: ${budgetData.currencySymbol}${totalIncomeVal}

- Monthly Expense Outflows:
${expenseSummary}
- Total Recorded Monthly Expense: ${budgetData.currencySymbol}${totalExpenseVal}

- Current Savings Rate: ${savingsRate.toFixed(1)}% (Calculated: (Income - Expenses) / Income)

- Net Worth Configuration:
  * Total Assets (Cash, Investments, Real Estate, etc.): ${budgetData.currencySymbol}${budgetData.netWorth?.assets || 0}
  * Total Liabilities (Credit cards, loans, mortgages): ${budgetData.currencySymbol}${budgetData.netWorth?.liabilities || 0}
  * Net Worth Baseline: ${budgetData.currencySymbol}${((budgetData.netWorth?.assets || 0) - (budgetData.netWorth?.liabilities || 0))}

### OUTPUT INSTRUCTIONS:
Evaluate discretionary spending leaks, evaluate savings velocity relative to the 50/30/20 guideline, identify leverage opportunities for liabilities, or comment on the diversification/status of net worth as shown in their logged values.
Return the suggestions strictly as a valid, JSON array. Do not return markdown wrappers like \`\`\`json. Return only the raw array string.
Each object inside the list MUST follow this structure:
{
  "title": "A concise, catchy title highlighting the primary guidance (e.g., 'Trim Subscription Bloat' or 'Accelerate Emergency Fund')",
  "category": "Savings" | "Expense Budgeting" | "Income Growth" | "Net Worth Strategy" | "Debt Management",
  "description": "2-3 highly specific, action-oriented, encouraging sentences showing them exactly what action to take (e.g. recommend a specific category to cut, or point to an asset/liability ratio to work on), citing the actual numbers in their profile.",
  "impact": "High" | "Medium" | "Low"
}`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json"
        }
      });

      const rawText = response.text?.trim() || "[]";
      // Ensure we extract pure JSON if the model still wrapped it
      let jsonStr = rawText;
      if (jsonStr.startsWith("```")) {
        const lines = jsonStr.split("\n");
        if (lines[0].includes("json")) {
          jsonStr = lines.slice(1, -1).join("\n");
        } else {
          jsonStr = lines.slice(1, -1).join("\n");
        }
      }
      
      const parsed = JSON.parse(jsonStr.trim());
      res.json(parsed);
    } catch (err: any) {
      console.error("Gemini Insights API Error:", err);
      res.status(500).json({ error: "Gemini server execution error: " + err.message });
    }
  });

  // Vite development middleware vs Static Production bundle
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
    console.log(`Server runs on host 0.0.0.0 at port ${PORT}`);
  });
}

startServer();
