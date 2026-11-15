"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Mail } from "lucide-react";
import { EmailAlertLog } from "@/types/kincare";

interface EmailPreviewModalProps {
  emailLog: EmailAlertLog | null;
  isOpen: boolean;
  onClose: () => void;
}

export const EmailPreviewModal: React.FC<EmailPreviewModalProps> = ({
  emailLog,
  isOpen,
  onClose,
}) => {
  if (!isOpen || !emailLog) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 8 }}
          className="bg-white rounded-3xl border border-slate-100 shadow-2xl max-w-2xl w-full p-8 sm:p-10 relative max-h-[90vh] flex flex-col"
        >
          {/* Close */}
          <button
            onClick={onClose}
            className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="flex items-center gap-3.5 border-b border-slate-100 pb-5 mb-5">
            <div className="w-11 h-11 rounded-full bg-slate-100 text-slate-800 flex items-center justify-center">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">Email Audit Preview</h3>
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                    emailLog.deliveryMode === "LIVE_RESEND"
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-slate-100 text-slate-700"
                  }`}
                >
                  {emailLog.deliveryMode}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">ID: {emailLog.id}</p>
            </div>
          </div>

          {/* Metadata Grid */}
          <div className="bg-slate-50 rounded-2xl p-4.5 mb-5 text-xs space-y-2 ring-1 ring-slate-900/5">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 font-medium">To Recipient:</span>
              <span className="font-bold text-slate-900 font-mono">{emailLog.recipientEmail}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400 font-medium">Subject:</span>
              <span className="font-semibold text-slate-900 truncate max-w-sm">{emailLog.subject}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400 font-medium">Workflow Trigger:</span>
              <span className="font-semibold text-teal-700">{emailLog.type}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400 font-medium">Dispatched At:</span>
              <span className="text-slate-600">
                {new Date(emailLog.sentAt).toLocaleString([], {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                })}
              </span>
            </div>
          </div>

          {/* Rendered HTML Container */}
          <div className="flex-1 overflow-y-auto rounded-2xl p-5 bg-[#fafafa] ring-1 ring-slate-900/5">
            {emailLog.htmlContent ? (
              <div
                className="email-render-wrapper"
                dangerouslySetInnerHTML={{ __html: emailLog.htmlContent }}
              />
            ) : (
              <div className="text-sm text-slate-700 p-5 bg-white rounded-2xl ring-1 ring-slate-900/5">
                <div className="font-bold mb-2">{emailLog.subject}</div>
                <div>{emailLog.bodyPreview}</div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
