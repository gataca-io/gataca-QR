/**
 * OpenID4VP Appendix A (DC API) helpers for gataca-ssibutton.
 * Aligns with Connect: response_mode dc_api vs dc_api.jwt mirrors direct_post / direct_post.jwt.
 * This package only prepares navigator.credentials.get; encryption and POST to response_uri are wallet + host fillSession.
 */

export const DC_API_RESPONSE_MODE = 'dc_api';
export const DC_API_JWT_RESPONSE_MODE = 'dc_api.jwt';

/** Appendix A.3.2 signed request passed by reference (`client_id` + `request_uri`). */
export const OPENID4VP_DCAPI_SIGNED_PROTOCOL = 'openid4vp-v1';
/** Appendix A.3.1 unsigned request: JWT claims inline. Gataca Wallet matches DCQL from these claims. */
export const OPENID4VP_DCAPI_UNSIGNED_PROTOCOL = 'openid4vp-v1-unsigned';
/** Appendix A.3.2 signed request inline. Google Wallet and cross-device require this. `data` is `{ request: compact JWS }`. */
export const OPENID4VP_GOOGLE_SIGNED_PROTOCOL = 'openid4vp-v1-signed';
/** ISO/IEC 18013-7 Annex C. */
export const ORG_ISO_MDOC_PROTOCOL = 'org-iso-mdoc';
/** Pre-versioned name some browsers still advertise. Same `data` as the versioned protocol it stands in for. */
export const LEGACY_OPENID4VP_PROTOCOL = 'openid4vp';

export const DC_API_REQUEST_PROTOCOLS = [
    ORG_ISO_MDOC_PROTOCOL,
    OPENID4VP_GOOGLE_SIGNED_PROTOCOL,
    OPENID4VP_DCAPI_SIGNED_PROTOCOL,
    OPENID4VP_DCAPI_UNSIGNED_PROTOCOL,
    LEGACY_OPENID4VP_PROTOCOL
] as const;

export type DcApiProtocolAllow = (protocol: string) => boolean;

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

/** Signed Appendix A.3.2 (request_uri only). Not used as primary: Gataca Wallet DC API needs inline auth request claims for DCQL matching. */
export function buildSignedOpenId4VpDcApiCredentialGetRequest(authenticationRequestUrl: string): OpenId4VpDcApiPrepareResult {
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

/**
 * Fetch Connect `request_uri` and pick the Digital Credentials protocol from that body.
 * Annex C JSON → `org-iso-mdoc`. A JWT with `x5c` or an `x509_*` client_id → `openid4vp-v1-signed`
 * (else `openid4vp-v1`). Any other JWT → `openid4vp-v1-unsigned` (else `openid4vp-v1`, else signed).
 */
export async function buildOpenId4VpDcApiCredentialGetRequest(authenticationRequestUrl: string): Promise<OpenId4VpDcApiPrepareResult> {
    return buildDcApiCredentialGetRequest(authenticationRequestUrl);
}

/** True when this browser can present `protocol`. Missing Digital Credentials API does not block selection. */
export function browserAllowsDcApiProtocol(protocol: string): boolean {
    if (typeof window === 'undefined') {
        return true;
    }
    const dc = (window as Window & {DigitalCredential?: {userAgentAllowsProtocol?: (protocol: string) => boolean}}).DigitalCredential;
    if (!dc || typeof dc.userAgentAllowsProtocol !== 'function') {
        return true;
    }
    return !!dc.userAgentAllowsProtocol(protocol);
}

function decodeJwtPart(jwt: string, index: number): Record<string, unknown> | undefined {
    const segment = jwt.trim().split('.')[index];
    if (!segment) {
        return undefined;
    }
    try {
        const base64 = segment.replace(/-/g, '+').replace(/_/g, '/');
        const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
        const parsed = JSON.parse(atob(padded));
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
            return undefined;
        }
        return parsed as Record<string, unknown>;
    } catch {
        return undefined;
    }
}

/** Connect puts `x5c` on the JWS only for an x509 client_id (high assurance / Google Wallet). */
export function jwtRequestsSignedDcApiProtocol(jwt: string): boolean {
    const header = decodeJwtPart(jwt, 0);
    if (header && Array.isArray(header.x5c) && header.x5c.length > 0) {
        return true;
    }
    const clientId = decodeJwtPart(jwt, 1)?.client_id;
    return typeof clientId === 'string' && (clientId.startsWith('x509_hash:') || clientId.startsWith('x509_san_dns:'));
}

function signedInlineRequest(jwt: string): OpenId4VpDigitalCredentialRequest {
    return {
        protocol: OPENID4VP_GOOGLE_SIGNED_PROTOCOL,
        data: {request: jwt.trim()}
    };
}

/**
 * Pick the OpenID4VP DC API protocol for a Connect signed JWT.
 * `allows` defaults to the browser. Pass a stub in tests.
 */
export function selectOpenId4VpDcApiRequest(jwt: string, authenticationRequestUrl: string, allows: DcApiProtocolAllow = browserAllowsDcApiProtocol): OpenId4VpDigitalCredentialRequest {
    const signed = signedInlineRequest(jwt);
    const unsigned: OpenId4VpDigitalCredentialRequest = {
        protocol: OPENID4VP_DCAPI_UNSIGNED_PROTOCOL,
        data: decodeJwtPayloadClaims(jwt)
    };
    let byReference: OpenId4VpDigitalCredentialRequest | undefined;
    try {
        byReference = buildSignedOpenId4VpDcApiCredentialGetRequest(authenticationRequestUrl).digitalRequest;
    } catch {
        byReference = undefined;
    }
    const order = (jwtRequestsSignedDcApiProtocol(jwt) ? [signed, byReference] : [unsigned, byReference, signed]).filter((candidate): candidate is OpenId4VpDigitalCredentialRequest => !!candidate);
    const match = order.find((candidate) => allows(candidate.protocol));
    if (match) {
        return match;
    }
    if (allows(LEGACY_OPENID4VP_PROTOCOL)) {
        return {protocol: LEGACY_OPENID4VP_PROTOCOL, data: order[0].data};
    }
    throw new Error('This browser does not allow an OpenID4VP Digital Credentials protocol');
}

export function isIso18013AuthorizationRequest(value: unknown): value is {deviceRequest: string; encryptionInfo: string} {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        return false;
    }
    const record = value as Record<string, unknown>;
    return typeof record.deviceRequest === 'string' && record.deviceRequest !== '' && typeof record.encryptionInfo === 'string' && record.encryptionInfo !== '';
}

/** GET Connect request_uri. ISO 18013-7 returns JSON; OpenID4VP returns a compact JWT. */
export async function fetchConnectAuthorizationRequest(requestUri: string): Promise<unknown> {
    const response = await fetch(requestUri, {method: 'GET', credentials: 'omit'});
    if (!response.ok) {
        throw new Error(`authorization request GET failed: ${response.status}`);
    }
    const raw = (await response.text()).trim();
    if (raw.startsWith('{')) {
        return JSON.parse(raw);
    }
    return raw;
}

export function iso18013DigitalRequestFromAuthorization(auth: unknown): OpenId4VpDigitalCredentialRequest {
    if (!isIso18013AuthorizationRequest(auth)) {
        throw new Error('ISO 18013-7 authorization request must include deviceRequest and encryptionInfo');
    }
    return {
        protocol: ORG_ISO_MDOC_PROTOCOL,
        data: {
            deviceRequest: auth.deviceRequest,
            encryptionInfo: auth.encryptionInfo
        }
    };
}

/**
 * Connect `request_uri` is a signed JWT for OpenID4VP and unsigned JSON for ISO 18013-7 Annex C.
 * The protocol id is chosen from that body and from what the browser allows.
 */
export async function buildDcApiCredentialGetRequest(authenticationRequestUrl: string, allows: DcApiProtocolAllow = browserAllowsDcApiProtocol): Promise<OpenId4VpDcApiPrepareResult> {
    const url = new URL(authenticationRequestUrl);
    const requestUri = url.searchParams.get('request_uri');
    if (!requestUri) {
        throw new Error('DC API: authentication request must include request_uri');
    }
    const auth = await fetchConnectAuthorizationRequest(requestUri);
    if (isIso18013AuthorizationRequest(auth)) {
        if (!allows(ORG_ISO_MDOC_PROTOCOL)) {
            throw new Error('This browser does not allow org-iso-mdoc');
        }
        return {
            digitalRequest: iso18013DigitalRequestFromAuthorization(auth),
            fillSessionRequest: authenticationRequestUrl
        };
    }
    if (typeof auth !== 'string') {
        throw new Error('OpenID4VP request_uri did not return a compact JWT');
    }
    const parts = auth.split('.');
    if (parts.length < 3) {
        throw new Error('OpenID4VP request_uri did not return a compact JWT');
    }
    return {
        digitalRequest: selectOpenId4VpDcApiRequest(auth, authenticationRequestUrl, allows),
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

/**
 * Force `openid4vp-v1-signed` with `{ request: compact JWS }`.
 * gataca-ssibutton does not call this: `buildDcApiCredentialGetRequest` selects the protocol.
 */
export async function buildGoogleWalletSignedOpenId4VpDcApiCredentialGetRequest(authenticationRequestUrl: string): Promise<OpenId4VpDcApiPrepareResult> {
    const url = new URL(authenticationRequestUrl);
    const requestUri = url.searchParams.get('request_uri');
    if (!requestUri) {
        throw new Error('OpenID4VP DC API: authentication request must include request_uri');
    }
    const jwt = await fetchCompactJwtFromRequestUri(requestUri);
    return {
        digitalRequest: signedInlineRequest(jwt),
        fillSessionRequest: authenticationRequestUrl
    };
}

/**
 * Read VP payload from navigator.credentials.get() (DigitalCredential).
 * UAs differ: payload may be in .data, a JSON string, or nested protocol/data (Appendix A).
 */
export function extractDigitalCredentialPresentationData(credentialResponse: unknown): unknown {
    if (credentialResponse === undefined || credentialResponse === null) {
        return null;
    }
    if (typeof credentialResponse === 'string') {
        return credentialResponse;
    }
    if (typeof credentialResponse !== 'object') {
        return credentialResponse;
    }
    const record = credentialResponse as Record<string, unknown>;
    if (record.data !== undefined && record.data !== null) {
        return record.data;
    }
    if (record.response !== undefined || record.vp_token !== undefined || record.id_token !== undefined) {
        return credentialResponse;
    }
    const toJSON = (record as {toJSON?: () => unknown}).toJSON;
    if (typeof toJSON === 'function') {
        const json = toJSON.call(credentialResponse);
        if (json && typeof json === 'object') {
            const j = json as Record<string, unknown>;
            if (j.data !== undefined && j.data !== null) {
                return j.data;
            }
        }
    }
    return credentialResponse;
}
