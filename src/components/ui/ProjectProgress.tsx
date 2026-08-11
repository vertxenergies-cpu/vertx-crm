"use client";

import React from "react";
import { ProjectStage } from "@/types";
import { PROJECT_STAGES_CONFIG } from "@/lib/constants";
import { Check, Circle, AlertCircle } from "lucide-react";
import { clsx } from "clsx";

interface ProjectProgressProps {
  currentStage: ProjectStage;
  onStageSelect?: (stage: ProjectStage) => void;
  disabled?: boolean;
}

export function ProjectProgress({ currentStage, onStageSelect, disabled = false }: ProjectProgressProps) {
  const currentStepIdx = PROJECT_STAGES_CONFIG.findIndex((s) => s.id === currentStage);
  const totalStages = PROJECT_STAGES_CONFIG.length;
  const progressPercent =
    currentStepIdx === -1
      ? 0
      : Math.round(((currentStepIdx + (currentStage === "COMPLETED" ? 1 : 0.5)) / totalStages) * 100);

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Project Milestone Pipeline
          </span>
          <p className="text-sm font-semibold text-slate-800">
            Stage {Math.max(1, currentStepIdx + 1)} of {totalStages}:{" "}
            <span className="text-blue-600">
              {PROJECT_STAGES_CONFIG[currentStepIdx]?.label || currentStage}
            </span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="w-24 sm:w-36 bg-slate-100 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-blue-600 h-2.5 rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="text-xs font-bold text-slate-700">{progressPercent}%</span>
        </div>
      </div>

      {/* Interactive Desktop / Tablet Stepper */}
      <div className="relative overflow-x-auto pb-2 scrollbar-thin">
        <div className="flex items-center min-w-[760px] justify-between relative py-2">
          {/* Background Connecting Line */}
          <div className="absolute top-1/2 left-4 right-4 h-1 bg-slate-200 -translate-y-1/2 z-0" />

          {/* Active Colored Line */}
          <div
            className="absolute top-1/2 left-4 h-1 bg-blue-600 -translate-y-1/2 z-0 transition-all duration-500"
            style={{
              width: `${(Math.max(0, currentStepIdx) / (totalStages - 1)) * 96}%`,
            }}
          />

          {PROJECT_STAGES_CONFIG.map((stage, idx) => {
            const isCompleted = idx < currentStepIdx || currentStage === "COMPLETED";
            const isCurrent = idx === currentStepIdx && currentStage !== "COMPLETED";
            const isUpcoming = idx > currentStepIdx;

            return (
              <button
                key={stage.id}
                disabled={disabled}
                onClick={() => onStageSelect && onStageSelect(stage.id)}
                className={clsx(
                  "relative z-10 flex flex-col items-center group text-center focus:outline-none transition",
                  disabled ? "cursor-default" : "cursor-pointer hover:scale-105"
                )}
              >
                <div
                  className={clsx(
                    "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all shadow-sm",
                    isCompleted
                      ? "bg-emerald-600 text-white ring-4 ring-emerald-100"
                      : isCurrent
                      ? "bg-blue-600 text-white ring-4 ring-blue-100 animate-pulse"
                      : "bg-white text-slate-400 border-2 border-slate-300 group-hover:border-blue-400"
                  )}
                >
                  {isCompleted ? (
                    <Check className="w-4 h-4 stroke-[3]" />
                  ) : isCurrent ? (
                    <span>{idx + 1}</span>
                  ) : (
                    <span>{idx + 1}</span>
                  )}
                </div>

                <span
                  className={clsx(
                    "mt-2 text-[11px] font-semibold tracking-tight transition max-w-[72px] leading-tight",
                    isCurrent
                      ? "text-blue-700 font-bold"
                      : isCompleted
                      ? "text-emerald-700"
                      : "text-slate-500 group-hover:text-slate-800"
                  )}
                >
                  {stage.shortLabel}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
