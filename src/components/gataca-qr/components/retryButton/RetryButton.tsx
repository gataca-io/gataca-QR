import React from 'react';
import {h} from '@stencil/core';
import alertIcon from '../../../../assets/icons/gat-icon-alert.svg';
import {qrStyle} from '../../gataca-qr';
import {RefreshIcon} from '../../../../assets/icons/RefreshIcon';

type IRetryButtonProps = {
    errorMessage?: string;
    modalWidth?: number;
    clickInsideBoxLabel?: string;
    refreshQrLabel?: string;
    scanQrLabel?: string;
    waitingStartSessionLabel?: string;
    style?: qrStyle;
    display: (x?: any) => void;
    renderRetryQR(value: string, useLogo?: boolean): any;
};

export const RetryButton: React.FC<IRetryButtonProps> = (props) => {
    const {errorMessage, modalWidth, clickInsideBoxLabel, refreshQrLabel, scanQrLabel, waitingStartSessionLabel, style, display, renderRetryQR} = props;

    const bgStyle = {backgroundColor: style?.bgColor ? style?.bgColor : 'white'};
    const alertBgStyle = {backgroundColor: style?.alertBgColor ? style?.alertBgColor : '#ffdedf'};
    const alertBorderColor = {borderColor: style?.alertBorderColor ? style?.alertBorderColor : '#ee888c'};
    const color = {color: style?.color ? style?.color : '#707074'};

    return (
        <div
            class="reload"
            style={{
                width: (modalWidth - 48).toString() + 'px',
                height: modalWidth ? (modalWidth - 48)?.toString() + 'px' : '',
                border: style?.color ? `1px dashed ${style?.color}` : `1px dashed #a1a1a1`
            }}>
            <div id="notify" onClick={() => display()} style={bgStyle}>
                <RefreshIcon color={style?.color} height={24} width={24} />

                <p class="notify-text" style={color}>
                    {clickInsideBoxLabel}{' '}
                </p>

                {errorMessage ? (
                    <p class="notify-text bold" style={color}>
                        {refreshQrLabel}
                    </p>
                ) : (
                    <p class="notify-text bold" style={color}>
                        {scanQrLabel}
                    </p>
                )}
                {errorMessage && (
                    <div
                        class="alert"
                        style={{
                            width: (modalWidth - 48).toString() + 'px',
                            ...alertBgStyle,
                            border: `1px solid ${alertBorderColor}`
                        }}>
                        <img src={alertIcon} height={24} width={24}></img>
                        <p style={{color: style?.color ? style?.color : '#1e1e20'}}>{errorMessage}</p>
                    </div>
                )}
            </div>
            <div id="qrwait">{renderRetryQR(waitingStartSessionLabel)}</div>
        </div>
    );
};
