"use client"

import React from "react"

export default function DeleteButton({ 
  onConfirmText, 
  children,
  className,
  title
}: { 
  onConfirmText: string; 
  children: React.ReactNode;
  className?: string;
  title?: string;
}) {
  return (
    <button 
      type="submit" 
      title={title}
      className={className}
      onClick={(e) => {
        if (!confirm(onConfirmText)) {
          e.preventDefault()
        }
      }}
    >
      {children}
    </button>
  )
}
