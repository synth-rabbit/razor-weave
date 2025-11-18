import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import YAML from 'yaml';
import { getDatabase } from '../database/index.js';
import type { PersonaData } from '../database/persona-client.js';

/**
 * Find the project root by walking up from current directory
 */
function findProjectRoot(): string {
  const currentFile = fileURLToPath(import.meta.url);
  let dir = dirname(currentFile);

  while (dir !== '/' && dir !== '.') {
    const packageJsonPath = join(dir, 'package.json');
    if (existsSync(packageJsonPath)) {
      try {
        const pkg = JSON.parse(readFileSync(packageJsonPath, 'utf-8')) as {
          name?: string;
          workspaces?: unknown;
        };
        if (pkg.name === 'razorweave' || pkg.workspaces !== undefined) {
          return dir;
        }
      } catch {
        // Invalid JSON, keep searching
      }
    }
    dir = dirname(dir);
  }

  return process.cwd();
}

const PROJECT_ROOT = findProjectRoot();

export interface PersonaFile {
  id: string;
  name: string;
  type: 'core' | 'generated';
  schema_version: number;
  created_at: string;
  dimensions: {
    archetype: string;
    experience_level: string;
    playstyle_modifiers?: string[];
    cognitive_styles?: {
      primary: string;
      secondary?: string;
    };
    social_emotional_traits?: string[];
    system_exposures?: string[];
    life_contexts?: string[];
    fiction_first_alignment: string;
    narrative_mechanics_comfort: string;
    gm_philosophy: string;
    genre_flexibility: string;
  };
  narrative_profile?: string;
  testing_focus?: string[];
}

export function loadPersonaFromFile(id: string): PersonaFile {
  const personaPath = join(
    PROJECT_ROOT,
    'data/personas/core',
    `${id}.yaml`
  );

  const yaml = readFileSync(personaPath, 'utf-8');
  return YAML.parse(yaml) as PersonaFile;
}

export function hydratePersona(persona: PersonaFile): void {
  const db = getDatabase();

  // Check if persona already exists
  const existing = db.personas.get(persona.id);
  if (existing) {
    return; // Already hydrated, skip
  }

  const data: PersonaData = {
    id: persona.id,
    name: persona.name,
    type: persona.type,
    archetype: persona.dimensions.archetype,
    experience_level: persona.dimensions.experience_level,
    fiction_first_alignment: persona.dimensions.fiction_first_alignment,
    narrative_mechanics_comfort: persona.dimensions.narrative_mechanics_comfort,
    gm_philosophy: persona.dimensions.gm_philosophy,
    genre_flexibility: persona.dimensions.genre_flexibility,
    primary_cognitive_style: persona.dimensions.cognitive_styles?.primary || '',
    secondary_cognitive_style: persona.dimensions.cognitive_styles?.secondary,
    playstyle_modifiers: persona.dimensions.playstyle_modifiers,
    social_emotional_traits: persona.dimensions.social_emotional_traits,
    system_exposures: persona.dimensions.system_exposures,
    life_contexts: persona.dimensions.life_contexts,
    schema_version: persona.schema_version
  };

  db.personas.create(data);
}

export function hydrateAllCorePersonas(): number {
  const coreIds = [
    'core-sarah-new-gm',
    'core-marcus-osr-veteran',
    'core-alex-indie-convert',
    'core-jordan-busy-parent',
    'core-riley-rules-lawyer',
    'core-morgan-method-actor',
    'core-sam-forever-gm',
    'core-casey-neurodivergent',
    'core-devon-solo-player',
    'core-taylor-video-game-convert'
  ];

  let count = 0;
  for (const id of coreIds) {
    const persona = loadPersonaFromFile(id);
    hydratePersona(persona);
    count++;
  }

  return count;
}
