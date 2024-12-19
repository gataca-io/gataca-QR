import React from "react";
import { h } from "@stencil/core";
import { AnimatedLoader } from "./components/AnimatedLoader";

type IReadQRProps = {
  modalWidth?: number;
  renderQR(value: string, useLogo?: boolean, size?: number): any;
  url: string;
  sizeQR?: number;
  readQrMessages?: {
    title?: string;
    description?: string;
  };
};

export const ReadQR: React.FC<IReadQRProps> = (props) => {
  const { modalWidth, readQrMessages, renderQR, url, sizeQR } = props;

  return (
    <div
      class="blured"
      style={{
        width: (modalWidth - 48).toString() + "px",
        height: modalWidth ? (modalWidth - 48)?.toString() + "px" : "",
      }}
    >
      <div id="notify">
        <AnimatedLoader />
        <p class="notify-text">{readQrMessages?.title} </p>
        <p class="notify-text bold">{readQrMessages?.description}</p>
      </div>
      <div id="qrwait">{renderQR(url, false, sizeQR)}</div>
    </div>
  );
};
