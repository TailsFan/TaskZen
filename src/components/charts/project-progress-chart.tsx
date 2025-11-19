"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { ChartConfig, ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import type { Project, Task } from '@/lib/types';

const chartConfig = {
  completed: {
    label: 'Выполнено',
  },
} satisfies ChartConfig;

type ProjectProgressChartProps = {
    projects: Project[] | null;
    tasks: Task[] | null;
};

export default function ProjectProgressChart({ projects, tasks }: ProjectProgressChartProps) {
    if (!projects || !tasks) return null;

    const chartData = projects.map(project => {
        const projectTasks = tasks.filter(t => t.projectId === project.id);
        const total = projectTasks.length;
        const completed = projectTasks.filter(t => t.completed).length;
        return {
            name: project.name,
            completed: total > 0 ? (completed / total) * 100 : 0,
            fill: project.color,
        };
    });

    return (
        <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
        <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData} layout="vertical" margin={{ left: 20, right: 20 }}>
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
            <XAxis type="number" dataKey="completed" hide />
            <Tooltip cursor={{ fill: 'hsl(var(--muted))' }} content={<ChartTooltipContent formatter={(value) => `${Math.round(Number(value))}%`} />} />
            <Bar dataKey="completed" radius={4}>
                {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
            </Bar>
            </BarChart>
        </ResponsiveContainer>
        </ChartContainer>
    );
}
