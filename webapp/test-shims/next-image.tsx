/**
 * @file Vitest Browser Mode 用の next/image 互換シム。
 * Next.js 画像最適化ランタイムに依存せず標準の <img> 要素として描画します。
 */
import type * as React from "react";

type StaticImageData = {
  src: string;
  height?: number;
  width?: number;
};

export interface NextImageShimProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, "src"> {
  src: string | StaticImageData;
  fill?: boolean;
  unoptimized?: boolean;
  priority?: boolean;
  quality?: number | string;
  placeholder?: string;
  blurDataURL?: string;
}

export default function NextImageShim({
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
}: NextImageShimProps) {
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
