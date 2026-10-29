import Image from "next/image";

export function CuratedCollectionCover({
  image,
  alt,
  aspectRatio,
  sizes,
}: {
  image: string;
  alt: string;
  aspectRatio?: string;
  sizes: string;
}) {
  const isSquare = !aspectRatio || aspectRatio === "1 / 1";

  return (
    <div className="curated-collection-cover">
      {!isSquare ? (
        <Image src={image} alt="" aria-hidden fill sizes={sizes} className="curated-collection-cover-backdrop" />
      ) : null}
      <Image
        src={image}
        alt={alt}
        fill
        sizes={sizes}
        className={`curated-collection-cover-image ${isSquare ? "is-cropped" : "is-contained"}`}
      />
    </div>
  );
}
