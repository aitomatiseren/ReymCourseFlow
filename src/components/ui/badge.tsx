import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { DesignTokens } from "@/lib/design-tokens"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
        // Employee Status Variants
        active: DesignTokens.status.active.css,
        inactive: DesignTokens.status.inactive.css,
        onLeave: DesignTokens.status.onLeave.css,
        sickShort: DesignTokens.status.sickShort.css,
        sickLong: DesignTokens.status.sickLong.css,
        vacation: DesignTokens.status.vacation.css,
        unavailable: DesignTokens.status.unavailable.css,
        terminated: DesignTokens.status.terminated.css,
        // Training Status Variants
        scheduled: DesignTokens.training.scheduled.css,
        inProgress: DesignTokens.training.inProgress.css,
        completed: DesignTokens.training.completed.css,
        cancelled: DesignTokens.training.cancelled.css,
        // Certificate Status Variants
        valid: DesignTokens.certificate.valid.css,
        expiringSoon: DesignTokens.certificate.expiringSoon.css,
        expired: DesignTokens.certificate.expired.css,
        suspended: DesignTokens.certificate.suspended.css,
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
