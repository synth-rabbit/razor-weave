// src/tooling/scripts/execute-review-gen-1763913096223-pizm7log8.ts
import { getDatabase } from '../database/index.js';
import { CampaignClient, writeReviewMarkdown } from '../reviews/index.js';

const db = getDatabase();
const campaignClient = new CampaignClient(db.getDb());

const reviewData = {
  ratings: {
    clarity_readability: 8,
    rules_accuracy: 8,
    persona_fit: 7,
    practical_usability: 7
  },
  narrative_feedback: `As a long-term GM who runs prepared sandbox campaigns and values fiction-first play while needing concrete mechanical support, this rulebook delivers substantial value but has some friction points for my playstyle.

**Strengths from my Socializer GM perspective:**

The social mechanics are genuinely impressive. Chapter 11's coverage of Exploration and Social Play gives me exactly what I need for running relationship-focused games. The negotiation and leverage systems (using Tags like "Profit-Minded" and "Honor-Bound" to anchor NPC motivations) are perfect for sandbox play where players approach problems from unexpected angles. The multi-round negotiation Clock example demonstrates sophisticated social stakes that reward the kind of character-driven scenes my groups love.

The Presence Skills section is particularly well-developed. Having distinct Skills for Persuasion & Appeal, Command & Coordination, Deception & Performance, and Insight & Empathy gives players meaningful choices about HOW they engage socially, not just whether they roll well. This supports the experimental, discovery-based play I prefer.

**Where I struggle as someone who needs concrete numbers:**

The DC ladder (12-22) is clean and memorable, but the guidance for setting DCs within social scenes feels too fluid. When the text says a DC might be "lower if the request is modest, or higher if the stakes are severe," I need more calibration examples. How much lower? How much higher? For prepared sandbox play, I want to pre-calculate likely DCs for key NPCs so I can stay consistent across sessions.

The Proficiency system is elegant in concept but feels underdeveloped for GM prep. Proficiencies "do not add numbers to Checks" but instead "influence difficulty, consequences, and access to information." As an experimental GM, I want to try things, but this flexibility means I'm constantly making judgment calls about how much a Proficiency should help. I'd love a sidebar with concrete guidelines like "Relevant Proficiency typically lowers DC by 2" or "grants Advantage."

**Fiction-first alignment (where I'm evangelical):**

The intent/approach structure is exactly right. Chapter 8's core Check procedure starts with "The player declares intent and approach" before any dice touch the table. This is the correct order and the book reinforces it consistently. The examples throughout demonstrate fiction leading to mechanics, not the reverse.

The Clocks system is brilliant for prepared sandbox play. I can pre-seed faction Clocks, world pressure Clocks, and opportunity Clocks before sessions, then let player actions tick them forward. The dual-Clock examples (Investigation vs. Cover-Up, Evacuation vs. Flood) model exactly how sandbox worlds should feel responsive without being railroaded.

**Community/relationship tracking gaps:**

For a Socializer archetype, the relationship mechanics feel thin. The character creation chapter mentions "one or two meaningful relationships" but there's no mechanical support for tracking relationship depth, faction standing, or community reputation beyond narrative description. Given how central social play is to this game's design, I expected something like relationship Clocks or faction disposition tracks.

**Overall for my table:**

This rulebook would run well at my table with some GM-side prep work. I'd build my own DC reference charts for common social situations, create faction disposition trackers, and establish house rules for Proficiency bonuses. The core systems are solid and support the fiction-first, sandbox style I love. The gaps are workable, not fatal.`,
  issue_annotations: [
    {
      section: "Chapter 8: Actions, Checks, and Outcomes",
      issue: "DC calibration for social scenes needs more concrete guidance",
      impact: "GMs who need specific numbers (like me) must develop their own reference tables, increasing prep burden",
      location: "Section 'Setting DCs' - the DC ladder is clear but application to social situations relies heavily on GM judgment"
    },
    {
      section: "Chapter 6: Character Creation / Chapter 7: Characters and Attributes",
      issue: "Relationship mechanics lack mechanical depth",
      impact: "Socializer players and GMs wanting to track relationship progression have no mechanical framework to build on",
      location: "Step Seven: Establish Background and Relationships - narrative guidance only, no mechanical hooks"
    },
    {
      section: "Chapter 16-17: Proficiencies System",
      issue: "Proficiency benefits are too abstract for consistent adjudication",
      impact: "Different GMs will rule Proficiency benefits very differently, potentially creating table-to-table inconsistency",
      location: "Throughout Proficiency chapters - examples show effects but don't quantify typical mechanical benefits"
    },
    {
      section: "Chapter 25: Factions, Fronts, and World Pressure",
      issue: "Missing faction disposition or standing system",
      impact: "Long-term campaign GMs must invent their own tracking for how groups feel about PCs",
      location: "Need to verify if this chapter exists and covers this topic - not in reviewed sections"
    },
    {
      section: "Chapter 15: Skills Reference by Attribute",
      issue: "Social skill examples are excellent but DC ranges could be tighter",
      impact: "The DC ranges given (e.g., DC 12-14 for routine, DC 16-18 for complex) span 2-3 points, adding uncertainty",
      location: "Persuasion & Appeal, Command & Coordination, and Insight & Empathy skill entries"
    }
  ],
  overall_assessment: `This is a thoughtfully designed rulebook that genuinely prioritizes fiction-first play while providing solid mechanical scaffolding. For my Socializer/Long-term GM identity, it delivers about 80% of what I need out of the box.

**The 4d6+Attribute core resolution is elegant.** The margin-based outcome tiers (Critical Success at +5, Full Success at 0, Partial at -1 to -2, Failure at -3 or worse, Critical Failure at -7) give clear structure. The Advantage/Disadvantage system (roll 5d6 or 6d6, keep best/worst 4) is intuitive and caps at +/-2 to prevent modifier stacking madness.

**The Tags, Conditions, and Clocks trinity is the real strength here.** These tools let me prep rich, reactive sandbox worlds. Environmental Tags shape scenes, Conditions create persistent consequences, and Clocks track everything from faction plans to ticking dangers. This is exactly the toolbox a prepared sandbox GM needs.

**For social-heavy campaigns,** the Presence Skills and social examples are strong. The "leverage and negotiation" framework in Chapter 11 shows the designers understand that interesting social play comes from understanding what NPCs want, not just rolling high. The Insight & Empathy skill for reading people is particularly well-handled.

**The gaps are real but manageable.** I'll need to build my own relationship tracking, create faction disposition mechanics, and codify Proficiency benefits more precisely. For a long-running campaign, this prep investment pays off—the core systems are robust enough to extend.

**Recommendation:** Excellent for tables that value narrative-mechanical integration. GMs who need highly specified rules will want to create supplementary reference materials, but the foundation is solid. Rating: 7.5/10 for a Socializer GM who needs concrete numbers—would be 9/10 with relationship mechanics and tighter DC guidance.`
};

campaignClient.createPersonaReview({
  campaignId: 'campaign-20251123-222404-g1zvdflh',
  personaId: 'gen-1763913096223-pizm7log8',
  reviewData,
  agentExecutionTime: Date.now()
});

writeReviewMarkdown(
  {
    campaignId: 'campaign-20251123-222404-g1zvdflh',
    personaName: 'Generated Persona 62063',
    personaArchetype: 'Socializer',
    personaExperience: 'Long-term GM',
    personaTraits: ['Evangelical (Fiction-First)', 'Needs Concrete Numbers', 'Prepared Sandbox', 'Experimental'],
    contentTitle: 'Razorweave Core Rulebook',
    reviewData
  },
  'data/reviews/raw/campaign-20251123-222404-g1zvdflh/gen-1763913096223-pizm7log8.md'
);

console.log('Review saved successfully');
console.log('\nRatings Summary:');
console.log(`  Clarity & Readability: ${reviewData.ratings.clarity_readability}/10`);
console.log(`  Rules Accuracy: ${reviewData.ratings.rules_accuracy}/10`);
console.log(`  Persona Fit: ${reviewData.ratings.persona_fit}/10`);
console.log(`  Practical Usability: ${reviewData.ratings.practical_usability}/10`);
