import {
  Component,
  Event,
  EventEmitter,
  h,
  Listen,
  Method,
  Prop,
  State,
} from "@stencil/core";
import alertIcon from "../../assets/icons/gat-icon-alert.svg";
import successIcon from "../../assets/icons/gat-icon-check.svg";
import refreshIcon from "../../assets/icons/gat-icon-refresh.svg";
import logoGataca from "../../assets/images/logo_gataca.svg";
import "../gataca-qrdisplay/gataca-qrdisplay";

import {
  base64UrlEncode,
  checkMobile,
  RESULT_STATUS,
  WSResponse,
} from "../../utils/utils";

const DEEP_LINK_PREFIX =
  "https://gataca.page.link/?apn=com.gatacaapp&ibi=com.gataca.wallet&link=";
const DEFAULT_SESSION_TIMEOUT = 300;
const QR_ROLE_CONNECT = "connect";

const FUNCTION_ROLES = {
  connect: "scan",
  certify: "credential",
};

@Component({
  tag: "gataca-qrws",
  styleUrl: "gataca-qrws.scss",
  shadow: true,
})
export class GatacaQRWS {
  constructor() {}

  disconnectedCallback() {
    this.stop();
  }

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
   * ***Mandatory***
   * WS Endpoint on your service to be invoked upon display
   */
  @Prop() socketEndpoint: string;

  /**
   * ***Mandatory***
   * Maximum time window to display the session and keep the websocket connection. It's needed to ensure the socket is closed.
   */
  @Prop() sessionTimeout?: number = DEFAULT_SESSION_TIMEOUT;

  /**
   * [Optional]
   * Function to send a message to the server upon socket creation
   */
  @Prop() wsOnOpen: (socket: WebSocket) => void;

  /**
   * **RECOMMENDED**
   * Callback to invoke an a message has been received on the socket. It provides the socket itself and the message as parameters.
   * If not used, the messages provided by the server on the Socket connection must conform to the WSReponse interface
   * If used, an Event named **sessionMsg** must be triggered with a WSReponse as data
   */
  @Prop() wsOnMessage: (socket: WebSocket, msg: MessageEvent) => void;

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
   * **RECOMMENDED**
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

  socket: WebSocket;

  /**
   * Force manually the display of a QR
   */
  @Method()
  async display(): Promise<void> {
    let socket = new WebSocket(this.socketEndpoint);
    setTimeout(() => {
      this.socket.close(1000, "");
    }, 1000 * this.sessionTimeout);
    this.socket = socket;

    socket.onopen = () => {
      if (this.wsOnOpen) this.wsOnOpen(this.socket);
    };

    socket.onmessage = (msg: MessageEvent) => {
      if (this.wsOnMessage) {
        this.wsOnMessage(this.socket, msg);
      } else {
        let wsresp = JSON.parse(msg.data) as WSResponse;
        if (!!wsresp.sessionId) {
          this.handleWSResponse(wsresp);
        }
      }
    };

    socket.onerror = () => {
      let error = new Error("Error connecting with server");
      this.result = RESULT_STATUS.FAILED;
      this.gatacaLoginFailed.emit(error);
      this.errorCallback(error);
      socket.close(1000, "");
    };

    socket.onclose = () => {
      if (this.result === RESULT_STATUS.ONGOING) {
        this.result = RESULT_STATUS.EXPIRED;
      }
      if (this.result === RESULT_STATUS.EXPIRED) {
        if (this.autorefresh) {
          this.display();
        } else {
          let error = new Error("User did not scan the QR in the alloted time");
          this.gatacaLoginFailed.emit(error);
          this.errorCallback(error);
        }
      }
    };

    if (checkMobile() && this.dynamicLink) {
      window.location.href = this.getLink();
    }
  }

  @Listen("sessionMsg", { capture: true })
  sessionMsgReceived(event: CustomEvent<WSResponse>) {
    let wsresp: WSResponse = event.detail;
    this.handleWSResponse(wsresp);
  }

  handleWSResponse(wsresp: WSResponse) {
    this.result = wsresp.result;
    switch (wsresp.result) {
      case RESULT_STATUS.ONGOING:
        this.sessionId = wsresp.sessionId;
        this.authenticationRequest = wsresp.authenticationRequest;
        break;
      case RESULT_STATUS.SUCCESS:
        this.sessionData = wsresp.authenticatedUserData;
        this.gatacaLoginCompleted.emit(wsresp.authenticatedUserData);
        this.successCallback(wsresp.authenticatedUserData);
        this.socket.close(1000, "");
        break;
      case RESULT_STATUS.FAILED:
        this.socket.close();
        let error = new Error(
          "Provided user credentials couldn't be validated"
        );
        this.gatacaLoginFailed.emit(error);
        this.errorCallback(error);
        break;
      case RESULT_STATUS.EXPIRED:
        this.socket.close();
        if (this.autorefresh) {
          this.display();
        } else {
          let error = new Error("User did not scan the QR in the alloted time");
          this.gatacaLoginFailed.emit(error);
          this.errorCallback(error);
        }
    }
  }

  /**
   * Stop manually an ongoing session
   */
  @Method()
  async stop(): Promise<void> {
    this.sessionData = undefined;
    this.sessionId = undefined;
    this.socket.close(1000, "Client stopped the connection");
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
