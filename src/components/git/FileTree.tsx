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
    <div className="h-full overflow-auto border-r-2 border-[var(--border-default)]">
      {files.length === 0 ? (
        <div className="px-3 py-4 text-xs text-[var(--text-secondary)]">No changes</div>
      ) : null}
      {files.map((file) => (
        <div
          key={file.path}
          className={`border-b border-[var(--border-default)] px-2 py-2 cursor-pointer ${
            selectedFile === file.path
              ? 'bg-[var(--accent-muted)]'
              : 'hover:bg-[var(--surface-tertiary)]'
          }`}
        >
          <button className="w-full text-left" onClick={() => onSelect(file.path)}>
            <p className="truncate text-xs font-medium">{file.path}</p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-secondary)]">
              {file.status}
              {file.staged ? ' \u2022 staged' : ''}
            </p>
          </button>
          <div className="mt-1 flex gap-1">
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
