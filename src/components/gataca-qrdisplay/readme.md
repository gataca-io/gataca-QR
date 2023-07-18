# Gataca-QR Display

This component built using stencyl allows an easy integration to display a QR with the gataca styles

Continuing with that example, you could integrate in any HTML using the following code

```html
<!DOCTYPE html>
<html dir="ltr" lang="en">

<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, minimum-scale=1.0, maximum-scale=5.0">
  <title>Gataca QR Display Component</title>
  <script type="module" src="/build/gataca-qrdisplay.esm.js"></script>
  <script nomodule src="/build/gataca-qrdisplay.js"></script>
</head>

<body>
  <div class="your-container-styles">

    <gataca-qrdisplay id="gataca-qr" qr-data="DATA TO DISPLAY">
      </gataca-qr>

  </div>
</body>

</html>
```

<!-- Auto Generated Below -->


## Properties

| Property   | Attribute   | Description                                                                                                                                                                    | Type      | Default     |
| ---------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------- | ----------- |
| `logoSize` | `logo-size` | _[Optional]_ Size of the logo to display in percentage to the total size [0-1]. 0 means no logo will be displayed. Default is the GATACA logo. Recommended size is around 0.33 | `number`  | `0`         |
| `logoSrc`  | `logo-src`  | _[Optional]_ Logo to display, just if the logo size is greater than 0. No logo is the GATACA logo.                                                                             | `string`  | `undefined` |
| `qrColor`  | `qr-color`  | _[Optional]_ QR Color.                                                                                                                                                         | `string`  | `"#1E1E20"` |
| `qrData`   | `qr-data`   | _[Mandatory]_ Sets the contents of the QR                                                                                                                                      | `string`  | `undefined` |
| `rounded`  | `rounded`   | _[Optional]_ Round usage                                                                                                                                                       | `boolean` | `true`      |
| `size`     | `size`      | _[Optional]_ Size of the QR Displayed                                                                                                                                          | `number`  | `256`       |


## Dependencies

### Used by

 - [gataca-qr](../gataca-qr)
 - [gataca-qrws](../gataca-qrws)

### Graph
```mermaid
graph TD;
  gataca-qr --> gataca-qrdisplay
  gataca-qrws --> gataca-qrdisplay
  style gataca-qrdisplay fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
