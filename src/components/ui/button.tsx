"use client";

import type { ComponentPropsWithoutRef } from "react";
import { Button as BaseButton } from "@base-ui/react/button";
import { cn } from "@/lib/cn";
import { btnDanger, btnDefault, btnIcon, btnPrimary } from "@/lib/ui-styles";

export type ButtonVariant = "default" | "primary" | "danger" | "icon";

const variantClass: Record<ButtonVariant, string> = {
  default: btnDefault,
  primary: btnPrimary,
  danger: btnDanger,
  icon: btnIcon,
};

type ButtonProps = ComponentPropsWithoutRef<typeof BaseButton> & {
  variant?: ButtonVariant;
};

export function Button({ variant = "default", className, ...props }: ButtonProps) {
  return <BaseButton className={cn(variantClass[variant], "btn-part", className)} {...props} />;
}

export function buttonClass(variant: ButtonVariant = "default", className?: string) {
  return cn(variantClass[variant], "btn-part", className);
}
