import { useMemo } from 'react';
import { useGit } from '@/hooks/useGit';
import { useGitStore } from '@/stores/gitStore';
import { BranchSelector } from './BranchSelector';
import { CommitForm } from './CommitForm';
import { DiffViewer } from './DiffViewer';
import { FileTree } from './FileTree';
import { LogGraph } from './LogGraph';
import { StashPanel } from './StashPanel';

interface Props {
  repoPath: string;
}

export function GitPanel({ repoPath }: Props) {
  const { loadDiff, stage, unstage, commit, checkout, push, pull, stash } = useGit(repoPath);
  const {
    statuses,
    selectedFile,
    diff,
    commits,
    branches,
    stashes,
    loading,
    error,
    setSelectedFile
  } = useGitStore((state) => ({
    statuses: state.statuses,
    selectedFile: state.selectedFile,
    diff: state.diff,
    commits: state.commits,
    branches: state.branches,
    stashes: state.stashes,
    loading: state.loading,
    error: state.error,
    setSelectedFile: state.setSelectedFile
  }));

  const changedCount = useMemo(() => statuses.length, [statuses]);

  return (
    <section className="flex h-full flex-col bg-surface-secondary">
      <header className="flex h-10 items-center justify-between border-b border-default px-3">
        <h3 className="text-xs uppercase tracking-[0.04em]">Git Sidecar</h3>
        <span className="text-[10px] text-text-secondary">{changedCount} changed files</span>
      </header>
      {error ? <div className="border-b border-default px-3 py-2 text-xs text-[#ef4444]">{error}</div> : null}
      {loading ? <div className="border-b border-default px-3 py-2 text-xs text-text-secondary">Refreshing…</div> : null}
      <BranchSelector branches={branches} onCheckout={checkout} />
      <div className="grid min-h-0 flex-1 grid-cols-[260px_1fr]">
        <FileTree
          files={statuses}
          selectedFile={selectedFile}
          onSelect={(file) => {
            setSelectedFile(file);
            void loadDiff(file, false);
          }}
          onStage={(file) => void stage([file])}
          onUnstage={(file) => void unstage([file])}
        />
        <DiffViewer diff={diff} />
      </div>
      <CommitForm
        onCommit={async (message, amend) => {
          await commit(message, amend);
        }}
        onPush={async () => {
          await push();
        }}
        onPull={async () => {
          await pull();
        }}
      />
      <StashPanel
        stashes={stashes}
        onPush={async (message) => {
          await stash('Push', message);
        }}
        onPop={async (index) => {
          await stash('Pop', undefined, index);
        }}
        onDrop={async (index) => {
          await stash('Drop', undefined, index);
        }}
      />
      <LogGraph commits={commits} />
    </section>
  );
}
