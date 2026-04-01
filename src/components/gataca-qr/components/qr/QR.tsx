import {h} from '@stencil/core';
import {DrawType} from 'qr-code-styling';
import React from 'react';
import {qrStyle} from '../../gataca-qr';

type IQRProps = {
    value: string;
    useLogo?: boolean;
    logoSrc?: string;
    qrType?: DrawType;
    size?: number;
    style?: qrStyle;
    linkReady?: boolean;
};

export const QR: React.FC<IQRProps> = (props) => {
    const {value, useLogo, logoSrc, size, qrType, style, linkReady = true} = props;
    const s = size ?? 256;

    if (!linkReady) {
        return (
            <div
                class="qr-loading-slot"
                style={{
                    width: s + 'px',
                    height: s + 'px',
                    margin: '0 auto'
                }}
            />
        );
    }

    return <gataca-qrdisplay qrData={value} rounded={true} qrType={qrType} size={size} logo-size={useLogo ? 0.33 : 0} logo-src={logoSrc} qrColor={style?.color} bgColor={style?.bgColor} />;
};
