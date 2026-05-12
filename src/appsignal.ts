import Appsignal from "@appsignal/javascript";

/**
 * Initialize AppSignal for Cloudflare Workers
 * 
 * @param apiKey - AppSignal API key (from env)
 * @param revision - Git revision or version
 * @returns Configured AppSignal instance or null if invalid
 */
export function initializeAppSignal(apiKey: string, revision?: string): Appsignal | null {
  try {
    return new Appsignal({
      key: apiKey,
      revision: revision || "unknown",
    });
  } catch (error) {
    console.error("Failed to initialize AppSignal:", error);
    return null;
  }
}

/**
 * Track request with AppSignal
 * 
 * @param appsignal - AppSignal instance
 * @param request - Request object
 * @param response - Response object
 * @param duration - Request duration in ms
 */
export function trackRequest(
  appsignal: Appsignal,
  request: Request,
  response: Response,
  duration: number
): void {
  try {
    const url = new URL(request.url);
    
    // Track as custom metric
    (appsignal as any).addDistributionValue?.("request.duration", duration, {
      method: request.method,
      path: url.pathname,
      status: String(response.status),
    });
  } catch (error) {
    console.error("Failed to track request:", error);
  }
}

/**
 * Track error with AppSignal
 * 
 * @param appsignal - AppSignal instance
 * @param error - Error object
 * @param context - Additional context
 */
export function trackError(
  appsignal: Appsignal,
  error: Error,
  context?: Record<string, string>
): void {
  try {
    appsignal.sendError(error, (span) => {
      if (context) {
        span.setTags(context);
      }
    });
  } catch (trackError) {
    console.error("Failed to track error:", trackError);
  }
}

/**
 * Track custom metrics
 * 
 * @param appsignal - AppSignal instance
 * @param name - Metric name
 * @param value - Metric value
 * @param tags - Optional tags
 */
export function trackMetric(
  appsignal: Appsignal,
  name: string,
  value: number,
  tags?: Record<string, string>
): void {
  try {
    // Use distribution value for better metric tracking
    (appsignal as any).addDistributionValue?.(name, value, tags);
  } catch (error) {
    console.error("Failed to track metric:", error);
  }
}
