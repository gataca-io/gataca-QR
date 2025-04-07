import React from 'react';
import {h} from '@stencil/core';
import {DrawType} from 'qr-code-styling';

type IQRProps = {
    value: string;
    useLogo?: boolean;
    logoSrc?: string;
    qrType?: DrawType;
    size?: number;
};

export const QR: React.FC<IQRProps> = (props) => {
    const {value, useLogo, logoSrc, size, qrType} = props;

    return <gataca-qrdisplay qrData={value} rounded={true} qrType={qrType} size={size} logo-size={useLogo ? 0.33 : 0} logo-src={logoSrc} />;
};
