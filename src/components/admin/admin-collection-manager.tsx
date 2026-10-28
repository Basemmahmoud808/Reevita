"use client";

import { useActionState } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { createCollectionAction, deleteCollectionAction, updateCollectionAction, type AdminActionState } from "@/lib/actions/admin";
import type { Collection, Product } from "@/lib/types";

const coverOptions = [
  "/images/collections/hair-care-duo-products.jpg",
  "/images/collections/soft-glow-bundle.jpg",
  "/images/collections/complete-care-bundle.jpg",
  "/images/collections/fresh-all-day-bundle.jpg",
  "/images/collections/soft-glow-bubblegum.jpg",
  "/images/collections/soft-glow-dove.jpg",
  "/images/collections/soft-glow-blueberry.jpg",
];

function Feedback({ state }: { state: AdminActionState | null }) {
  if (!state) return null;
  return <p className={`mt-2 text-xs font-semibold ${state.error ? "text-danger" : "text-success"}`}>{state.error ?? state.message}</p>;
}

function ProductChoices({ products, selected }: { products: Product[]; selected: string[] }) {
  return (
    <div className="grid max-h-48 gap-2 overflow-y-auto rounded-xl border border-line bg-cream/40 p-3 sm:grid-cols-2">
      {products.map((product) => (
        <label key={product.id} className="flex min-w-0 items-center gap-2 text-xs text-plum">
          <input type="checkbox" name="productIds" value={product.id} defaultChecked={selected.includes(product.id)} className="size-3.5 accent-[#3B0F24]" />
          <span className="truncate">{product.nameEn}</span>
        </label>
      ))}
    </div>
  );
}

function CollectionFields({ collection, products }: { collection?: Collection; products: Product[] }) {
  return (
    <>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        <input name="nameEn" required defaultValue={collection?.nameEn} className="field py-2 text-xs" placeholder="Collection name" />
        <input name="nameAr" required defaultValue={collection?.nameAr} className="field py-2 text-xs" placeholder="اسم المجموعة" dir="rtl" />
        <input name="slug" required defaultValue={collection?.slug} className="field py-2 text-xs" placeholder="collection-slug" dir="ltr" />
        <input name="image" list="collection-cover-options" defaultValue={collection?.image} className="field py-2 text-xs sm:col-span-2" placeholder="Cover image URL (or upload below)" dir="ltr" />
        <label className="grid gap-1 text-xs font-semibold text-muted sm:col-span-2">
          Upload or replace cover image (JPG, PNG, WEBP · max 5 MB)
          <input name="coverImage" type="file" accept="image/jpeg,image/png,image/webp" className="field py-2 text-xs" />
        </label>
        <input name="displayOrder" type="number" min={0} defaultValue={collection?.displayOrder ?? 0} className="field py-2 text-xs" placeholder="Display order" />
        <textarea name="descriptionAr" required defaultValue={collection?.descriptionAr} className="field py-2 text-xs sm:col-span-2" placeholder="وصف المجموعة" rows={2} dir="rtl" />
        <label className="flex items-center gap-2 text-xs font-semibold text-plum">
          <input type="checkbox" name="isPublished" defaultChecked={collection?.isPublished ?? true} className="size-3.5 accent-[#3B0F24]" />
          Published on storefront
        </label>
        <label className="flex items-center gap-2 text-xs font-semibold text-plum">
          <input type="checkbox" name="purchaseReady" defaultChecked={collection?.purchaseReady ?? Boolean(collection?.productIds?.length)} className="size-3.5 accent-[#3B0F24]" />
          Ready for purchase
        </label>
      </div>
      <label className="grid gap-1 text-xs font-semibold text-muted">
        Products still missing (one per line)
        <textarea name="missingProducts" defaultValue={collection?.missingProducts?.join("\n")} className="field py-2 text-xs" rows={2} dir="auto" />
      </label>
      <div>
        <p className="label">Products in this collection</p>
        <ProductChoices products={products} selected={collection?.productIds ?? []} />
      </div>
    </>
  );
}

export function AdminCollectionManager({ collections, products }: { collections: Collection[]; products: Product[] }) {
  const [createState, createAction, createPending] = useActionState<AdminActionState | null, FormData>(createCollectionAction, null);

  return (
    <div className="space-y-5">
      <datalist id="collection-cover-options">
        {coverOptions.map((image) => <option key={image} value={image} />)}
      </datalist>

      <section className="rounded-2xl border border-line bg-white/80 p-5">
        <p className="eyebrow">NEW COLLECTION</p>
        <h2 className="display-md mt-2 text-xl">Create a collection</h2>
        <form action={createAction} className="mt-4 space-y-4">
          <CollectionFields products={products} />
          <button type="submit" disabled={createPending} className="btn btn-primary px-4 py-2 text-xs">
            {createPending ? <Loader2 className="size-3.5 animate-spin" aria-hidden /> : null} Create collection
          </button>
          <Feedback state={createState} />
        </form>
      </section>

      {collections.map((collection) => <CollectionEditor key={collection.id} collection={collection} products={products} />)}
    </div>
  );
}

function CollectionEditor({ collection, products }: { collection: Collection; products: Product[] }) {
  const [updateState, updateAction, updatePending] = useActionState<AdminActionState | null, FormData>(updateCollectionAction, null);
  const [deleteState, deleteAction, deletePending] = useActionState<AdminActionState | null, FormData>(deleteCollectionAction, null);

  return (
    <section className="rounded-2xl border border-line bg-white/80 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="eyebrow">{collection.isPublished ? "PUBLISHED" : "DRAFT"}</p>
          <h2 className="display-md mt-2 text-xl">{collection.nameEn}</h2>
        </div>
        <span className="rounded-full bg-cream px-3 py-1 text-[0.65rem] font-bold text-muted">{collection.productIds?.length ?? 0} products</span>
      </div>
      <form action={updateAction} className="mt-4 space-y-4">
        <input type="hidden" name="id" value={collection.id} />
        <CollectionFields collection={collection} products={products} />
        <button type="submit" disabled={updatePending} className="btn btn-outline px-4 py-2 text-xs">
          {updatePending ? <Loader2 className="size-3.5 animate-spin" aria-hidden /> : null} Save collection
        </button>
        <Feedback state={updateState} />
      </form>
      <form action={deleteAction} className="mt-3" onSubmit={(event) => { if (!window.confirm("Delete this collection? Products will remain in the store.")) event.preventDefault(); }}>
        <input type="hidden" name="id" value={collection.id} />
        <button type="submit" disabled={deletePending} className="inline-flex items-center gap-1.5 text-xs font-bold text-danger hover:underline">
          <Trash2 className="size-3.5" aria-hidden /> Delete collection
        </button>
        <Feedback state={deleteState} />
      </form>
    </section>
  );
}
