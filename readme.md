# @gataca/qr

Web components for presenting a Gataca Connect or Certify session in a website. The package is published as [`@gataca/qr`](https://www.npmjs.com/package/@gataca/qr).

Your backend creates the session and reports its status. The components do not call Connect or Certify with your application credentials. They render the QR or the button and invoke the callbacks you pass in.

`createSession` must return both values:

| Field | Meaning |
| --- | --- |
| `sessionId` | Id your backend uses to poll the session |
| `authenticationRequest` | Authorization request URL returned by Connect (`client_id`, `request_uri`, and the rest of the query). The wallet link and the Digital Credentials API both need this URL |

`checkStatus` returns `{ result, data? }` with `result` from `RESULT_STATUS`: `0` ongoing, `1` success, `2` failed, `3` expired. `qrRole` is `connect` (verify) or `certify` (issue). There is no default.

`v` defaults to `"3"`: mobile opens the Gataca deeplink, desktop opens the QR modal. `v="2"` uses `authenticationRequest` as the raw link, without the deeplink wrapper.

The v1 properties `sessionEndpoint`, `generationEndpoint`, `asButton`, and `getLoginToken()` are gone. Anything you want from the finished session (token, claims, headers) comes back in the `data` of `checkStatus`.

## Install

```bash
npm install @gataca/qr
```

Load the custom elements once, before rendering:

```html
<script type="module" src="https://unpkg.com/@gataca/qr/dist/gatacaqr/gatacaqr.esm.js"></script>
<script nomodule src="https://unpkg.com/@gataca/qr/dist/gatacaqr/gatacaqr.js"></script>
```

In a bundler, call `defineCustomElements` from `@gataca/qr/loader` during startup. React wrappers live in `gatacaqr-react/`.

## Components

| Component | Role |
| --- | --- |
| [gataca-qrdisplay](src/components/gataca-qrdisplay/readme.md) | Renders a QR. No session logic. |
| [gataca-qr](src/components/gataca-qr/readme.md) | QR panel. Polls with `checkStatus`. |
| [gataca-qrws](src/components/gataca-qrws/readme.md) | Same panel, fed by a WebSocket instead of polling. Your backend owns the socket. Messages can be `WSResponse`, or any payload you translate into a `sessionMsg` event with that shape. |
| [gataca-ssibutton](src/components/gataca-ssibutton/readme.md) | Button that opens the QR modal, a mobile deeplink, or the Digital Credentials API. Same session callbacks as `gataca-qr`. |
| [gataca-ssibuttonws](src/components/gataca-ssibuttonws/readme.md) | Same button over the WebSocket QR. No Digital Credentials API. |
| [gataca-autoqr](src/components/gataca-autoqr/readme.md) | Downloads a `QRConfig` and mounts one of the components above. The config still has to carry `createSession` / `checkStatus` (or the WebSocket handlers). |

Property tables for each tag are in those pages. Prefer this file for how a session is created and how the Digital Credentials API picks a protocol. `callbackServer` remains on the tags and is not used to create or poll the session.

## Digital Credentials API

Only `gataca-ssibutton`. Set `enable-dc-api="true"` and pass `fillSession`. The button replaces the QR modal when `DigitalCredential.userAgentAllowsProtocol` accepts at least one supported protocol, on mobile and on desktop. On desktop the browser draws its own cross-device dialog (the system QR); this package does not.

The relying party does not choose the protocol. On click the button reads `request_uri` from `authenticationRequest`, fetches it, and matches the body to what the browser allows:

| Connect `request_uri` body | Protocol sent to `navigator.credentials.get` |
| --- | --- |
| JSON with `deviceRequest` and `encryptionInfo` (ISO/IEC 18013-7 Annex C) | `org-iso-mdoc` |
| Compact JWT with an `x5c` header, or `client_id` `x509_hash:` / `x509_san_dns:` | `openid4vp-v1-signed`, with `{ request: "<jwt>" }` |
| Any other compact JWT (DID, OpenID Federation) | `openid4vp-v1-unsigned`, with the JWT claims inline |

If the browser rejects the preferred protocol, the button falls through in this order and then stops:

- Signed JWT: `openid4vp-v1-signed`, then `openid4vp-v1` (`client_id` + `request_uri`).
- Other JWT: `openid4vp-v1-unsigned`, then `openid4vp-v1`, then `openid4vp-v1-signed`.
- Last resort, only when the browser still advertises the unversioned name: `openid4vp`, reusing the `data` of the candidate that was just rejected.

A body that is neither Annex C JSON nor a compact JWT throws. It is not sent as the other protocol.

`fillSession(authenticationRequest, presentation)` receives the same authorization request URL and the wallet payload (`vp_token`, compact JWE, or the Annex C response, depending on the wallet). Post that payload to Connect and return `{ result: 1, data? }` on success. Any other result, a thrown error, or a user dismissing the dialog calls `errorCallback` and emits `gatacaLoginFailed`. A successful DC API call does not call `successCallback` or emit `gatacaLoginCompleted`; finish the login with the `data` you already have inside `fillSession`.

Without `enable-dc-api`, or when the browser allows none of these protocols, the button keeps the QR modal (desktop) or the deeplink (mobile, `v="3"`).

```html
<gataca-ssibutton
  id="gataca-login"
  qr-role="connect"
  enable-dc-api="true"
  v="3"
></gataca-ssibutton>
<script>
  const button = document.getElementById("gataca-login");

  button.createSession = async () => {
    const session = await fetch("/api/verification/sessions", { method: "POST" }).then((r) => r.json());
    return {
      sessionId: session.id,
      authenticationRequest: session.authenticationRequest,
    };
  };

  button.checkStatus = async (sessionId) => {
    const status = await fetch("/api/verification/sessions/" + sessionId).then((r) => r.json());
    return { result: status.result, data: status.data };
  };

  button.fillSession = async (authenticationRequest, presentation) => {
    const done = await fetch("/api/verification/presentations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ authenticationRequest, presentation }),
    }).then((r) => r.json());
    return { result: done.ok ? 1 : 2, data: done.user };
  };

  button.successCallback = (data) => {
    // QR / deeplink path only
  };
  button.errorCallback = (error) => {
    console.error(error);
  };
</script>
```
