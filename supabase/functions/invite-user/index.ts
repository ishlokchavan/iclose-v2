import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const anonKey     = Deno.env.get('SUPABASE_ANON_KEY')!;
    const webhookSecret = Deno.env.get('WEBHOOK_SECRET') ?? '';
    const webAppUrl   = Deno.env.get('WEB_APP_URL') ?? 'https://academy.iclose.ae';

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user: caller }, error: authErr } = await userClient.auth.getUser();
    if (authErr || !caller) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: callerProfile } = await userClient
      .from('profiles')
      .select('role')
      .eq('id', caller.id)
      .single();

    if (!callerProfile || !['admin', 'manager'].includes(callerProfile.role)) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const email: string    = (body.email    ?? '').trim();
    const fullName: string = (body.full_name ?? '').trim();

    if (!email) {
      return new Response(JSON.stringify({ error: 'Email is required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const adminClient = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // 1. Create auth user (or recover existing record)
    let userId: string | undefined;
    const { data: newUser, error: createErr } = await adminClient.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    });

    if (createErr) {
      const alreadyExists =
        createErr.message.toLowerCase().includes('already') ||
        createErr.message.toLowerCase().includes('exists');
      if (!alreadyExists) throw createErr;

      const { data: existing } = await adminClient.auth.admin.listUsers();
      const found = existing?.users?.find((u) => u.email?.toLowerCase() === email.toLowerCase());
      if (!found) throw createErr;
      userId = found.id;
    } else {
      userId = newUser.user?.id;
    }

    // 2. Set manager role and seed profile (service role bypasses RLS + role-escalation trigger)
    if (userId) {
      const { error: upsertErr } = await adminClient
        .from('profiles')
        .upsert(
          { id: userId, role: 'manager', full_name: fullName || null, email, updated_at: new Date().toISOString() },
          { onConflict: 'id' },
        );
      if (upsertErr) throw new Error(`Profile upsert failed: ${upsertErr.message}`);
    }

    // 3. Generate password-reset URL pointing at the web app
    const { data: linkData, error: linkErr } = await adminClient.auth.admin.generateLink({
      type: 'recovery',
      email,
      options: { redirectTo: `${webAppUrl}/reset-password` },
    });
    if (linkErr) throw linkErr;

    const setPasswordUrl = linkData?.properties?.action_link;
    if (!setPasswordUrl) throw new Error('Failed to generate password-reset link.');

    // 4. Send branded invite email via the Vercel web app
    const mailRes = await fetch(`${webAppUrl}/api/invite`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-webhook-secret': webhookSecret,
      },
      body: JSON.stringify({ email, full_name: fullName, set_password_url: setPasswordUrl }),
    });

    if (!mailRes.ok) {
      const errBody = await mailRes.json().catch(() => ({}));
      throw new Error(`Mail route error ${mailRes.status}: ${JSON.stringify(errBody)}`);
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unexpected error';
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
