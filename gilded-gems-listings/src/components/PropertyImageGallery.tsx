import { useEffect, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PropertyImage {
  url: string;
  title: string;
  description?: string;
}

interface PropertyImageGalleryProps {
  images: PropertyImage[];
}

const PropertyImageGallery = ({ images }: PropertyImageGalleryProps) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (selectedIndex > images.length - 1) {
      setSelectedIndex(0);
    }
  }, [images.length, selectedIndex]);

  if (!images.length) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-border bg-muted/30 text-sm text-muted-foreground">
        No media uploaded yet.
      </div>
    );
  }

  const handlePrevious = () => {
    setSelectedIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setSelectedIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") handlePrevious();
    if (e.key === "ArrowRight") handleNext();
    if (e.key === "Escape") setIsFullscreen(false);
  };

  return (
    <>
      <div className="w-full space-y-4">
        {/* Main Image */}
        <div className="relative group">
          <div 
            className="relative h-[500px] overflow-hidden rounded-lg cursor-pointer"
            onClick={() => setIsFullscreen(true)}
          >
            <img
              src={images[selectedIndex].url}
              alt={images[selectedIndex].title}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="absolute bottom-4 left-4 text-white">
                <p className="text-lg font-semibold">{images[selectedIndex].title}</p>
                {images[selectedIndex].description && (
                  <p className="text-sm opacity-90 mt-1">{images[selectedIndex].description}</p>
                )}
                <p className="text-sm opacity-90 mt-1">Click to view fullscreen</p>
              </div>
            </div>
          </div>

          {/* Navigation Buttons */}
          {images.length > 1 && (
            <>
              <Button
                variant="outline"
                size="icon"
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation();
                  handlePrevious();
                }}
              >
                <ChevronLeft className="h-6 w-6" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation();
                  handleNext();
                }}
              >
                <ChevronRight className="h-6 w-6" />
              </Button>
            </>
          )}

          {/* Image Counter */}
          <div className="absolute top-4 right-4 bg-black/60 text-white px-3 py-1 rounded-full text-sm">
            {selectedIndex + 1} / {images.length}
          </div>
        </div>

        {/* Thumbnails */}
        {images.length > 1 && (
          <div className="flex gap-3 overflow-x-auto pb-2">
            {images.map((image, index) => (
              <button
                key={index}
                onClick={() => setSelectedIndex(index)}
                className={`relative flex-shrink-0 w-24 h-24 rounded-lg overflow-hidden transition-all ${
                  index === selectedIndex
                    ? "ring-4 ring-primary scale-105"
                    : "ring-2 ring-transparent hover:ring-primary/50 opacity-70 hover:opacity-100"
                }`}
              >
                <img
                  src={image.url}
                  alt={image.title}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Fullscreen Dialog */}
      <Dialog open={isFullscreen} onOpenChange={setIsFullscreen}>
        <DialogContent 
          className="max-w-screen-2xl h-screen p-0 bg-white dark:bg-gray-950"
          onKeyDown={handleKeyDown}
        >
          <div className="relative w-full h-full flex items-center justify-center">
            <img
              src={images[selectedIndex].url}
              alt={images[selectedIndex].title}
              className="max-w-full max-h-full object-contain"
            />

            {images.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground hover:bg-muted"
                  onClick={handlePrevious}
                >
                  <ChevronLeft className="h-8 w-8" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-foreground hover:bg-muted"
                  onClick={handleNext}
                >
                  <ChevronRight className="h-8 w-8" />
                </Button>
              </>
            )}

            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-center bg-card/95 backdrop-blur-sm rounded-lg px-6 py-4 shadow-lg max-w-2xl">
              <p className="text-xl font-semibold mb-1 text-foreground">{images[selectedIndex].title}</p>
              {images[selectedIndex].description && (
                <p className="text-sm text-muted-foreground mb-2">{images[selectedIndex].description}</p>
              )}
              <p className="text-xs text-muted-foreground">
                {selectedIndex + 1} / {images.length} • Use arrow keys to navigate
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PropertyImageGallery;
