// src/tooling/boardroom/client.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { BoardroomClient } from './client';
import { existsSync, mkdirSync, rmSync } from 'fs';

const TEST_EVENTS_DIR = 'data/test-boardroom-events';

describe('BoardroomClient', () => {
  let client: BoardroomClient;

  beforeEach(() => {
    if (existsSync(TEST_EVENTS_DIR)) rmSync(TEST_EVENTS_DIR, { recursive: true });
    mkdirSync(TEST_EVENTS_DIR, { recursive: true });
    client = new BoardroomClient(TEST_EVENTS_DIR, 'test-session', 'main');
  });

  afterEach(() => {
    if (existsSync(TEST_EVENTS_DIR)) rmSync(TEST_EVENTS_DIR, { recursive: true });
  });

  describe('createSession', () => {
    it('should create a boardroom session', () => {
      const session = client.createSession('docs/plans/proposals/test.md');

      expect(session.id).toMatch(/^sess_/);
      expect(session.proposal_path).toBe('docs/plans/proposals/test.md');
      expect(session.status).toBe('active');
    });
  });

  describe('createVPPlan', () => {
    it('should create a VP plan', () => {
      const session = client.createSession('test.md');
      const plan = client.createVPPlan(session.id, 'product');

      expect(plan.id).toMatch(/^plan_/);
      expect(plan.session_id).toBe(session.id);
      expect(plan.vp_type).toBe('product');
      expect(plan.status).toBe('draft');
    });
  });

  describe('createPhase', () => {
    it('should create a phase', () => {
      const session = client.createSession('test.md');
      const plan = client.createVPPlan(session.id, 'product');
      const phase = client.createPhase(plan.id, 'Phase 1', 'Description', 1, ['criterion']);

      expect(phase.id).toMatch(/^phase_/);
      expect(phase.plan_id).toBe(plan.id);
      expect(phase.name).toBe('Phase 1');
    });
  });

  describe('addCEOFeedback', () => {
    it('should add CEO feedback to a plan', () => {
      const session = client.createSession('test.md');
      const plan = client.createVPPlan(session.id, 'product');
      const feedback = client.addCEOFeedback(plan.id, 'Looks good, proceed');

      expect(feedback.id).toMatch(/^fb_/);
      expect(feedback.plan_id).toBe(plan.id);
      expect(feedback.feedback).toBe('Looks good, proceed');
    });
  });
});
