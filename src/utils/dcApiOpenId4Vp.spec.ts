import {buildOpenId4VpDcApiCredentialGetRequest, decodeJwtPayloadClaims, isDcApiJwtResponseMode, isDcApiResponseMode, OPENID4VP_DCAPI_SIGNED_PROTOCOL} from './dcApiOpenId4Vp';

describe('dcApiOpenId4Vp', () => {
    it('builds signed digital request from Connect-style authentication_request URL', () => {
        const authUrl = 'openid4vp://?client_id=did%3Aweb%3Aexample&request_uri=https%3A%2F%2Fconnect.example%2Frequest%2Fs1&request_uri_method=GET';
        const prepared = buildOpenId4VpDcApiCredentialGetRequest(authUrl);
        expect(prepared.fillSessionRequest).toBe(authUrl);
        expect(prepared.digitalRequest.protocol).toBe(OPENID4VP_DCAPI_SIGNED_PROTOCOL);
        expect(prepared.digitalRequest.data).toEqual({
            client_id: 'did:web:example',
            request_uri: 'https://connect.example/request/s1',
            request_uri_method: 'GET'
        });
    });

    it('recognizes dc_api response modes', () => {
        expect(isDcApiResponseMode('dc_api')).toBe(true);
        expect(isDcApiResponseMode('dc_api.jwt')).toBe(true);
        expect(isDcApiJwtResponseMode('dc_api.jwt')).toBe(true);
        expect(isDcApiResponseMode('direct_post')).toBe(false);
    });

    it('decodes JWT payload without mutating response_mode', () => {
        const payload = btoa(JSON.stringify({response_mode: 'dc_api.jwt', response_uri: 'https://enc.example/r'}))
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/, '');
        const jwt = `eyJhbGciOiJIUzI1NiJ9.${payload}.sig`;
        const claims = decodeJwtPayloadClaims(jwt);
        expect(claims.response_mode).toBe('dc_api.jwt');
        expect(claims.response_uri).toBe('https://enc.example/r');
    });
});
