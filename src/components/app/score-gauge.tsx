'use client';

import { RadialBarChart, RadialBar, PolarAngleAxis, ResponsiveContainer } from 'recharts';
import { useTheme } from 'next-themes';

type ScoreGaugeProps = {
  value: number;
};

export function ScoreGauge({ value }: ScoreGaugeProps) {
  const { resolvedTheme } = useTheme();
  const a11yValue = Math.round(value);

  // Use CSS variables for colors
  const fillColor = 'hsl(var(--accent))';
  const trackColor = resolvedTheme === 'dark' ? 'hsl(var(--muted) / 0.3)' : 'hsl(var(--muted))';
  const textColor = 'hsl(var(--foreground))';
  
  const data = [{ name: 'score', value }];

  return (
    <div className="w-36 h-36 relative">
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart
          innerRadius="70%"
          outerRadius="100%"
          barSize={12}
          data={data}
          startAngle={90}
          endAngle={-270}
        >
          <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
          <RadialBar
            background={{ fill: trackColor }}
            dataKey="value"
            angleAxisId={0}
            fill={fillColor}
            cornerRadius={6}
          />
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-3xl font-bold font-headline" style={{ color: textColor }}>
          {a11yValue}
        </span>
        <span className="text-sm font-bold" style={{ color: textColor }}>%</span>
      </div>
    </div>
  );
}
