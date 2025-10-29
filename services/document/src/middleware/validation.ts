import { body, param, query, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

export const validate = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

export const documentValidation = {
  create: [
    body('title')
      .trim()
      .isLength({ min: 1, max: 255 })
      .withMessage('Title must be between 1 and 255 characters'),
    body('content')
      .optional()
      .isLength({ max: 1000000 })
      .withMessage('Content is too large'),
    body('workspaceId')
      .isInt()
      .withMessage('Workspace ID must be a number'),
    validate,
  ],

  update: [
    param('documentId')
      .isMongoId()
      .withMessage('Invalid document ID'),
    body('title')
      .optional()
      .trim()
      .isLength({ min: 1, max: 255 })
      .withMessage('Title must be between 1 and 255 characters'),
    body('content')
      .optional()
      .isLength({ max: 1000000 })
      .withMessage('Content is too large'),
    validate,
  ],

  getById: [
    param('documentId')
      .isMongoId()
      .withMessage('Invalid document ID'),
    validate,
  ],

  search: [
    query('query')
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('Search query must be between 1 and 100 characters'),
    query('workspaceId')
      .optional()
      .isInt()
      .withMessage('Workspace ID must be a number'),
    validate,
  ],
};