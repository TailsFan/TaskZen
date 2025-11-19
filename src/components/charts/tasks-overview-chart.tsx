
"use client";

import { Bar, BarChart, Cell, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { ChartConfig, ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import type { Task } from '@/lib/types';

const chartConfig = {
    tasks: {
        label: "Задачи"
    },
    high: {
      label: 'Высокий',
      color: 'hsl(var(--destructive))',
    },
    medium: {
      label: 'Средний',
      color: 'hsl(var(--chart-4))',
    },
    low: {
      label: 'Низкий',
      color: 'hsl(var(--chart-3))',
    },
} satisfies ChartConfig;

type TasksOverviewChartProps = {
    tasks: Task[] | null;
}

export default function TasksOverviewChart({ tasks }: TasksOverviewChartProps) {
    if (!tasks) return null;

    const priorityCounts = tasks.reduce((acc, task) => {
        acc[task.priority] = (acc[task.priority] || 0) + 1;
        return acc;
    }, {} as Record<'high' | 'medium' | 'low', number>);

    const chartData = [
        { name: 'Высокий', tasks: priorityCounts.high || 0, fill: 'hsl(var(--destructive))' },
        { name: 'Средний', tasks: priorityCounts.medium || 0, fill: 'hsl(var(--chart-4))' },
        { name: 'Низкий', tasks: priorityCounts.low || 0, fill: 'hsl(var(--chart-3))' },
    ].filter(d => d.tasks > 0);


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
                <BarChart data={chartData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                    <CartesianGrid vertical={false} />
                     <XAxis
                        dataKey="name"
                        tickLine={false}
                        axisLine={false}
                        tickMargin={10}
                        />
                    <YAxis allowDecimals={false} />
                    <Tooltip 
                        cursor={{ fill: 'hsl(var(--muted))' }} 
                        content={<ChartTooltipContent 
                             formatter={(value) => `${value} задач`} 
                        />} 
                    />
                    <Bar dataKey="tasks" radius={4}>
                        {chartData.map((entry) => (
                          <Cell key={`cell-${entry.name}`} fill={entry.fill} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </ChartContainer>
    );
}
