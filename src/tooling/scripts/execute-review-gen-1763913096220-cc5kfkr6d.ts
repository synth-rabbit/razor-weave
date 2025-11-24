import { getDatabase } from '../database/index.js';
import { CampaignClient, writeReviewMarkdown } from '../reviews/index.js';

const db = getDatabase();
const campaignClient = new CampaignClient(db.getDb());

const reviewData = {
  ratings: {
    clarity_readability: 8,
    rules_accuracy: 7,
    persona_fit: 9,
    practical_usability: 7
  },
  narrative_feedback: `As an Explorer who's been playing TTRPGs for a couple of years now, Razorweave immediately grabbed me with its GMless cooperative play options. I've been evangelizing fiction-first systems to my group for a while, and this book feels like it was written for players like us who want to explore worlds together without needing one person to always be in charge.

The Chapter 26 section on Alternative Play speaks directly to my playstyle. The rotating facilitator model and shared authority principles are exactly what I've been looking for. I love that the book treats GMless play as a first-class citizen rather than a hastily added variant. The procedures are explicit: decide who tracks Clocks, share notes openly, favor transparency with DCs and fronts. This is concrete guidance I can actually use.

The 4d6 system with Tags, Conditions, and Clocks creates a shared language our group can use without needing a single authority figure. When we're all looking at the same Clock filling up, we can collectively decide how to respond. The VPC (Virtual Player Character) system in Chapter 24 gives us tools to run companions that feel alive without one person controlling everything.

As a Concrete Thinker, I really appreciated the worked examples throughout the book. The dual investigation Clocks example showing "Find the saboteur" racing against "Relay shutdown" is exactly the kind of practical demonstration I need. I can picture running that scene with my group right now.

Where the book shines for explorers like me is in its treatment of investigation and discovery. Chapter 11's guidance on paired Progress and Pressure Clocks for investigations gives us structure without railroading. "What am I trying to learn?" and "How do I pursue it?" are questions any player can ask, not just a GM.

The fiction-first approach means our group conversations naturally drive play forward. When the book says "Intent describes what the character wants to achieve. Approach describes how the character is trying to achieve it" - that's collaborative storytelling language, not GM-to-player instruction.

However, I did hit some friction points. The GMless procedures section, while better than most games, could use more explicit turn structure guidance. The book says "On your turn, you frame a scene, invite others to act, and help adjudicate any Checks that arise" but I'd love more concrete examples of how scene-framing authority rotates in practice. When do I pass the spotlight? What happens if two players want to frame incompatible scenes?

Also, the oracle and prompt guidance in solo play is good but brief. As someone who often plays GMless with just one or two friends, I want more robust oracle tables directly in the book rather than suggestions to create my own.`,
  issue_annotations: [
    {
      section: "Chapter 26: Alternative Play",
      issue: "GMless scene-framing rotation needs more concrete examples",
      impact: "The principles are solid but as a Concrete Thinker I need step-by-step guidance. When my group tried the rotating facilitator model, we weren't sure exactly when authority transferred. Does the scene-framer pass after every scene? After a certain number of Checks? The book says 'rotate regularly' but regular means different things to different groups. One worked example of a full GMless session showing authority transfers would be invaluable.",
      location: "Section 26.3 'GMless Procedures' - the turn structure paragraph"
    },
    {
      section: "Chapter 26: Alternative Play",
      issue: "Oracle tables too sparse for robust GMless play",
      impact: "The solo play section mentions 'Yes/No/Complication' oracles but doesn't provide actual tables. For Explorers who want to discover worlds together without prep, we need tools in the book itself. A single page of genre-flexible oracle tables (Yes/No variants, NPC reactions, twist generators, environment shifts) would dramatically improve GMless usability. Currently I have to either buy oracle tools or create my own, which adds friction.",
      location: "Section 26.4 'Using Oracles and Prompts' - the paragraph describing oracle use"
    },
    {
      section: "Chapter 5: Ways to Play the Game",
      issue: "GMless cooperative play section feels truncated",
      impact: "Chapter 5 introduces GMless play as an option but only gives it one short paragraph before pointing to Chapter 26. As a GMless Advocate, I want the introduction to sell this mode more enthusiastically. New players reading the book might skip over GMless as an afterthought when it's actually a fully supported mode. More advocacy in the intro chapter would help.",
      location: "Section 5.4 'GMless Cooperative Play' - the single descriptive paragraph"
    },
    {
      section: "Chapter 11: Exploration and Social Play",
      issue: "Shared authority adaptation guidance missing",
      impact: "The exploration mechanics work beautifully for GMless play - paired Clocks, clear DC guidance, structured investigation. But the chapter assumes a GM throughout. A sidebar noting how these procedures adapt to shared authority would help Explorers like me run discovery scenes collaboratively. Who decides what information a successful Check reveals when there's no GM? The answer is probably 'discuss as a group' but stating it explicitly would help.",
      location: "Chapter 11 generally - assumed GM framing throughout"
    },
    {
      section: "Chapter 24: NPCs and VPCs",
      issue: "VPC guidance excellent but assumes GM control",
      impact: "VPCs are perfect for GMless play - they give us characters who aren't protagonists but still matter. The mechanics are great. However, the guidance assumes one person controls each VPC. In my GMless sessions, we pass VPC voice around the table. Adding a note about shared VPC control would make this chapter even more useful for alternative play modes.",
      location: "Section 24.3 'Running VPCs' - the control and voice guidance"
    }
  ],
  overall_assessment: `Razorweave Core Rulebook is an exceptional fiction-first system that genuinely embraces GMless and shared authority play as legitimate modes rather than afterthoughts. For an Explorer who's been advocating for collaborative storytelling in my gaming group, this book feels like validation.

The core engine - 4d6 resolution, Tags, Conditions, Clocks - creates a shared mechanical language that works whether you have a traditional GM or not. The visibility of Clocks and Tags means everyone at the table can see the story's shape and contribute to its direction. This is design philosophy I can evangelize.

Chapter 26 stands out as one of the best treatments of GMless play I've seen in a traditionally-structured RPG. The rotating facilitator model, shared authority principles, and explicit procedures give our group real tools to work with. The VPC system in Chapter 24 solves a genuine problem for small groups or GMless tables who want a fuller party.

My Clarity & Readability score of 8 reflects excellent writing throughout. The book explains concepts clearly, uses consistent terminology, and builds understanding progressively. Examples are concrete and useful. I occasionally wanted more explicit step-by-step procedures for GMless scenarios, which keeps it from a 9.

Rules Accuracy earns a 7 because the system is internally consistent but some procedures feel open to interpretation. The flexibility is intentional (fiction-first design) but as a Concrete Thinker, I sometimes wished for more definitive answers to procedural questions.

Persona Fit gets my highest score at 9. This book was clearly written with alternative play modes in mind. The Explorer's desire to discover worlds collaboratively is supported by investigation mechanics, the fiction-first philosophy, and genuine GMless procedures. I only dock one point because some chapters still assume traditional GM authority when they could be more mode-agnostic.

Practical Usability scores 7 because while I can run this game effectively, GMless play requires me to supplement the book with external oracle tools and some house procedures for scene rotation. The bones are excellent - I just need to add a few connecting pieces.

Overall, this is a system I will enthusiastically recommend to other fiction-first advocates and GMless explorers. The collaborative DNA runs through the whole design. With a few more concrete GMless tools, this would be my default recommendation for anyone who wants to explore stories together without traditional authority structures.`
};

campaignClient.createPersonaReview({
  campaignId: 'campaign-20251123-222404-g1zvdflh',
  personaId: 'gen-1763913096220-cc5kfkr6d',
  reviewData,
  agentExecutionTime: Date.now()
});

writeReviewMarkdown(
  {
    campaignId: 'campaign-20251123-222404-g1zvdflh',
    personaName: 'Generated Persona 425593',
    personaArchetype: 'Explorer',
    personaExperience: 'Early Intermediate (1-3 years)',
    personaTraits: ['Evangelical (Fiction-First)', 'GMless Advocate', 'Concrete Thinker'],
    contentTitle: 'Razorweave Core Rulebook',
    reviewData
  },
  'data/reviews/raw/campaign-20251123-222404-g1zvdflh/gen-1763913096220-cc5kfkr6d.md'
);

console.log('Review saved');
