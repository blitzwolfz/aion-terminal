import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface Props {
  onCommit: (message: string, amend: boolean) => Promise<void>;
  onFetch: () => Promise<void>;
  onPush: () => Promise<void>;
  onPull: () => Promise<void>;
}

export function CommitForm({ onCommit, onFetch, onPush, onPull }: Props) {
  const [message, setMessage] = useState('');
  const [amend, setAmend] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleCommit() {
    if (!message.trim()) return;

    setLoading(true);
    try {
      await onCommit(message.trim(), amend);
      setMessage('');
      setAmend(false);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="border-t-2 border-[var(--border-default)] p-2">
      <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-[var(--text-secondary)]">Commit</p>
      <Input value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Commit message" />
      <label className="mt-2 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
        <input type="checkbox" checked={amend} onChange={(event) => setAmend(event.target.checked)} className="accent-[var(--accent-primary)]" />
        Amend last commit
      </label>
      <div className="mt-2 flex gap-1">
        <Button variant="primary" compact onClick={() => void handleCommit()} disabled={loading || !message.trim()}>
          Commit
        </Button>
        <Button compact onClick={() => void onFetch()}>Fetch</Button>
        <Button compact onClick={() => void onPull()}>Pull</Button>
        <Button compact onClick={() => void onPush()}>Push</Button>
      </div>
    </div>
  );
}
