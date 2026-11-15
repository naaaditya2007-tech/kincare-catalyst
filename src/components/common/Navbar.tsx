"use client";

import React, { useState } from "react";
import { Role, ElderProfile } from "@/types/kincare";
import { Shield, Heart, Bell, RefreshCw, UserCheck, ChevronDown, Check, LogOut } from "lucide-react";

interface NavbarProps {
  currentRole: Role;
  elderProfile: ElderProfile;
  onRoleSwitch: (role: Role) => void;
  onOpenEmailCenter: () => void;
  onResetData: () => void;
  onLogout: () => void;
  emailLogCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentRole,
  elderProfile,
  onRoleSwitch,
  onOpenEmailCenter,
  onResetData,
  onLogout,
  emailLogCount = 0,
}) => {
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);

  const roleLabelMap: Record<Role, { label: string; pin: string }> = {
    ELDER: { label: "Elder Companion", pin: "1111" },
    FAMILY_ADMIN: { label: "Family Admin", pin: "2222" },
    CARETAKER: { label: "Caretaker View", pin: "3333" },
  };

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/60 px-4 sm:px-8 py-3.5 transition-colors">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Brand & Elder Badge */}
        <div className="flex items-center gap-4 sm:gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-teal-600 flex items-center justify-center text-white shadow-xs">
              <Heart className="w-4 h-4 fill-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base tracking-tight text-slate-900">KinCare</span>
                <span className="text-[10px] uppercase tracking-wider font-bold bg-teal-50 text-teal-800 px-2 py-0.5 rounded-full border border-teal-200">
                  Telemetry
                </span>
              </div>
            </div>
          </div>

          {/* Elder Profile Pill */}
          <div className="hidden md:flex items-center gap-2 px-3.5 py-1 bg-slate-50 rounded-full text-xs text-slate-600 ring-1 ring-slate-900/5">
            <Shield className="w-3.5 h-3.5 text-teal-600" />
            <span className="font-semibold text-slate-900">{elderProfile.name}</span>
            <span className="text-slate-300">•</span>
            <span>Age {elderProfile.age}</span>
            <span className="text-slate-300">•</span>
            <span className="font-bold text-teal-700">{elderProfile.bloodGroup}</span>
          </div>
        </div>

        {/* Right Actions: Role Switcher, Email Center, Reset, Logout */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Email Testing Center Trigger (Pill Shape) */}
          <button
            onClick={onOpenEmailCenter}
            className="flex items-center gap-2 px-4 py-2 rounded-full border border-slate-200/80 hover:border-slate-300 bg-white text-slate-700 hover:text-slate-900 text-xs font-semibold transition shadow-2xs group"
            title="Email Testing Center"
          >
            <Bell className="w-3.5 h-3.5 text-slate-400 group-hover:text-teal-600" />
            <span className="hidden sm:inline">Email Testing Center</span>
            {emailLogCount > 0 && (
              <span className="bg-slate-900 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full min-w-4 text-center">
                {emailLogCount}
              </span>
            )}
          </button>

          {/* Instant Role Switcher Dropdown (Pill Shape) */}
          <div className="relative">
            <button
              onClick={() => setRoleMenuOpen(!roleMenuOpen)}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100 hover:bg-slate-200/80 text-xs font-semibold text-slate-900 transition"
            >
              <UserCheck className="w-3.5 h-3.5 text-teal-600" />
              <span>{roleLabelMap[currentRole]?.label || currentRole}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {roleMenuOpen && (
              <div className="absolute right-0 mt-2 w-60 bg-white border border-slate-200 rounded-2xl shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150 ring-1 ring-slate-900/5">
                <div className="px-3.5 py-1.5 border-b border-slate-100">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Switch Active Persona
                  </div>
                </div>

                {(["ELDER", "FAMILY_ADMIN", "CARETAKER"] as Role[]).map((r) => {
                  const item = roleLabelMap[r];
                  const isActive = currentRole === r;
                  return (
                    <button
                      key={r}
                      onClick={() => {
                        onRoleSwitch(r);
                        setRoleMenuOpen(false);
                      }}
                      className={`w-full text-left px-3.5 py-2.5 flex items-center justify-between text-xs hover:bg-slate-50 transition ${
                        isActive ? "bg-teal-50/60 font-semibold text-teal-900" : "text-slate-700"
                      }`}
                    >
                      <div>
                        <div className="font-semibold text-slate-900">{item.label}</div>
                        <div className="text-[10px] text-slate-400">PIN: {item.pin}</div>
                      </div>
                      {isActive && <Check className="w-4 h-4 text-teal-600" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Reset Seed Button */}
          <button
            onClick={onResetData}
            title="Reset to default seed state"
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>

          {/* Logout Button */}
          <button
            onClick={onLogout}
            title="Log out of session"
            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-full transition"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
};
