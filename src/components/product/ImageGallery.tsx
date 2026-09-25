import { useState } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "../../lib/cn";

interface ImageGalleryProps {
  images: string[];
  productName: string;
}

export function ImageGallery({ images, productName }: ImageGalleryProps) {
  const { t } = useTranslation("product");
  const [activeIndex, setActiveIndex] = useState(0);
  const gallery = images.length > 0 ? images : [];

  return (
    <div className="flex flex-col gap-3">
      <div className="aspect-square overflow-hidden rounded-[var(--radius-xl)] bg-surface-muted">
        <img
          src={gallery[activeIndex]}
          alt={`${productName} — ${t("gallery.imageOf", {
            index: activeIndex + 1,
            total: gallery.length,
            defaultValue: `image ${activeIndex + 1} of ${gallery.length}`,
          })}`}
          className="h-full w-full object-cover"
        />
      </div>
      {gallery.length > 1 ? (
        <div role="tablist" aria-label={t("gallery.thumbnails")} className="flex gap-2 overflow-x-auto">
          {gallery.map((src, index) => (
            <button
              key={src}
              role="tab"
              aria-selected={index === activeIndex}
              aria-label={t("gallery.imageOf", {
                index: index + 1,
                total: gallery.length,
                defaultValue: `image ${index + 1} of ${gallery.length}`,
              })}
              onClick={() => setActiveIndex(index)}
              className={cn(
                "h-16 w-16 shrink-0 overflow-hidden rounded-[var(--radius-md)] border-2 transition-colors",
                index === activeIndex ? "border-accent" : "border-transparent hover:border-border-strong"
              )}
            >
              <img src={src} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
