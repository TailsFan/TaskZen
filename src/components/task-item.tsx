

import type { Task } from "@/lib/types";
import { Card, CardContent } from "./ui/card";
import { Checkbox } from "./ui/checkbox";
import { cn } from "@/lib/utils";
import { Badge } from "./ui/badge";
import { Flame, ArrowDown, Circle, Trash2, Infinity } from "lucide-react";
import { format, isPast, isToday } from 'date-fns';
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";

type TaskItemProps = {
  task: Task;
  onToggle: (e: React.MouseEvent<HTMLButtonElement>) => void;
  onDelete: (e: React.MouseEvent<HTMLButtonElement>) => void;
};

const priorityIcons = {
  high: <Flame className="w-4 h-4 text-red-500" />,
  medium: <Circle className="w-3 h-3 text-yellow-500 fill-yellow-500" />,
  low: <ArrowDown className="w-4 h-4 text-blue-500" />,
};

export default function TaskItem({ task, onToggle, onDelete }: TaskItemProps) {
  const deadlineDate = task.deadline ? new Date(task.deadline) : null;
  const isOverdue = deadlineDate && !task.completed && isPast(deadlineDate) && !isToday(deadlineDate);

  const formattedDate = deadlineDate ? format(deadlineDate, 'dd.MM') : <Infinity className="w-4 h-4" />;

  return (
    <Card className={cn(
      "hover:bg-muted/50 transition-colors group cursor-pointer",
      task.completed ? "bg-muted/30 border-dashed" : "bg-card"
    )}>
      <CardContent className="p-3 flex items-start gap-3">
        <Checkbox 
            id={`task-${task.id}`} 
            checked={task.completed} 
            onClick={onToggle}
            className="w-5 h-5 mt-1 flex-shrink-0"
        />
        <div className="flex-1 space-y-2">
          <span 
            className={cn(
              "font-medium leading-snug",
              task.completed && "line-through text-muted-foreground"
            )}
          >
            {task.name}
          </span>
          {task.description && (
            <>
              <Separator className="my-1 bg-border/80" />
              <p className={cn(
                  "text-xs text-muted-foreground",
                  task.completed && "line-through"
              )}>
                  {task.description}
              </p>
            </>
          )}
        </div>
        <div className="flex flex-col items-end gap-2 text-sm flex-shrink-0">
            <div className="flex items-center gap-2">
                <Badge variant={isOverdue ? "destructive" : "outline"} className="hidden sm:inline-flex items-center gap-1">
                    {formattedDate}
                </Badge>
                <div className="w-6 h-6 flex items-center justify-center">
                    {task.priority && priorityIcons[task.priority]}
                </div>
                <Button variant="ghost" size="icon" className="w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity" onClick={onDelete}>
                    <Trash2 className="w-4 h-4 text-muted-foreground" />
                </Button>
            </div>
             <Badge variant={isOverdue ? "destructive" : "outline"} className="sm:hidden items-center gap-1 self-end">
                {formattedDate}
            </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
