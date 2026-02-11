import { useEffect, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { ShellConfig } from './ShellConfig';
import { useSettings } from '@/hooks/useSettings';

interface Props {
  open: boolean;
  onClose: () => void;
}

export function SettingsModal({ open, onClose }: Props) {
  const { shellConfig, save, loading, error } = useSettings();
  const [draft, setDraft] = useState(shellConfig);

  useEffect(() => {
    setDraft(shellConfig);
  }, [shellConfig]);

  return (
    <Modal
      open={open}
      title="Settings"
      onClose={onClose}
      footer={
        <div className="flex justify-end gap-2">
          <Button onClick={onClose}>Cancel</Button>
          <Button
            variant="primary"
            onClick={() => {
              void save(draft);
              onClose();
            }}
          >
            Save
          </Button>
        </div>
      }
    >
      {loading ? <p className="mb-2 text-xs text-[var(--text-secondary)]">Loading settings...</p> : null}
      {error ? <p className="mb-2 text-xs font-medium text-[var(--status-error)]">{error}</p> : null}
      <ShellConfig value={draft} onChange={setDraft} />
    </Modal>
  );
}
