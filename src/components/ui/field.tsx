import { forwardRef } from "react";
import { cn } from "@/lib/cn";
import { fieldClearBtn, fieldGroup, fieldGroupInput, fieldInput, fieldLabel } from "@/lib/ui-styles";

export const FieldInput = forwardRef<HTMLInputElement, React.ComponentProps<"input">>(function FieldInput({ className, ...props }, ref) {
  return <input ref={ref} className={cn(fieldInput, className)} {...props} />;
});

/** Layout row for an input plus optional leading icon / trailing clear. No border chrome. */
export function FieldGroup({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn(fieldGroup, className)} {...props} />;
}

/** Keep buttons (e.g. FieldClear) as siblings — never nest them here. */
export function FieldLabel({ className, ...props }: React.ComponentProps<"label">) {
  return <label className={cn(fieldLabel, className)} {...props} />;
}

export const FieldGroupInput = forwardRef<HTMLInputElement, React.ComponentProps<"input">>(function FieldGroupInput({ className, ...props }, ref) {
  return <input ref={ref} className={cn(fieldGroupInput, className)} {...props} />;
});

export function FieldClear({ className, ...props }: React.ComponentProps<"button">) {
  return <button type="button" className={cn(fieldClearBtn, className)} {...props} />;
}
