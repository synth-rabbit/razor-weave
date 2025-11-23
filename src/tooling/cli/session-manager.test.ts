import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SessionManager } from './session-manager';
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'fs';
import { join } from 'path';

const TEST_EVENTS_DIR = 'data/test-session-manager-events';

describe('SessionManager', () => {
  beforeEach(() => {
    if (existsSync(TEST_EVENTS_DIR)) rmSync(TEST_EVENTS_DIR, { recursive: true });
    mkdirSync(TEST_EVENTS_DIR, { recursive: true });
  });

  afterEach(() => {
    if (existsSync(TEST_EVENTS_DIR)) rmSync(TEST_EVENTS_DIR, { recursive: true });
  });

  describe('startSession', () => {
    it('should create a new session', () => {
      const manager = new SessionManager(TEST_EVENTS_DIR, 'main');
      const session = manager.startSession('docs/plans/proposals/test.md');

      expect(session.id).toMatch(/^sess_/);
      expect(session.proposal_path).toBe('docs/plans/proposals/test.md');
      expect(session.status).toBe('active');
    });

    it('should set the session as active', () => {
      const manager = new SessionManager(TEST_EVENTS_DIR, 'main');
      const session = manager.startSession('test.md');

      expect(manager.getActiveSessionId()).toBe(session.id);
    });
  });

  describe('getActiveSessionId', () => {
    it('should return null when no session is active', () => {
      const manager = new SessionManager(TEST_EVENTS_DIR, 'main');

      expect(manager.getActiveSessionId()).toBeNull();
    });

    it('should load active session from events', () => {
      // Create an event file with an active session
      writeFileSync(
        join(TEST_EVENTS_DIR, '2024-11-22-existing.jsonl'),
        JSON.stringify({
          id: 'evt_1',
          ts: '2024-11-22T00:00:00Z',
          worktree: 'main',
          table: 'boardroom_sessions',
          op: 'INSERT',
          data: {
            id: 'sess_existing',
            proposal_path: 'test.md',
            status: 'active',
            created_at: '2024-11-22T00:00:00Z',
            completed_at: null
          }
        }) + '\n'
      );

      const manager = new SessionManager(TEST_EVENTS_DIR, 'main');
      expect(manager.getActiveSessionId()).toBe('sess_existing');
    });

    it('should not return completed sessions', () => {
      // Create events: INSERT then UPDATE to completed
      const events = [
        {
          id: 'evt_1',
          ts: '2024-11-22T00:00:00Z',
          worktree: 'main',
          table: 'boardroom_sessions',
          op: 'INSERT',
          data: {
            id: 'sess_done',
            proposal_path: 'test.md',
            status: 'active',
            created_at: '2024-11-22T00:00:00Z',
            completed_at: null
          }
        },
        {
          id: 'evt_2',
          ts: '2024-11-22T00:01:00Z',
          worktree: 'main',
          table: 'boardroom_sessions',
          op: 'UPDATE',
          key: 'sess_done',
          data: { status: 'completed', completed_at: '2024-11-22T00:01:00Z' }
        }
      ];
      writeFileSync(
        join(TEST_EVENTS_DIR, '2024-11-22-test.jsonl'),
        events.map((e) => JSON.stringify(e)).join('\n') + '\n'
      );

      const manager = new SessionManager(TEST_EVENTS_DIR, 'main');
      expect(manager.getActiveSessionId()).toBeNull();
    });
  });

  describe('getSession', () => {
    it('should return session by ID', () => {
      const manager = new SessionManager(TEST_EVENTS_DIR, 'main');
      const session = manager.startSession('test.md');

      const retrieved = manager.getSession(session.id);
      expect(retrieved).not.toBeNull();
      expect(retrieved!.id).toBe(session.id);
      expect(retrieved!.proposal_path).toBe('test.md');
    });

    it('should return null for non-existent session', () => {
      const manager = new SessionManager(TEST_EVENTS_DIR, 'main');

      expect(manager.getSession('sess_nonexistent')).toBeNull();
    });
  });

  describe('listSessions', () => {
    it('should list all sessions', () => {
      const manager = new SessionManager(TEST_EVENTS_DIR, 'main');
      manager.startSession('test1.md');
      manager.startSession('test2.md');

      const sessions = manager.listSessions();
      expect(sessions).toHaveLength(2);
    });

    it('should filter by status', () => {
      // Create events with mixed statuses
      const events = [
        {
          id: 'evt_1',
          ts: '2024-11-22T00:00:00Z',
          worktree: 'main',
          table: 'boardroom_sessions',
          op: 'INSERT',
          data: { id: 'sess_1', proposal_path: 'a.md', status: 'active', created_at: '2024-11-22T00:00:00Z', completed_at: null }
        },
        {
          id: 'evt_2',
          ts: '2024-11-22T00:01:00Z',
          worktree: 'main',
          table: 'boardroom_sessions',
          op: 'INSERT',
          data: { id: 'sess_2', proposal_path: 'b.md', status: 'active', created_at: '2024-11-22T00:01:00Z', completed_at: null }
        },
        {
          id: 'evt_3',
          ts: '2024-11-22T00:02:00Z',
          worktree: 'main',
          table: 'boardroom_sessions',
          op: 'UPDATE',
          key: 'sess_1',
          data: { status: 'completed', completed_at: '2024-11-22T00:02:00Z' }
        }
      ];
      writeFileSync(
        join(TEST_EVENTS_DIR, '2024-11-22-test.jsonl'),
        events.map((e) => JSON.stringify(e)).join('\n') + '\n'
      );

      const manager = new SessionManager(TEST_EVENTS_DIR, 'main');

      expect(manager.listSessions('active')).toHaveLength(1);
      expect(manager.listSessions('completed')).toHaveLength(1);
    });
  });

  describe('completeSession', () => {
    it('should mark session as completed', () => {
      const manager = new SessionManager(TEST_EVENTS_DIR, 'main');
      const session = manager.startSession('test.md');

      manager.completeSession(session.id);

      const updated = manager.getSession(session.id);
      expect(updated!.status).toBe('completed');
      expect(updated!.completed_at).not.toBeNull();
    });

    it('should clear active session', () => {
      const manager = new SessionManager(TEST_EVENTS_DIR, 'main');
      const session = manager.startSession('test.md');

      manager.completeSession(session.id);

      expect(manager.getActiveSessionId()).toBeNull();
    });
  });

  describe('cancelSession', () => {
    it('should mark session as cancelled', () => {
      const manager = new SessionManager(TEST_EVENTS_DIR, 'main');
      const session = manager.startSession('test.md');

      manager.cancelSession(session.id);

      const updated = manager.getSession(session.id);
      expect(updated!.status).toBe('cancelled');
    });
  });

  describe('getWorktree', () => {
    it('should return current worktree', () => {
      const manager = new SessionManager(TEST_EVENTS_DIR, 'feature-x');

      expect(manager.getWorktree()).toBe('feature-x');
    });
  });

  describe('getEventsDir', () => {
    it('should return events directory', () => {
      const manager = new SessionManager(TEST_EVENTS_DIR, 'main');

      expect(manager.getEventsDir()).toBe(TEST_EVENTS_DIR);
    });
  });
});
