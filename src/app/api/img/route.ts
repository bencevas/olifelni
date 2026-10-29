import { NextResponse } from "next/server";
import { ensureVariant, publicUrl } from "@/lib/storage";
import { STORAGE_KEY, VARIANT_WIDTHS, variantKey } from "@/lib/image-variants";

export const runtime = "nodejs";

const YEAR = 31_536_000;

/**
 * GET /api/img?k=<storage key>&w=400|800 → redirect to that size of the photo.
 *
 * The copy is created on the first request and stored beside the original, so every later
 * request is a plain redirect — and the redirect itself is cached at Vercel's edge for a year,
 * which is safe because keys are content hashes and never change.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const key = url.searchParams.get("k") ?? "";
  const width = Number(url.searchParams.get("w"));

  if (!STORAGE_KEY.test(key) || !VARIANT_WIDTHS.includes(width as (typeof VARIANT_WIDTHS)[number])) {
    return new NextResponse("Bad request", { status: 400 });
  }

  try {
    if (await ensureVariant(key, width)) {
      return redirect(publicUrl(variantKey(key, width)), YEAR);
    }
    return new NextResponse("Not found", { status: 404, headers: { "Cache-Control": "public, max-age=60" } });
  } catch (e) {
    // Resizing failed: show the full-size photo rather than none, and try again soon.
    console.error(`image variant ${width} for ${key} failed`, e);
    return redirect(publicUrl(key), 60);
  }
}

function redirect(location: string, maxAge: number) {
  return new NextResponse(null, {
    status: 302,
    headers: {
      Location: location,
      "Cache-Control": `public, max-age=${maxAge}, s-maxage=${maxAge}${maxAge === YEAR ? ", immutable" : ""}`,
    },
  });
}
