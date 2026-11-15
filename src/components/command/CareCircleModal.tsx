"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, KeyRound, UserPlus, Check, Phone, Mail } from "lucide-react";
import { CareCircleMember, Role } from "@/types/kincare";

interface CareCircleModalProps {
  isOpen: boolean;
  onClose: () => void;
  careCircle: CareCircleMember[];
  onUpdatePasscode: (memberId: string, newPasscode: string) => Promise<void>;
  onAddMember: (member: Partial<CareCircleMember>) => Promise<void>;
}

export const CareCircleModal: React.FC<CareCircleModalProps> = ({
  isOpen,
  onClose,
  careCircle,
  onUpdatePasscode,
  onAddMember,
}) => {
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [newPin, setNewPin] = useState("");
  const [pinSuccessId, setPinSuccessId] = useState<string | null>(null);
  const [pinError, setPinError] = useState<string | null>(null);

  // Add Member form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState("");
  const [role, setRole] = useState<Role>("FAMILY_ADMIN");
  const [relation, setRelation] = useState("");
  const [email, setEmail] = useState("");
  const [passcode, setPasscode] = useState("4444");

  if (!isOpen) return null;

  const handleSavePin = async (memberId: string) => {
    if (newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
      setPinError("Passcode must be exactly 4 digits");
      return;
    }
    setPinError(null);
    await onUpdatePasscode(memberId, newPin);
    setPinSuccessId(memberId);
    setEditingMemberId(null);
    setNewPin("");
    setTimeout(() => setPinSuccessId(null), 3000);
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    await onAddMember({
      name: name.trim(),
      role,
      relation: relation.trim() || role,
      email: email.trim(),
      passcode: passcode.trim() || "4444",
      permissions: role === "FAMILY_ADMIN" ? ["ALL"] : ["LOG_DOSE", "VIEW_SCHEDULE"],
      avatarBg: role === "FAMILY_ADMIN" ? "bg-indigo-700" : "bg-emerald-700",
    });

    setShowAddForm(false);
    setName("");
    setRelation("");
    setEmail("");
    setPasscode("4444");
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-xl w-full p-6 sm:p-7 relative max-h-[90vh] overflow-y-auto"
        >
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3 mb-6">
            <div className="w-11 h-11 rounded-xl bg-teal-50 text-teal-600 border border-teal-200 flex items-center justify-center">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900">Care Circle & PIN Manager</h3>
              <p className="text-xs text-slate-500">
                Manage authenticated members and rotate 4-digit vault passcodes
              </p>
            </div>
          </div>

          {/* Member List */}
          <div className="space-y-3 mb-6">
            {careCircle.map((member) => {
              const isEditing = editingMemberId === member.id;
              const isSuccess = pinSuccessId === member.id;

              return (
                <div
                  key={member.id}
                  className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition"
                >
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-full ${member.avatarBg || "bg-teal-700"} text-white font-bold text-xs flex items-center justify-center`}
                      >
                        {member.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                          {member.name}
                          <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.2 rounded-full bg-slate-100 text-slate-700">
                            {member.role}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500">{member.relation}</div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-xs font-mono font-bold bg-slate-100 border border-slate-200 px-2 py-0.5 rounded text-slate-800">
                        PIN: {member.passcode}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-slate-500 mt-2 pt-2 border-t border-slate-100">
                    <span className="flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5" />
                      {member.email}
                    </span>
                    {member.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5" />
                        {member.phone}
                      </span>
                    )}
                  </div>

                  {/* Rotate PIN form */}
                  <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                    {isEditing ? (
                      <div className="flex items-center gap-2 w-full">
                        <input
                          type="text"
                          maxLength={4}
                          placeholder="New 4 digits"
                          value={newPin}
                          onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ""))}
                          className="w-28 px-2 py-1 text-xs border border-teal-500 rounded font-mono"
                        />
                        <button
                          onClick={() => handleSavePin(member.id)}
                          className="px-2.5 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded text-xs font-semibold"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => {
                            setEditingMemberId(null);
                            setNewPin("");
                          }}
                          className="px-2 py-1 text-slate-500 text-xs hover:bg-slate-100 rounded"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between w-full">
                        <span className="text-[11px] text-slate-400">
                          {isSuccess ? (
                            <span className="text-emerald-600 font-semibold flex items-center gap-1">
                              <Check className="w-3.5 h-3.5" /> Passcode Rotated!
                            </span>
                          ) : (
                            "Vault Access Active"
                          )}
                        </span>
                        <button
                          onClick={() => {
                            setEditingMemberId(member.id);
                            setNewPin("");
                          }}
                          className="text-xs text-teal-700 hover:text-teal-900 font-semibold underline underline-offset-2"
                        >
                          Rotate PIN
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {pinError && (
            <div className="text-xs text-rose-600 bg-rose-50 border border-rose-200 p-2 rounded-lg mb-4 text-center">
              {pinError}
            </div>
          )}

          {/* Add Member Toggle / Form */}
          {showAddForm ? (
            <form onSubmit={handleAddSubmit} className="border border-teal-200 bg-teal-50/40 rounded-xl p-4 space-y-3">
              <div className="text-xs font-bold uppercase text-teal-800">Add New Circle Member</div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Iyer"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Role</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as Role)}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white"
                  >
                    <option value="FAMILY_ADMIN">Family Admin</option>
                    <option value="CARETAKER">Caretaker</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Relation</label>
                  <input
                    type="text"
                    placeholder="e.g. Son / Primary"
                    value={relation}
                    onChange={(e) => setRelation(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Email</label>
                  <input
                    type="email"
                    required
                    placeholder="ramesh@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">4-digit PIN</label>
                  <input
                    type="text"
                    maxLength={4}
                    value={passcode}
                    onChange={(e) => setPasscode(e.target.value.replace(/\D/g, ""))}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 text-xs bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-semibold"
                >
                  Add Member
                </button>
              </div>
            </form>
          ) : (
            <button
              onClick={() => setShowAddForm(true)}
              className="w-full py-2.5 border border-dashed border-slate-300 hover:border-teal-500 rounded-xl text-xs font-semibold text-slate-600 hover:text-teal-700 flex items-center justify-center gap-1.5 transition"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add Authorized Circle Member</span>
            </button>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
