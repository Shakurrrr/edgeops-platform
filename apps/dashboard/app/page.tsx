"use client";

import { useEffect, useMemo, useState } from "react";

type ApiStatus = {
  status?: string;
  service?: string;
  version?: string;
  deployment?: string;
  commit?: string;
  environment?: string;
  timestamp?: string;
  request_id?: string;
};

type FrontendMarker = {
  color?: string;
};

function Badge({ text }: { text: string }) {
  const base =
    "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset";

  if (text === "stable") {
    return (
      <span className={`${base} bg-cyan-500/10 text-cyan-200 ring-cyan-400/20`}>
        STABLE
      </span>
    );
  }

  if (text === "canary") {
    return (
      <span
        className={`${base} bg-fuchsia-500/10 text-fuchsia-200 ring-fuchsia-400/20`}
      >
        CANARY
      </span>
    );
  }

  return (
    <span className={`${base} bg-white/5 text-white/70 ring-white/10`}>
      {text.toUpperCase()}
    </span>
  );
}

function StatusPill({ ok, text }: { ok: boolean; text: string }) {
  const base =
    "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset";

  return (
    <span
      className={
        ok
          ? `${base} bg-cyan-500/10 text-cyan-200 ring-cyan-400/20`
          : `${base} bg-rose-500/10 text-rose-200 ring-rose-400/20`
      }
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          ok ? "bg-cyan-300" : "bg-rose-300"
        }`}
      />
      {text}
    </span>
  );
}

function Chip({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="min-w-0 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 shadow-sm backdrop-blur-xl">
      <div className="truncate text-[11px] font-medium text-white/50">
        {label}
      </div>
      <div className="mt-1 text-sm font-semibold text-white">{value}</div>
    </div>
  );
}

function KV({ k, v }: { k: string; v?: React.ReactNode }) {
  return (
    <div className="min-w-0 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-xl">
      <div className="truncate text-[11px] font-medium text-white/50">{k}</div>
      <div className="mt-1 break-words text-sm font-semibold text-white">
        {v ?? "—"}
      </div>
    </div>
  );
}

function Button({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-medium text-white/80 hover:bg-white/10 hover:text-white transition"
    >
      {children}
    </button>
  );
}

function CodeBlock({ text }: { text: string }) {
  return (
    <pre className="overflow-auto rounded-2xl border border-white/10 bg-black/30 p-4 text-xs text-white/70">
      <code>{text}</code>
    </pre>
  );
}

function Sidebar() {
  const item =
    "flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-white/60 hover:bg-white/5 hover:text-white transition";
  const active =
    "flex items-center gap-3 rounded-xl px-3 py-2 text-sm bg-white/10 border border-white/10 text-white";

  const Dot = () => <span className="h-2 w-2 rounded-full bg-white/25" />;

  return (
    <aside className="h-full w-[260px] shrink-0 rounded-3xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-xl shadow-[0_30px_80px_-60px_rgba(0,0,0,.75)]">
      <div className="flex items-center gap-3 px-2 py-2">
        <div className="relative h-10 w-10 overflow-hidden rounded-2xl ring-1 ring-white/10 bg-white/[0.04]">
          <img
            src="/profile.png"
            alt="Profile"
            className="h-full w-full object-cover"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
            }}
          />
          <div className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-white/70">
            SE
          </div>
        </div>

        <div>
          <div className="text-sm font-semibold tracking-tight text-white">
            EdgeOps
          </div>
          <div className="text-xs text-white/40">Dashboard</div>
        </div>
      </div>

      <div className="mt-6 space-y-1">
        <a className={active} href="#">
          <Dot /> Overview
        </a>
        <a className={item} href="#api">
          <Dot /> API
        </a>
        <a className={item} href="#runbook">
          <Dot /> Runbook
        </a>
      </div>

      <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.04] p-3 backdrop-blur-xl">
        <div className="text-xs font-medium text-white/50">Tip</div>
        <div className="mt-1 text-xs text-white/60">
          Validate canary by hitting{" "}
          <span className="font-mono text-white/80">/api/version</span>.
        </div>
      </div>
    </aside>
  );
}

export default function Home() {
  const [health, setHealth] = useState<ApiStatus | null>(null);
  const [version, setVersion] = useState<ApiStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [frontendColor, setFrontendColor] = useState<string>("unknown");
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);

  const apiBase = process.env.NEXT_PUBLIC_API_BASE || "";

  async function loadAll() {
    try {
      setError(null);

      const [hRes, vRes] = await Promise.all([
        fetch(`${apiBase}/api/health`, { cache: "no-store" }),
        fetch(`${apiBase}/api/version`, { cache: "no-store" }),
      ]);

      if (!hRes.ok) throw new Error(`Health failed: ${hRes.status}`);
      if (!vRes.ok) throw new Error(`Version failed: ${vRes.status}`);

      const h = (await hRes.json()) as ApiStatus;
      const v = (await vRes.json()) as ApiStatus;

      setHealth(h);
      setVersion(v);
    } catch (e: any) {
      setError(e?.message || "Failed to fetch API");
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function boot() {
      if (cancelled) return;
      await loadAll();
    }

    boot();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiBase]);

  useEffect(() => {
    if (!autoRefresh) return;

    const t = setInterval(() => {
      loadAll();
    }, 8000);

    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRefresh]);

  useEffect(() => {
    let cancelled = false;

    async function loadFrontendMarker() {
      try {
        const res = await fetch("/frontend.json", { cache: "no-store" });
        if (!res.ok) return;

        const data = (await res.json()) as FrontendMarker;
        const color = data?.color ? String(data.color).toLowerCase() : "";

        if (!cancelled) {
          setFrontendColor(
            color === "blue" || color === "green" ? color : "unknown"
          );
        }
      } catch {}
    }

    loadFrontendMarker();
    return () => {
      cancelled = true;
    };
  }, []);

  const env = useMemo(
    () => health?.environment || version?.environment || "dev",
    [health, version]
  );

  const deployment = useMemo(
    () => version?.deployment || health?.deployment || "—",
    [health, version]
  );

  const card =
    "rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl shadow-[0_20px_60px_-45px_rgba(0,0,0,.75)]";

  const healthOk =
    !error &&
    (health?.status?.toLowerCase() === "ok" ||
      health?.status?.toLowerCase() === "healthy");

  const apiHostLabel =
    process.env.NODE_ENV === "development"
      ? apiBase.replace(/^https?:\/\//, "") || "localhost"
      : "via CloudFront";

  const cfBase =
    typeof window !== "undefined"
      ? `${window.location.protocol}//${window.location.host}`
      : "";

  const curlDirect = `curl ${cfBase}/api/version`;
  const curlLoop = `for i in {1..25}; do curl -s ${cfBase}/api/version | jq -r '.deployment' ; done | sort | uniq -c`;

  const whatThisProves = [
    "Single edge entry point via CloudFront: / serves the dashboard; /api/* is routed to API Gateway → Lambda.",
    "Progressive delivery visibility: /api/version returns deployment identity (stable/canary) + version + request id.",
    "Blue/green frontend marker: frontend.json is served from the active S3 origin (blue or green).",
    "Operations mindset: rollouts are validated under real HTTP traffic, not just ‘terraform apply’ screenshots.",
  ];

  const runbook = [
    {
      title: "Baseline checks",
      items: [
        "Open dashboard and confirm Environment + Frontend color.",
        "Hit /api/health and confirm status is OK.",
        "Hit /api/version and confirm deployment identity is visible.",
      ],
    },
    {
      title: "Canary validation",
      items: [
        "Set canary_weight (e.g. 0.1) and apply Terraform.",
        "Refresh a few times and confirm some responses show CANARY.",
        "If errors/latency spike, set canary_weight=0 and rollback.",
      ],
    },
    {
      title: "Blue/green frontend",
      items: [
        "Deploy build to inactive bucket (blue/green).",
        "Flip active_dashboard_color and validate visual changes.",
        "Rollback by switching active_dashboard_color back.",
      ],
    },
  ];

  return (
    <div className="fixed inset-0 bg-[#070A12]">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 -left-40 h-[520px] w-[520px] rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="absolute top-1/3 -right-40 h-[520px] w-[520px] rounded-full bg-fuchsia-500/15 blur-3xl" />
        <div className="absolute bottom-[-200px] left-1/3 h-[520px] w-[520px] rounded-full bg-cyan-500/10 blur-3xl" />
      </div>

      <div className="relative h-full w-full p-6">
        <div className="grid h-full gap-6 grid-cols-[260px_minmax(0,1fr)]">
          <Sidebar />

          <section className="h-full overflow-auto rounded-3xl border border-white/10 bg-white/[0.04] p-8 backdrop-blur-xl shadow-[0_30px_80px_-60px_rgba(0,0,0,.75)]">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div className="min-w-0">
                <h1 className="text-3xl font-semibold tracking-tight text-white">
                  EdgeOps <span className="text-white/40">overview</span>
                </h1>
                <p className="mt-2 text-sm text-white/60">
                  Minimal console for environment + API health (Stable + Canary).
                </p>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <Button onClick={() => loadAll()}>Refresh</Button>
                  <Button onClick={() => setAutoRefresh((v) => !v)}>
                    Auto-refresh: {autoRefresh ? "ON" : "OFF"}
                  </Button>
                  <Button
                    onClick={() => {
                      navigator.clipboard?.writeText(`${cfBase}/api/version`);
                    }}
                  >
                    Copy /api/version
                  </Button>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 md:justify-end">
                <div className="w-[200px]">
                  <Chip label="Environment" value={env} />
                </div>

                <div className="w-[200px]">
                  <Chip
                    label="Frontend"
                    value={
                      frontendColor === "unknown" ? (
                        <StatusPill ok={false} text="UNKNOWN" />
                      ) : (
                        <StatusPill ok={true} text={frontendColor.toUpperCase()} />
                      )
                    }
                  />
                </div>

                <div className="w-[200px]">
                  <Chip
                    label="API Deployment"
                    value={deployment === "—" ? "—" : <Badge text={String(deployment)} />}
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 h-px w-full bg-white/10" />

            {/* Top row: status cards */}
            <div id="api" className="mt-8 grid gap-6 lg:grid-cols-2">
              <div className={`${card} p-6`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-white">
                      API Health
                    </div>
                    <div className="mt-1 truncate text-xs text-white/40">
                      {apiHostLabel}
                    </div>
                  </div>

                  {error ? (
                    <StatusPill ok={false} text="Failed" />
                  ) : !health ? (
                    <StatusPill ok={true} text="Loading…" />
                  ) : (
                    <StatusPill
                      ok={!!healthOk}
                      text={healthOk ? "Healthy" : health.status || "Unknown"}
                    />
                  )}
                </div>

                {error && (
                  <div className="mt-4 rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-200">
                    {error}
                  </div>
                )}

                {!error && !health && (
                  <div className="mt-4 text-sm text-white/50">
                    Loading health status…
                  </div>
                )}

                {health && (
                  <div className="mt-5 grid grid-cols-2 gap-4">
                    <KV k="Status" v={health.status || "—"} />
                    <KV k="Service" v={health.service || "—"} />
                    <KV k="Version" v={health.version || "—"} />
                    <KV
                      k="Request ID"
                      v={
                        <span className="font-mono text-xs break-all text-white/80">
                          {health.request_id || "—"}
                        </span>
                      }
                    />
                  </div>
                )}
              </div>

              <div className={`${card} p-6`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-white">
                      API Version
                    </div>
                    <div className="mt-1 text-xs text-white/40">Details</div>
                  </div>
                  {version?.deployment ? (
                    <Badge text={version.deployment} />
                  ) : (
                    <Badge text="—" />
                  )}
                </div>

                {!version && !error && (
                  <div className="mt-4 text-sm text-white/50">
                    Loading version…
                  </div>
                )}

                <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <KV k="Service" v={version?.service} />
                  <KV k="Version" v={version?.version} />
                  <KV
                    k="Deployment"
                    v={
                      version?.deployment ? (
                        <Badge text={version.deployment} />
                      ) : (
                        "—"
                      )
                    }
                  />
                  <KV k="Environment" v={version?.environment} />
                  <KV
                    k="Commit"
                    v={
                      <span className="font-mono text-xs break-all text-white/80">
                        {version?.commit ?? "—"}
                      </span>
                    }
                  />
                  <KV
                    k="Timestamp"
                    v={
                      <span className="font-mono text-xs break-all text-white/80">
                        {version?.timestamp ?? "—"}
                      </span>
                    }
                  />
                  <div className="sm:col-span-2">
                    <KV
                      k="Request ID"
                      v={
                        <span className="font-mono text-xs break-all text-white/80">
                          {version?.request_id ?? "—"}
                        </span>
                      }
                    />
                  </div>
                </div>

                <details className="mt-4">
                  <summary className="cursor-pointer select-none text-xs font-medium text-white/60 hover:text-white">
                    View raw JSON
                  </summary>
                  <pre className="mt-3 max-h-[240px] overflow-auto rounded-2xl border border-white/10 bg-black/30 p-4 text-xs text-white/70">
                    {JSON.stringify(version ?? {}, null, 2)}
                  </pre>
                </details>
              </div>
            </div>

            {/* New row: narrative + commands */}
            <div className="mt-6 grid gap-6 xl:grid-cols-3">
              <div className={`${card} p-6 xl:col-span-2`}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold text-white">
                      What this dashboard proves
                    </div>
                    <div className="mt-1 text-xs text-white/40">
                      The “platform engineering” story in one screen.
                    </div>
                  </div>
                  <Badge text={deployment === "—" ? "stable" : String(deployment)} />
                </div>

                <ul className="mt-4 space-y-3 text-sm text-white/70">
                  {whatThisProves.map((x) => (
                    <li key={x} className="flex gap-3">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-300/70" />
                      <span>{x}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4 text-xs text-white/60">
                  <span className="font-medium text-white/70">Signal design:</span>{" "}
                  request_id is generated per request so you can verify traffic
                  splitting under real HTTP load without guessing.
                </div>
              </div>

              <div className={`${card} p-6`}>
                <div className="text-sm font-semibold text-white">Quick actions</div>
                <div className="mt-1 text-xs text-white/40">
                  Copy/paste validation commands.
                </div>

                <div className="mt-4 space-y-3">
                  <div>
                    <div className="text-xs font-medium text-white/60">
                      Single request
                    </div>
                    <CodeBlock text={curlDirect} />
                    <div className="mt-2">
                      <Button
                        onClick={() =>
                          navigator.clipboard?.writeText(curlDirect)
                        }
                      >
                        Copy command
                      </Button>
                    </div>
                  </div>

                  <div>
                    <div className="text-xs font-medium text-white/60">
                      Sample 25 responses (requires jq)
                    </div>
                    <CodeBlock text={curlLoop} />
                    <div className="mt-2">
                      <Button
                        onClick={() => navigator.clipboard?.writeText(curlLoop)}
                      >
                        Copy command
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Runbook */}
            <div id="runbook" className="mt-6">
              <div className={`${card} p-6`}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold text-white">
                      Runbook: validation checklist
                    </div>
                    <div className="mt-1 text-xs text-white/40">
                      Use this during demos and rollouts.
                    </div>
                  </div>
                  <StatusPill ok={!error} text={!error ? "Ready" : "Investigate"} />
                </div>

                <div className="mt-5 grid gap-6 lg:grid-cols-3">
                  {runbook.map((section) => (
                    <div
                      key={section.title}
                      className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
                    >
                      <div className="text-xs font-semibold text-white">
                        {section.title}
                      </div>
                      <ul className="mt-3 space-y-2 text-sm text-white/70">
                        {section.items.map((i) => (
                          <li key={i} className="flex gap-3">
                            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-fuchsia-300/70" />
                            <span>{i}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>

                <div className="mt-6 border-t border-white/10 pt-4 text-xs text-white/50">
                  Pro tip: Keep CloudFront <span className="font-mono">index.html</span>{" "}
                  uncached and cache hashed assets long-term. That prevents “stale UI”
                  during rollouts.
                </div>
              </div>
            </div>

            <div className="mt-8 border-t border-white/10 pt-6 text-xs text-white/50">
              Powered by{" "}
              <span className="font-medium text-white/70">
                CloudFront + Lambda aliases
              </span>
              . Validate canary with{" "}
              <code className="rounded border border-white/10 bg-white/[0.04] px-1 py-0.5 text-white/70">
                /api/version
              </code>
              .
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
