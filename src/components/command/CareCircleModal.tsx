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
          initial={{ opacity: 0, scale: 0.96, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 8 }}
          className="bg-white rounded-3xl shadow-[0_25px_60px_rgb(0,0,0,0.14)] ring-1 ring-slate-900/5 max-w-xl w-full p-8 sm:p-10 relative max-h-[90vh] overflow-y-auto"
        >
          <button
            onClick={onClose}
            className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3.5 mb-6">
            <div className="w-11 h-11 rounded-full bg-slate-100 text-slate-800 flex items-center justify-center">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight">Care Circle Access</h3>
              <p className="text-xs text-slate-500 font-normal">
                Manage authenticated members and rotate 4-digit passcodes
              </p>
            </div>
          </div>

          {/* Member List */}
          <div className="space-y-3.5 mb-6">
            {careCircle.map((member) => {
              const isEditing = editingMemberId === member.id;
              const isSuccess = pinSuccessId === member.id;

              return (
                <div
                  key={member.id}
                  className="p-5 rounded-2xl bg-white ring-1 ring-slate-900/5 hover:ring-slate-900/10 transition shadow-2xs"
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
                          <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                            {member.role}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500">{member.relation}</div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-xs font-mono font-bold bg-slate-100 px-2.5 py-1 rounded-full text-slate-800">
                        PIN: {member.passcode}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-slate-500 mt-2.5 pt-2.5 border-t border-slate-100">
                    <span className="flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5" />
                      {member.email}
                    </span>
                    {member.phone && (
                      <span className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5" />
                        {member.phone}
                      </span>
                    )}
                  </div>

                  {/* Rotate PIN form */}
                  <div className="mt-3.5 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                    {isEditing ? (
                      <div className="flex items-center gap-2 w-full">
                        <input
                          type="text"
                          maxLength={4}
                          placeholder="New 4 digits"
                          value={newPin}
                          onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ""))}
                          className="w-28 px-3 py-1.5 text-xs border border-slate-900 rounded-full font-mono focus:outline-none"
                        />
                        <button
                          onClick={() => handleSavePin(member.id)}
                          className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-full text-xs font-semibold transition"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => {
                            setEditingMemberId(null);
                            setNewPin("");
                          }}
                          className="px-2.5 py-1.5 text-slate-500 text-xs hover:bg-slate-100 rounded-full"
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
                            "Passkey verified"
                          )}
                        </span>
                        <button
                          onClick={() => {
                            setEditingMemberId(member.id);
                            setNewPin("");
                          }}
                          className="text-xs text-slate-700 hover:text-slate-900 font-semibold underline underline-offset-2"
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
            <div className="text-xs text-rose-600 bg-rose-50 border border-rose-200 p-2.5 rounded-full mb-4 text-center">
              {pinError}
            </div>
          )}

          {/* Add Member Toggle / Form */}
          {showAddForm ? (
            <form onSubmit={handleAddSubmit} className="bg-slate-50 rounded-2xl p-5 space-y-3.5 ring-1 ring-slate-900/5">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-700">Add New Circle Member</div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Iyer"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-full bg-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Role</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as Role)}
                    className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-full bg-white focus:outline-none"
                  >
                    <option value="FAMILY_ADMIN">Family Admin</option>
                    <option value="CARETAKER">Caretaker</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Relation</label>
                  <input
                    type="text"
                    placeholder="e.g. Son / Primary"
                    value={relation}
                    onChange={(e) => setRelation(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-full bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Email</label>
                  <input
                    type="email"
                    required
                    placeholder="ramesh@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-full bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">4-digit PIN</label>
                  <input
                    type="text"
                    maxLength={4}
                    value={passcode}
                    onChange={(e) => setPasscode(e.target.value.replace(/\D/g, ""))}
                    className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-full bg-white font-mono focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-5 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-200/60 rounded-full transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 text-xs bg-slate-900 hover:bg-slate-800 text-white rounded-full font-extrabold transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-slate-900/20 active:scale-95"
                >
                  Add Member
                </button>
              </div>
            </form>
          ) : (
            <button
              onClick={() => setShowAddForm(true)}
              className="w-full py-3.5 bg-slate-50 hover:bg-slate-100 ring-1 ring-slate-900/5 rounded-full text-xs font-bold text-slate-700 hover:text-slate-900 flex items-center justify-center gap-2 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xs active:scale-98"
            >
              <UserPlus className="w-4 h-4 text-teal-600" />
              <span>+ Add Authorized Circle Member</span>
            </button>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
