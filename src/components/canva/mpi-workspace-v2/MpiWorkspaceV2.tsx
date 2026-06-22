'use client';

import React from 'react';
import { WorkspaceTopBar, WorkspaceSceneList } from './WorkspaceTopBar';
import { WorkspaceCanvasStage } from './WorkspaceCanvasStage';
import { WorkspaceInspector } from './WorkspaceInspector';
import { WorkspaceContentPalette } from './WorkspaceContentPalette';

export function MpiWorkspaceV2() {
  return (
    <div
      className="flex flex-col h-full w-full bg-slate-100 overflow-hidden"
      id="mpi-workspace-v2"
      data-testid="mpi-workspace-v2"
    >
      <WorkspaceTopBar />
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <WorkspaceSceneList />
        <WorkspaceCanvasStage />
        <WorkspaceInspector />
      </div>
      <WorkspaceContentPalette />
    </div>
  );
}
