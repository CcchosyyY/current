// 작업 모듈 — 클라이언트도 가져갈 수 있는 타입 (docs/architecture.md §3-2 ⑤, 용어집 §9)

/** 작업 유형: 시스템이 의미로 묶은 작업 종류 ("문장 교정"). 순위의 단위 */
export interface TaskType {
  id: string;
  key: string; // text-proofreading
  name: string; // 문장 교정
}

/** 사용자의 작업: 자기가 쓴 이름 + 묶인 유형 */
export interface ResolvedTask {
  taskId: string;
  name: string; // 사용자가 쓴 그대로 ("자소서 다듬기") — 화면에는 이것 (R-4)
  taskType: TaskType;
  classifiedBy: "judge" | "user_pick" | "fallback";
  isNewType: boolean; // 이번에 판정 AI가 새 유형을 만들었나 (R-5)
  reused: boolean; // 예전에 쓴 이름이라 판정 없이 재사용했나 (R-6)
}

/** 자동완성 항목: 기존 유형 또는 내가 예전에 쓴 작업 이름 */
export type TaskSuggestion =
  | { kind: "type"; typeId: string; typeName: string; comparisons: number }
  | { kind: "my_task"; typeId: string; typeName: string; taskName: string };
