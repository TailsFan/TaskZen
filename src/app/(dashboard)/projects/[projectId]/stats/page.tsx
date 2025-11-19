'use client';

import { useParams, notFound } from 'next/navigation';
import { useUser, useFirestore, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { collection, query, doc } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, ListTodo, Hourglass, Folder } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import type { Task, Project, Column } from '@/lib/types';
import PageHeader from '@/components/page-header';
import TasksByPriorityChart from '@/components/charts/tasks-by-priority-chart';
import TasksByStatusChart from '@/components/charts/tasks-by-status-chart';

export default function ProjectStatsPage() {
    const params = useParams();
    const projectId = params.projectId as string;
    const { user } = useUser();
    const firestore = useFirestore();

    const projectRef = useMemoFirebase(
        () => (user && projectId ? doc(firestore, `users/${user.uid}/projects/${projectId}`) : null),
        [user, firestore, projectId]
    );

    const tasksQuery = useMemoFirebase(
        () => (user && projectId ? query(collection(firestore, `users/${user.uid}/projects/${projectId}/tasks`)) : null),
        [user, firestore, projectId]
    );
    
    const columnsQuery = useMemoFirebase(
        () => (user && projectId ? query(collection(firestore, `users/${user.uid}/projects/${projectId}/columns`)) : null),
        [user, firestore, projectId]
    );

    const { data: project, isLoading: projectLoading } = useDoc<Project>(projectRef);
    const { data: tasks, isLoading: tasksLoading } = useCollection<Task>(tasksQuery);
    const { data: columns, isLoading: columnsLoading } = useCollection<Column>(columnsQuery);

    const isLoading = projectLoading || tasksLoading || columnsLoading;

    if (isLoading) {
        return (
             <div>
                <PageHeader title={<Skeleton className="h-8 w-48" />} backHref={`/projects/${projectId}`} />
                <div className="p-4 sm:p-6 space-y-6">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                        <Skeleton className="h-28" />
                        <Skeleton className="h-28" />
                        <Skeleton className="h-28" />
                        <Skeleton className="h-28" />
                    </div>
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        <Skeleton className="h-80" />
                        <Skeleton className="h-80" />
                    </div>
                </div>
            </div>
        )
    }

    if (!project) {
        notFound();
    }
    
    const completedTasks = tasks?.filter(task => task.completed).length ?? 0;
    const totalTasks = tasks?.length ?? 0;
    const activeTasks = totalTasks - completedTasks;
    const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    const overdueTasks = tasks?.filter(task => task.deadline && new Date(task.deadline) < new Date() && !task.completed).length ?? 0;


  return (
    <div>
      <PageHeader title={project.name} backHref={`/projects/${projectId}`} />
      <div className="p-4 sm:p-6 space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Прогресс по проекту</CardTitle>
                    <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{progressPercentage}%</div>
                    <p className="text-xs text-muted-foreground">{completedTasks} из {totalTasks} задач выполнено</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Активные задачи</CardTitle>
                    <ListTodo className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{activeTasks}</div>
                    <p className="text-xs text-muted-foreground">Задачи в процессе выполнения</p>
                </CardContent>
            </Card>
             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Всего задач</CardTitle>
                    <Folder className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{totalTasks}</div>
                    <p className="text-xs text-muted-foreground">Всего задач в проекте</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Просрочено</CardTitle>
                    <Hourglass className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-destructive">{overdueTasks}</div>
                    <p className="text-xs text-muted-foreground">Задачи с истекшим сроком</p>
                </CardContent>
            </Card>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline">Задачи по статусам</CardTitle>
                    <CardDescription>Распределение задач по колонкам.</CardDescription>
                </CardHeader>
                <CardContent>
                    <TasksByStatusChart tasks={tasks} columns={columns} />
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline">Задачи по приоритетам</CardTitle>
                    <CardDescription>Распределение задач по приоритету.</CardDescription>
                </CardHeader>
                <CardContent>
                    <TasksByPriorityChart tasks={tasks} />
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
