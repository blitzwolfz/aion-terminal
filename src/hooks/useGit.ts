import { useCallback, useEffect, useRef } from 'react';
import {
  gitBranchDelete,
  gitBranches,
  gitCheckout,
  gitCherryPick,
  gitCommit,
  gitDiff,
  gitFetch,
  gitLog,
  gitMerge,
  gitPull,
  gitPush,
  gitStage,
  gitStash,
  gitStatus,
  gitTagCreate,
  gitTagDelete,
  gitUnstage,
  gitWatchStart,
  gitWatchStop,
  onGitChanged
} from '@/lib/ipc';
import { useGitStore } from '@/stores/gitStore';

export function useGit(repoPath: string) {
  const setStatuses = useGitStore((state) => state.setStatuses);
  const setDiff = useGitStore((state) => state.setDiff);
  const setCommits = useGitStore((state) => state.setCommits);
  const setBranches = useGitStore((state) => state.setBranches);
  const setStashes = useGitStore((state) => state.setStashes);
  const setLoading = useGitStore((state) => state.setLoading);
  const setError = useGitStore((state) => state.setError);
  const selectedFileRef = useRef(useGitStore.getState().selectedFile);

  // Keep ref in sync without causing effect re-runs
  useEffect(() => {
    return useGitStore.subscribe((state) => {
      selectedFileRef.current = state.selectedFile;
    });
  }, []);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [statuses, commits, branches, stashResult] = await Promise.all([
        gitStatus(repoPath),
        gitLog(repoPath, 100),
        gitBranches(repoPath),
        gitStash(repoPath, 'List')
      ]);
      setStatuses(statuses);
      setCommits(commits);
      setBranches(branches);
      setStashes(stashResult.stashes);
      if (selectedFileRef.current) {
        try {
          const nextDiff = await gitDiff(repoPath, selectedFileRef.current, false);
          setDiff(nextDiff);
        } catch {
          setDiff(null);
        }
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : String(error));
    } finally {
      setLoading(false);
    }
  }, [repoPath, setBranches, setCommits, setDiff, setError, setLoading, setStashes, setStatuses]);

  // Setup git watcher and initial refresh
  useEffect(() => {
    let mounted = true;
    let unlisten: (() => void) | undefined;
    let startedPath: string | undefined;
    let debounceTimeout: ReturnType<typeof setTimeout> | undefined;

    void refresh();

    void gitWatchStart(repoPath)
      .then((root) => {
        if (mounted) {
          startedPath = root;
        } else {
          void gitWatchStop(root);
        }
      })
      .catch(() => {});

    onGitChanged(() => {
      if (!mounted) return;
      if (debounceTimeout) clearTimeout(debounceTimeout);
      debounceTimeout = setTimeout(() => {
        if (mounted) void refresh();
      }, 200);
    }).then((fn) => {
      if (mounted) {
        unlisten = fn;
      } else {
        fn();
      }
    });

    return () => {
      mounted = false;
      if (debounceTimeout) clearTimeout(debounceTimeout);
      unlisten?.();
      if (startedPath) {
        void gitWatchStop(startedPath);
      }
    };
  }, [refresh, repoPath]);

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
      try {
        await gitStage(repoPath, files);
        await refresh();
      } catch (error) {
        setError(error instanceof Error ? error.message : String(error));
      }
    },
    [repoPath, refresh, setError]
  );

  const unstage = useCallback(
    async (files: string[]) => {
      try {
        await gitUnstage(repoPath, files);
        await refresh();
      } catch (error) {
        setError(error instanceof Error ? error.message : String(error));
      }
    },
    [repoPath, refresh, setError]
  );

  const commit = useCallback(
    async (message: string, amend = false) => {
      try {
        const result = await gitCommit(repoPath, message, amend);
        await refresh();
        return result;
      } catch (error) {
        setError(error instanceof Error ? error.message : String(error));
        throw error;
      }
    },
    [repoPath, refresh, setError]
  );

  const checkout = useCallback(
    async (branch: string, create = false) => {
      try {
        await gitCheckout(repoPath, branch, create);
        await refresh();
      } catch (error) {
        setError(error instanceof Error ? error.message : String(error));
      }
    },
    [repoPath, refresh, setError]
  );

  const deleteBranch = useCallback(
    async (branch: string, force = false) => {
      try {
        await gitBranchDelete(repoPath, branch, force);
        await refresh();
      } catch (error) {
        setError(error instanceof Error ? error.message : String(error));
      }
    },
    [repoPath, refresh, setError]
  );

  const fetchRemote = useCallback(
    async (remote?: string) => {
      try {
        const result = await gitFetch(repoPath, remote);
        await refresh();
        return result;
      } catch (error) {
        setError(error instanceof Error ? error.message : String(error));
        throw error;
      }
    },
    [repoPath, refresh, setError]
  );

  const pushRemote = useCallback(
    async (remote?: string, branch?: string, force = false) => {
      try {
        const result = await gitPush(repoPath, remote, branch, force);
        await refresh();
        return result;
      } catch (error) {
        setError(error instanceof Error ? error.message : String(error));
        throw error;
      }
    },
    [repoPath, refresh, setError]
  );

  const pullRemote = useCallback(
    async (remote?: string, branch?: string) => {
      try {
        const result = await gitPull(repoPath, remote, branch);
        await refresh();
        return result;
      } catch (error) {
        setError(error instanceof Error ? error.message : String(error));
        throw error;
      }
    },
    [repoPath, refresh, setError]
  );

  const merge = useCallback(
    async (branch: string, noFf = false) => {
      try {
        const result = await gitMerge(repoPath, branch, noFf);
        await refresh();
        return result;
      } catch (error) {
        setError(error instanceof Error ? error.message : String(error));
        throw error;
      }
    },
    [repoPath, refresh, setError]
  );

  const cherryPick = useCallback(
    async (commitOid: string) => {
      try {
        const result = await gitCherryPick(repoPath, commitOid);
        await refresh();
        return result;
      } catch (error) {
        setError(error instanceof Error ? error.message : String(error));
        throw error;
      }
    },
    [repoPath, refresh, setError]
  );

  const createTag = useCallback(
    async (tag: string, target?: string) => {
      try {
        const result = await gitTagCreate(repoPath, tag, target);
        await refresh();
        return result;
      } catch (error) {
        setError(error instanceof Error ? error.message : String(error));
        throw error;
      }
    },
    [repoPath, refresh, setError]
  );

  const deleteTag = useCallback(
    async (tag: string) => {
      try {
        const result = await gitTagDelete(repoPath, tag);
        await refresh();
        return result;
      } catch (error) {
        setError(error instanceof Error ? error.message : String(error));
        throw error;
      }
    },
    [repoPath, refresh, setError]
  );

  const stashOp = useCallback(
    async (action: 'Push' | 'Pop' | 'Drop' | 'List', message?: string, index?: number) => {
      try {
        const result = await gitStash(repoPath, action, message, index);
        await refresh();
        return result;
      } catch (error) {
        setError(error instanceof Error ? error.message : String(error));
        throw error;
      }
    },
    [repoPath, refresh, setError]
  );

  return {
    refresh,
    loadDiff,
    stage,
    unstage,
    commit,
    checkout,
    deleteBranch,
    fetch: fetchRemote,
    push: pushRemote,
    pull: pullRemote,
    merge,
    cherryPick,
    createTag,
    deleteTag,
    stash: stashOp
  };
}
