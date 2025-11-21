import { getDatabase } from '../src/tooling/database/index.js';
import { CampaignClient, writeAnalyzerPromptFile } from '../src/tooling/reviews/index.js';

const campaignId = process.argv[2] || 'campaign-20251121-121602-rk0y279m';

const db = getDatabase();
const rawDb = db.getDb();

// Update campaign status to analyzing
const campaignClient = new CampaignClient(rawDb);
campaignClient.updateStatus(campaignId, 'analyzing');

// Write analyzer prompt
const path = writeAnalyzerPromptFile(rawDb, campaignId);
console.log('Analyzer prompt written to:', path);
