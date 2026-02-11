import type { ShellConfig as ShellConfigType } from '@/lib/types';
import { Input } from '@/components/ui/Input';

interface Props {
  value: ShellConfigType;
  onChange: (next: ShellConfigType) => void;
}

export function ShellConfig({ value, onChange }: Props) {
  return (
    <div className="space-y-4">
      <section>
        <h4 className="mb-2 text-[10px] font-bold uppercase tracking-widest text-[var(--text-secondary)]">Defaults</h4>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <label className="space-y-1 text-xs">
            <span className="font-semibold uppercase tracking-wider text-[var(--text-secondary)]">macOS</span>
            <select
              className="h-8 w-full border-2 border-[var(--border-default)] bg-[var(--surface-elevated)] px-2 text-xs"
              value={value.defaultShell.darwin}
              onChange={(event) =>
                onChange({
                  ...value,
                  defaultShell: { ...value.defaultShell, darwin: event.target.value as ShellConfigType['defaultShell']['darwin'] }
                })
              }
            >
              <option value="zsh">zsh</option>
              <option value="bash">bash</option>
              <option value="fish">fish</option>
              <option value="custom">custom</option>
            </select>
          </label>
          <label className="space-y-1 text-xs">
            <span className="font-semibold uppercase tracking-wider text-[var(--text-secondary)]">Windows</span>
            <select
              className="h-8 w-full border-2 border-[var(--border-default)] bg-[var(--surface-elevated)] px-2 text-xs"
              value={value.defaultShell.win32}
              onChange={(event) =>
                onChange({
                  ...value,
                  defaultShell: { ...value.defaultShell, win32: event.target.value as ShellConfigType['defaultShell']['win32'] }
                })
              }
            >
              <option value="pwsh">pwsh</option>
              <option value="powershell">powershell</option>
              <option value="cmd">cmd</option>
              <option value="custom">custom</option>
            </select>
          </label>
        </div>
      </section>

      <section>
        <h4 className="mb-2 text-[10px] font-bold uppercase tracking-widest text-[var(--text-secondary)]">Custom Paths</h4>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <label className="space-y-1 text-xs">
            <span className="font-semibold uppercase tracking-wider text-[var(--text-secondary)]">darwin path</span>
            <Input
              value={value.customPaths.darwin ?? ''}
              onChange={(event) =>
                onChange({
                  ...value,
                  customPaths: { ...value.customPaths, darwin: event.target.value || undefined }
                })
              }
              placeholder="/opt/homebrew/bin/fish"
            />
          </label>
          <label className="space-y-1 text-xs">
            <span className="font-semibold uppercase tracking-wider text-[var(--text-secondary)]">win32 path</span>
            <Input
              value={value.customPaths.win32 ?? ''}
              onChange={(event) =>
                onChange({
                  ...value,
                  customPaths: { ...value.customPaths, win32: event.target.value || undefined }
                })
              }
              placeholder="C:\msys64\usr\bin\bash.exe"
            />
          </label>
        </div>
      </section>

      <section className="space-y-2">
        <h4 className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-secondary)]">Spawn Behavior</h4>
        <label className="flex items-center gap-2 text-xs font-medium">
          <input
            type="checkbox"
            checked={value.loginShell}
            onChange={(event) => onChange({ ...value, loginShell: event.target.checked })}
            className="accent-[var(--accent-primary)]"
          />
          Login shell
        </label>
        <label className="flex items-center gap-2 text-xs font-medium">
          <input
            type="checkbox"
            checked={value.profileLoad}
            onChange={(event) => onChange({ ...value, profileLoad: event.target.checked })}
            className="accent-[var(--accent-primary)]"
          />
          Load shell profile
        </label>
      </section>
    </div>
  );
}
