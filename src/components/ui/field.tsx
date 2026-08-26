import { forwardRef } from "react";
import { cn } from "@/lib/cn";
import { fieldClearBtn, fieldGroup, fieldGroupInput, fieldInput } from "@/lib/ui-styles";

export const FieldInput = forwardRef<HTMLInputElement, React.ComponentProps<"input">>(function FieldInput({ className, ...props }, ref) {
  return <input ref={ref} className={cn(fieldInput, className)} {...props} />;
});

export function FieldGroup({ className, children, ...props }: React.ComponentProps<"label">) {
  return (
    <label className={cn(fieldGroup, className)} {...props}>
      {children}
    </label>
  );
}

export const FieldGroupInput = forwardRef<HTMLInputElement, React.ComponentProps<"input">>(function FieldGroupInput({ className, ...props }, ref) {
  return <input ref={ref} className={cn(fieldGroupInput, className)} {...props} />;
});

export function FieldClear({ className, ...props }: React.ComponentProps<"button">) {
  return <button type="button" className={cn(fieldClearBtn, className)} {...props} />;
}
