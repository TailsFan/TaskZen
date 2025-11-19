
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useFirestore, useUser, useCollection, addDocumentNonBlocking, deleteDocumentNonBlocking, useMemoFirebase } from '@/firebase';
import { collection, query, getDocs, doc } from 'firebase/firestore';
import * as LucideIcons from 'lucide-react';

import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import ProjectCard from "@/components/project-card";
import PageHeader from "@/components/page-header";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/responsive-dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from '@/components/ui/skeleton';
import { Project } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

const iconNames = ["Folder", "Briefcase", "Book", "Code", "PenSquare", "Rocket", "Star"] as const;

const projectFormSchema = z.object({
  name: z.string().min(1, 'Название проекта обязательно'),
  description: z.string().optional(),
  icon: z.enum(iconNames),
});

export default function ProjectsPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  
  const projectsCollectionRef = useMemoFirebase(
    () => (user ? collection(firestore, `users/${user.uid}/projects`) : null),
    [user, firestore]
  );
  const projectsQuery = useMemoFirebase(
    () => (projectsCollectionRef ? query(projectsCollectionRef) : null),
    [projectsCollectionRef]
  );

  const { data: projects, isLoading } = useCollection<Project>(projectsQuery);

  const form = useForm<z.infer<typeof projectFormSchema>>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      name: "",
      description: "",
      icon: "Folder",
    },
  });

  async function onSubmit(values: z.infer<typeof projectFormSchema>) {
    if (!user || !projectsCollectionRef) return;

    const newProject: Omit<Project, 'id'> = {
      userId: user.uid,
      name: values.name,
      description: values.description || "",
      icon: values.icon,
      color: `hsl(var(--chart-${(projects?.length ?? 0) % 5 + 1}))`,
    };
    
    addDocumentNonBlocking(projectsCollectionRef, newProject);

    toast({
        title: "Проект создан",
        description: `Проект "${values.name}" был успешно создан.`,
    });

    form.reset();
    setIsDialogOpen(false);
  }

  async function handleDeleteProject(projectId: string) {
    if (!user || !firestore) return;

    try {
        const projectRef = doc(firestore, `users/${user.uid}/projects`, projectId);
        
        const tasksCollectionRef = collection(projectRef, 'tasks');
        const tasksSnapshot = await getDocs(tasksCollectionRef);
        tasksSnapshot.forEach(taskDoc => {
            deleteDocumentNonBlocking(taskDoc.ref);
        });

        const columnsCollectionRef = collection(projectRef, 'columns');
        const columnsSnapshot = await getDocs(columnsCollectionRef);
        columnsSnapshot.forEach(columnDoc => {
            deleteDocumentNonBlocking(columnDoc.ref);
        });

        deleteDocumentNonBlocking(projectRef);

        toast({
            title: "Проект удален",
            description: "Проект и все его задачи были удалены.",
        });
    } catch (error) {
         toast({
            variant: "destructive",
            title: "Ошибка удаления",
            description: "Не удалось удалить проект. Пожалуйста, попробуйте еще раз.",
        });
    }

    setProjectToDelete(null);
  }

  return (
    <div className="flex flex-col h-screen">
      <PageHeader 
        title="Мои проекты"
        actions={
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Новый проект
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Создать новый проект</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Название</FormLabel>
                        <FormControl>
                          <Input placeholder="например, Дипломная работа" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Описание</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Необязательное описание проекта" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="icon"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel>Иконка</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="grid grid-cols-6 gap-2"
                          >
                            {iconNames.map(iconName => {
                              const Icon = LucideIcons[iconName as keyof typeof LucideIcons];
                              const id = `icon-${iconName}`;
                              return (
                                <FormItem key={iconName} className="flex items-center justify-center">
                                  <FormControl>
                                    <RadioGroupItem value={iconName} id={id} className="sr-only" />
                                  </FormControl>
                                  <Label
                                    htmlFor={id}
                                    className={`flex items-center justify-center p-2 rounded-md border-2 border-muted bg-popover hover:bg-accent hover:text-accent-foreground cursor-pointer ${
                                        field.value === iconName ? 'border-primary' : ''
                                    }`}
                                  >
                                    <Icon className="w-6 h-6" />
                                  </Label>
                                </FormItem>
                              )
                            })}
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <DialogFooter>
                    <Button type="submit">Создать</Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        }
      />
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 sm:p-6">
            {isLoading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                <Skeleton className="h-48 rounded-lg" />
                <Skeleton className="h-48 rounded-lg" />
                <Skeleton className="h-48 rounded-lg" />
            </div>
            )}
            {!isLoading && projects && projects.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
                {projects.map((project) => (
                <ProjectCard key={project.id} project={project} onDelete={() => setProjectToDelete(project)} />
                ))}
            </div>
            )}
            {!isLoading && (!projects || projects.length === 0) && (
                <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground bg-muted/50 rounded-lg p-8">
                    <h3 className="text-xl font-semibold mb-2">Пока нет проектов</h3>
                    <p className="mb-4">Нажмите "Новый проект", чтобы начать.</p>
                </div>
            )}
        </div>
      </div>

       <AlertDialog open={!!projectToDelete} onOpenChange={(open) => !open && setProjectToDelete(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Вы абсолютно уверены?</AlertDialogTitle>
                <AlertDialogDescription>
                    Это действие необратимо. Это навсегда удалит проект <span className="font-bold">{projectToDelete?.name}</span> и все его задачи.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setProjectToDelete(null)}>Отмена</AlertDialogCancel>
                <AlertDialogAction onClick={() => projectToDelete && handleDeleteProject(projectToDelete.id)}>Удалить</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
