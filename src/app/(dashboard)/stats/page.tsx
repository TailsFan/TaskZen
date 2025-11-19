'use client';

import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, getDocs } from 'firebase/firestore';
import { useEffect, useState } from 'react';

import PageHeader from '@/components/page-header';
import ProjectProgressChart from '@/components/charts/project-progress-chart';
import TasksOverviewChart from '@/components/charts/tasks-overview-chart';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, ListTodo, Clock, Folder } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import type { Task, Project } from '@/lib/types';


export default function StatsPage() {
    const { user } = useUser();
    const firestore = useFirestore();

    const projectsQuery = useMemoFirebase(
        () => (user ? query(collection(firestore, 'users', user.uid, 'projects')) : null),
        [user, firestore]
    );
    const { data: projects, isLoading: projectsLoading } = useCollection<Project>(projectsQuery);

    const [allTasks, setAllTasks] = useState<Task[]>([]);
    const [tasksLoading, setTasksLoading] = useState(true);

    useEffect(() => {
        if (!user || !projects) return;

        if (projects.length === 0) {
            setAllTasks([]);
            setTasksLoading(false);
            return;
        }

        const fetchAllTasks = async () => {
            setTasksLoading(true);
            try {
                const tasksPromises = projects.map(project => {
                    const tasksCollectionRef = collection(firestore, `users/${user.uid}/projects/${project.id}/tasks`);
                    return getDocs(tasksCollectionRef);
                });

                const projectSnapshots = await Promise.all(tasksPromises);
                const allFetchedTasks = projectSnapshots.flatMap(snapshot => 
                    snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task))
                );
                
                setAllTasks(allFetchedTasks);
            } catch (error) {
                console.error("Ошибка при загрузке задач для статистики:", error);
            } finally {
                setTasksLoading(false);
            }
        };

        fetchAllTasks();

    }, [projects, firestore, user]);


    const isLoading = projectsLoading || tasksLoading;

    if (isLoading) {
        return (
             <div>
                <PageHeader title="Общая статистика" />
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
    
    if (!isLoading && projects?.length === 0) {
        return (
            <div>
                <PageHeader title="Общая статистика" />
                <div className="p-4 sm:p-6">
                    <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground bg-muted/50 rounded-lg p-8 min-h-[60vh]">
                        <h3 className="text-xl font-semibold mb-2">Статистика пока недоступна</h3>
                        <p className="mb-4">Создайте свой первый проект и добавьте задачи, чтобы увидеть статистику.</p>
                    </div>
                </div>
            </div>
        )
    }

    const completedTasks = allTasks?.filter(task => task.completed).length ?? 0;
    const totalTasks = allTasks?.length ?? 0;
    const activeTasks = totalTasks - completedTasks;
    const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    
    const completedProjects = projects?.filter(p => {
        const projectTasks = allTasks?.filter(t => t.projectId === p.id);
        return projectTasks && projectTasks.length > 0 && projectTasks.every(t => t.completed);
    }).length ?? 0;
    const totalProjects = projects?.length ?? 0;

  return (
    <div>
      <PageHeader title="Общая статистика" />
      <div className="p-4 sm:p-6 space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Общий прогресс</CardTitle>
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
                    <CardTitle className="text-sm font-medium">Всего проектов</CardTitle>
                    <Folder className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{totalProjects}</div>
                    <p className="text-xs text-muted-foreground">Всего создано проектов</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Проектов завершено</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{completedProjects} / {totalProjects}</div>
                    <p className="text-xs text-muted-foreground">Всего завершено проектов</p>
                </CardContent>
            </Card>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline">Завершение проектов</CardTitle>
                    <CardDescription>Процент выполненных задач по каждому проекту.</CardDescription>
                </CardHeader>
                <CardContent>
                    <ProjectProgressChart projects={projects} tasks={allTasks} />
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline">Задачи по приоритетам</CardTitle>
                    <CardDescription>Обзор всех задач, сгруппированных по приоритету.</CardDescription>
                </CardHeader>
                <CardContent>
                    <TasksOverviewChart tasks={allTasks} />
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
