import React from 'react';
import {h} from '@stencil/core';
import {DrawType} from 'qr-code-styling';

type IQRProps = {
    value: string;
    useLogo?: boolean;
    logoSrc?: string;
    qrType?: DrawType;
    size?: number;
    linkReady?: boolean;
};

export const QR: React.FC<IQRProps> = (props) => {
    const {value, useLogo, logoSrc, size, qrType, linkReady = true} = props;
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

    return <gataca-qrdisplay qrData={value} rounded={true} size={size} qrType={qrType} logo-size={useLogo ? 0.33 : 0} logo-src={logoSrc} />;
};
