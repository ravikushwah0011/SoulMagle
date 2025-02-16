
import { GoogleGenerativeAI } from '@google/generative-ai';
import 'dotenv/config'; // Load environment variables

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-thinking-exp-01-21' });

export const generateMatchExplanation = async (userA, userB) => {
  
  console.log(userA, userB);
  const prompt = `
    Explain why ${userA.name} (interests: ${userA.interests}) 
    and ${userB.name} (interests: ${userB.interests}) 
    would be a good match in 15 words or less. Focus on common themes and similar meaning word.
  `;
  
  
  // const prompt = `
  //   User A's interests: ${userAInterests.join(', ')}.
  //   Matched user's interests: ${matchedUserInterests.join(', ')}.
  //   Explain their similarity in 10 words or less.
  // `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text().trim();
  } catch (error) {
    console.error('Gemini API Error:', error);
    return 'They share common interests!';
  }
}

// import OpenAI from "openai";

// const openai = new OpenAI({ apiKey: process.env.OPENAI_KEY });

// export const generateMatchExplanation = async (userA, userB) => {
//   console.log(userA, userB);
  
//   const prompt = `
//     Explain why ${userA.name} (interests: ${userA.interests}) 
//     and ${userB.name} (interests: ${userB.interests}) 
//     would be a good match. Keep it under 2 sentences.
//   `;

//   const response = await openai.chat.completions.create({
//     model: "gpt-3.5-turbo",
//     messages: [{ role: "user", content: prompt }],
//   });

//   return response.choices[0].message.content;
// };


