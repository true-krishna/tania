"use client";

import { type DocumentNode } from "graphql";
import { useMutation } from "@apollo/client";
import {
  ChaptersDocument,
  CreateChapterDocument,
  CreateJobRoleDocument,
  CreateProjectDocument,
  CreateUnitDocument,
  JobRolesDocument,
  ProjectsDocument,
  SetChapterActiveDocument,
  SetJobRoleActiveDocument,
  SetJobRoleChapterDocument,
  SetProjectActiveDocument,
  SetUnitActiveDocument,
  UnitsDocument,
  UpdateChapterDocument,
  UpdateJobRoleDocument,
  UpdateProjectDocument,
  UpdateUnitDocument,
} from "@/generated/graphql";

export type MasterDataMutationValue = { name: string; selectValue?: string; code?: string };

function refetch(
  doc: DocumentNode,
): { query: typeof doc; variables: { includeInactive: boolean } }[] {
  return [{ query: doc, variables: { includeInactive: true } }];
}

export function useUnitMutations() {
  const [createUnit, createResult] = useMutation(CreateUnitDocument, {
    refetchQueries: refetch(UnitsDocument),
  });
  const [updateUnit] = useMutation(UpdateUnitDocument, { refetchQueries: refetch(UnitsDocument) });
  const [setUnitActive] = useMutation(SetUnitActiveDocument, { refetchQueries: refetch(UnitsDocument) });

  return {
    create: (v: MasterDataMutationValue) =>
      createUnit({ variables: { code: v.code ?? "", name: v.name } }),
    update: (id: string, v: MasterDataMutationValue) =>
      updateUnit({ variables: { id, code: v.code ?? "", name: v.name } }),
    toggleActive: (id: string, isActive: boolean) => setUnitActive({ variables: { id, isActive } }),
    busy: createResult.loading,
  };
}

export function useChapterMutations() {
  const [createChapter, createResult] = useMutation(CreateChapterDocument, {
    refetchQueries: refetch(ChaptersDocument),
  });
  const [updateChapter] = useMutation(UpdateChapterDocument, { refetchQueries: refetch(ChaptersDocument) });
  const [setChapterActive] = useMutation(SetChapterActiveDocument, {
    refetchQueries: refetch(ChaptersDocument),
  });

  return {
    create: (v: MasterDataMutationValue) => createChapter({ variables: { name: v.name } }),
    update: (id: string, v: MasterDataMutationValue) => updateChapter({ variables: { id, name: v.name } }),
    toggleActive: (id: string, isActive: boolean) => setChapterActive({ variables: { id, isActive } }),
    busy: createResult.loading,
  };
}

export function useJobRoleMutations() {
  const [createJobRole, createResult] = useMutation(CreateJobRoleDocument, {
    refetchQueries: refetch(JobRolesDocument),
  });
  const [updateJobRole] = useMutation(UpdateJobRoleDocument, { refetchQueries: refetch(JobRolesDocument) });
  const [setJobRoleChapter] = useMutation(SetJobRoleChapterDocument, {
    refetchQueries: refetch(JobRolesDocument),
  });
  const [setJobRoleActive] = useMutation(SetJobRoleActiveDocument, {
    refetchQueries: refetch(JobRolesDocument),
  });

  return {
    create: (v: MasterDataMutationValue) =>
      createJobRole({ variables: { name: v.name, chapterId: v.selectValue || null } }),
    update: (id: string, v: MasterDataMutationValue) => updateJobRole({ variables: { id, name: v.name } }),
    changeChapter: (id: string, chapterId: string | null) => setJobRoleChapter({ variables: { id, chapterId } }),
    toggleActive: (id: string, isActive: boolean) => setJobRoleActive({ variables: { id, isActive } }),
    busy: createResult.loading,
  };
}

export function useProjectMutations() {
  const [createProject, createResult] = useMutation(CreateProjectDocument, {
    refetchQueries: refetch(ProjectsDocument),
  });
  const [updateProject] = useMutation(UpdateProjectDocument, { refetchQueries: refetch(ProjectsDocument) });
  const [setProjectActive] = useMutation(SetProjectActiveDocument, {
    refetchQueries: refetch(ProjectsDocument),
  });

  return {
    create: (v: MasterDataMutationValue) =>
      createProject({ variables: { name: v.name, unitId: v.selectValue ?? "" } }),
    update: (id: string, v: MasterDataMutationValue) =>
      updateProject({ variables: { id, name: v.name, unitId: v.selectValue ?? "" } }),
    toggleActive: (id: string, isActive: boolean) => setProjectActive({ variables: { id, isActive } }),
    busy: createResult.loading,
  };
}