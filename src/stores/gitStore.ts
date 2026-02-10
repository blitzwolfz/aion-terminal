import { create } from 'zustand';
import type { BranchList, CommitEntry, DiffResult, FileStatusEntry, StashEntry } from '@/lib/types';

interface GitState {
  repoPath: string;
  statuses: FileStatusEntry[];
  selectedFile: string | null;
  diff: DiffResult | null;
  commits: CommitEntry[];
  branches: BranchList;
  stashes: StashEntry[];
  loading: boolean;
  error: string | null;
  setRepoPath: (repoPath: string) => void;
  setStatuses: (statuses: FileStatusEntry[]) => void;
  setSelectedFile: (file: string | null) => void;
  setDiff: (diff: DiffResult | null) => void;
  setCommits: (commits: CommitEntry[]) => void;
  setBranches: (branches: BranchList) => void;
  setStashes: (stashes: StashEntry[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

const EMPTY_BRANCHES: BranchList = {
  current: null,
  local: [],
  remote: []
};

export const useGitStore = create<GitState>((set) => ({
  repoPath: '.',
  statuses: [],
  selectedFile: null,
  diff: null,
  commits: [],
  branches: EMPTY_BRANCHES,
  stashes: [],
  loading: false,
  error: null,
  setRepoPath: (repoPath) => set({ repoPath }),
  setStatuses: (statuses) => set({ statuses }),
  setSelectedFile: (selectedFile) => set({ selectedFile }),
  setDiff: (diff) => set({ diff }),
  setCommits: (commits) => set({ commits }),
  setBranches: (branches) => set({ branches }),
  setStashes: (stashes) => set({ stashes }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error })
}));
