import type { FileStatusEntry } from '@/lib/types';
import { Button } from '@/components/ui/Button';

interface Props {
  files: FileStatusEntry[];
  selectedFile: string | null;
  onSelect: (file: string) => void;
  onStage: (file: string) => void;
  onUnstage: (file: string) => void;
}

export function FileTree({ files, selectedFile, onSelect, onStage, onUnstage }: Props) {
  return (
    <div className="h-full overflow-auto border-r border-default">
      {files.length === 0 ? (
        <div className="px-3 py-4 text-xs text-text-secondary">No changes</div>
      ) : null}
      {files.map((file) => (
        <div
          key={file.path}
          className={`border-b border-default px-2 py-2 ${selectedFile === file.path ? 'bg-surface-tertiary' : 'hover:bg-surface-tertiary'}`}
        >
          <button className="w-full text-left" onClick={() => onSelect(file.path)}>
            <p className="truncate text-xs">{file.path}</p>
            <p className="text-[10px] uppercase tracking-[0.04em] text-text-secondary">{file.status}</p>
          </button>
          <div className="mt-2 flex gap-1">
            {file.staged ? (
              <Button compact onClick={() => onUnstage(file.path)}>Unstage</Button>
            ) : (
              <Button compact variant="primary" onClick={() => onStage(file.path)}>Stage</Button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
