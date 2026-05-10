import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchProjects, fetchProject, deleteProject, createProjectFromPack, projectsKeys } from '../api'

export function useProjects() {
  return useQuery({
    queryKey: projectsKeys.lists(),
    queryFn: fetchProjects,
  })
}

export function useProject(id: string) {
  return useQuery({
    queryKey: projectsKeys.detail(id),
    queryFn: () => fetchProject(id),
  })
}

export function useDeleteProject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteProject(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: projectsKeys.lists() }),
  })
}

export function useCreateProjectFromPack() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createProjectFromPack,
    onSuccess: () => qc.invalidateQueries({ queryKey: projectsKeys.lists() }),
  })
}
