import React from 'react';
import successIcon from '../../../../assets/icons/gat-icon-check.svg';
import {h} from '@stencil/core';

type ISuccessProps = {
    modalHeight?: number;
    successLoginLabel?: string;
};

export const Success: React.FC<ISuccessProps> = (props) => {
    const {modalHeight, successLoginLabel} = props;

    return (
        <div
            class={'success'}
            style={{
                height: modalHeight ? modalHeight?.toString() + 'px' : '300px'
            }}
        >
            <img src={successIcon} height={52} width={52}></img>
            <p class="successMsg">{successLoginLabel}</p>
        </div>
    );
};
