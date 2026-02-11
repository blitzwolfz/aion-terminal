import { useMemo, useState } from 'react';
import type { BranchList } from '@/lib/types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface Props {
  branches: BranchList;
  onCheckout: (branch: string, create: boolean) => Promise<void>;
  onDelete: (branch: string, force: boolean) => Promise<void>;
  onMerge: (branch: string) => Promise<void>;
}

export function BranchSelector({ branches, onCheckout, onDelete, onMerge }: Props) {
  const [target, setTarget] = useState(branches.current ?? '');
  const [create, setCreate] = useState(false);
  const [mergeTarget, setMergeTarget] = useState('');
  const [forceDelete, setForceDelete] = useState(false);

  const mergeCandidates = useMemo(
    () => branches.local.filter((branch) => branch !== branches.current),
    [branches.current, branches.local]
  );

  return (
    <div className="border-b-2 border-[var(--border-default)] p-2">
      <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-secondary)]">Branch</p>
      <div className="mt-1 flex gap-1">
        <select
          className="h-8 min-w-0 flex-1 border-2 border-[var(--border-default)] bg-[var(--surface-elevated)] px-2 text-xs"
          value={target}
          onChange={(event) => {
            setTarget(event.target.value);
            setCreate(false);
          }}
        >
          <option value="">Select branch</option>
          {branches.local.map((branch) => (
            <option key={branch} value={branch}>
              {branch}
            </option>
          ))}
        </select>
        <Button compact onClick={() => void onCheckout(target, false)} disabled={!target}>
          Checkout
        </Button>
      </div>
      <div className="mt-2 flex gap-1">
        <Input
          placeholder="new-branch-name"
          value={create ? target : ''}
          onChange={(event) => {
            setTarget(event.target.value);
            setCreate(true);
          }}
        />
        <Button compact variant="primary" onClick={() => void onCheckout(target, true)} disabled={!target || !create}>
          Create
        </Button>
      </div>
      <div className="mt-2 flex items-center gap-2">
        <Button
          compact
          variant="danger"
          onClick={() => void onDelete(target, forceDelete)}
          disabled={!target || target === branches.current}
        >
          Delete
        </Button>
        <label className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
          <input
            type="checkbox"
            checked={forceDelete}
            onChange={(event) => setForceDelete(event.target.checked)}
            className="accent-[var(--accent-primary)]"
          />
          Force
        </label>
      </div>
      <div className="mt-3 border-t-2 border-[var(--border-default)] pt-2">
        <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-[var(--text-secondary)]">Merge Into Current</p>
        <div className="flex gap-1">
          <select
            className="h-8 min-w-0 flex-1 border-2 border-[var(--border-default)] bg-[var(--surface-elevated)] px-2 text-xs"
            value={mergeTarget}
            onChange={(event) => setMergeTarget(event.target.value)}
          >
            <option value="">Select branch</option>
            {mergeCandidates.map((branch) => (
              <option key={branch} value={branch}>
                {branch}
              </option>
            ))}
          </select>
          <Button compact onClick={() => void onMerge(mergeTarget)} disabled={!mergeTarget}>
            Merge
          </Button>
        </div>
      </div>
      <p className="mt-2 text-[10px] font-bold uppercase tracking-widest text-[var(--accent-deep)]">
        Current: {branches.current ?? 'detached'}
      </p>
    </div>
  );
}
