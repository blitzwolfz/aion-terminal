import type { StashEntry } from '@/lib/types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useState } from 'react';

interface Props {
  stashes: StashEntry[];
  onPush: (message?: string) => Promise<void>;
  onPop: (index: number) => Promise<void>;
  onDrop: (index: number) => Promise<void>;
}

export function StashPanel({ stashes, onPush, onPop, onDrop }: Props) {
  const [message, setMessage] = useState('');

  return (
    <div className="border-t border-default p-2">
      <p className="text-[10px] uppercase tracking-[0.04em] text-text-secondary">Stash</p>
      <div className="mt-1 flex gap-2">
        <Input value={message} onChange={(event) => setMessage(event.target.value)} placeholder="stash message" />
        <Button onClick={() => void onPush(message || undefined)}>Push</Button>
      </div>
      <div className="mt-2 space-y-1">
        {stashes.map((stash) => (
          <div key={stash.oid} className="flex items-center justify-between border border-default px-2 py-1 text-xs">
            <span className="truncate pr-2">{`stash@{${stash.index}}: ${stash.message}`}</span>
            <span className="flex gap-1">
              <Button compact onClick={() => void onPop(stash.index)}>Pop</Button>
              <Button compact variant="danger" onClick={() => void onDrop(stash.index)}>Drop</Button>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
