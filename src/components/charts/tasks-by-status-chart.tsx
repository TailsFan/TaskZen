"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { ChartConfig, ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import type { Task, Column } from '@/lib/types';

const chartConfig = {
  tasks: {
    label: 'Задачи',
    color: 'hsl(var(--chart-1))',
  },
} satisfies ChartConfig;

type TasksByStatusChartProps = {
    tasks: Task[] | null;
    columns: Column[] | null;
};

export default function TasksByStatusChart({ tasks, columns }: TasksByStatusChartProps) {
    if (!tasks || !columns) {
        return (
            <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                Загрузка данных...
            </div>
        )
    }

    const chartData = columns
        .map(column => {
            const tasksInColumn = tasks.filter(t => t.status === column.id).length;
            return {
                name: column.title,
                tasks: tasksInColumn,
            };
        })
        .filter(d => d.tasks > 0)
        .sort((a,b) => b.tasks - a.tasks);
    
    if (chartData.length === 0) {
        return (
            <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                Нет данных для отображения.
            </div>
        )
    }

    return (
        <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 20 }}>
                    <CartesianGrid horizontal={false} />
                    <YAxis 
                        dataKey="name" 
                        type="category" 
                        tickLine={false} 
                        axisLine={false} 
                        tick={{ fontSize: 12 }}
                        width={150} 
                        interval={0}
                    />
                    <XAxis type="number" dataKey="tasks" hide />
                    <Tooltip 
                        cursor={{ fill: 'hsl(var(--muted))' }} 
                        content={<ChartTooltipContent 
                            formatter={(value) => `${value} задач`} 
                            labelFormatter={(label) => `Колонка: ${label}`}
                        />} 
                    />
                    <Bar dataKey="tasks" fill="var(--color-tasks)" radius={4} />
                </BarChart>
            </ResponsiveContainer>
        </ChartContainer>
    );
}
