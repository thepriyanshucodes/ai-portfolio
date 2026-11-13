import React from 'react';

export type AppStatus = 'closed' | 'open' | 'minimized';

export interface AppConfig {
  id: string;
  title: string;
  icon:React.ReactNode
  topicon: React.ReactNode;
  status: AppStatus;
  isFocused: boolean;
  isMaximized: boolean;
  zIndex: number;
}