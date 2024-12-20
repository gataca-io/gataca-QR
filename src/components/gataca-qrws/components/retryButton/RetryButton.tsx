import React from "react";
import { h } from "@stencil/core";
import refreshIcon from "../../../../assets/icons/gat-icon-refresh.svg";
import alertIcon from "../../../../assets/icons/gat-icon-alert.svg";

type IRetryButtonProps = {
  errorMessage?: string;
  modalWidth?: number;
  clickInsideBoxLabel?: string;
  refreshQrLabel?: string;
  scanQrLabel?: string;
  waitingStartSessionLabel?: string;
  display: (x?: any) => void;
  renderRetryQR(value: string, useLogo?: boolean): any;
};

export const RetryButton: React.FC<IRetryButtonProps> = (props) => {
  const {
    errorMessage,
    modalWidth,
    clickInsideBoxLabel,
    refreshQrLabel,
    scanQrLabel,
    waitingStartSessionLabel,
    display,
    renderRetryQR,
  } = props;

  return (
    <div
      class="reload"
      style={{
        width: (modalWidth - 48).toString() + "px",
        height: modalWidth ? (modalWidth - 48)?.toString() + "px" : "",
      }}
    >
      <div id="notify" onClick={() => display()}>
        <img src={refreshIcon} height={24} width={24} />

        <p class="notify-text">{clickInsideBoxLabel} </p>

        {errorMessage ? (
          <p class="notify-text bold">{refreshQrLabel}</p>
        ) : (
          <p class="notify-text bold">{scanQrLabel}</p>
        )}
        {errorMessage && (
          <div
            class="alert"
            style={{
              width: (modalWidth - 48).toString() + "px",
            }}
          >
            <img src={alertIcon} height={24} width={24}></img>
            <p>{errorMessage}</p>
          </div>
        )}
      </div>
      <div id="qrwait">{renderRetryQR(waitingStartSessionLabel)}</div>
    </div>
  );
};
