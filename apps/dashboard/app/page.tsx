"use client";

import { useEffect, useState } from "react";

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

export default function Home() {
  const [health, setHealth] = useState<ApiStatus | null>(null);
  const [version, setVersion] = useState<ApiStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  const apiBase = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:3001";

  useEffect(() => {
    async function load() {
      try {
        const h = await fetch(`${apiBase}/api/health`).then(r => r.json());
        const v = await fetch(`${apiBase}/api/version`).then(r => r.json());
        setHealth(h);
        setVersion(v);
      } catch (e: any) {
        setError(e.message || "Failed to fetch API");
      }
    }
    load();
  }, [apiBase]);

  return (
    <main className="p-8 max-w-4xl mx-auto space-y-6">
      <header>
        <h1 className="text-3xl font-bold">EdgeOps Dashboard</h1>
        <p className="text-gray-600">
          Reference workload for validating safe deployments
        </p>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="border rounded-xl p-4">
          <h2 className="font-semibold">Frontend</h2>
          <p className="text-sm text-gray-600">Version: v0.1.0</p>
          <p className="text-sm text-gray-600">Environment: dev</p>
        </div>

        <div className="border rounded-xl p-4">
          <h2 className="font-semibold">API Health</h2>
          {error && <p className="text-red-600 text-sm">{error}</p>}
          {!error && !health && <p className="text-sm">Loading...</p>}
          {health && (
            <ul className="text-sm text-gray-700 mt-2 space-y-1">
              <li>Status: {health.status}</li>
              <li>Service: {health.service}</li>
              <li>Version: {health.version}</li>
              <li>Deployment: {health.deployment}</li>
              <li>Environment: {health.environment}</li>
            </ul>
          )}
        </div>
      </section>

      <section className="border rounded-xl p-4">
        <h2 className="font-semibold">API Version</h2>
        {!version && <p className="text-sm">Loading...</p>}
        {version && (
          <pre className="text-xs bg-gray-100 p-3 rounded-lg overflow-x-auto mt-2">
            {JSON.stringify(version, null, 2)}
          </pre>
        )}
      </section>
    </main>
  );
}
