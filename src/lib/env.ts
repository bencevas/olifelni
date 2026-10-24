/**
 * Where the app is running, and what it has been given to run with.
 *
 * The local defaults (PGlite on disk, photos in public/uploads) are deliberate conveniences
 * for development, but both write to the filesystem — which on Vercel is read-only outside
 * /tmp, and ephemeral per invocation even there. Silently falling back to them in a
 * deployment produces an opaque 500 on every request, so the checks here turn that into a
 * message that names the missing variable.
 */
export const isServerless = Boolean(process.env.VERCEL);

export const hasDatabaseUrl = Boolean(process.env.DATABASE_URL);

/**
 * SUPABASE_URL is the one secret-adjacent variable that gets *rendered into public HTML*,
 * because publicUrl() builds every image src from it. Pasting the Postgres connection
 * string here — easy, since both are called a URL — would put the database credentials in
 * the page source of every listing. So it must look like the project API origin, and
 * anything else is treated as unconfigured and fails loudly rather than being published.
 */
export const supabaseUrlIsValid = (() => {
  const raw = process.env.SUPABASE_URL;
  if (!raw) return false;
  try {
    return new URL(raw).protocol === "https:";
  } catch {
    return false;
  }
})();

export const hasSupabaseStorage = Boolean(
  supabaseUrlIsValid && process.env.SUPABASE_SERVICE_ROLE_KEY,
);

const SETUP_DOC = "See docs/DEPLOY.md.";

export function assertDatabaseConfigured(): void {
  if (hasDatabaseUrl || !isServerless) return;
  throw new Error(
    "DATABASE_URL is not set. This deployment has no database: the local fallback " +
      "(PGlite) writes to disk, which is read-only here. Add DATABASE_URL in Vercel → " +
      `Settings → Environment Variables, using Supabase's transaction pooler string (port 6543), then redeploy. ${SETUP_DOC}`,
  );
}

export function assertStorageConfigured(): void {
  if (hasSupabaseStorage || !isServerless) return;
  if (process.env.SUPABASE_URL && !supabaseUrlIsValid) {
    throw new Error(
      "SUPABASE_URL is not an https:// URL. It should be the project API origin, " +
        "https://<ref>.supabase.co — not the Postgres connection string, which belongs " +
        `in DATABASE_URL. Image URLs are built from this value and are public. ${SETUP_DOC}`,
    );
  }
  throw new Error(
    "SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are not set. Uploads would be written to " +
      `public/uploads, which is read-only here and would not persist between requests. ${SETUP_DOC}`,
  );
}
