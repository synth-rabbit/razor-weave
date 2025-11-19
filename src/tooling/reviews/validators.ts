import { existsSync } from 'fs';
import { ReviewDataSchema } from './schemas.js';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateReviewData(data: unknown): ValidationResult {
  const result = ReviewDataSchema.safeParse(data);

  if (result.success) {
    return { valid: true, errors: [] };
  }

  const errors = result.error.errors.map(
    (err) => `${err.path.join('.')}: ${err.message}`
  );

  return { valid: false, errors };
}

export function validateFileExists(filePath: string): ValidationResult {
  if (!existsSync(filePath)) {
    return {
      valid: false,
      errors: [`File does not exist: ${filePath}`],
    };
  }

  return { valid: true, errors: [] };
}

export function validateReviewComplete(
  campaignId: string,
  personaId: string,
  reviewDbRecord: unknown,
  markdownPath: string
): ValidationResult {
  const errors: string[] = [];

  // Check database record exists
  if (!reviewDbRecord) {
    errors.push(`No database record for ${personaId} in ${campaignId}`);
  }

  // Check markdown file exists
  if (!existsSync(markdownPath)) {
    errors.push(`Markdown file missing: ${markdownPath}`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
