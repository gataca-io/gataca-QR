import React from 'react';
import successIcon from '../../../../assets/icons/gat-icon-check.svg';
import {h} from '@stencil/core';
import {qrStyle} from '../../gataca-qr';

type ISuccessProps = {
    modalHeight?: number;
    successLoginLabel?: string;
    style?: qrStyle;
};

export const Success: React.FC<ISuccessProps> = (props) => {
    const {modalHeight, successLoginLabel, style} = props;

    const colorStyle = {color: style?.color ? style?.color : '#1e1e20'};

    return (
        <div
            class={'success'}
            style={{
                height: modalHeight ? modalHeight?.toString() + 'px' : '300px'
            }}>
            <img src={successIcon} height={52} width={52}></img>
            <p class="successMsg" style={colorStyle}>
                {successLoginLabel}
            </p>
        </div>
    );
};
