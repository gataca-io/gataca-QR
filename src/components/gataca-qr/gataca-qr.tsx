import {
  Component,
  Event,
  EventEmitter,
  h,
  Method,
  Prop,
  State,
} from "@stencil/core";
import alertIcon from "../../assets/icons/gat-icon-alert.svg";
import successIcon from "../../assets/icons/gat-icon-check.svg";
import refreshIcon from "../../assets/icons/gat-icon-refresh.svg";
import logoGataca from "../../assets/images/logo_gataca.svg";
import "../gataca-qrdisplay/gataca-qrdisplay";

import { base64UrlEncode, checkMobile, RESULT_STATUS } from "../../utils/utils";

const DEEP_LINK_PREFIX =
  "https://gataca.page.link/?apn=com.gatacaapp&ibi=com.gataca.wallet&link=";

//Default values
const DEFAULT_SESSION_TIMEOUT = 300; //5mins as in connect
const DEFAULT_POLLING_FREQ = 3;
const QR_ROLE_CONNECT = "connect";

const FUNCTION_ROLES = {
  connect: "scan",
  certify: "credential",
};

@Component({
  tag: "gataca-qr",
  styleUrl: "gataca-qr.scss",
  shadow: true,
})
export class GatacaQR {
  constructor() {}

  disconnectedCallback() {
    this.stop();
  }

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
   * Set to enable autoload when the QR is displayed. By default it is true
   */
  @Prop() autostart: boolean = true;

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
   * Maximum time window to display the session
   */
  @Prop() sessionTimeout?: number = DEFAULT_SESSION_TIMEOUT;

  /**
   * _[Optional]_
   * Frequency in seconds to check if the session has been validated
   */
  @Prop() pollingFrequency?: number = DEFAULT_POLLING_FREQ;

  /**
   * _[Optional]_
   * Display a link containing a dynamic link to invoke the wallet if closed
   */
  @Prop() dynamicLink?: boolean = true;

  @State() sessionId?: string;
  @State() authenticationRequest?: string;
  @State() sessionData: any = undefined;
  @State() result: RESULT_STATUS = RESULT_STATUS.NOT_STARTED;

  async componentDidLoad() {
    if (this.autostart) {
      await this.display();
    }
  }

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
   * Force manually the display of a QR
   */
  @Method()
  async display(): Promise<void> {
    await this.getSessionId();
    this.result = RESULT_STATUS.ONGOING;
    this.poll()
      .then((data: any) => {
        this.result = RESULT_STATUS.SUCCESS;
        this.sessionData = data;
        this.gatacaLoginCompleted.emit(data);
        this.successCallback(data);
      })
      .catch((err: RESULT_STATUS) => {
        this.clean();
        let expired = err === RESULT_STATUS.EXPIRED;
        if (expired && this.autorefresh) {
          this.display();
        } else {
          if (err !== RESULT_STATUS.NOT_STARTED) {
            let error = expired
              ? new Error("User did not scan the QR in the alloted time")
              : new Error("Provided user credentials couldn't be validated");
            this.result = err;
            this.gatacaLoginFailed.emit(error);
            this.errorCallback(error);
          }
        }
      });
    if (checkMobile() && this.dynamicLink) {
      window.location.href = this.getLink();
    }
  }

  /**
   * Stop manually an ongoing session
   */
  @Method()
  async stop(): Promise<void> {
    this.clean();
    if (this.result === RESULT_STATUS.ONGOING) {
      this.result = RESULT_STATUS.NOT_STARTED;
    }
  }

  clean(): void {
    this.sessionData = undefined;
    this.sessionId = undefined;
  }

  /**
   * Retrieve manually the session data on a successful login
   */
  @Method()
  async getSessionData() {
    return this.sessionData
      ? Promise.resolve(this.sessionData)
      : Promise.reject(new Error("No successful login"));
  }

  async getSessionId(): Promise<string> {
    if (this.sessionId) {
      return this.sessionId;
    }
    let { sessionId, authenticationRequest } = await this.createSession();
    this.sessionId = sessionId;
    this.authenticationRequest = authenticationRequest;
    return this.sessionId;
  }

  getLink(): string {
    if (this.v2 && this.qrRole == QR_ROLE_CONNECT) {
      return this.authenticationRequest;
    }
    let op = FUNCTION_ROLES[this.qrRole];
    let link = "https://gataca.page.link/" + op + "?";
    link +=
      this.qrRole === QR_ROLE_CONNECT
        ? "session=" + this.sessionId
        : "process=" + this.sessionId;
    link +=
      "&callback=" + base64UrlEncode(encodeURIComponent(this.callbackServer));
    link = encodeURIComponent(link);
    return this.dynamicLink ? DEEP_LINK_PREFIX + link : link;
  }

  async poll() {
    let endTime =
      new Date().getTime() +
      (this.sessionTimeout || DEFAULT_SESSION_TIMEOUT) * 1000;
    let interval = (this.pollingFrequency || DEFAULT_POLLING_FREQ) * 1000;
    let checkFunc = async (
      component: GatacaQR
    ): Promise<{ result: RESULT_STATUS; data?: any }> => {
      if (component.result === RESULT_STATUS.NOT_STARTED) {
        return { result: RESULT_STATUS.NOT_STARTED };
      }
      let id = await component.getSessionId();
      return component.checkStatus(id);
    };
    let component = this;
    let checkCondition = async function (resolve, reject) {
      // If the condition is met, we're done!
      let { result, data } = await checkFunc(component);
      switch (result) {
        case RESULT_STATUS.SUCCESS:
          resolve(data);
          break;
        case RESULT_STATUS.ONGOING:
          if (component.sessionTimeout > 0 && new Date().getTime() < endTime) {
            setTimeout(checkCondition, interval, resolve, reject);
          } else {
            reject(RESULT_STATUS.EXPIRED);
          }
          break;
        default:
          reject(result);
          break;
      }
    };
    return new Promise(checkCondition);
  }

  renderQRSection() {
    switch (this.result) {
      case RESULT_STATUS.NOT_STARTED:
        return this.renderRetryButton();
      case RESULT_STATUS.ONGOING:
        return this.renderQR(this.getLink(), 300, true);
      case RESULT_STATUS.EXPIRED:
        return this.renderRetryButton("QR Code expired");
      case RESULT_STATUS.FAILED:
        return this.renderRetryButton("User credentials not validated");
      case RESULT_STATUS.SUCCESS:
        return this.renderSuccess();
    }
  }

  renderSuccess() {
    return (
      <div class="success">
        <img src={successIcon} height={52} width={52}></img>
        <p class="successMsg">Successful Connection!</p>
      </div>
    );
  }

  renderRetryButton(errorMessage?: string) {
    return (
      <div class="reload">
        <div id="notify" onClick={() => this.display()}>
          <img src={refreshIcon} height={24} width={24} />
          <p class="qrDescription">Click inside the box to </p>
          {errorMessage ? (
            <p class="qrDescription bold">Refresh QR Code</p>
          ) : (
            <p class="qrDescription bold">Scan QR Code</p>
          )}
          {errorMessage && (
            <div class="alert">
              <img src={alertIcon} height={24} width={24}></img>
              <p>{errorMessage}</p>
            </div>
          )}
        </div>
        <div id="qrwait">
          {this.renderQR("waiting to start a session", 250)}
        </div>
      </div>
    );
  }

  renderQR(value: string, size: number, useLogo?: boolean) {
    return (
      <gataca-qrdisplay
        qrData={value}
        rounded={true}
        size={size}
        logo-size={useLogo ? 0.33 : 0}
      />
    );
  }

  render() {
    return (
      <div class="popUpContainer">
        <div
          class={"modal-window is-visible"}
          onClick={(event) => {
            event.stopPropagation();
          }}
        >
          <div class="modal-window__content">
            <div class="qrTitleContainer">
              <p class="qrTitle">{this.qrModalTitle}</p>
              {!this.hideBrandTitle && (
                <p class="qrBrand">
                  by Gataca{" "}
                  <span>
                    <img src={logoGataca} />
                  </span>
                </p>
              )}
              {this.result !== RESULT_STATUS.SUCCESS && (
                <p class="qrDescription">{this.qrModalDescription}</p>
              )}
            </div>
            <div class="qrSection">{this.renderQRSection()}</div>
          </div>
        </div>
      </div>
    );
  }
}
