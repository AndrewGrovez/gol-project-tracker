"use client";

import { useEffect, useState } from "react";

type Props = {
  imageUrl: string | null;
};

export default function SpotlightBackground({ imageUrl }: Props) {
  const [current, setCurrent] = useState<string | null>(imageUrl);
  const [previous, setPrevious] = useState<string | null>(null);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    if (imageUrl === current) return;
    setPrevious(current);
    setCurrent(imageUrl);
    setFading(true);
    const timeout = window.setTimeout(() => {
      setFading(false);
      setPrevious(null);
    }, 400);
    return () => window.clearTimeout(timeout);
  }, [imageUrl, current]);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {previous && (
        <div
          aria-hidden
          className="absolute inset-0 bg-cover bg-center transition-opacity duration-[400ms] ease-out"
          style={{
            backgroundImage: `url(${encodeURI(previous)})`,
            opacity: fading ? 0 : 0.28,
            filter: "saturate(1.2)",
          }}
        />
      )}
      {current && (
        <div
          aria-hidden
          className="absolute inset-0 bg-cover bg-center transition-opacity duration-[400ms] ease-out"
          style={{
            backgroundImage: `url(${encodeURI(current)})`,
            opacity: fading ? 0.28 : 0.28,
            filter: "saturate(1.2)",
          }}
        />
      )}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(90deg, rgba(15,26,38,0.95) 0%, rgba(15,26,38,0.82) 55%, rgba(15,26,38,0.45) 100%)",
        }}
      />
    </div>
  );
}
