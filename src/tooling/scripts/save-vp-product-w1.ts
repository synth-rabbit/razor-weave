import { BoardroomClient } from '@razorweave/boardroom';

const client = new BoardroomClient('data/events', 'sess_c7c49ec7', 'main');

// Create VP Product plan
const plan = client.createVPPlan('sess_c7c49ec7', 'product');
console.log('Created plan:', plan.id);

// Phase 1: Foundation Verification
const p1 = client.createPhase(plan.id, 'Foundation Verification', 
  'Confirm all Prework dependencies are operational before W1 execution begins.', 1,
  ['Core rulebook registered in book registry', 'Workflow lifecycle engine operational', 'Event system can emit and log events', 'Artifact registration works', 'Existing review analysis accessible']);
client.createMilestone(p1.id, 'Book Registry Operational', 'Core rulebook entry exists and is queryable', 1);
client.createMilestone(p1.id, 'Workflow Engine Operational', 'Can create W1 workflow run and transition states', 2);
client.createMilestone(p1.id, 'Analysis Data Accessible', 'Existing review analysis loads correctly', 3);

// Phase 2: Planning Pipeline
const p2 = client.createPhase(plan.id, 'Planning Pipeline',
  'Enable PM agent to consume review analysis and produce improvement plans.', 2,
  ['PM agent can read/parse existing review analysis', 'PM produces structured improvement plan', 'Plan includes measurable success criteria', 'Plan respects token cost constraints', 'Plan registered as workflow artifact']);
client.createMilestone(p2.id, 'PM Agent Functional', 'PM agent can be invoked with correct inputs', 1);
client.createMilestone(p2.id, 'Plan Output Valid', 'PM produces plan targeting top 3 severity issues', 2);
client.createMilestone(p2.id, 'Plan Artifact Registered', 'Improvement plan saved in workflow_artifacts', 3);

// Phase 3: Content Modification Pipeline
const p3 = client.createPhase(plan.id, 'Planning Pipeline',
  'Enable Writer, Editor, Domain Expert agents to modify, review, and approve/reject content.', 3,
  ['Writer agent can modify markdown files', 'Writer outputs change log', 'Editor can review and pass/fail', 'Domain Expert can review and pass/fail', 'Rejection routing works', 'Max 3 rejections before escalation', 'All agent actions emit events']);
client.createMilestone(p3.id, 'Writer Agent Functional', 'Writer can read plan and produce modified markdown', 1);
client.createMilestone(p3.id, 'Editor Review Operational', 'Editor can review and produce pass/fail', 2);
client.createMilestone(p3.id, 'Domain Expert Review Operational', 'Domain Expert can review and produce pass/fail', 3);
client.createMilestone(p3.id, 'Rejection Routing Works', 'Rejection routes back to Writer with feedback', 4);
client.createMilestone(p3.id, 'Escalation Works', '3+ rejections triggers human escalation', 5);

// Phase 4: Validation Pipeline
const p4 = client.createPhase(plan.id, 'Validation Pipeline',
  'Verify changes improved targeted metrics through chapter-level re-review.', 4,
  ['Chapter review targets only changed chapters', 'Results comparable to baseline metrics', 'PM can evaluate metrics improvement', 'Failed metrics routes back to PM', 'Metrics comparison logged with before/after']);
client.createMilestone(p4.id, 'Chapter Review Scoping Works', 'Review accepts chapter whitelist', 1);
client.createMilestone(p4.id, 'Metrics Comparison Available', 'Before/after scores calculated', 2);
client.createMilestone(p4.id, 'Metrics Routing Works', 'Failed metrics triggers route to PM', 3);

// Phase 5: Human Gate
const p5 = client.createPhase(plan.id, 'Human Gate',
  'Present changes to human for final approval before artifact promotion.', 5,
  ['Human receives clear change summary', 'Human receives metrics comparison', 'Human can approve/reject with feedback', 'Human gate status tracked in workflow']);
client.createMilestone(p5.id, 'Human Summary Generated', 'Clear change summary and metrics diff', 1);
client.createMilestone(p5.id, 'Human Decision Captured', 'Approval/rejection recorded in workflow', 2);

// Phase 6: Finalization
const p6 = client.createPhase(plan.id, 'Finalization',
  'Promote approved changes to all output formats and create release notes.', 6,
  ['New print HTML generated', 'New PDF draft generated', 'New web HTML generated', 'Release notes created', 'All artifacts registered with version linkage', 'Output version ID recorded']);
client.createMilestone(p6.id, 'Print HTML Generated', 'Updated print HTML from approved markdown', 1);
client.createMilestone(p6.id, 'PDF Generated', 'PDF draft from print HTML', 2);
client.createMilestone(p6.id, 'Web HTML Generated', 'Web-optimized HTML for site', 3);
client.createMilestone(p6.id, 'Release Notes Created', 'Summary document of all changes', 4);
client.createMilestone(p6.id, 'All Artifacts Registered', 'Every output in workflow_artifacts', 5);

console.log('VP Product plan saved successfully');
