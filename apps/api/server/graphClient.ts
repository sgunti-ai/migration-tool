import {
  Client,
  Middleware,
  Context,
  CustomAuthenticationProvider,
  MiddlewareFactory,
} from '@microsoft/microsoft-graph-client';

export interface GraphClientConfig {
  accessToken: string;
  onRetry?: (attempt: number, retryAfterMs: number, reason: string) => void;
  onLog?: (message: string) => void;
}

/**
 * Custom Middleware for Microsoft Graph Client that intercepts HTTP 429 (Too Many Requests)
 * reads the 'Retry-After' header, and executes automated exponential backoff.
 */
export class ThrottleRetryMiddleware implements Middleware {
  private nextMiddleware: Middleware | undefined;
  private maxRetries: number;
  private onRetry?: (attempt: number, retryAfterMs: number, reason: string) => void;

  constructor(
    maxRetries = 3,
    onRetry?: (attempt: number, retryAfterMs: number, reason: string) => void
  ) {
    this.maxRetries = maxRetries;
    this.onRetry = onRetry;
  }

  public setNext(next: Middleware): void {
    this.nextMiddleware = next;
  }

  public async execute(context: Context): Promise<void> {
    let attempt = 0;

    while (attempt <= this.maxRetries) {
      try {
        if (this.nextMiddleware) {
          await this.nextMiddleware.execute(context);
        }

        const response = context.response as Response | undefined;
        if (response && response.status === 429) {
          attempt++;
          if (attempt > this.maxRetries) {
            throw new Error(`Microsoft Graph API Rate Limit Exceeded (HTTP 429): Max retries (${this.maxRetries}) reached.`);
          }

          const retryAfterHeader = response.headers?.get?.('Retry-After') || response.headers?.get?.('retry-after');
          let delayMs = 1500 * Math.pow(2, attempt);

          if (retryAfterHeader) {
            const parsed = parseInt(retryAfterHeader, 10);
            if (!isNaN(parsed) && parsed > 0) {
              delayMs = parsed * 1000;
            }
          }

          const totalWait = delayMs + Math.floor(Math.random() * 400);

          if (this.onRetry) {
            this.onRetry(
              attempt,
              totalWait,
              `HTTP 429 Throttled. Backing off for ${Math.round(totalWait / 1000)}s before retry ${attempt}/${this.maxRetries}...`
            );
          }

          await new Promise((resolve) => setTimeout(resolve, totalWait));
          continue;
        }

        return;
      } catch (err: any) {
        if (err?.statusCode === 429 || err?.status === 429) {
          attempt++;
          if (attempt > this.maxRetries) {
            throw err;
          }

          const retryAfterSec = err.headers?.['retry-after'] || err.headers?.get?.('Retry-After');
          let delayMs = 1500 * Math.pow(2, attempt);
          if (retryAfterSec) {
            const sec = parseInt(retryAfterSec, 10);
            if (!isNaN(sec)) delayMs = sec * 1000;
          }

          if (this.onRetry) {
            this.onRetry(
              attempt,
              delayMs,
              `Microsoft Graph API Throttled (429). Retrying in ${Math.round(delayMs / 1000)}s (Attempt ${attempt}/${this.maxRetries})`
            );
          }

          await new Promise((resolve) => setTimeout(resolve, delayMs));
          continue;
        }

        throw err;
      }
    }
  }
}

/**
 * Creates an authenticated Microsoft Graph client with custom throttle retry middleware
 */
export function createGraphClient(config: GraphClientConfig): Client {
  const authProvider = new CustomAuthenticationProvider(async () => {
    return config.accessToken || 'ENTRA_DELEGATED_ACCESS_TOKEN';
  });

  const throttleMiddleware = new ThrottleRetryMiddleware(3, config.onRetry);
  const defaultChain = MiddlewareFactory.getDefaultMiddlewareChain(authProvider);

  // Prepend throttle middleware
  throttleMiddleware.setNext(defaultChain[0]);
  const customChain = [throttleMiddleware, ...defaultChain];

  const client = Client.initWithMiddleware({
    middleware: customChain,
  });

  return client;
}

/**
 * Helper to execute Graph calls with automatic 429 interception and backoff
 */
export async function executeWithGraphRetry<T>(
  fn: () => Promise<T>,
  onRetry?: (attempt: number, delayMs: number, reason: string) => void,
  maxRetries = 3
): Promise<T> {
  let attempt = 0;
  while (true) {
    try {
      return await fn();
    } catch (err: any) {
      const is429 = err?.statusCode === 429 || err?.status === 429 || err?.message?.includes('429');
      if (is429 && attempt < maxRetries) {
        attempt++;
        const retryAfter = err?.headers?.['retry-after'] || 2;
        const delayMs = typeof retryAfter === 'number' ? retryAfter * 1000 : 1500 * Math.pow(2, attempt);
        if (onRetry) {
          onRetry(attempt, delayMs, `HTTP 429 Rate Limit. Backing off ${Math.round(delayMs / 1000)}s`);
        }
        await new Promise((r) => setTimeout(r, delayMs));
        continue;
      }
      throw err;
    }
  }
}
