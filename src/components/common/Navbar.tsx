"use client";

import React, { useState } from "react";
import { Role, ElderProfile } from "@/types/kincare";
import {
  Shield,
  Heart,
  Bell,
  RefreshCw,
  UserCheck,
  ChevronDown,
  Check,
  LogOut,
  UserPlus,
} from "lucide-react";

interface NavbarProps {
  currentRole: Role;
  elderProfile: ElderProfile;
  allPatients?: ElderProfile[];
  onRoleSwitch: (role: Role) => void;
  onSwitchPatient?: (patientId: string) => void;
  onOpenOnboarding?: () => void;
  onOpenEmailCenter: () => void;
  onResetData: () => void;
  onLogout: () => void;
  emailLogCount?: number;
}

/**
 * Navbar Component
 * 
 * Top application header providing dynamic multi-tenant patient switching,
 * role authorization toggle (Elder, Family Admin, Caretaker), email testing telemetry,
 * demo reset, and secure session logout.
 * 
 * @param {NavbarProps} props - Component properties
 * @returns {React.ReactElement} The rendered navigation header
 */
export const Navbar: React.FC<NavbarProps> = ({
  currentRole,
  elderProfile,
  allPatients = [elderProfile],
  onRoleSwitch,
  onSwitchPatient,
  onOpenOnboarding,
  onOpenEmailCenter,
  onResetData,
  onLogout,
  emailLogCount = 0,
}) => {
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const [patientMenuOpen, setPatientMenuOpen] = useState(false);

  const roleLabelMap: Record<Role, { label: string; pin: string }> = {
    ELDER: { label: "Elder Companion", pin: "1111" },
    FAMILY_ADMIN: { label: "Family Admin", pin: "2222" },
    CARETAKER: { label: "Caretaker View", pin: "3333" },
  };

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/60 px-4 sm:px-8 py-3.5 transition-colors">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Brand & Dynamic Patient Switcher Dropdown */}
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

          {/* Clickable Patient Switcher Dropdown Badge */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setPatientMenuOpen(!patientMenuOpen)}
              aria-label={`Current patient: ${elderProfile.name}. Click to switch active patient`}
              className="flex items-center gap-2 px-3.5 py-1.5 bg-slate-50 hover:bg-slate-100/90 rounded-full text-xs text-slate-700 transition ring-1 ring-slate-900/5 group"
              title="Click to switch active elder patient profile"
            >
              <Shield className="w-3.5 h-3.5 text-teal-600 shrink-0" />
              <span className="font-bold text-slate-900">{elderProfile.name}</span>
              <span className="hidden sm:inline text-slate-300">•</span>
              <span className="hidden sm:inline text-slate-500">Age {elderProfile.age}</span>
              <span className="hidden sm:inline text-slate-300">•</span>
              <span className="font-bold text-teal-700">{elderProfile.bloodGroup}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-700 transition ml-0.5" />
            </button>

            {patientMenuOpen && (
              <div className="absolute left-0 mt-2 w-72 bg-white border border-slate-200 rounded-2xl shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150 ring-1 ring-slate-900/5 divide-y divide-slate-100">
                <div className="px-3.5 py-1.5">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Switch Active Patient ({allPatients.length})
                  </div>
                </div>

                <div className="max-h-56 overflow-y-auto py-1">
                  {allPatients.map((p) => {
                    const isActive = p.id === elderProfile.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          if (onSwitchPatient) onSwitchPatient(p.id);
                          setPatientMenuOpen(false);
                        }}
                        aria-label={`Select patient ${p.name}`}
                        className={`w-full text-left px-3.5 py-2.5 flex items-center justify-between text-xs hover:bg-slate-50 transition ${
                          isActive ? "bg-teal-50/60 font-semibold text-teal-900" : "text-slate-700"
                        }`}
                      >
                        <div className="min-w-0 pr-2">
                          <div className="font-bold text-slate-900 truncate">{p.name}</div>
                          <div className="text-[10px] text-slate-500 truncate">
                            Age {p.age} • {p.bloodGroup} • {p.allergies[0] || "No allergies"}
                          </div>
                        </div>
                        {isActive && <Check className="w-4 h-4 text-teal-600 shrink-0" />}
                      </button>
                    );
                  })}
                </div>

                {onOpenOnboarding && (
                  <div className="p-2 bg-slate-50">
                    <button
                      type="button"
                      onClick={() => {
                        setPatientMenuOpen(false);
                        onOpenOnboarding();
                      }}
                      aria-label="Onboard new elder profile"
                      className="w-full py-2 px-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition shadow-2xs"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>+ Onboard New Elder Profile</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Actions: Role Switcher, Email Center, Reset, Logout */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Email Testing Center Trigger (Pill Shape) */}
          <button
            type="button"
            onClick={onOpenEmailCenter}
            aria-label={`Email Testing Center, ${emailLogCount} emails logged`}
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
              type="button"
              onClick={() => setRoleMenuOpen(!roleMenuOpen)}
              aria-label={`Current persona: ${roleLabelMap[currentRole]?.label || currentRole}. Click to switch role`}
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
                      type="button"
                      onClick={() => {
                        onRoleSwitch(r);
                        setRoleMenuOpen(false);
                      }}
                      aria-label={`Switch to ${item.label} persona`}
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
            type="button"
            onClick={onResetData}
            aria-label="Reset application data to default seed state"
            title="Reset to default seed state"
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>

          {/* Logout Button */}
          <button
            type="button"
            onClick={onLogout}
            aria-label="Log out of current session"
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
