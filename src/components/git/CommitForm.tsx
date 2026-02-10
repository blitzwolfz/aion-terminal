import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface Props {
  onCommit: (message: string, amend: boolean) => Promise<void>;
  onPush: () => Promise<void>;
  onPull: () => Promise<void>;
}

export function CommitForm({ onCommit, onPush, onPull }: Props) {
  const [message, setMessage] = useState('');
  const [amend, setAmend] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleCommit() {
    if (!message.trim()) {
      return;
    }

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
    <div className="border-t border-default p-2">
      <Input value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Commit message" />
      <label className="mt-2 flex items-center gap-2 text-[10px] uppercase tracking-[0.04em] text-text-secondary">
        <input type="checkbox" checked={amend} onChange={(event) => setAmend(event.target.checked)} />
        Amend last commit
      </label>
      <div className="mt-2 flex gap-2">
        <Button variant="primary" onClick={() => void handleCommit()} disabled={loading || !message.trim()}>
          Commit
        </Button>
        <Button onClick={() => void onPull()}>Pull</Button>
        <Button onClick={() => void onPush()}>Push</Button>
      </div>
    </div>
  );
}
