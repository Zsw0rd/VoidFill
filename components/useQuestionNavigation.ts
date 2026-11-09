"use client";

import { useEffect, useRef, type Dispatch, type SetStateAction } from "react";

/** Move focus only after the learner deliberately changes questions. */
export function useQuestionNavigation(index: number, setIndex: Dispatch<SetStateAction<number>>) {
  const questionHeading = useRef<HTMLDivElement>(null);
  const focusRequested = useRef(false);

  useEffect(() => {
    if (!focusRequested.current) return;
    focusRequested.current = false;
    questionHeading.current?.focus();
  }, [index]);

  function moveQuestion(nextIndex: number) {
    if (nextIndex === index) return;
    focusRequested.current = true;
    setIndex(nextIndex);
  }

  return { questionHeading, moveQuestion };
}
