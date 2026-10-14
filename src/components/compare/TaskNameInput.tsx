"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Tag } from "lucide-react";
import type { ResolvedTask, TaskSuggestion } from "@/modules/task/types";
import { compareApi } from "./api";

// 작업 이름 입력 + 자동완성 (이야기 2). 입력이 끝나면(포커스 아웃·자동완성 선택) 유형으로 묶는다.

interface Props {
  resolved: ResolvedTask | null;
  onResolved: (task: ResolvedTask | null) => void;
  onError: (message: string) => void;
}

export default function TaskNameInput({ resolved, onResolved, onError }: Props) {
  const [name, setName] = useState(resolved?.name ?? "");
  const [suggestions, setSuggestions] = useState<TaskSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [resolving, setResolving] = useState(false);
  const lastResolved = useRef<string>(resolved?.name ?? "");

  // 300ms 디바운스 자동완성
  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      compareApi
        .suggestTasks(name.trim(), controller.signal)
        .then(setSuggestions)
        .catch(() => {});
    }, 300);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [name, open]);

  async function resolve(taskName: string, pickedTypeId?: string) {
    const trimmed = taskName.trim();
    if (!trimmed || (trimmed === lastResolved.current && !pickedTypeId)) return;
    setResolving(true);
    try {
      const task = await compareApi.resolveTask(trimmed, pickedTypeId);
      lastResolved.current = trimmed;
      onResolved(task);
    } catch (e) {
      onError(e instanceof Error ? e.message : "작업을 분류하지 못했어요");
    } finally {
      setResolving(false);
    }
  }

  function pick(s: TaskSuggestion) {
    setOpen(false);
    if (s.kind === "my_task") {
      setName(s.taskName);
      resolve(s.taskName);
    } else {
      // 유형을 고르면 입력한 이름 그대로 두고 유형만 지정. 이름이 비었으면 유형 이름을 쓴다.
      const taskName = name.trim() || s.typeName;
      setName(taskName);
      resolve(taskName, s.typeId);
    }
  }

  return (
    <div className="relative">
      <input
        value={name}
        maxLength={100}
        onChange={(e) => {
          setName(e.target.value);
          setOpen(true);
          if (resolved && e.target.value.trim() !== resolved.name) onResolved(null);
        }}
        onFocus={() => setOpen(true)}
        // 목록 클릭(onMouseDown)이 먼저 처리되도록 닫기를 조금 늦춘다
        onBlur={() => setTimeout(() => {
          setOpen(false);
          resolve(name);
        }, 150)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            setOpen(false);
            resolve(name);
          }
        }}
        placeholder="예: 자소서 다듬기"
        className="h-12 w-full rounded-xl border border-white/10 bg-black/30 px-4 text-sm text-text-primary placeholder:text-text-tertiary outline-none focus:border-primary/60"
      />

      <div className="mt-2 flex h-5 items-center gap-2 text-xs">
        {resolving ? (
          <span className="flex items-center gap-1.5 text-text-tertiary">
            <Loader2 size={12} className="animate-spin" /> 작업 유형을 찾는 중…
          </span>
        ) : resolved ? (
          <span className="flex items-center gap-1.5 text-text-secondary">
            <Tag size={12} className="text-primary-light" />
            <span className="text-primary-light">{resolved.taskType.name}</span>
            {resolved.isNewType ? "유형이 새로 만들어졌어요" : "유형으로 분류했어요"}
          </span>
        ) : null}
      </div>

      {open && suggestions.length > 0 && (
        <ul className="absolute z-20 mt-1 max-h-64 w-full overflow-y-auto rounded-xl border border-white/10 bg-[#0d0d14] py-1 shadow-xl top-12">
          {suggestions.map((s, i) => (
            <li key={`${s.kind}-${s.typeId}-${i}`}>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  pick(s);
                }}
                className="flex w-full items-center justify-between px-4 py-2 text-left text-sm hover:bg-white/5 cursor-pointer"
              >
                {s.kind === "my_task" ? (
                  <>
                    <span className="text-text-primary">{s.taskName}</span>
                    <span className="text-[11px] text-text-tertiary">내 작업 · {s.typeName}</span>
                  </>
                ) : (
                  <>
                    <span className="text-text-primary">{s.typeName}</span>
                    <span className="text-[11px] text-text-tertiary">
                      {s.comparisons > 0 ? `${s.comparisons}회 비교됨` : "유형"}
                    </span>
                  </>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
