"use client";
import { useId } from "react";
import { Check } from "lucide-react";

export function QuestionOptions({
  options,
  question,
  value,
  onChange,
  disabled = false,
}: {
  options: string[];
  question: string;
  value?: number;
  onChange: (index: number) => void;
  disabled?: boolean;
}) {
  const group = useId();
  return (
    <fieldset className="grid gap-3" disabled={disabled}>
      <legend className="sr-only">{question} Choose one answer.</legend>
      {options.map((option, index) => (
        <label
          key={index}
          className={`assessment-option relative flex cursor-pointer items-center gap-4 rounded-xl border p-4 text-left transition has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-rust ${value === index ? "border-forest bg-forest/[.07]" : "border-line bg-surface hover:bg-paper"} ${disabled ? "pointer-events-none opacity-60" : ""}`}
        >
          <input
            type="radio"
            name={group}
            checked={value === index}
            onChange={() => onChange(index)}
            className="sr-only"
            value={index}
          />
          <span
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border text-xs font-semibold ${value === index ? "border-forest bg-forest text-white" : "border-line bg-paper text-muted"}`}
          >
            {value === index ? (
              <Check size={15} />
            ) : (
              String.fromCharCode(65 + index)
            )}
          </span>
          <span className="text-sm leading-6">{option}</span>
        </label>
      ))}
    </fieldset>
  );
}
