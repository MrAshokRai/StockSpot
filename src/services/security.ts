import { AuditLog, UserRole } from '../types';

// XSS Sanitizer: Escape dangerous characters
export function sanitizeInput(input: string): string {
  if (!input) return '';
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

// Token Bucket Rate Limiter
class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private maxRequests: number;
  private windowMs: number;

  constructor(maxRequests: number = 30, windowMs: number = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  public isAllowed(key: string): { allowed: boolean; remaining: number; retryAfterMs?: number } {
    const now = Date.now();
    const timestamps = this.requests.get(key) || [];
    
    // Filter timestamps within window
    const validTimestamps = timestamps.filter(t => now - t < this.windowMs);
    
    if (validTimestamps.length >= this.maxRequests) {
      const oldest = validTimestamps[0];
      const retryAfterMs = this.windowMs - (now - oldest);
      return { allowed: false, remaining: 0, retryAfterMs };
    }

    validTimestamps.push(now);
    this.requests.set(key, validTimestamps);
    return {
      allowed: true,
      remaining: this.maxRequests - validTimestamps.length
    };
  }
}

export const searchRateLimiter = new RateLimiter(60, 60000); // 60 queries/min
export const rfqRateLimiter = new RateLimiter(10, 60000); // 10 RFQs/min
export const reservationRateLimiter = new RateLimiter(15, 60000); // 15 reservations/min

// Audit Logger
class SecurityAuditManager {
  private logs: AuditLog[] = [];
  private static STORAGE_KEY = 'stockspot_security_audit_logs';

  constructor() {
    this.loadLogs();
  }

  private loadLogs() {
    try {
      const stored = localStorage.getItem(SecurityAuditManager.STORAGE_KEY);
      if (stored) {
        this.logs = JSON.parse(stored);
      }
    } catch (e) {
      this.logs = [];
    }
  }

  private persistLogs() {
    try {
      // Keep last 100 logs
      if (this.logs.length > 100) {
        this.logs = this.logs.slice(0, 100);
      }
      localStorage.setItem(SecurityAuditManager.STORAGE_KEY, JSON.stringify(this.logs));
    } catch (e) {
      // Ignore storage errors
    }
  }

  public logAction(
    actorRole: UserRole | string,
    action: string,
    entityType: string,
    entityId: string,
    details: Record<string, any> = {},
    actorId?: string
  ): AuditLog {
    const fakeIpHash = `ip_hash_${Math.random().toString(36).substring(2, 10)}`;
    const log: AuditLog = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      actorId: actorId || 'session_user',
      actorRole,
      action,
      entityType,
      entityId,
      ipHash: fakeIpHash,
      details,
      createdAt: new Date().toISOString()
    };

    this.logs.unshift(log);
    this.persistLogs();
    return log;
  }

  public getLogs(): AuditLog[] {
    return [...this.logs];
  }

  public clearLogs() {
    this.logs = [];
    localStorage.removeItem(SecurityAuditManager.STORAGE_KEY);
  }
}

export const auditLogger = new SecurityAuditManager();
