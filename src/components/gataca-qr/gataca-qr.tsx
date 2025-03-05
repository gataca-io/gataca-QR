import {
  Component,
  Event,
  EventEmitter,
  h,
  Method,
  Prop,
  State,
} from "@stencil/core";
import logoGataca from "../../assets/images/logo_gataca.svg";
import "../gataca-qrdisplay/gataca-qrdisplay";
import { base64UrlEncode, checkMobile, RESULT_STATUS } from "../../utils/utils";
import { Success } from "./components/success/Success";
import { RetryButton } from "./components/retryButton/RetryButton";
import { ReadQR } from "./components/readQR/ReadQR";
import { QR } from "./components/qr/QR";

const DEEP_LINK_PREFIX = "https://api.gataca.io/qr/redirect.html";

//Default values
const DEFAULT_SESSION_TIMEOUT = 300; //5mins as in connect
const DEFAULT_POLLING_FREQ = 3;

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
   * Using v="3", it can provide just a session Id
   * Using another version, it must provide also the authentication request. The session Id is the id of the presentation definition
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
   * ***Mandatory just for V1***
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
   * If 3, handle deeplink redirects and deprecates (remove) v1 functionality. If not, the create session must be providing both an authentication request and a session Id
   */
  @Prop() v?: string = "3";

  /**
   * _[Optional]_
   * Modifies the qr headline title
   */
  @Prop() qrModalTitle?: string = "Quick Access";

  /**
   * _[Optional]_
   * String to set Modal title color
   */
  @Prop() modalTitleColor?: string = "#4745B7";

  /**
   * _[Optional]_
   * Modifies the Modal description
   */
  @Prop() qrModalDescription?: string =
    "Sign up or sign in by scanning the QR Code with the Gataca Wallet";

  /**
   * _[Optional]_
   * Boolean to show or not show the modal title, brandTitle and description
   */
  @Prop() hideModalTexts?: boolean = false;

  /**
   * _[Optional]_
   * Boolean to show or not show the modal title, brandTitle and description
   */
  @Prop() hideModalBoxShadow?: boolean = false;

  /**
   * _[Optional]_
   * Boolean to show or not show the gataca brand title
   */
  @Prop() hideBrandTitle?: boolean = false;

  /**
   * _[Optional]_
   * Size of the logo to display in percentage to the total size [0-1]. 0 means no logo will be displayed. Default is the GATACA logo. Recommended size is around 0.33
   */
  @Prop() logoSize?: number = 0;

  /**
   * _[Optional]_
   * Logo to display, just if the logo size is greater than 0. No logo is the GATACA logo.
   */
  @Prop() logoSrc?: string = logoGataca;

  /**
   * _[Optional]_
   * Size of QR Displayed
   */
  @Prop() qrSize?: number = 300;

  /**
   * _[Optional]_
   * Width of the modal
   */
  @Prop() modalWidth?: number = 300;

  /**
   * _[Optional]_
   * Height of the modal
   */
  @Prop() modalHeight?: number;

  /**
   * _[Optional]_
   * String to show when qr code expired
   */
  @Prop() qrCodeExpiredLabel?: string = "QR Code expired";

  /**
   * _[Optional]_
   * String to show when credentials not validatedd
   */
  @Prop() credentialsNotValidatedLabel?: string =
    "User credentials not validated";

  /**
   * _[Optional]_
   * String to show "click inside" label
   */
  @Prop() clickInsideBoxLabel?: string = "Click inside the box to";

  /**
   * _[Optional]_
   * String to show "refresh QR" label
   */
  @Prop() refreshQrLabel?: string = "Refresh QR Code";

  /**
   * _[Optional]_
   * String to show "scan QR" label
   */
  @Prop() scanQrLabel?: string = "Scan QR Code";

  /**
   * _[Optional]_
   * String to show "user not scan in time" error
   */
  @Prop() userNotScanInTimeErrorLabel?: string =
    "User did not scan the QR in the allowed time";

  /**
   * _[Optional]_
   * String to show "provided credentials not validates" error
   */
  @Prop() credsNotValidatedErrorLabel?: string =
    "Provided user credentials couldn't be validated";

  /**
   * _[Optional]_
   * String to show "failed login" error
   */
  @Prop() failedLoginErrorLabel?: string = "No successful login";

  /**
   * _[Optional]_
   * String to show "successful login" label
   */
  @Prop() successLoginLabel?: string = "Successful Connection!";

  /**
   * _[Optional]_
   * String to show "by brand" label
   */
  @Prop() byBrandLabel?: string = "by Gataca";

  /**
   * _[Optional]_
   * String to show "waiting start session" label
   */
  @Prop() waitingStartSessionLabel?: string = "waiting to start a session";

  /**
   * _[Optional]_
   * String title to show when QR already read
   */
  @Prop() readQrTitle?: string = "Processing...";

  /**
   * _[Optional]_
   * String description to show when QR already read
   */
  @Prop() readQrDescription?: string = "Please wait a moment";

  /**
   * _[Optional]_
   * Boolean to show or not show the QR Modal description
   */
  @Prop() hideQrModalDescription?: boolean = false;

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
              ? new Error(this.userNotScanInTimeErrorLabel)
              : new Error(this.credsNotValidatedErrorLabel);
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
    if (this.result === RESULT_STATUS.ONGOING || RESULT_STATUS.READ) {
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
      : Promise.reject(new Error(this.failedLoginErrorLabel));
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
    if (this.v === "2") {
      return this.authenticationRequest;
    }
    const authRequestEncoded =
      "?dl=" + base64UrlEncode(this.authenticationRequest);

    return DEEP_LINK_PREFIX + authRequestEncoded;
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
        case RESULT_STATUS.READ:
          component.result = RESULT_STATUS.READ;
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
        return this.renderQR(this.getLink(), true);
      case RESULT_STATUS.EXPIRED:
        return this.renderRetryButton(this.qrCodeExpiredLabel);
      case RESULT_STATUS.FAILED:
        return this.renderRetryButton(this.credentialsNotValidatedLabel);
      case RESULT_STATUS.SUCCESS:
        return this.renderSuccess();
      case RESULT_STATUS.READ:
        return this.renderReadQR({
          title: this?.readQrTitle,
          description: this?.readQrDescription,
        });
    }
  }

  renderSuccess() {
    return (
      <Success
        modalHeight={this?.modalHeight}
        successLoginLabel={this?.successLoginLabel}
      />
    );
  }

  renderRetryButton(errorMessage?: string) {
    return (
      <RetryButton
        errorMessage={errorMessage}
        modalWidth={this?.modalWidth}
        clickInsideBoxLabel={this?.clickInsideBoxLabel}
        refreshQrLabel={this?.refreshQrLabel}
        scanQrLabel={this?.scanQrLabel}
        waitingStartSessionLabel={this?.waitingStartSessionLabel}
        display={this.display.bind(this)}
        renderRetryQR={this.renderRetryQR.bind(this)}
      />
    );
  }

  renderReadQR(readQrMessages?: { title; description }) {
    return (
      <ReadQR
        modalWidth={this?.modalWidth}
        readQrMessages={readQrMessages}
        url={this.getLink()}
        sizeQR={this?.qrSize ? this?.qrSize - 50 : undefined}
        renderQR={this.renderQR}
      />
    );
  }

  renderQR(value: string, useLogo?: boolean) {
    return (
      <QR
        value={value}
        useLogo={useLogo}
        size={this?.qrSize || undefined}
        logoSrc={this?.logoSrc}
      />
    );
  }

  renderRetryQR(value: string, useLogo?: boolean) {
    return (
      <QR
        value={value}
        useLogo={useLogo}
        size={this?.qrSize ? this?.qrSize - 50 : undefined}
        logoSrc={this?.logoSrc}
      />
    );
  }

  render() {
    return (
      <div class="popUpContainer">
        <div
          class={`is-visible modal-window ${
            this.hideModalTexts ? "" : "large-modal"
          } ${this.hideModalBoxShadow ? "noBoxShadow" : ""}`}
          style={{
            width: (this.modalWidth - 2).toString() + "px",
            height: this.modalHeight
              ? (this.modalHeight - 2)?.toString() + "px"
              : "",
          }}
          onClick={(event) => {
            event.stopPropagation();
          }}
        >
          <div class="modal-window__content">
            <div
              class={`qrTitleContainer ${
                this.hideModalTexts ? "hidenText" : ""
              }`}
            >
              <p
                class="qrTitle modalText"
                style={{ color: this.modalTitleColor || "#1e1e20" }}
              >
                {this.qrModalTitle}
              </p>
              {!this.hideBrandTitle && (
                <p class="qrBrand modalText">
                  {this.byBrandLabel}{" "}
                  <span>
                    <img src={logoGataca} />
                  </span>
                </p>
              )}
              {this.result !== RESULT_STATUS.SUCCESS &&
                !this.hideQrModalDescription && (
                  <p class="qrDescription modalText">
                    {this.qrModalDescription}
                  </p>
                )}
            </div>
            <div
              class="qrSection"
              style={{
                width: this.modalWidth.toString() + "px",
                height: this.modalWidth
                  ? this.modalWidth?.toString() + "px"
                  : "",
              }}
            >
              {this.renderQRSection()}
            </div>
          </div>
        </div>
      </div>
    );
  }
}
