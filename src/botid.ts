import { checkBotId } from "botid/server";

export type BotCheckLevel = "basic" | "deepAnalysis";

export interface BotIdCheckResult {
  isBot: boolean;
  isHuman: boolean;
  isVerifiedBot: boolean;
  verifiedBotName?: string;
  reason?: string;
}

/**
 * BotID middleware for Cloudflare Workers
 * Checks incoming requests for bot signatures
 * 
 * @param request - The incoming Request object
 * @param level - Check level: 'basic' for lightweight checks, 'deepAnalysis' for thorough analysis
 * @returns BotIdCheckResult with bot detection status
 */
export async function checkBotProtection(
  request: Request,
  level: BotCheckLevel = "basic"
): Promise<BotIdCheckResult> {
  try {
    // Convert CF Request headers to Node.js IncomingHttpHeaders format
    const headers: Record<string, string> = {};
    request.headers.forEach((value, key) => {
      headers[key.toLowerCase()] = value;
    });

    const result = await checkBotId({
      advancedOptions: {
        checkLevel: level,
        headers: headers as any,
      },
    });
    
    // Type guard to handle the union type
    const verifiedBotName = 'verifiedBotName' in result ? result.verifiedBotName : undefined;
    
    return {
      isBot: result.isBot,
      isHuman: result.isHuman,
      isVerifiedBot: result.isVerifiedBot || false,
      verifiedBotName,
      reason: result.isBot 
        ? (verifiedBotName ? `Verified bot: ${verifiedBotName}` : "Unverified bot detected")
        : undefined,
    };
  } catch (error) {
    console.error("BotID check error:", error);
    // Fail open - if BotID fails, allow the request
    return {
      isBot: false,
      isHuman: true,
      isVerifiedBot: false,
      reason: "BotID check failed, allowing request",
    };
  }
}

/**
 * Creates a 403 Forbidden response for blocked bot requests
 */
export function createBotBlockedResponse(reason?: string): Response {
  return new Response(
    JSON.stringify({
      error: "Bot request blocked",
      reason: reason || "Request identified as automated bot traffic",
      code: "BOT_BLOCKED",
    }),
    {
      status: 403,
      headers: {
        "Content-Type": "application/json",
        "X-Bot-Protection": "active",
      },
    }
  );
}

/**
 * Wrapper middleware that checks bot protection and returns Response if blocked
 * Returns null if request should proceed
 * 
 * Note: Verified bots (like Googlebot) are allowed through
 */
export async function checkAndBlockBot(
  request: Request,
  level: BotCheckLevel = "basic"
): Promise<Response | null> {
  const result = await checkBotProtection(request, level);
  
  // Block unverified bots, but allow verified bots (search engines, etc.)
  if (result.isBot && !result.isVerifiedBot) {
    console.log(`Bot blocked: ${result.reason}`);
    return createBotBlockedResponse(result.reason);
  }
  
  // Allow verified bots through
  if (result.isVerifiedBot) {
    console.log(`Verified bot allowed: ${result.verifiedBotName}`);
  }
  
  return null;
}
