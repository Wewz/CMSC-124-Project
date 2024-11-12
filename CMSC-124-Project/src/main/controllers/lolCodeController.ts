import { Request, Response } from 'express';
import { analyzeLolcode } from '../lib/lolCodeAnalyzer';

export const analyzeFile = (req: Request, res: Response) => {
  const { fileContent } = req.body;

  try {
    const analysisResult = analyzeLolcode(fileContent);
    res.status(200).json({ result: analysisResult });
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};