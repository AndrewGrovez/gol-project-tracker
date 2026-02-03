"use client";

import React, { useEffect, useMemo, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import type { ProjectDocument } from "@/types/database.types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ExternalLink, FileSpreadsheet, FileText, Link2, Trash2 } from "lucide-react";

interface ProjectDocumentsProps {
  projectId: string;
}

type DocumentKind = "doc" | "sheet" | "unknown";

const normalizeUrl = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
};

const classifyGoogleDoc = (value: string): DocumentKind => {
  try {
    const parsed = new URL(value);
    if (parsed.hostname !== "docs.google.com") return "unknown";
    if (parsed.pathname.includes("/spreadsheets/")) return "sheet";
    if (parsed.pathname.includes("/document/")) return "doc";
    return "unknown";
  } catch {
    return "unknown";
  }
};

const getDocumentMeta = (url: string) => {
  const kind = classifyGoogleDoc(url);
  if (kind === "sheet") {
    return {
      label: "Google Sheet",
      Icon: FileSpreadsheet,
      iconClasses: "bg-emerald-500/15 text-emerald-600",
    };
  }
  if (kind === "doc") {
    return {
      label: "Google Doc",
      Icon: FileText,
      iconClasses: "bg-sky-500/15 text-sky-700",
    };
  }
  return {
    label: "Google file",
    Icon: Link2,
    iconClasses: "bg-slate-200/70 text-slate-600",
  };
};

export default function ProjectDocuments({ projectId }: ProjectDocumentsProps) {
  const supabase = useMemo(() => createClient(), []);
  const [documents, setDocuments] = useState<ProjectDocument[]>([]);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDocuments() {
      try {
        setLoading(true);
        setListError(null);

        const { data, error } = await supabase
          .from("project_documents")
          .select("*")
          .eq("project_id", projectId)
          .order("created_at", { ascending: false });

        if (error) throw error;
        setDocuments(data || []);
      } catch (error) {
        console.error("Error fetching project documents:", error);
        setListError("Unable to load documents right now.");
      } finally {
        setLoading(false);
      }
    }

    fetchDocuments();
  }, [projectId, supabase]);

  const handleAddDocument = async (event: React.FormEvent) => {
    event.preventDefault();
    setFormError(null);

    const trimmedTitle = title.trim();
    const normalizedUrl = normalizeUrl(url);
    const kind = classifyGoogleDoc(normalizedUrl);

    if (!trimmedTitle) {
      setFormError("Add a short title so teammates know what this file is.");
      return;
    }

    if (!normalizedUrl) {
      setFormError("Paste a Google Docs or Sheets link.");
      return;
    }

    if (kind === "unknown") {
      setFormError("Use a Google Docs or Sheets link from docs.google.com.");
      return;
    }

    try {
      setSaving(true);
      const { data, error } = await supabase
        .from("project_documents")
        .insert([
          {
            project_id: projectId,
            title: trimmedTitle,
            url: normalizedUrl,
          },
        ])
        .select()
        .single();

      if (error) throw error;
      if (data) {
        setDocuments((current) => [data, ...current]);
        setTitle("");
        setUrl("");
      }
    } catch (error) {
      console.error("Error adding project document:", error);
      setFormError("Unable to add that link. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    if (!confirm("Remove this document from the project?")) return;
    try {
      const { error } = await supabase.from("project_documents").delete().eq("id", documentId);
      if (error) throw error;
      setDocuments((current) => current.filter((doc) => doc.id !== documentId));
    } catch (error) {
      console.error("Error deleting project document:", error);
      setFormError("Unable to remove that link. Please try again.");
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-[#09162a]">Docs & Sheets</h2>
          <p className="text-sm text-slate-500">
            Attach Google Docs or Sheets so everyone has quick access.
          </p>
        </div>
      </div>

      <form onSubmit={handleAddDocument} className="mt-6 grid gap-4 lg:grid-cols-[1.2fr_2fr_auto]">
        <div className="space-y-2">
          <label htmlFor="doc-title" className="text-sm font-medium text-slate-700">
            Title
          </label>
          <Input
            id="doc-title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Launch plan, budget tracker"
            required
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="doc-url" className="text-sm font-medium text-slate-700">
            Google Docs/Sheets link
          </label>
          <Input
            id="doc-url"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder="https://docs.google.com/spreadsheets/d/..."
            required
          />
          <p className="text-xs text-slate-500">
            Tip: use a share link from docs.google.com to keep the type badge accurate.
          </p>
        </div>
        <div className="flex items-end">
          <Button type="submit" disabled={saving}>
            {saving ? "Adding..." : "Attach"}
          </Button>
        </div>
      </form>

      {formError ? (
        <div className="mt-3 rounded-xl border border-rose-100 bg-rose-50/80 px-4 py-2 text-sm text-rose-600">
          {formError}
        </div>
      ) : null}

      <div className="mt-6 space-y-3">
        {loading ? (
          <div className="rounded-2xl border border-emerald-100/70 bg-white/90 p-4 text-sm text-slate-500 shadow-sm">
            Loading documents...
          </div>
        ) : documents.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-emerald-200/70 bg-white/85 p-4 text-sm text-slate-500">
            No linked documents yet. Add a Google Doc or Sheet to share with the team.
          </div>
        ) : (
          documents.map((doc) => {
            const meta = getDocumentMeta(doc.url);
            const Icon = meta.Icon;
            return (
              <div
                key={doc.id}
                className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-emerald-100/70 bg-white/90 p-4 shadow-sm"
              >
                <div className="flex items-start gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${meta.iconClasses}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#09162a]">{doc.title}</p>
                    <p className="mt-1 text-xs text-slate-500">{meta.label}</p>
                    <a
                      href={doc.url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1 inline-flex items-center gap-1 text-xs text-[#81bb26] hover:text-[#74a822]"
                    >
                      Open link
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-rose-500 hover:bg-rose-50 hover:text-rose-600"
                    onClick={() => handleDeleteDocument(doc.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })
        )}
        {listError ? (
          <div className="rounded-xl border border-rose-100 bg-rose-50/80 px-4 py-2 text-sm text-rose-600">
            {listError}
          </div>
        ) : null}
      </div>
    </div>
  );
}
