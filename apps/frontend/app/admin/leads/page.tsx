"use client";

import { useEffect, useState } from "react";

interface Lead {
  id: string;
  email: string;
  source: string;
  created_at: string;
}

const SOURCE_LABELS: Record<string, string> = {
  popup: "Discount Popup",
  footer: "Newsletter",
  unknown: "Other",
};

export default function AdminLeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/leads")
      .then((res) => res.json())
      .then((data) => setLeads(data.leads || []))
      .catch(() => setLeads([]))
      .finally(() => setLoading(false));
  }, []);

  const exportCsv = () => {
    const rows = [["Email", "Source", "Date"], ...leads.map((l) => [l.email, l.source, l.created_at])];
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "leads.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return <div className="text-center py-20 text-gray-400">Loading leads...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-display">Leads</h2>
          <p className="text-sm text-gray-500 mt-1">
            {leads.length} email signups from the discount popup and newsletter
          </p>
        </div>
        {leads.length > 0 && (
          <button
            onClick={exportCsv}
            className="bg-secondary text-white text-sm px-4 py-2.5 rounded-lg hover:bg-secondary/90 transition"
          >
            Export CSV
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-400">Email</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-400">Source</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-400">Date</th>
              </tr>
            </thead>
            <tbody>
              {leads.length === 0 ? (
                <tr>
                  <td colSpan={3} className="text-center py-12 text-gray-400">
                    No leads yet. They&apos;ll appear here as visitors sign up via the discount
                    popup or newsletter form.
                  </td>
                </tr>
              ) : (
                leads.map((lead) => (
                  <tr key={lead.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium">{lead.email}</td>
                    <td className="px-6 py-4">
                      <span className="text-xs px-2.5 py-1 rounded-full bg-gold-50 text-gold-600 font-medium">
                        {SOURCE_LABELS[lead.source] || lead.source}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-400">
                      {new Date(lead.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
