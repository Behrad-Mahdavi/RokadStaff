"use client";

import React, { useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl";
}

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = "md",
}: ModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidthClass = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-2xl",
  }[maxWidth];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Box */}
      <div
        className={cn(
          "relative bg-white dark:bg-[#151C28] w-full rounded-3xl border-2 border-primary/40 shadow-[4px_4px_0_#202A5A] dark:shadow-[4px_4px_0_#59BBAF] p-4 sm:p-6 md:p-7 z-10 animate-in fade-in zoom-in-95 duration-150 max-h-[90dvh] overflow-y-auto text-ink-normal dark:text-gray-100",
          maxWidthClass
        )}
      >
        <div className="flex items-center justify-between pb-3.5 sm:pb-4 border-b border-gray-100 dark:border-gray-800 mb-4 sm:mb-5">
          <h3 className="text-base sm:text-lg font-black text-sec dark:text-white truncate">{title}</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl text-ink-normal/60 dark:text-gray-400 hover:text-ink-normal dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-center transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {children}
      </div>
    </div>
  );
}
