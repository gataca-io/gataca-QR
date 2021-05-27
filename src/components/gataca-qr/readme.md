# Gataca-QR

This component built using stencyl allows an easy integration to display a gataca QR.
It allows to integrate 2 slots, named "title" and "description", to provide further integration to the user upon display of the QR.

This component can be used with the prerequisite of having an application which can be integrated with [Gataca Connect](https://docs.gatacaid.com/connect/). More precisely, your application will need to be able to perform the two operations against your connect server:
1. Create sessions
2. Consult sessions

Therefore, in order to make it work, you will need at least:
1. A **connect server** (might be Gataca Connect Saas)
2. An application integrated with that server to perform the basic operations.

You can find an example of that kind of simple application _(written in Go)_ on the [Gataca Authorizer](https://github.com/gatacaid/gataca-authorizer), which we will use as example to explain the component's usage. *Gataca Authorizer* offers the two required endpoints:

1. **/validate** : _Check if the user is authenticated, if not, create a new session against the connect server_
2. **/login** : _Check the status of the created session_

Continuing with that example, you could integrate with that kind of application _(if running on http://localhost:9009)_ using the following code

````html
<!DOCTYPE html>
<html dir="ltr" lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, minimum-scale=1.0, maximum-scale=5.0">
  <title>Gataca QR Component</title>
  <script type="module" src="/build/gatacaqr.esm.js"></script>
  <script nomodule src="/build/gatacaqr.js"></script>
  <script type="module" src="/build/modal.esm.js"></script>
  <script nomodule src="/build/modal.js"></script>
  <style type="text/css">
  h1{
    color: #181B5E;
    align-self: center;
    text-align: center;
  }

  h5{
    color: #181B5E;
  }
  </style>
</head>
<body>
  <gataca-qr id="gataca-qr" callback-server="https://connect.dev.gatacaid.com:9090" session-endpoint="http://localhost:9009/login?id=">
  <h1 slot="title">Login with Gataca</h1>
  <h5 slot="description">Scan this QR to open your gataca wallet</h5></gataca-qr>
  
  <script>
    const qr = document.getElementById('gataca-qr');
    qr.successCallback = () => {
        //replace with your logic
      alert('LOGIN SUCCESS')
    };
    qr.errorCallback = () => {
        //replace with your logic
      alert('LOGIN ERROR')
    };

    qr.createSession = async () => {
        let response = await fetch("http://localhost:9009/validate");
        return response.headers.get("X-Connect-Id")
    }
  </script>
</body>
</html>
````

You can use this component with an already created session, which can be inserted on the sessionId property on the element, or passed via query parameter _id_ or _sessionId_ on the current URL.
You can also provide a method to generate a new session like in the example, or, in the rare event of matching the authorizer API, just the endpoint to your application.

In order to consult sessions, both options are also available, depending on how you want to develop your own API.

<!-- Auto Generated Below -->


## Properties

| Property             | Attribute              | Description                                                                                                                                                                                                                                                                                                                                         | Type                                      | Default                       |
| -------------------- | ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- | ----------------------------- |
| `asButton`           | `as-button`            | _[Optional]_ Decide if to show it as a button to display the QR Or display directly the QR. Default: true (display button)                                                                                                                                                                                                                          | `boolean`                                 | `false`                       |
| `buttonText`         | `button-text`          | _[Optional]_ In the case of being a button, modifies its text                                                                                                                                                                                                                                                                                       | `string`                                  | `'Easy login'`                |
| `callbackServer`     | `callback-server`      | ***Mandatory*** Connect Server where the wallet will send the data                                                                                                                                                                                                                                                                                  | `string`                                  | `DEFAULT_CALLBACK_SERVER`     |
| `checkStatus`        | --                     | _[Optional]_ Check status function to query the current status of the session If not set, it would fallback to the session Endpoint property.                                                                                                                                                                                                       | `(id?: string) => Promise<RESULT_STATUS>` | `undefined`                   |
| `createSession`      | --                     | _[Optional]_ Create session function to generate a new Session If the property is unset, it will fallback to the generation Endpoint property.                                                                                                                                                                                                      | `() => Promise<string>`                   | `undefined`                   |
| `dynamicLink`        | `dynamic-link`         | _[Optional]_ Display a link containing a dynamic link to invoke the wallet if closed                                                                                                                                                                                                                                                                | `boolean`                                 | `true`                        |
| `errorCallback`      | --                     | ***Mandatory*** Callback fired upon session expired or invalid If not set, session error would not be handled An error containing information will be passed as parameter                                                                                                                                                                           | `(error?: Error) => void`                 | `undefined`                   |
| `generationEndpoint` | `generation-endpoint`  | _[Optional]_ Session Generation URL to create a new Session. It will expect to receive the session Id from the response header 'X-Connect-Id'. If not set, it would use a default endpoint to the same window URL under the path /auth                                                                                                              | `string`                                  | `DEFAULT_GENERATION_ENDPOINT` |
| `hideBrandTile`      | `hide-brand-tile`      | _[Optional]_ Boolean to show or not show the gataca brand title                                                                                                                                                                                                                                                                                     | `boolean`                                 | `false`                       |
| `pollingFrequency`   | `polling-frequency`    | _[Optional]_ Frequency in seconds to check if the session has been validated                                                                                                                                                                                                                                                                        | `number`                                  | `DEFAULT_POLLING_FREQ`        |
| `qrModalDescription` | `qr-modal-description` | _[Optional]_ Modifies the Modal description                                                                                                                                                                                                                                                                                                         | `string`                                  | `'Scan to sign in'`           |
| `qrModalTitle`       | `qr-modal-title`       | _[Optional]_ Modifies the qr headline title                                                                                                                                                                                                                                                                                                         | `string`                                  | `'Fast Sing-on'`              |
| `qrRole`             | `qr-role`              | _[Optional]_ Decide if scanning the credential as a verifier to request credentials or as an issuer too issue credentials. Options: scan (default) \| credential                                                                                                                                                                                    | `string`                                  | `DEFAULT_QR_FUNCTION`         |
| `sessionEndpoint`    | `session-endpoint`     | _[Optional]_ EndpointURL to fetch data for the status. The endpoint URL will send a GET request with the session id on a parameter; concatenated to this string. It can be used if your API fulfills the requirement. If not, use the checkStatus property. If not set, it would use a default endpoint to the same window URL under the path /auth | `string`                                  | `DEFAULT_SESSION_ENDPOINT`    |
| `sessionId`          | `session-id`           | _[Optional]_ Generated session Id, which is required. Without session Id, the QR will not work. If the property is unset, it will check for an _id_ or _sessionId_ query parameter on the current URL. If there is no sessionId, it will fallback to the createSession method to generate a new Session.                                            | `string`                                  | `undefined`                   |
| `sessionTimeout`     | `session-timeout`      | _[Optional]_ Maximum time window to display the session                                                                                                                                                                                                                                                                                             | `number`                                  | `DEFAULT_SESSION_TIMEOUT`     |
| `successCallback`    | --                     | ***Mandatory*** Callback fired upon session correctly verified If not set, session validation wouldn't trigger any action The session data and a possible token will be sent as parameters to the callback                                                                                                                                          | `(data?: any, token?: string) => void`    | `undefined`                   |


## Events

| Event                  | Description                                                                | Type               |
| ---------------------- | -------------------------------------------------------------------------- | ------------------ |
| `gatacaLoginCompleted` | GatacaLoginCompleted event, triggered with session data upon login success | `CustomEvent<any>` |
| `gatacaLoginFailed`    | GatacaLoginFailed event, triggered with error upon login failure           | `CustomEvent<any>` |


## Methods

### `display() => Promise<void>`

Force manually the display of a QR

#### Returns

Type: `Promise<void>`



### `getSessionData() => Promise<any>`

Retrieve manually the session data on a successful login

#### Returns

Type: `Promise<any>`



### `getToken() => Promise<string>`

Retrieve manually a possible token retrieved upon login on the Header 'token'

#### Returns

Type: `Promise<string>`



### `stop() => Promise<void>`

Stop manually an ongoing session

#### Returns

Type: `Promise<void>`




----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
