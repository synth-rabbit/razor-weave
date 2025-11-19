export interface ReviewerPromptData {
  personaId: string;
  personaProfile: {
    name: string;
    archetype: string;
    experience_level: string;
    playstyle_traits: string[];
  };
  contentType: 'book' | 'chapter';
  contentSnapshot: string;
  contentTitle: string;
}

export interface ReviewerPromptResult {
  prompt: string;
  expectedOutputSchema: string;
}
