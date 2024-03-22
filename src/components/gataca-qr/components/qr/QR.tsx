import React from "react";
import { h } from "@stencil/core";

type IQRProps = {
  value: string;
  useLogo?: boolean;
  logoSrc?: string;
  size?: number;
};

export const QR: React.FC<IQRProps> = (props) => {
  const { value, useLogo, logoSrc, size } = props;

  return (
    <gataca-qrdisplay
      qrData={value}
      rounded={true}
      size={size}
      logo-size={useLogo ? 0.33 : 0}
      logo-src={logoSrc}
    />
  );
};
