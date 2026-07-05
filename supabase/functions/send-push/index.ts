import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "jsr:@supabase/supabase-js@2"
// @deno-types="npm:@types/web-push@3.6.4"
import webpush from "npm:web-push@3.6.7"

const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY")!
const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY")!
const VAPID_EMAIL = Deno.env.get("VAPID_EMAIL") ?? "mailto:noreply.iclose@gmail.com"
const WEBHOOK_SECRET = Deno.env.get("WEBHOOK_SECRET") ?? ""

webpush.setVapidDetails(VAPID_EMAIL, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)

Deno.serve(async (req: Request) => {
  if (WEBHOOK_SECRET && req.headers.get("x-webhook-secret") !== WEBHOOK_SECRET) {
    return new Response("Unauthorized", { status: 401 })
  }

  try {
    const payload = await req.json()
    const notification = payload.record
    if (!notification?.user_id) {
      return new Response("no user_id", { status: 400 })
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    )

    const { data: subs } = await supabase
      .from("push_subscriptions")
      .select("endpoint, p256dh, auth")
      .eq("user_id", notification.user_id)

    if (!subs?.length) {
      return new Response("no subscriptions", { status: 200 })
    }

    const pushPayload = JSON.stringify({
      title: notification.title,
      body: notification.body,
      url: notification.entity_url ?? "/",
      icon: "/icons/icon-192.png",
    })

    const results = await Promise.allSettled(
      subs.map((sub) =>
        webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          pushPayload
        )
      )
    )

    const expiredEndpoints = subs
      .filter((_, i) => {
        const r = results[i]
        return r?.status === "rejected" && (r as PromiseRejectedResult).reason?.statusCode === 410
      })
      .map((s) => s.endpoint)

    if (expiredEndpoints.length) {
      await supabase.from("push_subscriptions").delete().in("endpoint", expiredEndpoints)
    }

    return new Response(JSON.stringify({ sent: subs.length - expiredEndpoints.length }), {
      headers: { "Content-Type": "application/json" },
    })
  } catch (err) {
    console.error("send-push error:", err)
    return new Response("error", { status: 500 })
  }
})
