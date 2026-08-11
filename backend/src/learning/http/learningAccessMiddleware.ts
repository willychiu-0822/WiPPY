import type { Request, Response, NextFunction } from 'express';
import type { LearningRepository } from '../application/ports';

export function createLearningAccessMiddleware(repository: LearningRepository) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!(await repository.hasLearningAccess(req.userId))) {
      res.status(404).json({ error: 'Not found', code: 'not_found' });
      return;
    }
    next();
  };
}
