import type { Project, Task } from "@/lib/types";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import * as LucideIcons from "lucide-react";
import { useCollection, useMemoFirebase } from "@/firebase";
import { useUser, useFirestore } from "@/firebase";
import { collection } from "firebase/firestore";

type ProjectCardProps = {
  project: Project;
  onDelete: (projectId: string) => void;
};

function getIcon(name: string) {
    const Icon = LucideIcons[name as keyof typeof LucideIcons];
    return Icon ? <Icon className="w-6 h-6 text-muted-foreground" /> : <LucideIcons.Folder className="w-6 h-6 text-muted-foreground" />;
}

export default function ProjectCard({ project, onDelete }: ProjectCardProps) {
  const { user } = useUser();
  const firestore = useFirestore();

  const tasksCollectionRef = useMemoFirebase(
    () => (user ? collection(firestore, `users/${user.uid}/projects/${project.id}/tasks`) : null),
    [user, firestore, project.id]
  );
  
  const { data: tasks } = useCollection<Task>(tasksCollectionRef);
  
  const completedTasks = tasks?.filter((task) => task.completed).length ?? 0;
  const totalTasks = tasks?.length ?? 0;
  const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
  
  const progressProps: { value: number; indicatorColor?: string } = { value: progress };
  if (project.color) {
    progressProps.indicatorColor = project.color;
  }


  return (
    <Card className="flex flex-col h-full shadow-md hover:shadow-xl transition-shadow duration-300">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
             {getIcon(project.icon)}
            <CardTitle className="font-headline text-xl">{project.name}</CardTitle>
          </div>
          <Button variant="ghost" size="icon" className="w-8 h-8" onClick={() => onDelete(project.id)}>
              <LucideIcons.Trash2 className="w-4 h-4 text-muted-foreground" />
          </Button>
        </div>
        <CardDescription>{project.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Прогресс</span>
            <span>{completedTasks} / {totalTasks}</span>
          </div>
          <Progress {...progressProps} />
        </div>
      </CardContent>
      <CardFooter>
        <Button asChild className="w-full" variant="secondary">
          <Link href={`/projects/${project.id}`}>Открыть проект</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
