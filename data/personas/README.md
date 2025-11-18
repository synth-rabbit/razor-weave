# Persona System

11-dimensional persona framework for automated rulebook review and testing.

## Overview

The persona system models diverse TTRPG players and GMs to provide representative feedback during rulebook development. Each persona represents a specific combination of playstyle, experience, and preferences across 11 dimensions.

This system enables:

- **Continuous feedback during writing** - Get ongoing persona reactions to guide content direction
- **Comparative analysis** - Run multiple personas against same content to understand different reader experiences
- **Representative sampling** - 150+ procedurally generated personas simulate unknown future audience
- **Statistical analysis** - Rich dimensional data enables pattern identification and trend analysis

## Architecture

### Components

1. **Schema** (`data/personas/schema/`)
   - `dimensions.yaml` - All 11 dimension definitions with valid values
   - `combination-rules.yaml` - Quantity, exclusion, and affinity rules

2. **Core Personas** (`data/personas/core/`)
   - 10 hand-crafted personas representing key user types
   - YAML files with complete dimensional profiles and narrative descriptions

3. **Database** (`src/tooling/database/`)
   - SQLite schema for persona storage and querying
   - PersonaClient for CRUD operations

4. **Validation** (`src/tooling/personas/coherence.ts`)
   - Quantity rule validation
   - Exclusion rule enforcement
   - Affinity score calculation

5. **Generation** (`src/tooling/personas/generator.ts`)
   - Procedural persona generation
   - Seeded random for reproducibility
   - Batch generation with diversity guarantees

6. **CLI** (`src/tooling/cli-commands/personas.ts`)
   - `hydrate-core` - Load core personas into database
   - `generate` - Create procedural personas
   - `stats` - View distribution statistics

## The 11 Dimensions

### Standard Dimensions (7)

**1. Archetypes** - Core player motivations

Values: Achiever, Explorer, Socializer, Killer, Tactician, Storyteller, Power Gamer, Method Actor, Casual Gamer

Quantity: Exactly 1 per persona

Example: Sarah is a **Socializer** - she values group harmony and player experience over mechanical optimization.

**2. Playstyle Modifiers** - How they engage with games

Values: Rule Minimalist, Rule Maximalist, Dice Goblin, Homebrew Addict, Solo Gamer, Campaign Purist, Chaos Gremlin, Mechanics First, Theme First, Optimization Skeptic, Rules Lawyer, Vibes-Based Player, Puzzle Solver, Combat Junkie, Non-Combat Roleplayer, Session Zero Purist, Safety Tool Advocate

Quantity: 1-3 per persona

Example: Riley is a **Rules Lawyer** and **Optimization Focused** - they scrutinize mechanics for edge cases and optimal builds.

**3. Cognitive Styles** - How they process information

Values: Analytical, Intuitive, Visual, Verbal, Pattern-Driven, Experimental, Cautious, Abstract Thinker, Concrete Thinker, Systems Integrator, Simplicity Seeker, Complexity Tolerant

Quantity: 1 primary, 0-1 secondary

Example: Jordan has **Visual** (primary) and **Simplicity Seeker** (secondary) - prefers diagrams and clear layouts over dense text.

**4. Social/Emotional Traits** - Interpersonal dynamics

Values: Empathic, Detached, Enthusiastic, Conflict-Averse, Direct Communicator, Introvert, Extrovert, Anxious Newbie, Confident Veteran, Group-Focused, Calm Mediator

Quantity: 1-3 per persona

Example: Casey is **Anxious** and **Conflict-Averse** - needs clear structure to feel comfortable.

**5. Experience Levels** - TTRPG history

Values: Newbie (0-1 years), Early Intermediate (1-3 years), Experienced (3-10 years), Veteran (10-20 years), Long-term GM, Forever GM, Hybrid GM/Player

Quantity: Exactly 1 per persona

Example: Marcus is a **Veteran (10-20 years)** - has seen many systems and knows what works.

**6. System Exposures** - Prior game experience

Values: 5e-Native, OSR-Enthusiast, PbtA Player, Indie/Storygame Fan, Crunch-Heavy Veteran, Solo-RPG Enthusiast, Actual-Play Viewer, Video-Game RPG Convert, Wargamer Background, System Hopper, System Loyalist

Quantity: 1-3 per persona

Example: Alex is a **PbtA Player** and **Indie/Storygame Fan** - approaches Razorweave with fiction-first expectations.

**7. Life Contexts** - Real-world constraints

Values: Busy Parent, College Student, Digital-Only Player, Accessibility Needs, Weekend-Only Gamer, Remote-Only Group, Neurodivergent, Budget Limited, Prefers PDF Hyperlinks

Quantity: 1-3 per persona

Example: Devon is **Remote-Only** and **Prefers PDF Hyperlinks** - needs digital-first design.

### Razorweave-Specific Dimensions (4)

**8. Fiction-First Alignment** - Comfort with fiction-first philosophy

Values: Skeptical, Curious, Converting, Native, Evangelical

Quantity: Exactly 1 per persona

Purpose: Tests how content lands with different philosophical alignments

Example: Marcus is **Skeptical** - needs convincing that fiction-first mechanics work, while Alex is **Evangelical** - expects strong fiction-first delivery.

**9. Narrative Mechanics Comfort** - Relationship with Tags/Conditions/Clocks

Values: Needs Concrete Numbers, Wary of Abstraction, Neutral, Comfortable with Abstraction, Prefers Narrative Tools, Narrative Purist

Quantity: Exactly 1 per persona

Purpose: Tests if narrative mechanics explanations work across comfort levels

Example: Taylor **Needs Concrete Numbers** coming from video games, while Morgan **Prefers Narrative Tools** for character expression.

**10. GM Philosophy** - GMing approach (for GM personas)

Values: Railroad Conductor, Prepared Sandbox, Scene Framer, World Simulator, Collaborative Storyteller, GMless Advocate, Non-GM

Quantity: Exactly 1 per persona

Purpose: Tests if GM sections serve different GMing styles

Example: Sarah uses a **Prepared Sandbox** approach, while Sam is a **Collaborative Storyteller**.

**11. Genre Flexibility** - Comfort with genre-agnostic systems

Values: Genre-Specific Purist, Prefers Focused Systems, Neutral, Enjoys Flexibility, Genre-Agnostic Enthusiast

Quantity: Exactly 1 per persona

Purpose: Tests if genre-agnostic approach works or confuses readers

Example: Sarah **Prefers Focused Systems**, while Sam **Enjoys Flexibility**.

## Core Personas

The 10 hand-crafted core personas provide strategic coverage of key user types:

### Typical Users (70%)

1. **Sarah - New GM** - Tests onboarding clarity for beginner GMs
2. **Alex - Indie Convert** - Tests fiction-first delivery for native audience
3. **Jordan - Busy Parent** - Tests usability under time constraints
4. **Morgan - Method Actor** - Tests narrative depth and character expression
5. **Sam - Forever GM** - Tests GM tools and campaign guidance
6. **Taylor - Video Game Convert** - Tests onboarding from video game expectations
7. **Devon - Solo Player** - Tests solo play mechanics and self-facilitation

### Edge Cases (30%)

8. **Marcus - OSR Veteran** - Tests whether mechanics satisfy traditional players
9. **Riley - Rules Lawyer** - Tests mechanical completeness and edge case coverage
10. **Casey - Neurodivergent Player** - Tests accessibility, structure, cognitive load

Each persona includes:

- Complete 11-dimensional profile
- Narrative profile describing their background and needs
- Testing focus areas specific to their perspective

See individual YAML files in `data/personas/core/` for full details.

## Usage

### Loading Core Personas

Load all 10 core personas into the database:

```bash
pnpm tsx src/tooling/scripts/personas.ts hydrate-core
```

This reads all YAML files from `data/personas/core/` and inserts them into the SQLite database.

### Generating Personas

Generate procedural personas for representative sampling:

```bash
# Generate 50 personas with random seed
pnpm tsx src/tooling/scripts/personas.ts generate 50

# Generate with specific seed for reproducibility
pnpm tsx src/tooling/scripts/personas.ts generate 100 --seed 12345

# Generate in smaller batches
pnpm tsx src/tooling/scripts/personas.ts generate 150 --batch-size 10
```

Generated personas are:

- Validated against all coherence rules
- Saved to database with unique IDs
- Seeded for reproducibility
- Distributed across all dimensions

### Querying Personas

Query personas programmatically:

```typescript
import { getDatabase } from './src/tooling/database/index.js';

const db = getDatabase();

// Get all personas
const allPersonas = db.personas.getAll();

// Get persona by ID
const sarah = db.personas.getById('core-sarah-new-gm');

// Query by dimension
const newbies = db.personas.getByExperienceLevel('Newbie (0-1 years)');
const skeptics = db.personas.getByFictionFirstAlignment('Skeptical');

// Get statistics
const stats = db.personas.getStats();
console.log(stats.distribution.by_archetype);
console.log(stats.distribution.by_experience_level);
```

### Validation

Validate persona coherence:

```typescript
import { validatePersona } from './src/tooling/personas/coherence.js';
import { loadPersonaSchema } from './src/tooling/personas/schema.js';

const schema = loadPersonaSchema();
const persona = {
  dimensions: {
    archetypes: 'Socializer',
    experience_levels: 'Newbie (0-1 years)',
    // ... other dimensions
  }
};

const validation = validatePersona(persona, schema);

if (!validation.valid) {
  console.error('Validation errors:', validation.errors);
}
```

## Integration with Review System

The persona system provides the foundation for automated review:

1. **Agent Instantiation** - Each persona becomes a review agent with:
   - Dimensional profile informing review perspective
   - Narrative profile providing context and background
   - Testing focus areas guiding what to scrutinize

2. **Representative Sampling** - 150+ personas ensure:
   - All user types are represented
   - Edge cases are tested
   - Statistical analysis is meaningful

3. **Continuous Feedback** - Personas provide:
   - Structured feedback on specific sections
   - Confusion points and clarity issues
   - Suggestions aligned with their perspective

4. **Statistical Analysis** - Aggregating across dimensions reveals:
   - Which sections confuse fiction-first skeptics
   - Whether beginners understand core concepts
   - How different cognitive styles respond to explanations

The review automation system (to be built separately) will consume persona definitions to instantiate agents and collect feedback.

## Testing

The persona system has comprehensive test coverage:

- **Schema Validation Tests** - All dimension values are valid, quantity rules enforced, exclusions caught
- **Core Persona Tests** - All 10 core personas validate successfully
- **Generation Tests** - Procedural generation produces valid, diverse personas
- **Coherence Tests** - Exclusion rules prevent invalid combinations
- **Database Tests** - CRUD operations work correctly

All tests pass with 100% validation rate for generated personas.

## Future Enhancements

Potential improvements:

1. **Dynamic Affinity Weights** - Refine based on which personas provide most valuable feedback
2. **Persona Evolution** - Track which personas identify the most issues, adjust representation
3. **Additional Dimensions** - Add dimensions as understanding of audience grows
4. **Persona Retirement** - Remove or merge personas that provide redundant coverage
5. **Real User Mapping** - Map real playtest feedback to nearest persona for validation
6. **Cross-System Reuse** - Use personas for iterative editing and simulated play sessions

## File Structure

```text
data/personas/
├── README.md                          # This file
├── schema/
│   ├── dimensions.yaml               # All 11 dimension definitions
│   └── combination-rules.yaml        # Exclusions, affinities, quantities
└── core/
    ├── core-sarah-new-gm.yaml
    ├── core-marcus-osr-veteran.yaml
    ├── core-alex-indie-convert.yaml
    ├── core-jordan-busy-parent.yaml
    ├── core-riley-rules-lawyer.yaml
    ├── core-morgan-method-actor.yaml
    ├── core-sam-forever-gm.yaml
    ├── core-casey-neurodivergent.yaml
    ├── core-devon-solo-player.yaml
    └── core-taylor-video-game-convert.yaml
```

## See Also

- [Persona System Design](../../docs/plans/2025-01-18-persona-system.md) - Full design document
- [Implementation Plan](../../docs/plans/2025-01-18-persona-system-implementation.md) - Detailed implementation guide
- [Schema Documentation](./schema/dimensions.yaml) - Complete dimension definitions
- [Combination Rules](./schema/combination-rules.yaml) - Validation rules
