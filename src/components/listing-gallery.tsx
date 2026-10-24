"use client";

import Image from "next/image";
import { useState } from "react";

export type GalleryImage = { url: string; width: number; height: number; alt: string };

/**
 * Desktop: vertical thumbnail strip beside the main image, as on the current site.
 * Mobile: a swipeable scroll-snap carousel with dot indicators.
 */
export function ListingGallery({ images }: { images: GalleryImage[] }) {
  const [active, setActive] = useState(0);

  if (!images.length) {
    return (
      <div className="flex aspect-square items-center justify-center rounded-lg bg-sheet text-ink-soft">
        Nincs kép
      </div>
    );
  }

  return (
    <div>
      {/* Mobile carousel */}
      <div className="lg:hidden">
        <div
          className="flex snap-x snap-mandatory gap-2 overflow-x-auto rounded-lg [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          onScroll={(e) => {
            const el = e.currentTarget;
            setActive(Math.round(el.scrollLeft / el.clientWidth));
          }}
        >
          {images.map((img, i) => (
            <div key={img.url} className="relative aspect-[4/5] w-full shrink-0 snap-center bg-sheet">
              <Image
                src={img.url}
                alt={img.alt}
                fill
                priority={i === 0}
                sizes="100vw"
                className="object-contain"
              />
            </div>
          ))}
        </div>
        {images.length > 1 && (
          <div className="mt-3 flex justify-center gap-1.5">
            {images.map((img, i) => (
              <span
                key={img.url}
                aria-hidden
                className={`h-2 w-2 rounded-full ${i === active ? "bg-ink" : "bg-rule"}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Desktop: thumbs + main */}
      <div className="hidden gap-4 lg:flex">
        {images.length > 1 && (
          <div className="flex w-20 shrink-0 flex-col gap-2">
            {images.map((img, i) => (
              <button
                key={img.url}
                type="button"
                onClick={() => setActive(i)}
                aria-label={`${i + 1}. kép megtekintése`}
                aria-current={i === active}
                className={`relative aspect-square overflow-hidden rounded border-2 bg-sheet transition-colors ${
                  i === active ? "border-brand" : "border-transparent hover:border-rule"
                }`}
              >
                <Image src={img.url} alt="" fill sizes="80px" className="object-cover" />
              </button>
            ))}
          </div>
        )}
        <div className="relative aspect-[4/5] flex-1 overflow-hidden rounded-lg bg-sheet">
          <Image
            src={images[active].url}
            alt={images[active].alt}
            fill
            priority
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="object-contain"
          />
        </div>
      </div>
    </div>
  );
}
