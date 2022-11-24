import {
  Component,
  Event,
  EventEmitter,
  h,
  Method,
  Prop,
  State,
} from "@stencil/core";
import "../gataca-qrdisplay/gataca-qrdisplay";

import { RESULT_STATUS } from "../../utils/utils";
import { GatacaQR } from "../gataca-qr/gataca-qr";

const PHONE_ICON =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABsAAAAbCAYAAACN1PRVAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAHvSURBVHgB3ZZPTttAFMbfe3YjL7qYLopcpZXSG7Q3CDfIsqrSJpyg5QQtJ2h7glgUdVs4AeEE5AYEQSDAgtnw357Hm0hAQDaeIRFCfFKyeKPxzzPzvc+DUKCZN80GEv1ABgWOQgSdGbOwv7u0nDueV4zjTzUIKhuAZna4vdQFR828azbI0K/TI/qodaLvjlP+tLDGDCs+IKv9Lbsi7kcv0w9541Q0EREPYcoieEQ9KiyECRXHzbpBUOcnYTfPFOOaaGVx9WsLiDrSIp0iU0wFNgIx/AQyc9I/OmOjy+Y8aBvHQcDUYebewc6/Xtk8J5htcg5efEPGhk0JtqkyBjo7DuZcnuO2sqCyKv8rUDmfTS9IBURqBAL+I6CkzBjOMOs22TLY21n8fl17KzXR3uDvb/CQk0GEdfvN07QvpnAOaGfYaRT25JzU6+rnG2tTpcWAy+Cp0m3U/URLms8HWfg/rn6RFaGSs9KQkZMpvGBWNs2Vandt46ac6YNBuc0fDLMaOU5DFybQ8039p/KJ4bq4rwPewtqoM/1gsCm/NfBXvWjgHhhuDAeLyd3qVSifHQULeZkou9EqemLhmUmav8qrZ4GEMGA7ivzjKvfeqGptFV2YdWPMPHHq0cCh3DdpVdLl/XCY9J1gVvbCiWa6N+JLocPFjCsx9cAAAAAASUVORK5CYII=";

@Component({
  tag: "gataca-ssibutton",
  styleUrl: "gataca-ssibutton.scss",
  shadow: true,
})
export class GatacaSSIButton {
  qr: GatacaQR;

  constructor() {
    this.qr = (
      <gataca-qr
        checkStatus={this.checkStatus}
        createSession={this.createSession}
        successCallback={this.successCallback}
        errorCallback={this.errorCallback}
        qrRole={this.qrRole}
        callbackServer={this.callbackServer}
        sessionTimeout={this.sessionTimeout}
        pollingFrequency={this.pollingFrequency}
        autostart={true}
        autorefresh={this.autorefresh}
        v2={this.v2}
        qrModalTitle={this.qrModalTitle}
        qrModalDescription={this.qrModalDescription}
        hideBrandTitle={this.hideBrandTitle}
        dynamicLink={this.dynamicLink}
      />
    );
  }

  /**
   * _[Optional]_
   * In the case of being a button, modifies its text
   */
  @Prop() buttonText?: string = "Easy login";

  //PROPERTIES INHERITED BY GATACA QR

  /**
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
   * ***Mandatory***
   * Callback fired upon session correctly verified
   * If not set, session validation wouldn't trigger any action
   * The session data and a possible token will be sent as parameters to the callback
   */
  @Prop() successCallback: (data?: any) => void = undefined;

  /**
   * ***Mandatory***
   * Callback fired upon session expired or invalid
   * If not set, session error would not be handled
   * An error containing information will be passed as parameter
   */
  @Prop() errorCallback: (error?: Error) => void = undefined;

  /**
   * ***Mandatory***
   * Decide if scanning the credential as a verifier to request credentials
   * or as an issuer too issue credentials.
   * Options: connect | certify
   */
  @Prop() qrRole: string;

  /**
   * ***Mandatory just for V1***
   * Connect/Certify Server where the wallet will send the data
   */
  @Prop() callbackServer: string;

  /**
   * _[Optional]_
   * Maximum time window to display the session
   */
  @Prop() sessionTimeout?: number;

  /**
   * _[Optional]_
   * Frequency in seconds to check if the session has been validated
   */
  @Prop() pollingFrequency?: number;

  /**
   * _[Optional]_
   * Set to refresh the session automatically upon expiration. By default it is false
   */
  @Prop() autorefresh: boolean = false;

  /**
   * _[Optional]_
   * Set to use v2 links. The create session must be providing both an authentication request and a session Id
   */
  @Prop() v2?: boolean = false;

  /**
   * _[Optional]_
   * Modifies the qr headline title
   */
  @Prop() qrModalTitle?: string = "Quick Access";

  /**
   * _[Optional]_
   * Modifies the Modal description
   */
  @Prop() qrModalDescription?: string =
    "Sign up or sign in by scanning the QR Code with the Gataca Wallet";

  /**
   * _[Optional]_
   * Boolean to show or not show the gataca brand title
   */
  @Prop() hideBrandTitle?: boolean = false;

  /**
   * _[Optional]_
   * Display a link containing a dynamic link to invoke the wallet if closed
   */
  @Prop() dynamicLink?: boolean = true;

  @State() open: boolean = false;

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

  renderModal() {
    return this.qr;
  }

  renderButton() {
    return (
      <div class="gatacaButtonWrapper">
        <button
          class="gatacaButton"
          onClick={() => {
            this.open = !this.open;
            if (this.open) {
              this.qr.display();
            } else {
              this.qr.stop();
            }
          }}
        >
          <img src={PHONE_ICON} class="buttonImg" alt={this.buttonText} />
          <span>{this.buttonText}</span>
        </button>
      </div>
    );
  }

  render() {
    return (
      <div class="buttonContainer">
        {this.renderButton()}
        {this.open && this.renderModal()}
      </div>
    );
  }
}
