/**
 * OpenID4VP Appendix A (DC API) helpers for gataca-ssibutton.
 * Aligns with Connect: response_mode dc_api vs dc_api.jwt mirrors direct_post / direct_post.jwt.
 * This package only prepares navigator.credentials.get; encryption and POST to response_uri are wallet + host fillSession.
 */

export const DC_API_RESPONSE_MODE = 'dc_api';
export const DC_API_JWT_RESPONSE_MODE = 'dc_api.jwt';

export const OPENID4VP_DCAPI_SIGNED_PROTOCOL = 'openid4vp-v1';
export const OPENID4VP_DCAPI_UNSIGNED_PROTOCOL = 'openid4vp-v1-unsigned';

export function isDcApiResponseMode(responseMode: unknown): boolean {
    return responseMode === DC_API_RESPONSE_MODE || responseMode === DC_API_JWT_RESPONSE_MODE;
}

export function isDcApiJwtResponseMode(responseMode: unknown): boolean {
    return responseMode === DC_API_JWT_RESPONSE_MODE;
}

export type OpenId4VpDigitalCredentialRequest = {
    protocol: string;
    data: Record<string, unknown>;
};

export type OpenId4VpDcApiPrepareResult = {
    digitalRequest: OpenId4VpDigitalCredentialRequest;
    /** Authorization request URL; host fillSession uses it to resolve request_uri / Connect JWT. */
    fillSessionRequest: string;
};

/** Parse Connect authentication_request (openid4vp://?client_id=…&request_uri=…). */
export function buildOpenId4VpDcApiCredentialGetRequest(authenticationRequestUrl: string): OpenId4VpDcApiPrepareResult {
    const url = new URL(authenticationRequestUrl);
    const requestUri = url.searchParams.get('request_uri');
    const clientId = url.searchParams.get('client_id');
    if (!requestUri || !clientId) {
        throw new Error('OpenID4VP DC API: authentication request must include client_id and request_uri');
    }
    const requestUriMethod = url.searchParams.get('request_uri_method') || 'GET';
    return {
        digitalRequest: {
            protocol: OPENID4VP_DCAPI_SIGNED_PROTOCOL,
            data: {
                client_id: clientId,
                request_uri: requestUri,
                request_uri_method: requestUriMethod
            }
        },
        fillSessionRequest: authenticationRequestUrl
    };
}

export async function fetchCompactJwtFromRequestUri(requestUri: string): Promise<string> {
    const response = await fetch(requestUri, {method: 'GET', credentials: 'omit'});
    if (!response.ok) {
        throw new Error(`OpenID4VP request_uri GET failed: ${response.status}`);
    }
    const rawResponse = (await response.text()).trim();
    let jwt = rawResponse;
    try {
        const parsedResponse = JSON.parse(rawResponse);
        if (typeof parsedResponse === 'string') {
            jwt = parsedResponse;
        } else if (parsedResponse?.jwt && typeof parsedResponse.jwt === 'string') {
            jwt = parsedResponse.jwt;
        }
    } catch {
        /* compact JWT string */
    }
    const parts = jwt.split('.');
    if (parts.length < 3) {
        throw new Error('OpenID4VP request_uri did not return a compact JWT');
    }
    return jwt;
}

export function decodeJwtPayloadClaims(jwt: string): Record<string, unknown> {
    const parts = jwt.trim().split('.');
    if (parts.length < 2 || !parts[1]) {
        throw new Error('Invalid JWT payload');
    }
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
    const decoded = atob(padded);
    const claims = JSON.parse(decoded);
    if (!claims || typeof claims !== 'object' || Array.isArray(claims)) {
        throw new Error('Invalid JWT payload JSON');
    }
    return claims as Record<string, unknown>;
}

/**
 * Fallback when the UA only accepts unsigned inline requests: use JWT claims as-is (do not override response_mode).
 */
export async function buildUnsignedDigitalRequestFromRequestUri(requestUri: string): Promise<OpenId4VpDigitalCredentialRequest> {
    const jwt = await fetchCompactJwtFromRequestUri(requestUri);
    const claims = decodeJwtPayloadClaims(jwt);
    return {
        protocol: OPENID4VP_DCAPI_UNSIGNED_PROTOCOL,
        data: claims
    };
}
