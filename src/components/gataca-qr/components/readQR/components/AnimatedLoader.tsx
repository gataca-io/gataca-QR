import React from "react";
import { h } from "@stencil/core";

export const AnimatedLoader: React.FC = () => {
  return (
    <div class="containerLoader">
      <div class="loader">
        <div class="loader__item loader__item__1"></div>
        <div class="loader__item loader__item__2"></div>
        <div class="loader__item loader__item__3"></div>
        <div class="loader__item loader__item__4"></div>
        <div class="loader__item loader__item__5"></div>
        <div class="loader__item loader__item__6"></div>
        <div class="loader__item loader__item__7"></div>
        <div class="loader__item loader__item__8"></div>
      </div>
    </div>
  );
};
