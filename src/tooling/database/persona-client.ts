import Database from 'better-sqlite3';

export interface PersonaData {
  id?: string;
  name: string;
  type: 'core' | 'generated';
  archetype: string;
  experience_level: string;
  fiction_first_alignment: string;
  narrative_mechanics_comfort: string;
  gm_philosophy: string;
  genre_flexibility: string;
  primary_cognitive_style: string;
  secondary_cognitive_style?: string;
  playstyle_modifiers?: string[];
  social_emotional_traits?: string[];
  system_exposures?: string[];
  life_contexts?: string[];
  schema_version?: number;
  generated_seed?: number;
}

export interface Persona extends PersonaData {
  id: string;
  created_at: string;
  active: boolean;
}

export interface PersonaDimensions {
  playstyle_modifiers: string[];
  social_emotional_traits: string[];
  system_exposures: string[];
  life_contexts: string[];
}

export class PersonaClient {
  constructor(private db: Database.Database) {}

  create(data: PersonaData): string {
    const id = data.id || this.generateId(data.type);

    // Wrap in transaction for atomicity (persona + dimensions together)
    const createPersona = this.db.transaction(() => {
      // Insert main persona record
      const stmt = this.db.prepare(`
        INSERT INTO personas (
          id, name, type, archetype, experience_level,
          fiction_first_alignment, narrative_mechanics_comfort,
          gm_philosophy, genre_flexibility,
          primary_cognitive_style, secondary_cognitive_style,
          schema_version, generated_seed
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      stmt.run(
        id,
        data.name,
        data.type,
        data.archetype,
        data.experience_level,
        data.fiction_first_alignment,
        data.narrative_mechanics_comfort,
        data.gm_philosophy,
        data.genre_flexibility,
        data.primary_cognitive_style,
        data.secondary_cognitive_style || null,
        data.schema_version || 1,
        data.generated_seed || null
      );

      // Insert multi-value dimensions
      this.setDimensions(id, {
        playstyle_modifiers: data.playstyle_modifiers || [],
        social_emotional_traits: data.social_emotional_traits || [],
        system_exposures: data.system_exposures || [],
        life_contexts: data.life_contexts || []
      });
    });

    createPersona();
    return id;
  }

  get(id: string): Persona | null {
    const stmt = this.db.prepare(`
      SELECT * FROM personas WHERE id = ? AND active = TRUE
    `);

    const row = stmt.get(id);
    return row ? (row as Persona) : null;
  }

  getAll(): Persona[] {
    const stmt = this.db.prepare(`
      SELECT * FROM personas WHERE active = TRUE
      ORDER BY created_at DESC
    `);

    const rows = stmt.all();
    return rows as Persona[];
  }

  getDimensions(personaId: string): PersonaDimensions {
    const stmt = this.db.prepare(`
      SELECT dimension_type, value
      FROM persona_dimensions
      WHERE persona_id = ?
      ORDER BY id
    `);

    const rows = stmt.all(personaId) as Array<{
      dimension_type: string;
      value: string;
    }>;

    const dimensions: PersonaDimensions = {
      playstyle_modifiers: [],
      social_emotional_traits: [],
      system_exposures: [],
      life_contexts: []
    };

    for (const row of rows) {
      const dimType = row.dimension_type as keyof PersonaDimensions;
      dimensions[dimType].push(row.value);
    }

    return dimensions;
  }

  private setDimensions(personaId: string, dimensions: PersonaDimensions): void {
    const stmt = this.db.prepare(`
      INSERT INTO persona_dimensions (persona_id, dimension_type, value)
      VALUES (?, ?, ?)
    `);

    for (const [dimType, values] of Object.entries(dimensions)) {
      for (const value of values) {
        stmt.run(personaId, dimType, value);
      }
    }
  }

  private generateId(type: 'core' | 'generated'): string {
    if (type === 'generated') {
      return `gen-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    return `core-${Math.random().toString(36).substr(2, 9)}`;
  }
}
