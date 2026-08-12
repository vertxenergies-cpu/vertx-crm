"use client";

import React, { useState } from "react";
import { ProjectStage } from "@/types";
import {
  PROJECT_STAGES_CONFIG,
  getStageState,
  calculateProjectProgress,
  CANONICAL_PROJECT_STAGES,
  normalizeStageId,
} from "@/lib/constants";
import { Check, Lock, AlertCircle } from "lucide-react";
import { clsx } from "clsx";

interface ProjectProgressProps {
  currentStage: ProjectStage;
  completedStages?: ProjectStage[];
  onStageSelect?: (stage: ProjectStage) => void;
  onLockedStageClick?: (stage: ProjectStage) => void;
  disabled?: boolean;
}

export function ProjectProgress({
  currentStage,
  completedStages = [],
  onStageSelect,
  onLockedStageClick,
  disabled = false,
}: ProjectProgressProps) {
  const [lockedNotice, setLockedNotice] = useState<string | null>(null);

  const currentStepIdx = PROJECT_STAGES_CONFIG.findIndex(
    (s) => normalizeStageId(s.id) === normalizeStageId(currentStage)
  );
  const totalStages = 12;
  const stageNumber = currentStage === "COMPLETED" ? 12 : currentStepIdx === -1 ? 1 : currentStepIdx + 1;
  const progressPercent = calculateProjectProgress(completedStages, currentStage);
  const completedCount = PROJECT_STAGES_CONFIG.filter(
    (stage) => getStageState(stage.id, currentStage, completedStages) === "COMPLETED"
  ).length;

  const handleStageClick = (stageId: ProjectStage, state: string, label: string) => {
    if (state === "LOCKED") {
      const currentConfig = PROJECT_STAGES_CONFIG.find(
        (s) => normalizeStageId(s.id) === normalizeStageId(currentStage)
      );
      const msg = `Complete ${currentConfig?.label || currentStage} before moving to ${label}.`;
      setLockedNotice(msg);
      setTimeout(() => setLockedNotice(null), 4000);
      if (onLockedStageClick) onLockedStageClick(stageId);
      return;
    }

    if (onStageSelect && !disabled) {
      onStageSelect(stageId);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Strict Sequential EPC Pipeline
          </span>
          <p className="text-sm font-extrabold text-slate-900 mt-0.5">
            Stage {stageNumber} of {totalStages}:{" "}
            <span className="text-blue-600">
              {PROJECT_STAGES_CONFIG[currentStepIdx]?.label || currentStage}
            </span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Workflow Completion
            </span>
            <span className="text-xs font-extrabold text-slate-800 font-mono">
              {completedCount} / {totalStages} Stages ({progressPercent}%)
            </span>
          </div>

          <div className="w-28 sm:w-36 bg-slate-100 rounded-full h-2.5 overflow-hidden border border-slate-200">
            <div
              className="bg-emerald-600 h-2.5 rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Locked Stage Notice Toast */}
      {lockedNotice && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-center gap-2 animate-fadeIn">
          <Lock className="w-4 h-4 text-amber-600 shrink-0" />
          <span className="font-semibold">{lockedNotice}</span>
        </div>
      )}

      {/* Interactive Desktop / Tablet Stepper */}
      <div className="relative overflow-x-auto pb-2 scrollbar-thin">
        <div className="flex items-center min-w-[980px] justify-between relative py-2 px-3">
          {/* Background Connecting Line */}
          <div className="absolute top-1/2 left-6 right-6 h-1 bg-slate-200 -translate-y-1/2 z-0" />

          {/* Active Colored Progress Line */}
          <div
            className="absolute top-1/2 left-6 h-1 bg-emerald-500 -translate-y-1/2 z-0 transition-all duration-500"
            style={{
              width: `${(Math.max(0, completedCount) / (totalStages - 1)) * 96}%`,
            }}
          />

          {PROJECT_STAGES_CONFIG.map((stage, idx) => {
            const state = getStageState(stage.id, currentStage, completedStages);
            const isCompleted = state === "COMPLETED";
            const isCurrent = state === "CURRENT";
            const isLocked = state === "LOCKED";

            return (
              <button
                key={stage.id}
                type="button"
                onClick={() => handleStageClick(stage.id, state, stage.label)}
                className={clsx(
                  "relative z-10 flex flex-col items-center group text-center focus:outline-none transition select-none",
                  isLocked ? "cursor-not-allowed opacity-80" : "cursor-pointer hover:scale-105"
                )}
              >
                <div
                  className={clsx(
                    "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all shadow-2xs",
                    isCompleted
                      ? "bg-emerald-600 text-white ring-4 ring-emerald-100"
                      : isCurrent
                      ? "bg-blue-600 text-white ring-4 ring-blue-100 animate-pulse"
                      : "bg-slate-100 text-slate-400 border border-slate-300"
                  )}
                >
                  {isCompleted ? (
                    <Check className="w-4 h-4 stroke-[3]" />
                  ) : isCurrent ? (
                    <span className="text-white text-base leading-none">●</span>
                  ) : (
                    <Lock className="w-3 h-3 text-slate-400" />
                  )}
                </div>

                <span
                  className={clsx(
                    "mt-2 text-[10px] tracking-tight transition max-w-[78px] leading-tight",
                    isCurrent
                      ? "text-blue-700 font-extrabold"
                      : isCompleted
                      ? "text-emerald-700 font-bold"
                      : "text-slate-400 font-medium"
                  )}
                >
                  {stage.shortLabel}
                </span>

                <span
                  className={clsx(
                    "text-[9px] uppercase tracking-wider font-extrabold mt-0.5",
                    isCompleted
                      ? "text-emerald-600"
                      : isCurrent
                      ? "text-blue-600"
                      : "text-slate-400"
                  )}
                >
                  {state}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

