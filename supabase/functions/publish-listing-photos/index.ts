import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

function json(obj: unknown, status = 200) {
  return new Response(JSON.stringify(obj), { status, headers: { "content-type": "application/json" } });
}

Deno.serve(async (req) => {
  try {
    const { submission_id, reference, secret } = await req.json();
    if (secret !== "iclose-publish-2026") return json({ ok: false, error: "forbidden" }, 403);
    const url = Deno.env.get("SUPABASE_URL")!;
    const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const sb = createClient(url, key);

    const { data: sub, error: subErr } = await sb
      .from("listing_submissions").select("photo_paths").eq("id", submission_id).single();
    if (subErr || !sub) return json({ ok: false, error: "submission not found" }, 404);

    const paths: string[] = sub.photo_paths ?? [];
    const publicUrls: string[] = [];
    for (let i = 0; i < paths.length; i++) {
      const { data: file, error } = await sb.storage.from("listing-uploads").download(paths[i]);
      if (error || !file) continue;
      const ext = (paths[i].split(".").pop() || "jpg").toLowerCase();
      const dest = `${reference}/${i}.${ext}`;
      const buf = new Uint8Array(await file.arrayBuffer());
      const ct = file.type || (ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg");
      const up = await sb.storage.from("listing-photos").upload(dest, buf, { contentType: ct, upsert: true });
      if (up.error) continue;
      const { data: pub } = sb.storage.from("listing-photos").getPublicUrl(dest);
      publicUrls.push(pub.publicUrl);
    }

    if (publicUrls.length) {
      await sb.from("listings").update({ cover_image_url: publicUrls[0] }).eq("reference", reference);
      await sb.from("listing_images").delete().eq("reference", reference);
      const rows = publicUrls.slice(1).map((u, idx) => ({ reference, url: u, position: idx + 1 }));
      if (rows.length) await sb.from("listing_images").insert(rows);
    }
    return json({ ok: true, count: publicUrls.length, urls: publicUrls });
  } catch (e) {
    return json({ ok: false, error: String(e) }, 500);
  }
});
