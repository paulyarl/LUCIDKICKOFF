'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, BookOpen, Clock, Activity, Award, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, subWeeks, addWeeks, startOfWeek, endOfWeek, isThisWeek } from 'date-fns';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { toast } from 'sonner';

type ChildProgress = {
  id: string;
  username: string;
  total_minutes: number;
  total_pages: number;
  last_activity: string;
  top_packs: Array<{
    id: string;
    title: string;
    minutes_spent: number;
  }>;
};

type WeeklyData = {
  week_start: string;
  total_minutes: number;
  total_pages: number;
};

export function WeeklyProgress() {
  const [isLoading, setIsLoading] = useState(true);
  const [children, setChildren] = useState<ChildProgress[]>([]);
  const [selectedWeek, setSelectedWeek] = useState<Date>(new Date());
  const [weeklyData, setWeeklyData] = useState<Record<string, WeeklyData>>({});
  const supabase = createClient();

  const fetchChildren = async () => {
    try {
      setIsLoading(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      
      // Get all children for the current parent
      const { data: childrenData, error: childrenError } = await supabase
        .from('family_relationships')
        .select('child:child_id(id, username)')
        .eq('parent_id', session.user.id);
      
      if (childrenError) throw childrenError;
      
      if (!childrenData?.length) {
        setChildren([]);
        return;
      }
      
      // Get progress for each child
      const childIds = childrenData.map(c => c.child.id);
      const weekStart = startOfWeek(selectedWeek, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(selectedWeek, { weekStartsOn: 1 });
      
      const { data: progressData, error: progressError } = await supabase
        .rpc('get_weekly_progress', {
          p_child_ids: childIds,
          p_week_start: weekStart.toISOString(),
          p_week_end: weekEnd.toISOString()
        });
      
      if (progressError) throw progressError;
      
      setChildren(progressData || []);
      
      // Track event
      await supabase.rpc('track_event', {
        event_name: 'weekly_progress_viewed',
        event_data: {
          week_start: weekStart.toISOString(),
          child_count: childIds.length
        },
      });
      
    } catch (error) {
      console.error('Error fetching children progress:', error);
      toast.error('Failed to load progress data');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch historical weekly data for the chart
  const fetchHistoricalData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      
      const { data, error } = await supabase.rpc('get_historical_weekly_data', {
        p_parent_id: session.user.id,
        p_weeks: 8 // Last 8 weeks
      });
      
      if (error) throw error;
      
      // Transform data for the chart
      const formattedData = (data || []).reduce((acc: Record<string, WeeklyData>, item: any) => {
        acc[item.week_start] = {
          week_start: format(new Date(item.week_start), 'MMM d'),
          total_minutes: item.total_minutes || 0,
          total_pages: item.total_pages || 0
        };
        return acc;
      }, {});
      
      setWeeklyData(formattedData);
      
    } catch (error) {
      console.error('Error fetching historical data:', error);
    }
  };

  useEffect(() => {
    fetchChildren();
    fetchHistoricalData();
  }, [selectedWeek]);

  const navigateWeek = (direction: 'prev' | 'next') => {
    setSelectedWeek(prev => 
      direction === 'prev' ? subWeeks(prev, 1) : addWeeks(prev, 1)
    );
  };

  const resetToCurrentWeek = () => {
    setSelectedWeek(new Date());
  };

  const chartData = Object.values(weeklyData);
  const showResetButton = !isThisWeek(selectedWeek, { weekStartsOn: 1 });
  const weekRange = `${format(startOfWeek(selectedWeek, { weekStartsOn: 1 }), 'MMM d')} - ${format(endOfWeek(selectedWeek, { weekStartsOn: 1 }), 'MMM d, yyyy')}`;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (children.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center space-y-2 rounded-lg border border-dashed p-8 text-center">
        <BookOpen className="h-12 w-12 text-muted-foreground/40" />
        <h3 className="text-lg font-medium">No children linked yet</h3>
        <p className="text-sm text-muted-foreground">
          Link your child's account to view their progress.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between space-y-4 sm:flex-row sm:items-center sm:space-y-0">
        <h2 className="text-2xl font-bold tracking-tight">Weekly Progress</h2>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateWeek('prev')}
            className="h-8 w-8 p-0"
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Previous week</span>
          </Button>
          
          <div className="flex items-center justify-center text-sm font-medium w-64 text-center">
            {weekRange}
            {showResetButton && (
              <Button
                variant="ghost"
                size="sm"
                onClick={resetToCurrentWeek}
                className="ml-2 h-7 text-xs"
              >
                This Week
              </Button>
            )}
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateWeek('next')}
            disabled={isThisWeek(selectedWeek, { weekStartsOn: 1 })}
            className="h-8 w-8 p-0"
          >
            <ChevronRight className="h-4 w-4" />
            <span className="sr-only">Next week</span>
          </Button>
        </div>
      </div>
      
      {/* Weekly Summary Chart */}
      {chartData.length > 0 && (
        <Card className="mb-6
          hover:shadow-md transition-shadow duration-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Activity Overview</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis 
                  dataKey="week_start" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  yAxisId="left" 
                  orientation="left" 
                  stroke="#8884d8"
                  axisLine={false} 
                  tickLine={false}
                  tickFormatter={(value) => `${value}m`}
                />
                <YAxis 
                  yAxisId="right" 
                  orientation="right" 
                  stroke="#82ca9d"
                  axisLine={false} 
                  tickLine={false}
                />
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="rounded-lg border bg-background p-4 shadow-sm">
                          <p className="text-sm font-medium">{payload[0].payload.week_start}</p>
                          <div className="mt-1 grid gap-1">
                            <div className="flex items-center">
                              <div className="mr-2 h-2 w-2 rounded-full bg-[#8884d8]" />
                              <span className="text-xs text-muted-foreground">
                                {payload[0].value} minutes
                              </span>
                            </div>
                            <div className="flex items-center">
                              <div className="mr-2 h-2 w-2 rounded-full bg-[#82ca9d]" />
                              <span className="text-xs text-muted-foreground">
                                {payload[1].value} pages
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend 
                  iconType="circle"
                  formatter={(value) => (
                    <span className="text-xs text-muted-foreground">
                      {value === 'total_minutes' ? 'Minutes' : 'Pages'}
                    </span>
                  )}
                />
                <Bar 
                  yAxisId="left" 
                  dataKey="total_minutes" 
                  name="total_minutes" 
                  fill="#8884d8" 
                  radius={[4, 4, 0, 0]}
                />
                <Bar 
                  yAxisId="right" 
                  dataKey="total_pages" 
                  name="total_pages" 
                  fill="#82ca9d" 
                  radius={[4, 4, 0, 0]
                }
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
      
      {/* Individual Child Progress */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {children.map((child) => (
          <Card key={child.id} className="overflow-hidden">
            <CardHeader className="bg-muted/30 p-4 pb-2">
              <div className="flex items-center space-x-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-lg font-medium">
                    {child.username}
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">
                    Last active: {format(new Date(child.last_activity), 'MMM d, h:mm a')}
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-3">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Clock className="mr-1 h-4 w-4" />
                    <span>Time Spent</span>
                  </div>
                  <p className="text-xl font-semibold">
                    {Math.round(child.total_minutes)} min
                  </p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <BookOpen className="mr-1 h-4 w-4" />
                    <span>Pages Read</span>
                  </div>
                  <p className="text-xl font-semibold">{child.total_pages}</p>
                </div>
              </div>
              
              {child.top_packs?.length > 0 && (
                <div className="mt-4 space-y-2">
                  <h4 className="text-sm font-medium">Top Packs</h4>
                  <div className="space-y-1.5">
                    {child.top_packs.map((pack) => (
                      <div key={pack.id} className="flex items-center justify-between text-sm">
                        <span className="truncate pr-2">{pack.title}</span>
                        <span className="font-medium">{Math.round(pack.minutes_spent)}m</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
