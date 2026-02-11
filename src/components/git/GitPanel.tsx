import { useMemo, useState } from 'react';
import { useGit } from '@/hooks/useGit';
import { useGitStore } from '@/stores/gitStore';
import { BranchSelector } from './BranchSelector';
import { CommitForm } from './CommitForm';
import { DiffViewer } from './DiffViewer';
import { FileTree } from './FileTree';
import { LogGraph } from './LogGraph';
import { StashPanel } from './StashPanel';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

interface Props {
  repoPath: string;
}

export function GitPanel({ repoPath }: Props) {
  const {
    loadDiff,
    stage,
    unstage,
    commit,
    checkout,
    deleteBranch,
    fetch,
    push,
    pull,
    merge,
    cherryPick,
    createTag,
    deleteTag,
    stash
  } = useGit(repoPath);
  const statuses = useGitStore((state) => state.statuses);
  const selectedFile = useGitStore((state) => state.selectedFile);
  const diff = useGitStore((state) => state.diff);
  const commits = useGitStore((state) => state.commits);
  const branches = useGitStore((state) => state.branches);
  const stashes = useGitStore((state) => state.stashes);
  const loading = useGitStore((state) => state.loading);
  const error = useGitStore((state) => state.error);
  const setSelectedFile = useGitStore((state) => state.setSelectedFile);

  const [tagName, setTagName] = useState('');

  const changedCount = useMemo(() => statuses.length, [statuses]);

  return (
    <section className="flex h-full flex-col bg-[var(--surface-secondary)]">
      <header className="flex h-11 items-center justify-between border-b-2 border-[var(--border-strong)] bg-[var(--surface-primary)] px-3">
        <div>
          <h3 className="font-display text-sm font-bold uppercase tracking-widest">Git</h3>
        </div>
        <span className="border-2 border-[var(--border-default)] bg-[var(--surface-tertiary)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
          {changedCount} changed
        </span>
      </header>

      {error ? (
        <div className="border-b-2 border-[var(--status-error)] bg-[#FEE2E2] px-3 py-2 text-xs font-medium text-[#991B1B]">
          {error}
        </div>
      ) : null}
      {loading ? (
        <div className="border-b border-[var(--border-default)] bg-[var(--accent-surface)] px-3 py-2 text-xs text-[var(--accent-deep)]">
          Refreshing...
        </div>
      ) : null}

      <div className="min-h-0 flex-1 overflow-auto">
        <BranchSelector
          branches={branches}
          onCheckout={checkout}
          onDelete={deleteBranch}
          onMerge={async (branch) => {
            await merge(branch, false);
          }}
        />

        <div className="border-b-2 border-[var(--border-default)] p-2">
          <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-[var(--text-secondary)]">Tags</p>
          <div className="flex gap-1">
            <Input value={tagName} onChange={(event) => setTagName(event.target.value)} placeholder="v1.0.0" />
            <Button
              compact
              variant="primary"
              onClick={() => {
                if (tagName.trim()) {
                  void createTag(tagName.trim());
                  setTagName('');
                }
              }}
            >
              Create
            </Button>
            <Button
              compact
              variant="danger"
              onClick={() => {
                if (tagName.trim()) {
                  void deleteTag(tagName.trim());
                  setTagName('');
                }
              }}
            >
              Delete
            </Button>
          </div>
        </div>

        <div className="grid min-h-[200px] grid-cols-1 lg:grid-cols-[240px_1fr]">
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
          onFetch={async () => {
            await fetch();
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

        <LogGraph
          commits={commits}
          onCherryPick={async (oid) => {
            await cherryPick(oid);
          }}
        />
      </div>
    </section>
  );
}
