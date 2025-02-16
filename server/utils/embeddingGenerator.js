import { pipeline } from "@xenova/transformers";

export const generateEmbedding = async (text) => {
  const extractor = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
  const output = await extractor(text, { pooling: "mean", normalize: true });
  return output.tolist()[0]; // Returns a 384-dimensional array
};
