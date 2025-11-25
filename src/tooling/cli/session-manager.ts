/**
 * Session Manager
 *
 * Manages boardroom session lifecycle - creation, tracking, and completion.
 * Provides a higher-level interface over BoardroomClient and EventReader.
 */

import { BoardroomClient } from '@razorweave/boardroom';
import type { BoardroomSession, SessionStatus } from '@razorweave/boardroom';
import { EventReader, EventWriter } from '@razorweave/events';
import type { InsertEvent, UpdateEvent, DatabaseEvent } from '@razorweave/events';

export class SessionManager {
  private readonly eventsDir: string;
  private readonly worktree: string;
  private client: BoardroomClient | null = null;
  private currentSessionId: string | null = null;
  private sessionCache: Map<string, BoardroomSession> = new Map();

  constructor(eventsDir: string, worktree: string) {
    this.eventsDir = eventsDir;
    this.worktree = worktree;
    this.loadFromEvents();
  }

  /**
   * Load existing sessions from event logs
   */
  private loadFromEvents(): void {
    const reader = new EventReader(this.eventsDir);
    const events = reader.readByTable('boardroom_sessions');

    for (const event of events) {
      this.applyEvent(event);
    }

    // Find active session
    for (const session of this.sessionCache.values()) {
      if (session.status === 'active') {
        this.currentSessionId = session.id;
        break;
      }
    }
  }

  /**
   * Apply an event to update the session cache
   */
  private applyEvent(event: DatabaseEvent): void {
    if (event.op === 'INSERT') {
      const insertEvent = event as InsertEvent;
      const session = insertEvent.data as unknown as BoardroomSession;
      this.sessionCache.set(session.id, session);
    } else if (event.op === 'UPDATE') {
      const updateEvent = event as UpdateEvent;
      const existing = this.sessionCache.get(updateEvent.key);
      if (existing) {
        const updated = { ...existing, ...updateEvent.data } as BoardroomSession;
        this.sessionCache.set(updateEvent.key, updated);
      }
    } else if (event.op === 'DELETE') {
      this.sessionCache.delete(event.key);
    }
  }

  /**
   * Get or create a BoardroomClient for the current session
   */
  private getClient(sessionId: string): BoardroomClient {
    if (!this.client || this.currentSessionId !== sessionId) {
      this.client = new BoardroomClient(this.eventsDir, sessionId, this.worktree);
    }
    return this.client;
  }

  /**
   * Start a new boardroom session
   */
  startSession(proposalPath: string): BoardroomSession {
    // Generate a new session ID for the client
    const tempClient = new BoardroomClient(
      this.eventsDir,
      `session-${Date.now()}`,
      this.worktree
    );
    const session = tempClient.createSession(proposalPath);

    // Update cache
    this.sessionCache.set(session.id, session);
    this.currentSessionId = session.id;
    this.client = new BoardroomClient(this.eventsDir, session.id, this.worktree);

    return session;
  }

  /**
   * Get the active session ID
   */
  getActiveSessionId(): string | null {
    // Re-check cache for active session
    for (const session of this.sessionCache.values()) {
      if (session.status === 'active') {
        return session.id;
      }
    }
    return null;
  }

  /**
   * Get a session by ID
   */
  getSession(sessionId: string): BoardroomSession | null {
    return this.sessionCache.get(sessionId) ?? null;
  }

  /**
   * List all sessions, optionally filtered by status
   */
  listSessions(status?: SessionStatus): BoardroomSession[] {
    const sessions = Array.from(this.sessionCache.values());
    if (status) {
      return sessions.filter((s) => s.status === status);
    }
    return sessions;
  }

  /**
   * Mark a session as completed
   */
  completeSession(sessionId: string): void {
    const session = this.sessionCache.get(sessionId);
    if (!session) return;

    const writer = new EventWriter(this.eventsDir, sessionId, this.worktree);
    const completedAt = new Date().toISOString();

    writer.write(
      'boardroom_sessions',
      'UPDATE',
      { status: 'completed', completed_at: completedAt },
      sessionId
    );

    // Update cache
    session.status = 'completed';
    session.completed_at = completedAt;
    this.sessionCache.set(sessionId, session);

    // Clear active session if this was it
    if (this.currentSessionId === sessionId) {
      this.currentSessionId = null;
    }
  }

  /**
   * Mark a session as cancelled
   */
  cancelSession(sessionId: string): void {
    const session = this.sessionCache.get(sessionId);
    if (!session) return;

    const writer = new EventWriter(this.eventsDir, sessionId, this.worktree);

    writer.write(
      'boardroom_sessions',
      'UPDATE',
      { status: 'cancelled' },
      sessionId
    );

    // Update cache
    session.status = 'cancelled';
    this.sessionCache.set(sessionId, session);

    // Clear active session if this was it
    if (this.currentSessionId === sessionId) {
      this.currentSessionId = null;
    }
  }

  /**
   * Get the current worktree name
   */
  getWorktree(): string {
    return this.worktree;
  }

  /**
   * Get the events directory
   */
  getEventsDir(): string {
    return this.eventsDir;
  }

  /**
   * Get the BoardroomClient for a session (for advanced operations)
   */
  getBoardroomClient(sessionId: string): BoardroomClient {
    return this.getClient(sessionId);
  }
}
