import { useCallback, useEffect } from 'react';
import {
  gitBranches,
  gitCheckout,
  gitCommit,
  gitDiff,
  gitLog,
  gitPull,
  gitPush,
  gitStage,
  gitStash,
  gitStatus,
  gitUnstage,
  onGitChanged
} from '@/lib/ipc';
import { useGitStore } from '@/stores/gitStore';

export function useGit(repoPath: string) {
  const {
    setStatuses,
    setDiff,
    setCommits,
    setBranches,
    setStashes,
    setLoading,
    setError,
    selectedFile
  } = useGitStore((state) => ({
    setStatuses: state.setStatuses,
    setDiff: state.setDiff,
    setCommits: state.setCommits,
    setBranches: state.setBranches,
    setStashes: state.setStashes,
    setLoading: state.setLoading,
    setError: state.setError,
    selectedFile: state.selectedFile
  }));

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [statuses, commits, branches, stashResult] = await Promise.all([
        gitStatus(repoPath),
        gitLog(repoPath, 50),
        gitBranches(repoPath),
        gitStash(repoPath, 'List')
      ]);
      setStatuses(statuses);
      setCommits(commits);
      setBranches(branches);
      setStashes(stashResult.stashes);
      if (selectedFile) {
        const nextDiff = await gitDiff(repoPath, selectedFile, false);
        setDiff(nextDiff);
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : String(error));
    } finally {
      setLoading(false);
    }
  }, [repoPath, selectedFile, setBranches, setCommits, setDiff, setError, setLoading, setStashes, setStatuses]);

  useEffect(() => {
    void refresh();
    let unlisten: (() => void) | undefined;
    void onGitChanged(() => {
      void refresh();
    }).then((fn) => {
      unlisten = fn;
    });
    return () => {
      if (unlisten) {
        unlisten();
      }
    };
  }, [refresh]);

  const loadDiff = useCallback(
    async (file: string, staged = false) => {
      try {
        const nextDiff = await gitDiff(repoPath, file, staged);
        setDiff(nextDiff);
      } catch (error) {
        setError(error instanceof Error ? error.message : String(error));
      }
    },
    [repoPath, setDiff, setError]
  );

  const stage = useCallback(
    async (files: string[]) => {
      await gitStage(repoPath, files);
      await refresh();
    },
    [repoPath, refresh]
  );

  const unstage = useCallback(
    async (files: string[]) => {
      await gitUnstage(repoPath, files);
      await refresh();
    },
    [repoPath, refresh]
  );

  const commit = useCallback(
    async (message: string, amend = false) => {
      const result = await gitCommit(repoPath, message, amend);
      await refresh();
      return result;
    },
    [repoPath, refresh]
  );

  const checkout = useCallback(
    async (branch: string, create = false) => {
      await gitCheckout(repoPath, branch, create);
      await refresh();
    },
    [repoPath, refresh]
  );

  const push = useCallback(
    async (remote?: string, branch?: string, force = false) => {
      const result = await gitPush(repoPath, remote, branch, force);
      await refresh();
      return result;
    },
    [repoPath, refresh]
  );

  const pull = useCallback(
    async (remote?: string, branch?: string) => {
      const result = await gitPull(repoPath, remote, branch);
      await refresh();
      return result;
    },
    [repoPath, refresh]
  );

  const stash = useCallback(
    async (action: 'Push' | 'Pop' | 'Drop' | 'List', message?: string, index?: number) => {
      const result = await gitStash(repoPath, action, message, index);
      await refresh();
      return result;
    },
    [repoPath, refresh]
  );

  return {
    refresh,
    loadDiff,
    stage,
    unstage,
    commit,
    checkout,
    push,
    pull,
    stash
  };
}
