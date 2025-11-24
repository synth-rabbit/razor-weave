// Script to execute persona review for campaign-20251123-192801-j6p4e486
// Persona: Generated Persona 673764 (Achiever/Long-term GM)

import { getDatabase } from '../../../src/tooling/database/index.js';
import { CampaignClient, writeReviewMarkdown } from '../../../src/tooling/reviews/index.js';
import type { ReviewData } from '../../../src/tooling/reviews/schemas.js';

const startTime = Date.now();

// Initialize database and client
const db = getDatabase();
const campaignClient = new CampaignClient(db.getDb());

// Campaign and Persona IDs
const campaignId = 'campaign-20251123-192801-j6p4e486';
const personaId = 'gen-1763913096233-cl97sm0pi';

// Review data from Generated Persona 673764's perspective
// Archetype: Achiever | Experience: Long-term GM | Fiction-First: Converting
// Narrative/Mechanics: Comfortable with Abstraction | Cognitive Style: Systems Integrator

const reviewData: ReviewData = {
  ratings: {
    clarity_readability: 8,
    rules_accuracy: 7,
    persona_fit: 7,
    practical_usability: 6
  },
  narrative_feedback: `As someone who's run campaigns for years and is now exploring fiction-first systems, Razorweave presents an interesting challenge. The writing is generally clear and well-organized - I appreciate how chapters build on each other, and the examples throughout help illustrate abstract concepts. The synthwave aesthetic is bold but doesn't interfere with readability.

What draws me in as an Achiever is the structured progression system with Skills and Proficiencies. The way they interact - Skills providing the mechanical foundation while Proficiencies grant contextual advantages - appeals to my systems-oriented mind. I can see how players could build satisfying advancement paths.

However, I'm still "converting" to fiction-first thinking, and some sections assume familiarity with that paradigm. The Core Principles chapter (Ch. 4) does good work explaining the philosophy, but the later mechanics chapters sometimes blur the line between "when to roll" and "when the fiction just flows." For a GM like me who's comfortable with more structured systems, I'd want clearer decision trees.

The Clocks and Tags system is elegant - I can see using these to track complex situations - but the examples, while numerous, don't always show what happens when things go wrong. As a long-term GM, I know players will find edge cases the book doesn't address.

The Proficiencies chapter in particular is dense. Each proficiency has substantial text, which is thorough but makes it hard to reference quickly during play. The tables help, but I'd want summary cards or a quick-reference sheet beyond what Chapter 27 provides.

Overall, this is a solid rulebook with genuine ambition. It respects the GM's judgment while providing enough structure to feel grounded. I'd need a few sessions to internalize the flow, but I can see this becoming a core system for the right group.`,
  issue_annotations: [
    {
      section: "Chapter 8: Actions, Checks, Outcomes",
      issue: "The criteria for when to call for a Check vs. letting fiction determine outcomes needs more explicit guidance",
      impact: "GMs coming from more traditional systems may over-roll or under-roll, disrupting game flow",
      location: "Actions and Outcomes subsection"
    },
    {
      section: "Chapter 16-17: Proficiencies",
      issue: "Proficiency entries are comprehensive but too dense for quick table reference",
      impact: "Slows down play when looking up specific proficiency benefits mid-scene",
      location: "All detailed proficiency entries"
    },
    {
      section: "Chapter 9: Tags, Conditions, Clocks",
      issue: "Limited examples of Clock failure states and how to narratively handle when Clocks fill negatively",
      impact: "GMs may struggle to improvise consequences that feel proportional and interesting",
      location: "Clocks subsection"
    },
    {
      section: "Chapter 10: Combat Basics",
      issue: "Action economy and initiative handling could use a clearer summary diagram or flowchart",
      impact: "First few combat encounters may feel clunky as GM and players learn the rhythm",
      location: "Combat sequence description"
    },
    {
      section: "Chapter 27: Sheets and Play Aids",
      issue: "Reference sheets provided don't include a one-page proficiency summary",
      impact: "GMs need to create their own quick-reference materials for proficiencies",
      location: "Reference materials list"
    }
  ],
  overall_assessment: `Razorweave Core Rulebook is a thoughtful, well-produced system that successfully bridges narrative and mechanical play. For an Achiever archetype like myself who enjoys systematic progression and is gradually converting to fiction-first approaches, it offers enough structure to feel comfortable while encouraging narrative flexibility.

The main challenges are density (particularly in Proficiencies) and the assumption that readers already understand fiction-first conventions. With some supplementary quick-reference materials and a few sessions to internalize the principles, this could become an excellent campaign system.

Recommended for groups willing to invest in learning the system, with the caveat that GMs from purely mechanical backgrounds should read the Core Principles chapter twice before diving into the mechanics.`
};

// Calculate execution time
const agentExecutionTime = Date.now() - startTime;

// Write to database
const reviewId = campaignClient.createPersonaReview({
  campaignId,
  personaId,
  reviewData,
  agentExecutionTime
});

console.log(`Created persona review with ID: ${reviewId}`);

// Write markdown file
const outputPath = `data/reviews/raw/${campaignId}/${personaId}.md`;
writeReviewMarkdown(
  {
    campaignId,
    personaName: 'Generated Persona 673764',
    personaArchetype: 'Achiever',
    personaExperience: 'Long-term GM',
    personaTraits: ['Converting', 'Systems Integrator'],
    contentTitle: 'Razorweave Core Rulebook',
    reviewData
  },
  outputPath
);

console.log(`Wrote markdown review to: ${outputPath}`);
console.log('\nReview Summary:');
console.log(`  Clarity & Readability: ${reviewData.ratings.clarity_readability}/10`);
console.log(`  Rules Accuracy: ${reviewData.ratings.rules_accuracy}/10`);
console.log(`  Persona Fit: ${reviewData.ratings.persona_fit}/10`);
console.log(`  Practical Usability: ${reviewData.ratings.practical_usability}/10`);
console.log(`  Issues Identified: ${reviewData.issue_annotations.length}`);
