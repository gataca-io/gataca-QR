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
};

export const QR: React.FC<IQRProps> = (props) => {
    const {value, useLogo, logoSrc, size, qrType, style} = props;

    return <gataca-qrdisplay qrData={value} rounded={true} qrType={qrType} size={size} logo-size={useLogo ? 0.33 : 0} logo-src={logoSrc} qrColor={style?.color} bgColor={style?.bgColor} />;
};
