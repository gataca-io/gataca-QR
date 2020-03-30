import { Component, Prop, h, State, getAssetPath, Method } from '@stencil/core';
import qrcode from 'qrcode-generator';

import {checkMobile, base64UrlEncode, RESULT_STATUS} from '../../utils/utils';


const DEEP_LINK_PREFIX = "https://gataca.page.link/?apn=com.gatacaapp&ibi=com.gataca.wallet&link="

//Default values
const DEFAULT_SESSION_TIMEOUT = 180 //3mins
const DEFAULT_POLLING_FREQ = 3 // 3 s
const DEFAULT_CALLBACK_SERVER = "https://connect.gatacaid.com:9090" // Gataca Connect SaaS
const DEFAULT_SESSION_ENDPOINT = "https://" + window.location.hostname + ":9090/admin/v1/login/gataca" // Should never be used, but will be matching the examples provided
const DEFAULT_GENERATION_ENDPOINT = "https://" + window.location.hostname + ":9090/admin/v1/login/request" // Should never be used, but will be matching the examples provided

@Component({
  tag: 'gataca-qr',
  styleUrl: 'gataca-qr.css',
  shadow: true,
  assetsDirs: ['assets']
})
export class GatacaQR {
  /**
  * ***Mandatory***
  * Callback fired upon session correctly verified
  * If not set, session validation wouldn't trigger any action
  * The session data and a possible token will be sent as parameters to the callback
  */
  @Prop() successCallback: (data ?:any, token ?:string) => void = undefined;

  /**
  * ***Mandatory***
  * Callback fired upon session expired or invalid
  * If not set, session error would not be handled
  * An error containing information will be passed as parameter
  */
  @Prop() errorCallback: (error ?:Error) => void = undefined;

  /**
  * ***Mandatory***
  * Connect Server where the wallet will send the data
  */
  @Prop() callbackServer: string = DEFAULT_CALLBACK_SERVER;

  /**
  * _[Optional]_
  * Check status function to query the current status of the session
  * If not set, it would fallback to the session Endpoint property.
  */
  @Prop() checkStatus?: (id ?: string) => Promise<RESULT_STATUS> = undefined;

  /**
  * _[Optional]_
  * EndpointURL to fetch data for the status. The endpoint URL will send a GET request with the session id on a parameter; concatenated to this string.
  * It can be used if your API fulfills the requirement. If not, use the checkStatus property.
  * If not set, it would use a default endpoint to the same window URL under the path /auth
  */
  @Prop() sessionEndpoint?: string = DEFAULT_SESSION_ENDPOINT;

  /**
   * _[Optional]_
   * Generated session Id, which is required. Without session Id, the QR will not work.
   * If the property is unset, it will check for an _id_ or _sessionId_ query parameter on the current URL.
   * If there is no sessionId, it will fallback to the createSession method to generate a new Session.
   */
  @Prop() sessionId?: string = undefined;

  /**
   * _[Optional]_
   * Create session function to generate a new Session
   * If the property is unset, it will fallback to the generation Endpoint property.
   */
  @Prop() createSession?: () => Promise<string> = undefined;

  /**
   * _[Optional]_
   * Session Generation URL to create a new Session.
   * It will expect to receive the session Id from the response header 'X-Connect-Id'.
   * If not set, it would use a default endpoint to the same window URL under the path /auth
   */
  @Prop() generationEndpoint?: string = DEFAULT_GENERATION_ENDPOINT;

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

  
  @State() open: boolean = false;

  @State() loaded: boolean = false;

  @State() connectToken :string =undefined;

  @State() loginToken :string = undefined;
  @State() sessionData :any = undefined;

  /**
   * Force manually the display of a QR
   */
  @Method()
  async display() :Promise<void>{
    await this.getSessionId();
    this.poll().then((data :any) => {this.successCallback(data, this.loginToken)})
                .catch((error :Error) => this.errorCallback(error));
    if (checkMobile() && this.dynamicLink) {
      window.location.href = this.getLink();
    } else {
      this.open = true;
    }
  }

  /**
   * Stop manually an ongoing session
   */
  @Method()
  async stop() :Promise<void>{
    this.open = false;
    this.loginToken = null;
    this.sessionData = null;
    if (this.loaded){
      this.sessionId = null;
    }
  }

  /**
   * Retrieve manually a possible token retrieved upon login on the Header 'token'
   */
  @Method()
  async getToken() {
    return this.loginToken ? Promise.resolve(this.loginToken) : Promise.reject(new Error("No successful login"))
  }

  /**
   * Retrieve manually the session data on a successful login
   */
  @Method()
  async getSessionData() {
    return this.sessionData ? Promise.resolve(this.sessionData) : Promise.reject(new Error("No successful login"))
  }

  async getSessionId(): Promise<string> {
    if (this.sessionId){
      return this.sessionId
    }
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id') || urlParams.get('sessionId');
    if (id) {
      this.sessionId = id;
      return id
    }
    this.loaded = true;
    if (this.createSession){
      this.sessionId = await this.createSession()
      return this.sessionId
    }
    this.sessionId = await this.createSessionDefault()
    return this.sessionId;
  }


  getLink(): string{
    let link = 'https://gataca.page.link/scan?';
    link += "session=" + this.sessionId + "&callback=" + base64UrlEncode(encodeURIComponent(this.callbackServer));
    link = encodeURIComponent(link);
    return this.dynamicLink ? DEEP_LINK_PREFIX + link : link;
  }

  renderButton() {
    return <button class="gatacaButton" onClick={(_) => this.display()}><img src={getAssetPath('assets/gatacaLogo.png')} class="buttonImg" /> Log in with Gataca</button>;
  }

  async checkSessionDefault(id: string): Promise<RESULT_STATUS> {
    let endpoint = this.sessionEndpoint || DEFAULT_SESSION_ENDPOINT;
    let response = await fetch(
      endpoint,
      {
          method: "POST",
          headers: {
              'Content-Type': 'application/json',
              'session_id' : id,
              'connect_token': this.connectToken,
              'tenant': 'Admin',
          },
          body: "{}"
      }
    );
    switch (response.status){
      case 200:
        this.loginToken = response.headers.get("token");
        this.sessionData = (await response.json()).data;
        return RESULT_STATUS.SUCCESS;
      case 428:
        return RESULT_STATUS.ONGOING;
      default:
        return RESULT_STATUS.FAILED
    } 
  }

  async createSessionDefault(): Promise< string>{
    let endpoint = this.generationEndpoint || DEFAULT_GENERATION_ENDPOINT;
    let response = await fetch(endpoint);
    let data = await response.json();
    this.connectToken = data.connect_token;
    console.log("ConnectToken", "SET", this.connectToken, "EXPECTED", data.connect_token)
    return data.session_id
  }

  async poll(){
    let endTime = new Date().getTime() + (this.sessionTimeout || DEFAULT_SESSION_TIMEOUT) * 1000;
    let interval = (this.pollingFrequency || DEFAULT_POLLING_FREQ) * 1000;
    let checkFunc = async (component: GatacaQR): Promise<RESULT_STATUS> => {
      let id = await component.getSessionId();
      return component.checkStatus ? component.checkStatus(id) : component.checkSessionDefault(id);
    }
    let component = this;
    let checkCondition = async function (resolve, reject) {
      // If the condition is met, we're done! 
      let result = await checkFunc(component);
      console.log("Checking condition: ", result)
      if (result === RESULT_STATUS.SUCCESS) {
        console.log("Resolve")
        resolve(this.sessionData);
      } 
      // If the condition isn't met but the timeout hasn't elapsed, go again
      else if (result === RESULT_STATUS.ONGOING && new Date().getTime() < endTime) {
        console.log("Retry in ", interval)
        setTimeout(checkCondition, interval, resolve, reject);
      }
      // Didn't match and too much time, reject!
      else {
        await this.stop()
        reject(new Error('Session validation timed out for after' + this.sessionTimeout || DEFAULT_SESSION_TIMEOUT + ' s.'));
      }
    };
    return new Promise(checkCondition);
  }

  displayQR() {
    let typeNumber = 0 as TypeNumber;
    let errorCorrectionLevel = 'H' as ErrorCorrectionLevel;
    let qr = qrcode(typeNumber, errorCorrectionLevel);
    let link = this.getLink();
    console.log("LINK", link)
    qr.addData(link);
    qr.make();
    return <div>
      <slot name="title"></slot>
      <div class="qr-container" innerHTML={this.dynamicLink? qr.createSvgTag(8, 25) : qr.createSvgTag(6, 25)} />
      <slot name="description"></slot>
    </div>
  }

  renderModal() {
    return <div class={'overlay ' + (this.open ? 'is-visible' : '') + ' '} onClick={(_) => this.stop()}>
      <div class="modal-window" onClick={(event) => { event.stopPropagation() }}>
        <div class="modal-window__content" >
          {this.displayQR()}
        </div>
      </div>
    </div>;
  }

  render() {
    return <div>
      {this.renderButton()}
      {this.open && this.renderModal()}
    </div>;
  }
}
