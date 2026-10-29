import Image from "next/image";

export function CuratedCollectionCover({
  image,
  alt,
  aspectRatio,
  fit,
  sizes,
}: {
  image: string;
  alt: string;
  aspectRatio?: string;
  fit?: "cover" | "contain";
  sizes: string;
}) {
  const isSquare = !aspectRatio || aspectRatio === "1 / 1";
  const isContained = fit ? fit === "contain" : !isSquare;

  return (
    <div className="curated-collection-cover">
      {isContained ? (
        <Image src={image} alt="" aria-hidden fill sizes={sizes} className="curated-collection-cover-backdrop" />
      ) : null}
      <Image
        src={image}
        alt={alt}
        fill
        sizes={sizes}
        className={`curated-collection-cover-image ${isContained ? "is-contained" : "is-cropped"}`}
      />
    </div>
  );
}
