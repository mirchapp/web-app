"use client";

import * as React from "react";
import { SideDrawer } from "@/components/ui/side-drawer";
import { ProfileOverview } from "./ProfileOverview";

interface ProfileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: string;
  zIndex?: number;
}

export function ProfileDrawer({ isOpen, onClose, userId, zIndex = 70 }: ProfileDrawerProps) {
  // If no userId is provided, don't render anything (or show own profile)
  if (!isOpen) return null;

  return (
    <SideDrawer
      isOpen={isOpen}
      onClose={onClose}
      showBackButton={false}
      zIndex={zIndex}
    >
      <ProfileOverview viewingUserId={userId} onProfileClose={onClose} zIndex={zIndex} />
    </SideDrawer>
  );
}
