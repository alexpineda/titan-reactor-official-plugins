
import React, { memo } from "react";
import { assets } from "@titan-reactor-runtime/ui";

export const ProductionImage = memo(({ icon }) => {
    if (icon === undefined) return null;
    return <img
        src={assets.imagesUrl + `cmdicons.${icon}.png`}
        style={{
        filter: "hue-rotate(64deg) brightness(1.5) contrast(0.8) grayscale(1)",
        }}
    />
}, (prev, next) => (prev.icon === next.icon));