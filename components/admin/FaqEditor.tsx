"use client";

import { useState } from "react";
import { GripVertical, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AdminButton } from "./AdminShell";

type Faq = {
  question: string;
  answer: string;
  sortOrder: number;
  active: boolean;
};

/** FAQ content shown on the homepage, customize page and contact page. */
export function FaqEditor({ initial }: { initial: Faq[] }) {
  const [faqs, setFaqs] = useState<Faq[]>(initial);
  const [saving, setSaving] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const update = (index: number, patch: Partial<Faq>) =>
    setFaqs((current) =>
      current.map((faq, i) => (i === index ? { ...faq, ...patch } : faq)),
    );

  const move = (from: number, to: number) => {
    if (to < 0 || to >= faqs.length) return;
    const next = [...faqs];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    setFaqs(next);
  };

  const save = async () => {
    setSaving(true);
    try {
      const payload = faqs
        .filter((faq) => faq.question.trim() && faq.answer.trim())
        .map((faq, index) => ({ ...faq, sortOrder: index }));

      const response = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ faqs: payload }),
      });
      const result = await response.json();
      if (!response.ok || !result?.ok) {
        throw new Error(result?.error ?? "Could not save FAQs.");
      }
      setFaqs(payload);
      toast.success("FAQs saved");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <ul className="space-y-3">
        {faqs.map((faq, index) => (
          <li
            key={index}
            draggable
            onDragStart={() => setDragIndex(index)}
            onDragOver={(event) => event.preventDefault()}
            onDrop={() => {
              if (dragIndex != null && dragIndex !== index)
                move(dragIndex, index);
              setDragIndex(null);
            }}
            className="rounded-lg border border-[#e3e8ef] bg-white p-4"
          >
            <div className="flex items-start gap-2">
              <span
                aria-hidden
                className="mt-2 cursor-grab text-[#cbd5e1] active:cursor-grabbing"
              >
                <GripVertical className="size-4" />
              </span>
              <div className="min-w-0 flex-1 space-y-2">
                <input
                  value={faq.question}
                  onChange={(event) =>
                    update(index, { question: event.target.value })
                  }
                  placeholder="Question"
                  aria-label={`Question ${index + 1}`}
                  className="admin-field font-medium"
                />
                <textarea
                  value={faq.answer}
                  onChange={(event) =>
                    update(index, { answer: event.target.value })
                  }
                  placeholder="Answer"
                  aria-label={`Answer ${index + 1}`}
                  rows={3}
                  className="admin-field resize-y"
                />
                <label className="flex items-center gap-2 text-[12.5px]">
                  <input
                    type="checkbox"
                    checked={faq.active}
                    onChange={(event) =>
                      update(index, { active: event.target.checked })
                    }
                    className="size-4 accent-[#16324f]"
                  />
                  Show on the site
                </label>
              </div>
              <button
                type="button"
                onClick={() => setFaqs(faqs.filter((_, i) => i !== index))}
                aria-label={`Remove question ${index + 1}`}
                className="grid size-8 flex-none place-items-center rounded-lg text-[#b3261e] hover:bg-[#fee2e2]"
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-4 flex flex-wrap justify-between gap-2">
        <AdminButton
          type="button"
          variant="secondary"
          onClick={() =>
            setFaqs([
              ...faqs,
              {
                question: "",
                answer: "",
                sortOrder: faqs.length,
                active: true,
              },
            ])
          }
        >
          <Plus className="size-4" />
          Add question
        </AdminButton>
        <AdminButton
          type="button"
          disabled={saving}
          onClick={() => void save()}
        >
          {saving ? "Saving…" : "Save FAQs"}
        </AdminButton>
      </div>
    </div>
  );
}
