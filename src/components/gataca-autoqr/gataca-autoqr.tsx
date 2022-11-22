import {
  Component,
  Event,
  EventEmitter,
  h,
  Method,
  Prop,
  State,
} from "@stencil/core";
import { QRConfig, RESULT_STATUS } from "../../utils";

import { GatacaQR } from "../gataca-qr/gataca-qr";
import { GatacaQRWS } from "../gataca-qrws/gataca-qrws";
import { GatacaSSIButton } from "../gataca-ssibutton/gataca-ssibutton";
import { GatacaSSIButtonWS } from "../gataca-ssibuttonws/gataca-ssibuttonws";

@Component({
  tag: "gataca-autoqr",
  styleUrl: "gataca-autoqr.scss",
  shadow: true,
})
export class GatacaAutoQR {
  qr: GatacaQRWS | GatacaQR | GatacaSSIButton | GatacaSSIButtonWS;

  constructor() {
    //TODO config ID is now an URL. Replace with an ID to ensure that all configs are stored in the place we desire (i.e: Studio)
    this.loading = true;
    fetch(this.configId, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((response) => {
        response
          .json()
          .then((data: QRConfig) => {
            this.config = data;
            this.loading = false;
          })
          .catch((err) => {
            console.log("Cannot retrieve selected config", err);
            this.loading = false;
          });
      })
      .catch((err) => {
        console.log("Cannot retrieve selected config", err);
        this.loading = false;
      });
  }

  /**
   * ***Mandatory***
   * ID of the QR configuration to display
   */
  @Prop() configId;

  //--------------------------------
  //Function properties inherited by subcomponents that can be overriden to avoid code inyection
  //--------------------------------

  /**
   * ***Mandatory***
   * Callback fired upon session correctly verified
   * If not set, session validation wouldn't trigger any action
   * The session data and a possible token will be sent as parameters to the callback
   */
  @Prop()
  successCallback: (data?: any) => void = undefined;

  /**
   * ___Just for polling flavour___
   * ***Mandatory***
   * Callback fired upon session expired or invalid
   * If not set, session error would not be handled
   * An error containing information will be passed as parameter
   */
  @Prop() errorCallback: (error?: Error) => void = undefined;

  /**
   * ___Just for polling flavour___
   * ***Mandatory***
   * Check status function to query the current status of the session
   * The function must query a client endpoint to check the status. That endpoint must return an error if the session has expired.
   */
  @Prop() checkStatus?: (
    id?: string
  ) => Promise<{ result: RESULT_STATUS; data?: any }> = undefined;

  /**
   * ***Mandatory***
   * Create session function to generate a new Session
   * Using V1, it can provide just a session Id
   * Using V2, it must provide also the authentication request. The session Id is the id of the presentation definition
   */
  @Prop() createSession?: () => Promise<{
    sessionId: string;
    authenticationRequest?: string;
  }> = undefined;

  /**
   * ___Just for WS flavour___
   * [Optional]
   * Function to send a message to the server upon socket creation
   */
  @Prop() wsOnOpen: (socket: WebSocket) => void;

  /**
   * ___Just for WS flavour___
   * **RECOMMENDED**
   * Callback to invoke an a message has been received on the socket. It provides the socket itself and the message as parameters.
   * If not used, the messages provided by the server on the Socket connection must conform to the WSReponse interface
   * If used, an Event named **sessionMsg** must be triggered with a WSReponse as data
   */
  @Prop() wsOnMessage: (socket: WebSocket, msg: MessageEvent) => void;

  @State() config?: QRConfig;
  @State() loading?: boolean;

  /**
   * GatacaLoginCompleted event, triggered with session data upon login success
   */
  @Event({
    eventName: "gatacaLoginCompleted",
    composed: true,
    cancelable: true,
    bubbles: true,
  })
  gatacaLoginCompleted: EventEmitter;

  /**
   * GatacaLoginFailed event, triggered with error upon login failure
   */
  @Event({
    eventName: "gatacaLoginFailed",
    composed: true,
    cancelable: true,
    bubbles: true,
  })
  gatacaLoginFailed: EventEmitter;

  /**
   * Retrieve manually the session data on a successful login
   */
  @Method()
  async getSessionData() {
    return this.qr.getSessionData();
  }

  selectQR() {
    if (this.config.useButton) {
      if (this.config.useWs) {
        this.qr = (
          <gataca-ssibuttonws
            buttonText={this.config.buttonText}
            wsOnMessage={this.wsOnMessage || this.config.wsOnMessage}
            wsOnOpen={this.wsOnOpen || this.config.wsOnOpen}
            successCallback={
              this.successCallback || this.config.successCallback
            }
            errorCallback={this.errorCallback || this.config.errorCallback}
            qrRole={this.config.qrRole}
            callbackServer={this.config.callbackServer}
            sessionTimeout={this.config.sessionTimeout}
            socketEndpoint={this.config.socketEndpoint}
            autostart={true}
            autorefresh={this.config.autorefresh}
            v2={this.config.v2}
            qrModalTitle={this.config.qrModalTitle}
            qrModalDescription={this.config.qrModalDescription}
            hideBrandTitle={this.config.hideBrandTitle}
            dynamicLink={this.config.dynamicLink}
          />
        );
      } else {
        this.qr = (
          <gataca-ssibutton
            buttonText={this.config.buttonText}
            checkStatus={this.checkStatus || this.config.checkStatus}
            createSession={this.createSession || this.config.createSession}
            successCallback={
              this.successCallback || this.config.successCallback
            }
            errorCallback={this.errorCallback || this.config.errorCallback}
            qrRole={this.config.qrRole}
            callbackServer={this.config.callbackServer}
            sessionTimeout={this.config.sessionTimeout}
            pollingFrequency={this.config.pollingFrequency}
            autorefresh={this.config.autorefresh}
            v2={this.config.v2}
            qrModalTitle={this.config.qrModalTitle}
            qrModalDescription={this.config.qrModalDescription}
            hideBrandTitle={this.config.hideBrandTitle}
            dynamicLink={this.config.dynamicLink}
          />
        );
      }
    } else {
      if (this.config.useWs) {
        this.qr = (
          <gataca-qrws
            wsOnMessage={this.wsOnMessage || this.config.wsOnMessage}
            wsOnOpen={this.wsOnOpen || this.config.wsOnOpen}
            successCallback={
              this.successCallback || this.config.successCallback
            }
            errorCallback={this.errorCallback || this.config.errorCallback}
            qrRole={this.config.qrRole}
            callbackServer={this.config.callbackServer}
            sessionTimeout={this.config.sessionTimeout}
            socketEndpoint={this.config.socketEndpoint}
            autostart={this.config.autostart}
            autorefresh={this.config.autorefresh}
            v2={this.config.v2}
            qrModalTitle={this.config.qrModalTitle}
            qrModalDescription={this.config.qrModalDescription}
            hideBrandTitle={this.config.hideBrandTitle}
            dynamicLink={this.config.dynamicLink}
          />
        );
      } else {
        this.qr = (
          <gataca-qr
            checkStatus={this.checkStatus || this.config.checkStatus}
            createSession={this.createSession || this.config.createSession}
            successCallback={
              this.successCallback || this.config.successCallback
            }
            errorCallback={this.errorCallback || this.config.errorCallback}
            qrRole={this.config.qrRole}
            callbackServer={this.config.callbackServer}
            sessionTimeout={this.config.sessionTimeout}
            pollingFrequency={this.config.pollingFrequency}
            autostart={this.config.autostart}
            autorefresh={this.config.autorefresh}
            v2={this.config.v2}
            qrModalTitle={this.config.qrModalTitle}
            qrModalDescription={this.config.qrModalDescription}
            hideBrandTitle={this.config.hideBrandTitle}
            dynamicLink={this.config.dynamicLink}
          />
        );
      }
    }
  }

  render() {
    if (this.loading) {
      //TODO: Improve loading message
      return <div>Loading...</div>;
    }
    if (this.config) {
      this.selectQR();
      return this.qr;
    }
    //TODO: Improve error message
    return <div>Error loading your config...</div>;
  }
}
