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
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full p-6 sm:p-7 relative max-h-[90vh] flex flex-col"
        >
          {/* Close */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="flex items-center gap-3 border-b border-slate-200 pb-4 mb-4">
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 border border-teal-200 flex items-center justify-center">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-900">Email Dispatch Audit Inspector</h3>
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    emailLog.deliveryMode === "LIVE_RESEND"
                      ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                      : "bg-amber-100 text-amber-800 border border-amber-200"
                  }`}
                >
                  {emailLog.deliveryMode}
                </span>
              </div>
              <p className="text-xs text-slate-500">ID: {emailLog.id}</p>
            </div>
          </div>

          {/* Email Metadata Grid */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 mb-4 text-xs space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-medium">To Recipient:</span>
              <span className="font-bold text-slate-900 font-mono">{emailLog.recipientEmail}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-medium">Subject:</span>
              <span className="font-semibold text-slate-900 truncate max-w-sm">{emailLog.subject}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-medium">Workflow Rule:</span>
              <span className="font-semibold text-teal-700">{emailLog.type}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-medium">Dispatched At:</span>
              <span className="text-slate-700">
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
          <div className="flex-1 overflow-y-auto border border-slate-200 rounded-xl p-4 bg-[#fafafa]">
            {emailLog.htmlContent ? (
              <div
                className="email-render-wrapper"
                dangerouslySetInnerHTML={{ __html: emailLog.htmlContent }}
              />
            ) : (
              <div className="text-sm text-slate-700 p-4 bg-white rounded-lg border border-slate-200">
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
