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
    <div className="border-b border-default p-2">
      <p className="text-[10px] uppercase tracking-[0.04em] text-text-secondary">Branch</p>
      <div className="mt-1 flex gap-2">
        <select
          className="h-8 min-w-0 flex-1 border border-default bg-surface-secondary px-2 text-xs"
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
        <Button onClick={() => void onCheckout(target, false)} disabled={!target}>Checkout</Button>
      </div>
      <div className="mt-2 flex gap-2">
        <Input
          placeholder="new-branch-name"
          value={create ? target : ''}
          onChange={(event) => {
            setTarget(event.target.value);
            setCreate(true);
          }}
        />
        <Button variant="primary" onClick={() => void onCheckout(target, true)} disabled={!target || !create}>
          Create
        </Button>
      </div>
      <div className="mt-2 flex items-center gap-2">
        <Button
          variant="danger"
          onClick={() => void onDelete(target, forceDelete)}
          disabled={!target || target === branches.current}
        >
          Delete
        </Button>
        <label className="flex items-center gap-1 text-[10px] uppercase tracking-[0.04em] text-text-secondary">
          <input
            type="checkbox"
            checked={forceDelete}
            onChange={(event) => setForceDelete(event.target.checked)}
          />
          Force
        </label>
      </div>
      <div className="mt-3 border-t border-default pt-2">
        <p className="mb-1 text-[10px] uppercase tracking-[0.04em] text-text-secondary">Merge Into Current</p>
        <div className="flex gap-2">
          <select
            className="h-8 min-w-0 flex-1 border border-default bg-surface-secondary px-2 text-xs"
            value={mergeTarget}
            onChange={(event) => setMergeTarget(event.target.value)}
          >
            <option value="">Select branch to merge</option>
            {mergeCandidates.map((branch) => (
              <option key={branch} value={branch}>
                {branch}
              </option>
            ))}
          </select>
          <Button onClick={() => void onMerge(mergeTarget)} disabled={!mergeTarget}>Merge</Button>
        </div>
      </div>
      <p className="mt-2 text-[10px] uppercase tracking-[0.04em] text-text-secondary">
        Current: {branches.current ?? 'detached'}
      </p>
    </div>
  );
}
