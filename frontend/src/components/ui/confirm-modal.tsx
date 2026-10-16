"use client";

import React from "react";
import { AlertTriangle, RotateCcw, Check, X } from "lucide-react";

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "primary" | "warning";
  isLoading?: boolean;
  confirmButtonId?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  isOpen,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "primary",
  isLoading = false,
  confirmButtonId,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="w-full max-w-md rounded-2xl border border-[#EAE7F2] bg-white p-6 shadow-xl space-y-4 animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
                variant === "danger"
                  ? "bg-red-500/10 text-red-600"
                  : variant === "warning"
                  ? "bg-amber-500/10 text-amber-600"
                  : "bg-primary/10 text-primary"
              }`}
            >
              <AlertTriangle size={20} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">{title}</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5 font-medium">
                Operational Confirmation Required
              </p>
            </div>
          </div>

          <button
            onClick={onCancel}
            disabled={isLoading}
            className="text-muted-foreground hover:text-foreground rounded-lg p-1 transition-colors"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        <p className="text-xs text-muted-foreground leading-relaxed bg-[#FAFAFC] border border-border/60 rounded-xl p-3.5">
          {description}
        </p>

        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-border/60">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="aero-btn-secondary text-xs px-3.5 py-2 cursor-pointer disabled:opacity-50"
          >
            {cancelText}
          </button>

          <button
            id={confirmButtonId}
            onClick={onConfirm}
            disabled={isLoading}
            className={`text-xs px-4 py-2 rounded-lg font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm disabled:opacity-50 ${
              variant === "danger"
                ? "bg-red-600 text-white hover:bg-red-700"
                : variant === "warning"
                ? "bg-amber-600 text-white hover:bg-amber-700"
                : "bg-primary text-white hover:bg-primary/90"
            }`}
          >
            {isLoading ? (
              <RotateCcw size={13} className="animate-spin" />
            ) : variant === "primary" ? (
              <Check size={13} />
            ) : null}
            <span>{isLoading ? "Executing..." : confirmText}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
