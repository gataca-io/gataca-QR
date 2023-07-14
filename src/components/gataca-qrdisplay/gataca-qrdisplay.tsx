import { Component, h, Prop } from "@stencil/core";
import QRCodeStyling from "qr-code-styling";
import logoGataca from "../../assets/images/logo_gataca.svg";

@Component({
  tag: "gataca-qrdisplay",
})
export class GatacaQRDisplay {
  private qr: HTMLDivElement;

  componentDidLoad() {
    const qrCode = new QRCodeStyling({
      data: this.qrData,
      width: this.size,
      height: this.size,
      image: this.logoSize > 0 ? this.logoSrc || logoGataca : undefined,
      margin: 10,
      type: "svg",
      dotsOptions: {
        color: this.qrColor,
        type: this.rounded ? "dots" : "square",
      },
      cornersSquareOptions: {
        type: this.rounded ? "extra-rounded" : "square",
      },
      cornersDotOptions: {
        type: this.rounded ? "dot" : "square",
      },
      imageOptions: {
        margin: 2,
        imageSize: this.logoSize,
      },
    });
    qrCode.append(this.qr);
  }

  /**
   * _[Mandatory]_
   * Sets the contents of the QR
   */
  @Prop() qrData: string;

  /**
   * _[Optional]_
   * Size of the QR Displayed
   */
  @Prop() size?: number = 256;

  /**
   * _[Optional]_
   * Size of the logo to display in percentage to the total size [0-1]. 0 means no logo will be displayed. Default is the GATACA logo. Recommended size is around 0.33
   */
  @Prop() logoSize?: number = 0;

  /**
   * _[Optional]_
   * Logo to display, just if the logo size is greater than 0. No logo is the GATACA logo.
   */
  @Prop() logoSrc?: string;

  /**
   * _[Optional]_
   * QR Color.
   */
  @Prop() qrColor?: string = "#1E1E20"; //"#4745B7"; new purple color

  /**
   * _[Optional]_
   * Round usage
   */
  @Prop() rounded?: boolean = true;

  render() {
    return (
      <div
        ref={(el) => {
          this.qr = el;
        }}
      />
    );
  }
}
