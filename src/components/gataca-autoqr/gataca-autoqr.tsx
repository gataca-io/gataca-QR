import {Component, Event, EventEmitter, h, Method, Prop, State} from '@stencil/core';
import {QRConfig, RESULT_STATUS} from '../../utils';

import {GatacaQR} from '../gataca-qr/gataca-qr';
import {GatacaQRWS} from '../gataca-qrws/gataca-qrws';
import {GatacaSSIButton} from '../gataca-ssibutton/gataca-ssibutton';
import {GatacaSSIButtonWS} from '../gataca-ssibuttonws/gataca-ssibuttonws';
import {DrawType} from 'qr-code-styling';

const DEFAULT_REPOSITORY = 'https://studio.gataca.io/api/v1/qrconfigs';

const fixFunctions = (data: QRConfig): QRConfig => {
    data.errorCallback = deserializeFunction(data.errorCallback?.toString()) as undefined | ((error?: Error) => void);
    data.successCallback = deserializeFunction(data.successCallback?.toString()) as undefined | ((data?: any) => void);
    data.wsOnMessage = deserializeFunction(data.wsOnMessage?.toString()) as undefined | ((socket: WebSocket, msg: MessageEvent) => void);
    data.wsOnOpen = deserializeFunction(data.wsOnOpen?.toString()) as undefined | ((socket: WebSocket) => void);
    data.checkStatus = deserializeFunction(data.checkStatus?.toString()) as undefined | ((id?: string) => Promise<{result: RESULT_STATUS; data?: any}>);
    data.createSession = deserializeFunction(data.createSession?.toString()) as
        | undefined
        | (() => Promise<{
              sessionId: string;
              authenticationRequest?: string;
          }>);
    return data;
};

const deserializeFunction = (data?: string): Function | undefined => {
    if (data) {
        return new Function('return ' + data)();
    }
    return undefined;
};

@Component({
    tag: 'gataca-autoqr',
    styleUrl: 'gataca-autoqr.scss',
    shadow: true
})
export class GatacaAutoQR {
    qr: GatacaQRWS | GatacaQR | GatacaSSIButton | GatacaSSIButtonWS;

    constructor() {
        this.loading = true;
        fetch(this.configRepository + '/' + this.configId, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        })
            .then((response) => {
                response
                    .json()
                    .then((data: QRConfig) => {
                        data = fixFunctions(data);
                        this.config = data;
                        this.loading = false;
                    })
                    .catch((err) => {
                        console.log('Cannot retrieve selected config', err);
                        this.loading = false;
                    });
            })
            .catch((err) => {
                console.log('Cannot retrieve selected config', err);
                this.loading = false;
            });
    }

    /**
     * ***Mandatory***
     * ID of the QR configuration to display
     */
    @Prop() configId: string;

    /**
     * _[Optional]_
     * Sets the qr type. It can be "svg" or "canvas". "svg" by default.
     */
    @Prop() qrType?: DrawType = 'svg';

    /**
     * ___Optional___
     * ConfigURL Repository to download the config from
     */
    @Prop() configRepository: string = DEFAULT_REPOSITORY;

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
    @Prop() checkStatus?: (id?: string) => Promise<{result: RESULT_STATUS; data?: any}> = undefined;

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
        eventName: 'gatacaLoginCompleted',
        composed: true,
        cancelable: true,
        bubbles: true
    })
    gatacaLoginCompleted: EventEmitter;

    /**
     * GatacaLoginFailed event, triggered with error upon login failure
     */
    @Event({
        eventName: 'gatacaLoginFailed',
        composed: true,
        cancelable: true,
        bubbles: true
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
                        successCallback={this.successCallback || this.config.successCallback}
                        errorCallback={this.errorCallback || this.config.errorCallback}
                        qrType={this.qrType}
                        qrRole={this.config.qrRole}
                        callbackServer={this.config.callbackServer}
                        sessionTimeout={this.config.sessionTimeout}
                        socketEndpoint={this.config.socketEndpoint}
                        autostart={true}
                        autorefresh={this.config.autorefresh}
                        v={this.config.v}
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
                        successCallback={this.successCallback || this.config.successCallback}
                        errorCallback={this.errorCallback || this.config.errorCallback}
                        qrType={this.qrType}
                        qrRole={this.config.qrRole}
                        callbackServer={this.config.callbackServer}
                        sessionTimeout={this.config.sessionTimeout}
                        pollingFrequency={this.config.pollingFrequency}
                        autorefresh={this.config.autorefresh}
                        v={this.config.v}
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
                        successCallback={this.successCallback || this.config.successCallback}
                        qrType={this.qrType}
                        errorCallback={this.errorCallback || this.config.errorCallback}
                        qrRole={this.config.qrRole}
                        callbackServer={this.config.callbackServer}
                        sessionTimeout={this.config.sessionTimeout}
                        socketEndpoint={this.config.socketEndpoint}
                        autostart={this.config.autostart}
                        autorefresh={this.config.autorefresh}
                        v={this.config.v}
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
                        successCallback={this.successCallback || this.config.successCallback}
                        qrType={this.qrType}
                        errorCallback={this.errorCallback || this.config.errorCallback}
                        qrRole={this.config.qrRole}
                        callbackServer={this.config.callbackServer}
                        sessionTimeout={this.config.sessionTimeout}
                        pollingFrequency={this.config.pollingFrequency}
                        autostart={this.config.autostart}
                        autorefresh={this.config.autorefresh}
                        v={this.config.v}
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
