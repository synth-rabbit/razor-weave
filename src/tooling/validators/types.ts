// Shared types for validators
export interface ValidationResult {
  valid: boolean;
  error?: string;
  warning?: string;
  format?: string;
  metadata?: Record<string, unknown>;
}

export interface ValidationError {
  type: 'structure' | 'link' | 'completeness' | 'consistency';
  message: string;
  line?: number;
}
