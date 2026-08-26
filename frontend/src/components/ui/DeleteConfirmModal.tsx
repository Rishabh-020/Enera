import { useState, type ReactNode } from "react";
import { AlertTriangle, Trash2, X, Loader2 } from "lucide-react";
import { Button } from "./primitives";
import { getErrorMessage } from "../../lib/utils";

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  title: string;
  itemName?: string;
  description?: string | ReactNode;
  confirmText?: string;
  dangerNote?: string;
}

export function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  itemName,
  description,
  confirmText = "Delete",
  dangerNote = "This action cannot be undone.",
}: DeleteConfirmModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setError(null);
    setLoading(true);
    try {
      await onConfirm();
      onClose();
    } catch (err) {
      setError(getErrorMessage(err, "Failed to delete. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity animate-fade-in"
        onClick={loading ? undefined : onClose}
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl animate-scale-in z-10">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-50 border border-rose-200/60 text-rose-600 shrink-0">
              <Trash2 size={20} />
            </div>
            <div>
              <h3 className="font-display text-base font-bold text-slate-900">{title}</h3>
              <p className="text-xs text-slate-500 mt-0.5">Please review before continuing</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-3 py-2">
          {description ? (
            <div className="text-sm text-slate-600 leading-relaxed">{description}</div>
          ) : (
            <p className="text-sm text-slate-600 leading-relaxed">
              Are you sure you want to permanently delete{" "}
              {itemName ? <strong className="font-semibold text-slate-900">"{itemName}"</strong> : "this item"}?
            </p>
          )}

          {dangerNote && (
            <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50/70 p-3 text-xs text-amber-800">
              <AlertTriangle size={15} className="text-amber-600 shrink-0" />
              <span>{dangerNote}</span>
            </div>
          )}

          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 font-medium animate-fade-in">
              {error}
            </div>
          )}
        </div>

        <div className="mt-6 flex items-center justify-end gap-2.5 border-t border-slate-100 pt-4">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={loading}
            className="cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleConfirm}
            disabled={loading}
            className="bg-rose-600 hover:bg-rose-700 text-white font-semibold cursor-pointer flex items-center gap-1.5"
          >
            {loading && <Loader2 size={14} className="animate-spin" />}
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
}
