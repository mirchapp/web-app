"use client";

import * as React from "react";
import { SideDrawer } from "@/components/ui/side-drawer";
import { ProfileOverview } from "./ProfileOverview";

interface ProfileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  zIndex?: number;
}

export function ProfileDrawer({ isOpen, onClose, userId, zIndex = 70 }: ProfileDrawerProps) {
  return (
    <SideDrawer
      isOpen={isOpen}
      onClose={onClose}
      showBackButton={true}
      zIndex={zIndex}
    >
      <ProfileOverview viewingUserId={userId} />
    </SideDrawer>
  );
}
