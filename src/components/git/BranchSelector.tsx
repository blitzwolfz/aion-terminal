import { useState } from 'react';
import type { BranchList } from '@/lib/types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface Props {
  branches: BranchList;
  onCheckout: (branch: string, create: boolean) => Promise<void>;
}

export function BranchSelector({ branches, onCheckout }: Props) {
  const [target, setTarget] = useState(branches.current ?? '');
  const [create, setCreate] = useState(false);

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
        <Input placeholder="new-branch-name" value={create ? target : ''} onChange={(event) => {
          setTarget(event.target.value);
          setCreate(true);
        }} />
        <Button variant="primary" onClick={() => void onCheckout(target, true)} disabled={!target || !create}>
          Create
        </Button>
      </div>
      <p className="mt-2 text-[10px] uppercase tracking-[0.04em] text-text-secondary">
        Current: {branches.current ?? 'detached'}
      </p>
    </div>
  );
}
