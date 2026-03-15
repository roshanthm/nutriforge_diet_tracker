import { GoogleGenAI } from "@google/genai";
import { User, FoodLog, WeightLog } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function getAICoachAdvice(user: User, logs: FoodLog[], weightHistory: WeightLog[]) {
  const today = new Date().toISOString().split('T')[0];
  const todayLogs = logs.filter(log => log.logged_at === today);
  const totalCalories = todayLogs.reduce((acc, log) => acc + log.calories, 0);
  
  const prompt = `
    You are an expert AI Health & Nutrition Coach for the app "NutriForge".
    
    User Profile:
    - Name: ${user.name}
    - Age: ${user.age}
    - Gender: ${user.gender}
    - Current Weight: ${user.current_weight}kg
    - Target Weight: ${user.target_weight}kg
    - Daily Calorie Target: ${user.daily_target} kcal
    - Activity Level: ${user.activity_level}
    
    Today's Progress:
    - Calories Consumed: ${totalCalories} kcal
    - Remaining: ${user.daily_target - totalCalories} kcal
    
    Recent Weight History:
    ${weightHistory.slice(-5).map(w => `- ${w.logged_at}: ${w.weight}kg`).join('\n')}
    
    Please provide:
    1. A brief encouraging summary of their progress.
    2. 3 specific, actionable tips for today or tomorrow based on their data.
    3. A suggested healthy meal for their next meal (if they have calories left).
    
    Keep the tone professional, motivating, and concise. Use markdown for formatting.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "I'm sorry, I'm having trouble connecting to my knowledge base right now. Please try again later!";
  }
}
