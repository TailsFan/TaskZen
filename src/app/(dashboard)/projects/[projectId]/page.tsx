
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, notFound } from "next/navigation";
import {
  useFirestore,
  useUser,
  useCollection,
  useDoc,
  updateDocumentNonBlocking,
  deleteDocumentNonBlocking,
  setDocumentNonBlocking,
  useMemoFirebase,
  addDocumentNonBlocking,
} from "@/firebase";
import {
  doc,
  collection,
  query,
  orderBy,
  writeBatch,
} from "firebase/firestore";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { nanoid } from "nanoid";

import PageHeader from "@/components/page-header";
import TaskItem from "@/components/task-item";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Trash2 } from "lucide-react";
import type { Task, Project, Column } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { format } from "date-fns";


const taskFormSchema = z.object({
  name: z.string().min(1, "Название задачи обязательно."),
  description: z.string().optional(),
  noDeadline: z.boolean().default(false),
  deadline: z.string().optional(),
  priority: z.enum(["low", "medium", "high"]),
  status: z.string().min(1, "Необходимо выбрать колонку."),
}).refine(data => data.noDeadline || !!data.deadline, {
  message: "Срок выполнения обязателен, если не выбрано 'Без срока'.",
  path: ["deadline"],
});


type TaskFormData = z.infer<typeof taskFormSchema>;

function TaskFormFields({ control, columns }: { control: any, columns: Column[] | null }) {
  const noDeadline = useWatch({
      control,
      name: 'noDeadline',
  });

  return (
      <div className="space-y-4 py-4">
          <FormField
              control={control}
              name="name"
              render={({ field }) => (
                  <FormItem>
                      <FormLabel>Название</FormLabel>
                      <FormControl>
                          <Input placeholder="например, Написать теоретическую часть" {...field} />
                      </FormControl>
                      <FormMessage />
                  </FormItem>
              )}
          />
          <FormField
              control={control}
              name="description"
              render={({ field }) => (
                  <FormItem>
                      <FormLabel>Описание</FormLabel>
                      <FormControl>
                          <Textarea
                              placeholder="Необязательное описание задачи"
                              {...field}
                          />
                      </FormControl>
                      <FormMessage />
                  </FormItem>
              )}
          />
          <div className="flex items-center space-x-2">
              <FormField
                  control={control}
                  name="noDeadline"
                  render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                              <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                              />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                              <FormLabel>
                                  Без срока
                              </FormLabel>
                          </div>
                      </FormItem>
                  )}
              />
          </div>
          {!noDeadline && (
              <FormField
                  control={control}
                  name="deadline"
                  render={({ field }) => (
                      <FormItem>
                          <FormLabel>Срок выполнения</FormLabel>
                          <FormControl>
                              <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                      </FormItem>
                  )}
              />
          )}
          <FormField
              control={control}
              name="status"
              render={({ field }) => (
                  <FormItem>
                      <FormLabel>Колонка</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                              <SelectTrigger>
                                  <SelectValue placeholder="Выберите колонку" />
                              </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                              {columns?.map((col) => (
                                  <SelectItem key={col.id} value={col.id}>{col.title}</SelectItem>
                              ))}
                          </SelectContent>
                      </Select>
                      <FormMessage />
                  </FormItem>
              )}
          />
          <FormField
              control={control}
              name="priority"
              render={({ field }) => (
                  <FormItem>
                      <FormLabel>Приоритет</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                              <SelectTrigger>
                                  <SelectValue placeholder="Выберите приоритет" />
                              </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                              <SelectItem value="high">Высокий</SelectItem>
                              <SelectItem value="medium">Средний</SelectItem>
                              <SelectItem value="low">Низкий</SelectItem>
                          </SelectContent>
                      </Select>
                      <FormMessage />
                  </FormItem>
              )}
          />
      </div>
  );
}

function ResizableColumn({ children }: { children: React.ReactNode }) {
    const columnRef = useRef<HTMLDivElement>(null);
    const resizerRef = useRef<HTMLDivElement>(null);

    const onMouseMove = useCallback((e: MouseEvent) => {
        if (columnRef.current) {
            const newWidth = e.clientX - columnRef.current.getBoundingClientRect().left;
            if (newWidth > 320) { // min width
                 columnRef.current.style.width = `${newWidth}px`;
            }
        }
    }, []);

    const onMouseUp = useCallback(() => {
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
    }, [onMouseMove]);
    
    const onMouseDown = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    }, [onMouseMove, onMouseUp]);

    return (
        <div ref={columnRef} className="relative rounded-lg border bg-muted/60 flex flex-col h-full" style={{ width: '320px' }}>
            {children}
            <div 
                ref={resizerRef}
                onMouseDown={onMouseDown}
                className="absolute top-0 right-0 h-full w-2 cursor-col-resize hidden md:block"
            />
        </div>
    );
}

export default function ProjectDetailsPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [openNewTaskDialog, setOpenNewTaskDialog] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const startPos = useRef({ x: 0, y: 0 });
  const scrollPos = useRef({ left: 0, top: 0 });


  const projectRef = useMemoFirebase(
    () => (user && projectId ? doc(firestore, "users", user.uid, "projects", projectId) : null),
    [user, firestore, projectId]
  );

  const tasksCollectionRef = useMemoFirebase(
    () => (user && projectId ? collection(firestore, `users/${user.uid}/projects/${projectId}/tasks`) : null),
    [user, firestore, projectId]
  );
  
  const columnsRef = useMemoFirebase(
    () => (projectRef ? collection(firestore, projectRef.path, "columns") : null),
    [projectRef]
  );
  
  const orderedColumnsQuery = useMemoFirebase(
    () => (columnsRef ? query(columnsRef, orderBy("order")) : null),
    [columnsRef]
  );
  
  const allTasksQuery = useMemoFirebase(e=> (tasksCollectionRef ? query(tasksCollectionRef) : null),
    [tasksCollectionRef]
  );

  const { data: project, isLoading: isProjectLoading } = useDoc<Project>(projectRef);
  const { data: tasks, isLoading: areTasksLoading } = useCollection<Task>(allTasksQuery);
  const { data: columnsFromDB, isLoading: areColumnsLoading } = useCollection<Column>(orderedColumnsQuery);

  const [orderedColumns, setOrderedColumns] = useState<Column[] | null>(null);

  useEffect(() => {
    if (columnsFromDB) {
      setOrderedColumns(columnsFromDB);
    }
  }, [columnsFromDB]);


  const [columnToDelete, setColumnToDelete] = useState<Column | null>(null);

  const form = useForm<TaskFormData>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      name: "",
      description: "",
      deadline: "",
      noDeadline: false,
      priority: "medium",
      status: "",
    },
  });
  
  useEffect(() => {
    if (orderedColumns && orderedColumns.length > 0 && !form.getValues('status')) {
      form.setValue('status', orderedColumns[0].id);
    }
  }, [orderedColumns, form]);

  const editForm = useForm<TaskFormData>({
    resolver: zodResolver(taskFormSchema),
  });

  useEffect(() => {
    if (editingTask) {
      editForm.reset({
        name: editingTask.name,
        description: editingTask.description,
        noDeadline: !editingTask.deadline,
        deadline: editingTask.deadline ? format(new Date(editingTask.deadline), 'yyyy-MM-dd') : undefined,
        priority: editingTask.priority,
        status: editingTask.status,
      });
    }
  }, [editingTask, editForm]);

    const onMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        const target = e.target as HTMLElement;
        // Prevent dragging when interacting with form elements or buttons inside columns
        if (target.closest('.p-3, .p-2, button, input, textarea, select')) {
            return;
        }

        if (scrollContainerRef.current) {
            isDragging.current = true;
            startPos.current = { x: e.pageX, y: e.pageY };
            scrollPos.current = {
                left: scrollContainerRef.current.scrollLeft,
                top: scrollContainerRef.current.scrollTop
            };
            scrollContainerRef.current.style.cursor = 'grabbing';
            document.body.classList.add('no-select');
        }
    };

    const onMouseLeaveOrUp = () => {
        if (isDragging.current) {
            isDragging.current = false;
            if (scrollContainerRef.current) {
                scrollContainerRef.current.style.cursor = 'grab';
            }
            document.body.classList.remove('no-select');
        }
    };

    const onMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!isDragging.current || !scrollContainerRef.current) return;
        e.preventDefault();
        const dx = e.pageX - startPos.current.x;
        const dy = e.pageY - startPos.current.y;
        scrollContainerRef.current.scrollLeft = scrollPos.current.left - dx;
        scrollContainerRef.current.scrollTop = scrollPos.current.top - dy;
    };


  const onDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId, type } = result;
    if (!destination || !orderedColumns || !tasks || !user || !firestore) return;

    const tasksRef = collection(firestore, `users/${user.uid}/projects/${projectId}/tasks`);

    if (type === "column") {
      const newColumnOrder = Array.from(orderedColumns);
      const [reorderedItem] = newColumnOrder.splice(source.index, 1);
      newColumnOrder.splice(destination.index, 0, reorderedItem);

      setOrderedColumns(newColumnOrder);

      const batch = writeBatch(firestore);
      newColumnOrder.forEach((col, index) => {
        if (!columnsRef) return;
        const colRef = doc(columnsRef, col.id);
        batch.update(colRef, { order: index });
      });
      await batch.commit();
      return;
    }

    const startColumn = orderedColumns.find(c => c.id === source.droppableId);
    const finishColumn = orderedColumns.find(c => c.id === destination.droppableId);
    
    if (!startColumn) return;

    if (startColumn === finishColumn) {
      const columnTasks = tasks.filter(t => t.status === startColumn.id).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      const newTasksOrder = Array.from(columnTasks);
      const [reorderedItem] = newTasksOrder.splice(source.index, 1);
      newTasksOrder.splice(destination.index, 0, reorderedItem);

      const batch = writeBatch(firestore);
      newTasksOrder.forEach((task, index) => {
          const taskRef = doc(tasksRef, task.id);
          batch.update(taskRef, { order: index });
      });
      await batch.commit();
    } else if (finishColumn) { 
      const startTasks = tasks.filter(t => t.status === startColumn.id).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      const finishTasks = tasks.filter(t => t.status === finishColumn.id).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      
      const [movedTask] = startTasks.splice(source.index, 1);
      finishTasks.splice(destination.index, 0, movedTask);

      const batch = writeBatch(firestore);
      
      const taskRef = doc(tasksRef, draggableId);
      batch.update(taskRef, { status: finishColumn.id });
      
      startTasks.forEach((task, index) => {
          const tRef = doc(tasksRef, task.id);
          batch.update(tRef, { order: index });
      });
      
      finishTasks.forEach((task, index) => {
          const tRef = doc(tasksRef, task.id);
          batch.update(tRef, { order: index });
      });
      
      await batch.commit();
    }
  };

  const addColumn = () => {
    if (!columnsRef || !orderedColumns || !user) return;
    const newId = nanoid();
    const newColumn: Column = {
      id: newId,
      title: "Новая колонка",
      order: orderedColumns.length,
    };
    const newColRef = doc(columnsRef, newId);
    setDocumentNonBlocking(newColRef, newColumn, {});
  };

  const deleteColumn = (columnId: string) => {
    if (!columnsRef || !user) return;
    const columnRef = doc(columnsRef, columnId);
    deleteDocumentNonBlocking(columnRef);
    setColumnToDelete(null);
  };

  const renameColumn = (columnId: string, newTitle: string) => {
    if (!columnsRef || !newTitle || !user) return;
    const columnRef = doc(columnsRef, columnId);
    updateDocumentNonBlocking(columnRef, { title: newTitle });
  };
  
  async function handleCreateTask(values: TaskFormData) {
    if (!user || !orderedColumns || orderedColumns.length === 0 || !tasksCollectionRef || !tasks) {
        toast({
            variant: "destructive",
            title: "Невозможно создать задачу.",
            description: "Нет доступных колонок. Пожалуйста, сначала добавьте колонку.",
        });
        return;
    };
    const targetColumnId = values.status;
    const tasksInColumn = tasks.filter(t => t.status === targetColumnId);

    const newTask: Omit<Task, 'id'> = {
        projectId: projectId,
        userId: user.uid,
        name: values.name,
        description: values.description || "",
        deadline: values.noDeadline ? null : values.deadline || null,
        priority: values.priority,
        completed: false,
        status: targetColumnId,
        order: tasksInColumn.length,
    };

    addDocumentNonBlocking(tasksCollectionRef, newTask);
    toast({
        title: "Задача создана",
        description: `Задача "${newTask.name}" была добавлена.`,
    });
    form.reset();
    setOpenNewTaskDialog(false);
  }

  async function handleUpdateTask(values: TaskFormData) {
    if (!editingTask || !tasksCollectionRef) return;
    
    const taskRef = doc(tasksCollectionRef, editingTask.id);
    updateDocumentNonBlocking(taskRef, {
        name: values.name,
        description: values.description,
        deadline: values.noDeadline ? null : values.deadline || null,
        priority: values.priority,
        status: values.status
    });

    toast({
        title: "Задача обновлена",
    });
    setEditingTask(null);
  }


  const handleToggleTask = (task: Task, completed: boolean) => {
    if (!user || !tasksCollectionRef) return;
    const taskRef = doc(tasksCollectionRef, task.id);
    updateDocumentNonBlocking(taskRef, { completed });
  };

  const handleDeleteTask = (taskId: string) => {
    if (!user || !tasksCollectionRef) return;
    const taskRef = doc(tasksCollectionRef, taskId);
    deleteDocumentNonBlocking(taskRef);
     toast({
        title: "Задача удалена",
    });
  };
  
  const isLoading = isProjectLoading || areTasksLoading || areColumnsLoading || isUserLoading;

  if (isLoading) {
    return (
        <div className="h-full flex flex-col">
            <PageHeader title={<Skeleton className="h-8 w-48" />} backHref="/projects" />
            <div className="p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <Skeleton className="h-96" />
                <Skeleton className="h-96" />
                <Skeleton className="h-96" />
            </div>
        </div>
    )
  }

  if (!project && !isLoading) {
    notFound();
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <PageHeader
        title={project?.name ?? "Проект"}
        backHref="/projects"
        actions={
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={addColumn}>
              <Plus className="w-4 h-4 mr-2" />
              Добавить колонку
            </Button>
            <Dialog open={openNewTaskDialog} onOpenChange={setOpenNewTaskDialog}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Новая задача
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Создать новую задачу</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(handleCreateTask)}>
                    <TaskFormFields control={form.control} columns={orderedColumns} />
                    <DialogFooter>
                       <DialogClose asChild>
                        <Button type="button" variant="ghost">Отмена</Button>
                      </DialogClose>
                      <Button type="submit">Создать задачу</Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        }
      />
      <div 
        className="flex-1 overflow-auto cursor-grab"
        ref={scrollContainerRef}
        onMouseDown={onMouseDown}
        onMouseLeave={onMouseLeaveOrUp}
        onMouseUp={onMouseLeaveOrUp}
        onMouseMove={onMouseMove}
      >
        <DragDropContext onDragEnd={onDragEnd}>
            <Droppable
              droppableId="all-columns"
              type="column"
              direction="horizontal"
            >
              {(provided) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="flex gap-6 h-full items-start p-4 sm:p-6"
                >
                  {orderedColumns && orderedColumns.map((column, index) => {
                    const columnTasks = tasks?.filter(t => t.status === column.id).sort((a,b) => (a.order ?? 0) - (b.order ?? 0)) || [];
                    return (
                      <Draggable
                        key={column.id}
                        draggableId={column.id}
                        index={index}
                      >
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className="flex-shrink-0"
                             style={{
                                ...provided.draggableProps.style,
                            }}
                          >
                            <ResizableColumn>
                              <div {...provided.dragHandleProps} className="p-3 flex items-center justify-between flex-shrink-0 border-b cursor-grab">
                                <Input
                                  defaultValue={column.title}
                                  onBlur={(e) => renameColumn(column.id, e.target.value)}
                                  className="bg-transparent border-none text-lg font-bold focus:ring-1 focus:ring-ring"
                                />
                                <Button variant="ghost" size="icon" onClick={() => setColumnToDelete(column)}>
                                    <Trash2 className="w-4 h-4 text-muted-foreground" />
                                </Button>
                              </div>
                              <div className="flex-1 overflow-y-auto">
                                  <Droppable droppableId={column.id} type="task">
                                  {(provided, snapshot) => (
                                      <div
                                          ref={provided.innerRef}
                                          {...provided.droppableProps}
                                          className={cn(
                                          "p-2 space-y-3 rounded-b-lg min-h-[100px] flex-1",
                                          snapshot.isDraggingOver && "bg-accent/50"
                                          )}
                                      >
                                          {columnTasks.length > 0 ? (
                                          columnTasks.map((task, taskIndex) => (
                                              <Draggable
                                              key={task.id}
                                              draggableId={task.id}
                                              index={taskIndex}
                                              >
                                              {(provided) => (
                                                  <div
                                                    ref={provided.innerRef}
                                                    {...provided.draggableProps}
                                                    {...provided.dragHandleProps}
                                                    onClick={() => setEditingTask(task)}
                                                    style={{
                                                        ...provided.draggableProps.style,
                                                    }}
                                                  >
                                                  <TaskItem 
                                                      task={task} 
                                                      onToggle={(e) => {
                                                          e.stopPropagation();
                                                          handleToggleTask(task, !task.completed);
                                                      }}
                                                      onDelete={(e) => {
                                                          e.stopPropagation();
                                                          handleDeleteTask(task.id);
                                                      }}
                                                  />
                                                  </div>
                                              )}
                                              </Draggable>
                                          ))
                                          ) : (
                                          !areTasksLoading && <div className="text-center py-12 text-muted-foreground">
                                              <p>Пока нет задач.</p>
                                          </div>
                                          )}
                                          {provided.placeholder}
                                      </div>
                                  )}
                                  </Droppable>
                              </div>
                            </ResizableColumn>
                          </div>
                        )}
                      </Draggable>
                    );
                  })}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
        </DragDropContext>
      </div>

      <Dialog open={!!editingTask} onOpenChange={(open) => !open && setEditingTask(null)}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Редактировать задачу</DialogTitle>
            </DialogHeader>
            <Form {...editForm}>
                <form onSubmit={editForm.handleSubmit(handleUpdateTask)}>
                    <TaskFormFields control={editForm.control} columns={orderedColumns} />
                    <DialogFooter>
                        <Button type="button" variant="ghost" onClick={() => setEditingTask(null)}>Отмена</Button>
                        <Button type="submit">Сохранить изменения</Button>
                    </DialogFooter>
                </form>
            </Form>
        </DialogContent>
      </Dialog>


      <AlertDialog open={!!columnToDelete} onOpenChange={(open) => !open && setColumnToDelete(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Вы абсолютно уверены?</AlertDialogTitle>
                <AlertDialogDescription>
                    Это действие необратимо. Это навсегда удалит колонку '{columnToDelete?.title}' и все задачи в ней.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setColumnToDelete(null)}>Отмена</AlertDialogCancel>
                <AlertDialogAction onClick={() => {
                    if (columnToDelete) {
                        const tasksInColumn = tasks?.filter(t => t.status === columnToDelete.id);
                        tasksInColumn?.forEach(t => handleDeleteTask(t.id));
                        deleteColumn(columnToDelete.id);
                    }
                }}>Удалить</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
