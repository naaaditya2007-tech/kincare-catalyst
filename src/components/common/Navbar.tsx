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

  const roleLabelMap: Record<Role, { label: string; badge: string; pin: string }> = {
    ELDER: { label: "Elder Companion", badge: "bg-teal-50 text-teal-700 border-teal-200", pin: "1111" },
    FAMILY_ADMIN: { label: "Family Admin", badge: "bg-indigo-50 text-indigo-700 border-indigo-200", pin: "2222" },
    CARETAKER: { label: "Caretaker View", badge: "bg-emerald-50 text-emerald-700 border-emerald-200", pin: "3333" },
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-200 px-4 sm:px-6 py-3 transition-colors">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Brand & Elder Badge */}
        <div className="flex items-center gap-3 sm:gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal-600 flex items-center justify-center text-white shadow-sm shadow-teal-600/20">
              <Heart className="w-5 h-5 fill-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-lg tracking-tight text-slate-900">KinCare</span>
                <span className="text-[10px] uppercase tracking-wider font-semibold bg-teal-100 text-teal-800 px-1.5 py-0.5 rounded">
                  Autonomous
                </span>
              </div>
            </div>
          </div>

          {/* Elder Profile Pill */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-slate-50 border border-slate-200 rounded-full text-xs text-slate-600">
            <Shield className="w-3.5 h-3.5 text-teal-600" />
            <span className="font-semibold text-slate-900">{elderProfile.name}</span>
            <span className="text-slate-400">•</span>
            <span>Age {elderProfile.age}</span>
            <span className="text-slate-400">•</span>
            <span className="font-medium text-rose-600 bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200">
              {elderProfile.bloodGroup}
            </span>
          </div>
        </div>

        {/* Right Actions: Role Switcher, Email Center, Reset, Logout */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Email Testing Center Trigger */}
          <button
            onClick={onOpenEmailCenter}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-teal-500 bg-white text-slate-700 hover:text-teal-700 text-xs sm:text-sm font-medium transition shadow-xs group"
            title="Email Testing Center"
          >
            <Bell className="w-4 h-4 text-slate-500 group-hover:text-teal-600" />
            <span className="hidden sm:inline">Email Testing Center</span>
            {emailLogCount > 0 && (
              <span className="bg-teal-600 text-white text-[11px] font-bold px-1.5 py-0.2 rounded-full min-w-4 text-center">
                {emailLogCount}
              </span>
            )}
          </button>

          {/* Instant Role Switcher Dropdown */}
          <div className="relative">
            <button
              onClick={() => setRoleMenuOpen(!roleMenuOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs sm:text-sm font-medium text-slate-800 transition"
            >
              <UserCheck className="w-4 h-4 text-teal-600" />
              <span className="hidden sm:inline text-slate-500 text-xs font-normal">Active Role:</span>
              <span className="font-semibold">{roleLabelMap[currentRole]?.label || currentRole}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {roleMenuOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-xl shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-3 py-1.5 border-b border-slate-100">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Judge Quick Role Switch
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
                        isActive ? "bg-teal-50/70 font-semibold text-teal-900" : "text-slate-700"
                      }`}
                    >
                      <div>
                        <div className="font-medium text-slate-900">{item.label}</div>
                        <div className="text-[11px] text-slate-500">PIN: {item.pin}</div>
                      </div>
                      {isActive && <Check className="w-4 h-4 text-teal-600" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Reset State Button */}
          <button
            onClick={onResetData}
            title="Reset to default seed state"
            className="p-1.5 sm:px-2.5 sm:py-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg text-xs font-medium border border-transparent hover:border-slate-200 transition flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Reset Seed</span>
          </button>

          {/* Logout Button */}
          <button
            onClick={onLogout}
            title="Log out of session"
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
