/**
 * @file ブラウザテスト用の next/image フェイク。
 */
import type * as React from "react";

type StaticImageData = {
  src: string;
  height?: number;
  width?: number;
};

export interface FakeNextImageProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, "src"> {
  src: string | StaticImageData;
  fill?: boolean;
  unoptimized?: boolean;
  priority?: boolean;
  quality?: number | string;
  placeholder?: string;
  blurDataURL?: string;
}

export default function FakeNextImage({
  src,
  alt = "",
  fill,
  unoptimized: _unoptimized,
  priority: _priority,
  quality: _quality,
  placeholder: _placeholder,
  blurDataURL: _blurDataURL,
  style,
  ...rest
}: FakeNextImageProps) {
  const resolvedSrc = typeof src === "string" ? src : src.src;
  const fillStyle: React.CSSProperties | undefined = fill
    ? {
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        ...style,
      }
    : style;

  return <img src={resolvedSrc} alt={alt} style={fillStyle} {...rest} />;
}
