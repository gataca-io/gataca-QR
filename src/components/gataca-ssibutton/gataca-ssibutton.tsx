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
import { DrawType } from "qr-code-styling";

const PHONE_ICON =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABsAAAAbCAYAAACN1PRVAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAHvSURBVHgB3ZZPTttAFMbfe3YjL7qYLopcpZXSG7Q3CDfIsqrSJpyg5QQtJ2h7glgUdVs4AeEE5AYEQSDAgtnw357Hm0hAQDaeIRFCfFKyeKPxzzPzvc+DUKCZN80GEv1ABgWOQgSdGbOwv7u0nDueV4zjTzUIKhuAZna4vdQFR828azbI0K/TI/qodaLvjlP+tLDGDCs+IKv9Lbsi7kcv0w9541Q0EREPYcoieEQ9KiyECRXHzbpBUOcnYTfPFOOaaGVx9WsLiDrSIp0iU0wFNgIx/AQyc9I/OmOjy+Y8aBvHQcDUYebewc6/Xtk8J5htcg5efEPGhk0JtqkyBjo7DuZcnuO2sqCyKv8rUDmfTS9IBURqBAL+I6CkzBjOMOs22TLY21n8fl17KzXR3uDvb/CQk0GEdfvN07QvpnAOaGfYaRT25JzU6+rnG2tTpcWAy+Cp0m3U/URLms8HWfg/rn6RFaGSs9KQkZMpvGBWNs2Vandt46ac6YNBuc0fDLMaOU5DFybQ8039p/KJ4bq4rwPewtqoM/1gsCm/NfBXvWjgHhhuDAeLyd3qVSifHQULeZkou9EqemLhmUmav8qrZ4GEMGA7ivzjKvfeqGptFV2YdWPMPHHq0cCh3DdpVdLl/XCY9J1gVvbCiWa6N+JLocPFjCsx9cAAAAAASUVORK5CYII=";

//Default values
const DEFAULT_SESSION_TIMEOUT = 300; //5mins as in connect
const DEFAULT_POLLING_FREQ = 3;

@Component({
  tag: "gataca-ssibutton",
  styleUrl: "gataca-ssibutton.scss",
  shadow: true,
})
export class GatacaSSIButton {
  qr: GatacaQR;

  private qrElement!: HTMLGatacaQrElement;

  constructor() {
    this.qr = (
      <gataca-qr
        ref={(el) => (this.qrElement = el as HTMLGatacaQrElement)}
        checkStatus={this.checkStatus}
        createSession={this.createSession}
        successCallback={this.successCallback}
        errorCallback={this.errorCallback}
        qrRole={this.qrRole}
        qrType={this.qrType}
        callbackServer={this.callbackServer}
        sessionTimeout={this.sessionTimeout}
        pollingFrequency={this.pollingFrequency}
        autostart={this.autostart}
        autorefresh={this.autorefresh}
        v={this.v}
        qrModalTitle={this.qrModalTitle}
        qrModalDescription={this.qrModalDescription}
        hideBrandTitle={this.hideBrandTitle}
        dynamicLink={this.dynamicLink}
        logoSize={this.logoSize}
        logoSrc={this.logoSrc}
        modalTitleColor={this.modalTitleColor}
        qrCodeExpiredLabel={this.qrCodeExpiredLabel}
        credentialsNotValidatedLabel={this.credentialsNotValidatedLabel}
        clickInsideBoxLabel={this.clickInsideBoxLabel}
        refreshQrLabel={this.refreshQrLabel}
        scanQrLabel={this.scanQrLabel}
        userNotScanInTimeErrorLabel={this.userNotScanInTimeErrorLabel}
        credsNotValidatedErrorLabel={this.credsNotValidatedErrorLabel}
        failedLoginErrorLabel={this.failedLoginErrorLabel}
        successLoginLabel={this.successLoginLabel}
        byBrandLabel={this.byBrandLabel}
        waitingStartSessionLabel={this.waitingStartSessionLabel}
        hideQrModalDescription={this.hideQrModalDescription}
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
   * _[Optional]_
   * Sets the qr type. It can be "svg" or "canvas". "svg" by default.
   */
  @Prop() qrType?: DrawType = "svg";

  /**
   * _[Optional]_
   * Set to start polling when button or QR is displayed. By default it is true
   */
  @Prop() autostart: boolean = true;

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
   * _[Optional]_
   * Function that runs every time the loading state changes while checking if the App is installed. Only on mobile with v3.
   */
  @Prop() handleCheckAppLoading?: (isCheckingApp?: boolean) => void = undefined;

  /**
   * _[Optional]_
   * Maximum time window to check if the App is installed
   */
  @Prop() checkAppTimeout?: number = 6;

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
   * Boolean to show or not show the gataca brand title
   */
  @Prop() hideBrandTitle?: boolean = false;

  /**
   * _[Optional]_
   * Display a link containing a dynamic link to invoke the wallet if closed
   */
  @Prop() dynamicLink?: boolean = true;

  /**
   * _[Optional]_
   * Size of the logo to display in percentage to the total size [0-1]. 0 means no logo will be displayed. Default is the GATACA logo. Recommended size is around 0.33
   */
  @Prop() logoSize?: number = 0;

  /**
   * _[Optional]_
   * Logo to display, just if the logo size is greater than 0. No logo is the GATACA logo.
   */
  @Prop() logoSrc?: string;

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
   * Boolean to show or not show the QR Modal description
   */
  @Prop() hideQrModalDescription?: boolean = false;

  @State() open: boolean = false;
  @State() sessionId?: string;
  @State() authenticationRequest?: string;
  @State() sessionData: any = undefined;
  @State() result: RESULT_STATUS = RESULT_STATUS.NOT_STARTED;

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

  async getSessionId(): Promise<string> {
    if (this.sessionId) {
      return this.sessionId;
    }
    let { sessionId, authenticationRequest } = await this.createSession();
    this.sessionId = sessionId;
    this.authenticationRequest = authenticationRequest;
    return this.sessionId;
  }

  /**
   * Force manually the start polling
   */
  @Method()
  async startMobilePolling(): Promise<void> {
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
          this.startMobilePolling();
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

  renderModal() {
    return this.qr;
  }

  async poll() {
    let endTime =
      new Date().getTime() +
      (this.sessionTimeout || DEFAULT_SESSION_TIMEOUT) * 1000;
    let interval = (this.pollingFrequency || DEFAULT_POLLING_FREQ) * 1000;
    let checkFunc = async (
      component: any
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

  isAppInstalled(appScheme, callback) {
    let timeout;
    let detected = false;

    if (appScheme?.length) {
      window.location.href = appScheme;
    }

    const waitTimeToCheckApp = this.checkAppTimeout * 1000;

    timeout = setTimeout(() => {
      if (!detected) {
        callback(false);
      }
      cleanup();
    }, waitTimeToCheckApp);

    const handleVisibilityChange = () => {
      if (document.hidden) {
        detected = true;
        callback(true);
        if (!this.autostart) {
          this.startMobilePolling();
        }
        cleanup();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    function cleanup() {
      clearTimeout(timeout);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    }
  }

  renderDesktopButton() {
    return (
      <div class="gatacaButtonWrapper">
        <button
          class="gatacaButton"
          onClick={() => {
            this.open = !this.open;

            setTimeout(() => {
              if (this.open) {
                this.qrElement?.display();
              } else {
                this.qrElement?.stop();
              }
            }, 0);
          }}
        >
          <img src={PHONE_ICON} class="buttonImg" alt={this.buttonText} />
          <span>{this.buttonText}</span>
        </button>
      </div>
    );
  }

  async getAuthRequest(): Promise<string> {
    let { authenticationRequest } = await this.createSession();

    return authenticationRequest;
  }

  renderMobileButton(isAndroid: boolean, isIos: boolean) {
    if (this.autostart) {
      this.startMobilePolling();
    }

    let loading = false;

    const handleLoading = (isLoading: boolean) => {
      loading = isLoading;
      if (this.handleCheckAppLoading) {
        this.handleCheckAppLoading(isLoading);
      }
    };

    const executeRedirection = async () => {
      handleLoading(true);

      const androidStoreLink =
        "https://play.google.com/store/apps/details?id=com.gataca.identity";
      const iosStoreLink = "https://apps.apple.com/us/app/gataca/id1498607616";

      try {
        const appScheme = await this.getAuthRequest();

        this.isAppInstalled(appScheme, (installed) => {
          if (!installed) {
            this.stop();
            if (isAndroid) {
              window.location.href = androidStoreLink;
            } else if (isIos) {
              window.location.href = iosStoreLink;
            }
          }
          handleLoading(false);
        });
      } catch (error) {
        this.stop();
        handleLoading(false);
      }
    };

    return (
      <div class="gatacaButtonWrapper">
        <button
          class="gatacaButton"
          onClick={() => {
            executeRedirection();
          }}
          disabled={loading}
        >
          <img src={PHONE_ICON} class="buttonImg" alt={this.buttonText} />
          <span>{this.buttonText}</span>
        </button>
      </div>
    );
  }

  render() {
    const userAgent =
      // @ts-ignore
      navigator?.userAgent || navigator?.vendor || window?.opera;
    const isAndroid = /android/i.test(userAgent);
    const isIos =
      // @ts-ignore
      (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    const isMobile = isAndroid || isIos;

    return (
      <div class="buttonContainer">
        {isMobile && this.v === "3"
          ? this.renderMobileButton(isAndroid, isIos)
          : this.renderDesktopButton()}
        {this.open && (!isMobile || this.v === "3") && this.renderModal()}
      </div>
    );
  }
}
