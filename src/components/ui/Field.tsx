import { forwardRef, useId } from 'react';
import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const CONTROL =
  'w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 transition-colors hover:border-slate-400 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500';

interface LabelledProps {
  label: string;
  hint?: string;
  /** Hide the label visually but keep it for screen readers. */
  srOnlyLabel?: boolean;
  className?: string;
}

export const TextInput = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement> & LabelledProps
>(function TextInput({ label, hint, srOnlyLabel, className, id, ...props }, ref) {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label
        htmlFor={inputId}
        className={cn('text-xs font-semibold text-slate-600', srOnlyLabel && 'sr-only')}
      >
        {label}
      </label>
      <input ref={ref} id={inputId} className={cn(CONTROL, 'h-9')} {...props} />
      {hint && <p className="text-xs text-slate-500">{hint}</p>}
    </div>
  );
});

export const Select = forwardRef<
  HTMLSelectElement,
  SelectHTMLAttributes<HTMLSelectElement> & LabelledProps & { children: ReactNode }
>(function Select({ label, hint, srOnlyLabel, className, id, children, ...props }, ref) {
  const generatedId = useId();
  const selectId = id ?? generatedId;

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label
        htmlFor={selectId}
        className={cn('text-xs font-semibold text-slate-600', srOnlyLabel && 'sr-only')}
      >
        {label}
      </label>
      <select ref={ref} id={selectId} className={cn(CONTROL, 'h-9 pr-8')} {...props}>
        {children}
      </select>
      {hint && <p className="text-xs text-slate-500">{hint}</p>}
    </div>
  );
});

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement> & LabelledProps
>(function Textarea({ label, hint, srOnlyLabel, className, id, ...props }, ref) {
  const generatedId = useId();
  const textareaId = id ?? generatedId;

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label
        htmlFor={textareaId}
        className={cn('text-xs font-semibold text-slate-600', srOnlyLabel && 'sr-only')}
      >
        {label}
      </label>
      <textarea ref={ref} id={textareaId} className={cn(CONTROL, 'py-2 leading-relaxed')} {...props} />
      {hint && <p className="text-xs text-slate-500">{hint}</p>}
    </div>
  );
});

interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  /** Hide the label text but keep the accessible name. */
  srOnlyLabel?: boolean;
  className?: string;
  size?: 'sm' | 'md';
}

/**
 * Success tick control.
 *
 * A real `<input type="checkbox">` sits underneath (keyboard, form semantics,
 * screen readers) with a styled box drawn on top via peer classes.
 */
export function Checkbox({
  checked,
  onChange,
  label,
  srOnlyLabel = false,
  className,
  size = 'md',
}: CheckboxProps) {
  const id = useId();
  const box = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5';
  const icon = size === 'sm' ? 'h-2.5 w-2.5' : 'h-3.5 w-3.5';

  return (
    <div className={cn('inline-flex items-center gap-2', className)}>
      <span className="relative inline-flex shrink-0">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
          className="peer absolute inset-0 z-10 cursor-pointer opacity-0"
        />
        <span
          aria-hidden="true"
          className={cn(
            'pointer-events-none flex items-center justify-center rounded-[5px] border-2 transition-all',
            box,
            checked
              ? 'border-emerald-600 bg-emerald-600 text-white'
              : 'border-slate-300 bg-white peer-hover:border-emerald-500',
            'peer-focus-visible:ring-2 peer-focus-visible:ring-emerald-600 peer-focus-visible:ring-offset-2',
          )}
        >
          {checked && <Check className={cn(icon, 'stroke-[3]')} />}
        </span>
      </span>
      <label
        htmlFor={id}
        className={cn(
          'cursor-pointer select-none text-sm text-slate-700',
          srOnlyLabel && 'sr-only',
        )}
      >
        {label}
      </label>
    </div>
  );
}
