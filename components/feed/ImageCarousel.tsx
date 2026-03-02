import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface ImageCarouselProps {
  images: string[];
}

const ImageCarousel = ({ images }: ImageCarouselProps) => {
  const [index, setIndex] = useState(0);

  if (images.length === 0) return null;
  if (images.length === 1) {
    return (
      <img
        src={images[0]}
        alt="Post"
        className="w-full object-contain bg-black/5"
        style={{ maxHeight: "85vh" }}
        loading="lazy"
      />
    );
  }

  return (
    <div className="relative">
      <img
        src={images[index]}
        alt={`Foto ${index + 1}`}
        className="w-full object-contain bg-black/5"
        style={{ maxHeight: "85vh" }}
        loading="lazy"
      />
      <button
        onClick={() => setIndex((i) => (i - 1 + images.length) % images.length)}
        className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/70 rounded-full p-1.5 hover:bg-background/90 transition-colors"
      >
        <ChevronLeft className="w-5 h-5 text-foreground" />
      </button>
      <button
        onClick={() => setIndex((i) => (i + 1) % images.length)}
        className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/70 rounded-full p-1.5 hover:bg-background/90 transition-colors"
      >
        <ChevronRight className="w-5 h-5 text-foreground" />
      </button>
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
        {images.map((_, i) => (
          <button
            key={i}
            onClick={() => setIndex(i)}
            className={`w-2 h-2 rounded-full transition-colors ${
              i === index ? "bg-primary" : "bg-foreground/30"
            }`}
          />
        ))}
      </div>
      <div className="absolute top-2 right-2 bg-background/70 rounded-full px-2 py-0.5 text-xs text-foreground">
        {index + 1}/{images.length}
      </div>
    </div>
  );
};

export default ImageCarousel;
