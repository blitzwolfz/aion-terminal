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
        <h4 className="mb-2 text-[10px] uppercase tracking-[0.04em] text-text-secondary">Defaults</h4>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <label className="space-y-1 text-xs">
            <span className="text-text-secondary">macOS default shell</span>
            <select
              className="h-8 w-full border border-default bg-surface-secondary px-2"
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
            <span className="text-text-secondary">Windows default shell</span>
            <select
              className="h-8 w-full border border-default bg-surface-secondary px-2"
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
        <h4 className="mb-2 text-[10px] uppercase tracking-[0.04em] text-text-secondary">Custom Paths</h4>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <label className="space-y-1 text-xs">
            <span className="text-text-secondary">darwin path</span>
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
            <span className="text-text-secondary">win32 path</span>
            <Input
              value={value.customPaths.win32 ?? ''}
              onChange={(event) =>
                onChange({
                  ...value,
                  customPaths: { ...value.customPaths, win32: event.target.value || undefined }
                })
              }
              placeholder="C:\\msys64\\usr\\bin\\bash.exe"
            />
          </label>
        </div>
      </section>

      <section className="space-y-2">
        <h4 className="text-[10px] uppercase tracking-[0.04em] text-text-secondary">Spawn Behavior</h4>
        <label className="flex items-center gap-2 text-xs">
          <input
            type="checkbox"
            checked={value.loginShell}
            onChange={(event) => onChange({ ...value, loginShell: event.target.checked })}
          />
          Login shell
        </label>
        <label className="flex items-center gap-2 text-xs">
          <input
            type="checkbox"
            checked={value.profileLoad}
            onChange={(event) => onChange({ ...value, profileLoad: event.target.checked })}
          />
          Load shell profile
        </label>
      </section>
    </div>
  );
}
