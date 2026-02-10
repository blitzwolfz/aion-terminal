import { useCallback, useEffect, useState } from 'react';
import { load_shell_config, resolveShell, save_shell_config } from '@/lib/ipc';
import { useSettingsStore } from '@/stores/settingsStore';

export function useSettings() {
  const shellConfig = useSettingsStore((state) => state.shellConfig);
  const setShellConfig = useSettingsStore((state) => state.setShellConfig);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const config = await load_shell_config();
      setShellConfig(config);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [setShellConfig]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const save = useCallback(
    async (nextConfig: typeof shellConfig) => {
      await save_shell_config(nextConfig);
      setShellConfig(nextConfig);
    },
    [setShellConfig]
  );

  const resolve = useCallback(
    (overrideShell?: string) => resolveShell(shellConfig, overrideShell),
    [shellConfig]
  );

  return {
    shellConfig,
    loading,
    error,
    refresh,
    save,
    resolve
  };
}
