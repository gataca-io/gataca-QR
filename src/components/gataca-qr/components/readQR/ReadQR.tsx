import {h} from '@stencil/core';
import React from 'react';
import {qrStyle} from '../../gataca-qr';
import {AnimatedLoader} from './components/AnimatedLoader';

type IReadQRProps = {
    modalWidth?: number;
    renderQR(value: string, useLogo?: boolean, size?: number): any;
    url: string;
    sizeQR?: number;
    readQrMessages?: {
        title?: string;
        description?: string;
    };
    style?: qrStyle;
};

export const ReadQR: React.FC<IReadQRProps> = (props) => {
    const {modalWidth, readQrMessages, renderQR, url, sizeQR, style} = props;

    return (
        <div
            class="blured"
            style={{
                width: (modalWidth - 48).toString() + 'px',
                height: modalWidth ? (modalWidth - 48)?.toString() + 'px' : '',
                backgroundColor: style?.bgColor,
                color: style?.color,
                border: style?.color ? `1px dashed ${style?.color}` : `1px dashed #a1a1a1`
            }}>
            <div
                id="notify"
                style={{
                    backgroundColor: style?.bgColor ? style?.bgColor : 'white'
                }}>
                <AnimatedLoader />
                <p
                    class="notify-text"
                    style={{
                        color: style?.color ? style?.color : '#707074'
                    }}>
                    {readQrMessages?.title}{' '}
                </p>
                <p
                    class="notify-text bold"
                    style={{
                        color: style?.color ? style?.color : '#707074'
                    }}>
                    {readQrMessages?.description}
                </p>
            </div>
            <div id="qrwait">{renderQR(url, false, sizeQR)}</div>
        </div>
    );
};
