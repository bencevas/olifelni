import { desc } from "drizzle-orm";
import { db, leads } from "@/lib/db";
import { LeadRow } from "@/components/admin/lead-row";

export default async function LeadsPage() {
  const rows = await db.select().from(leads).orderBy(desc(leads.createdAt)).limit(200);
  const pending = rows.filter((r) => !r.handled).length;

  return (
    <div>
      <h1 className="text-2xl font-extrabold">Érdeklődések</h1>
      <p className="mt-1 text-sm text-ink-soft">
        {rows.length} üzenet · {pending} elintézetlen
      </p>

      {!rows.length ? (
        <p className="py-16 text-center text-ink-soft">
          Még nem érkezett üzenet. Amit a látogatók a weboldal űrlapján küldenek, itt jelenik meg.
        </p>
      ) : (
        <ul className="mt-6 divide-y divide-rule-soft border-y border-rule-soft">
          {rows.map((lead) => (
            <LeadRow key={lead.id} lead={{ ...lead, createdAt: lead.createdAt.toISOString() }} />
          ))}
        </ul>
      )}

      <p className="mt-8 text-[13px] text-ink-soft">
        Tipp: a weboldal űrlapjáról érkező üzenetek ide kerülnek. Érdemes naponta ránézni —
        e-mail értesítés jelenleg nincs beállítva.
      </p>
    </div>
  );
}
