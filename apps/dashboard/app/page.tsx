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
      <span
        className={`${base} bg-emerald-50 text-emerald-700 ring-emerald-600/20`}
      >
        STABLE
      </span>
    );
  }

  if (text === "canary") {
    return (
      <span className={`${base} bg-amber-50 text-amber-800 ring-amber-600/20`}>
        CANARY
      </span>
    );
  }

  return (
    <span className={`${base} bg-gray-100 text-gray-700 ring-gray-300`}>
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
          ? `${base} bg-emerald-50 text-emerald-700 ring-emerald-600/20`
          : `${base} bg-red-50 text-red-700 ring-red-600/20`
      }
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          ok ? "bg-emerald-500" : "bg-red-500"
        }`}
      />
      {text}
    </span>
  );
}

function Chip({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="min-w-0 rounded-2xl border border-black/5 bg-white/70 px-4 py-3 shadow-sm">
      <div className="truncate text-[11px] font-medium text-gray-500">
        {label}
      </div>
      <div className="mt-1 text-sm font-semibold text-gray-900">{value}</div>
    </div>
  );
}

/**
 * KV tile: prevents text/labels from overflowing the card.
 * - min-w-0 allows grid children to shrink
 * - overflow-hidden ensures nothing paints outside
 * - truncate label keeps headings inside tile
 * - break-words keeps values from pushing layout
 */
function KV({ k, v }: { k: string; v?: React.ReactNode }) {
  return (
    <div className="min-w-0 overflow-hidden rounded-2xl border border-black/5 bg-white/70 p-4">
      <div className="truncate text-[11px] font-medium text-gray-500">{k}</div>
      <div className="mt-1 break-words text-sm font-semibold text-gray-900">
        {v ?? "—"}
      </div>
    </div>
  );
}

function Sidebar() {
  const item =
    "flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-gray-600 hover:bg-white/70 hover:text-gray-900 transition";
  const active =
    "flex items-center gap-3 rounded-xl px-3 py-2 text-sm bg-white shadow-sm text-gray-900";

  const Dot = () => <span className="h-2 w-2 rounded-full bg-gray-300" />;

  return (
    <aside className="h-full w-[260px] shrink-0 rounded-3xl border border-black/5 bg-white/60 p-4 backdrop-blur shadow-[0_30px_80px_-60px_rgba(0,0,0,.35)]">
      {/* Header + Profile Pic */}
      <div className="flex items-center gap-3 px-2 py-2">
        <div className="relative h-10 w-10 overflow-hidden rounded-2xl ring-1 ring-black/5 bg-white/70">
          <img
            src="/profile.png"
            alt="Profile"
            className="h-full w-full object-cover"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
            }}
          />
          <div className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-gray-600">
            SE
          </div>
        </div>

        <div>
          <div className="text-sm font-semibold tracking-tight">EdgeOps</div>
          <div className="text-xs text-gray-500">Dashboard</div>
        </div>
      </div>

      <div className="mt-6 space-y-1">
        <a className={active} href="#">
          <Dot /> Overview
        </a>
        <a className={item} href="#api">
          <Dot /> API
        </a>
      </div>

      <div className="mt-8 rounded-2xl border border-black/5 bg-white/70 p-3">
        <div className="text-xs font-medium text-gray-500">Tip</div>
        <div className="mt-1 text-xs text-gray-600">
          Validate canary by hitting{" "}
          <span className="font-mono">/api/version</span>.
        </div>
      </div>
    </aside>
  );
}

export default function Home() {
  const [health, setHealth] = useState<ApiStatus | null>(null);
  const [version, setVersion] = useState<ApiStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Frontend (blue/green) marker fetched from the active CloudFront origin
  const [frontendColor, setFrontendColor] = useState<string>("unknown");

  // Prod: leave NEXT_PUBLIC_API_BASE unset to call /api/* on same domain (CloudFront).
  // Dev: set NEXT_PUBLIC_API_BASE=http://localhost:3001 in .env.local
  const apiBase = process.env.NEXT_PUBLIC_API_BASE || "";

  useEffect(() => {
    let cancelled = false;

    async function load() {
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

        if (!cancelled) {
          setHealth(h);
          setVersion(v);
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "Failed to fetch API");
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [apiBase]);

  // Fetch frontend.json from the current (active) dashboard origin
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
      } catch {
        // keep unknown on failures
      }
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
    "rounded-3xl border border-black/5 bg-white/70 backdrop-blur shadow-[0_20px_60px_-45px_rgba(0,0,0,.35)]";

  const healthOk =
    !error &&
    (health?.status?.toLowerCase() === "ok" ||
      health?.status?.toLowerCase() === "healthy");

  const apiHostLabel =
    process.env.NODE_ENV === "development"
      ? apiBase.replace(/^https?:\/\//, "") || "localhost"
      : "via CloudFront";

  return (
    // ✅ Forces full-viewport app shell regardless of any parent constraints
    <div className="fixed inset-0 bg-[#efefef]">
      <div className="h-full w-full p-6">
        <div className="grid h-full gap-6 grid-cols-[260px_minmax(0,1fr)]">
          <Sidebar />

          {/* ✅ Fill remaining height and scroll inside */}
          <section className="h-full overflow-auto rounded-3xl border border-black/5 bg-white/40 p-8 shadow-[0_30px_80px_-60px_rgba(0,0,0,.35)]">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div className="min-w-0">
                <h1 className="text-3xl font-semibold tracking-tight text-gray-900">
                  EdgeOps <span className="text-gray-400">overview</span>
                </h1>
                <p className="mt-2 text-sm text-gray-600">
                  Minimal console for environment + API health (Stable + Canary).
                </p>
              </div>

              <div className="flex flex-wrap gap-3 md:justify-end">
                <div className="w-[180px]">
                  <Chip label="Environment" value={env} />
                </div>

                <div className="w-[180px]">
                  <Chip
                    label="Frontend"
                    value={
                      frontendColor === "unknown" ? (
                        <StatusPill ok={false} text="UNKNOWN" />
                      ) : (
                        <StatusPill
                          ok={true}
                          text={frontendColor.toUpperCase()}
                        />
                      )
                    }
                  />
                </div>

                <div className="w-[180px]">
                  <Chip
                    label="API Deployment"
                    value={
                      deployment === "—" ? (
                        "—"
                      ) : (
                        <Badge text={String(deployment)} />
                      )
                    }
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 h-px w-full bg-black/5" />

            <div id="api" className="mt-8 grid gap-6 lg:grid-cols-2">
              <div className={`${card} p-6`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-gray-900">
                      API Health
                    </div>
                    <div className="mt-1 truncate text-xs text-gray-500">
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
                  <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                    {error}
                  </div>
                )}

                {!error && !health && (
                  <div className="mt-4 text-sm text-gray-500">
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
                        <span className="font-mono text-xs break-all">
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
                    <div className="text-sm font-semibold text-gray-900">
                      API Version
                    </div>
                    <div className="mt-1 text-xs text-gray-500">Details</div>
                  </div>
                  {version?.deployment ? (
                    <Badge text={version.deployment} />
                  ) : (
                    <Badge text="—" />
                  )}
                </div>

                {!version && !error && (
                  <div className="mt-4 text-sm text-gray-500">
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
                      <span className="font-mono text-xs break-all">
                        {version?.commit ?? "—"}
                      </span>
                    }
                  />
                  <KV
                    k="Timestamp"
                    v={
                      <span className="font-mono text-xs break-all">
                        {version?.timestamp ?? "—"}
                      </span>
                    }
                  />
                  <div className="sm:col-span-2">
                    <KV
                      k="Request ID"
                      v={
                        <span className="font-mono text-xs break-all">
                          {version?.request_id ?? "—"}
                        </span>
                      }
                    />
                  </div>
                </div>

                <details className="mt-4">
                  <summary className="cursor-pointer select-none text-xs font-medium text-gray-600 hover:text-gray-900">
                    View raw JSON
                  </summary>
                  <pre className="mt-3 max-h-[240px] overflow-auto rounded-2xl border border-black/5 bg-white/70 p-4 text-xs text-gray-700">
                    {JSON.stringify(version ?? {}, null, 2)}
                  </pre>
                </details>
              </div>
            </div>

            <div className="mt-8 border-t border-black/5 pt-6 text-xs text-gray-500">
              Powered by{" "}
              <span className="font-medium text-gray-700">
                CloudFront + Lambda aliases
              </span>
              . Validate canary with{" "}
              <code className="rounded border border-black/5 bg-white/70 px-1 py-0.5 text-gray-700">
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
