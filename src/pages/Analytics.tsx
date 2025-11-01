import { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { Card } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { MessageSquare, Image, Workflow, Calendar, TrendingUp } from 'lucide-react';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function Analytics() {
  const [analytics, setAnalytics] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalMessages: 0,
    totalImages: 0,
    totalWorkflows: 0,
    totalTasks: 0
  });

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    const { data, error } = await supabase
      .from('usage_analytics')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1000);

    if (error) {
      console.error('Error loading analytics:', error);
      return;
    }

    const analyticsData = data || [];
    setAnalytics(analyticsData);

    // Calculate stats
    const messages = analyticsData.filter(a => a.action_type === 'premium_chat').length;
    const images = analyticsData.filter(a => a.action_type === 'image_generation').length;
    const workflows = analyticsData.filter(a => a.action_type === 'workflow_execution').length;
    const tasks = analyticsData.filter(a => a.action_type === 'scheduled_task').length;

    setStats({
      totalMessages: messages,
      totalImages: images,
      totalWorkflows: workflows,
      totalTasks: tasks
    });
  };

  // Group by action type for pie chart
  const actionTypeCounts = analytics.reduce((acc, item) => {
    acc[item.action_type] = (acc[item.action_type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const pieData = Object.entries(actionTypeCounts).map(([name, value]) => ({
    name: name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    value
  }));

  // Group by date for bar chart
  const dailyUsage = analytics.reduce((acc, item) => {
    const date = new Date(item.created_at).toLocaleDateString();
    acc[date] = (acc[date] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const barData = Object.entries(dailyUsage)
    .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
    .slice(-14) // Last 14 days
    .map(([date, count]) => ({ date, count }));

  return (
    <Layout>
      <div className="container mx-auto p-8 space-y-8 animate-fade-in">
        <div>
          <h1 className="text-5xl font-bold mb-2 text-gradient">Usage Analytics</h1>
          <p className="text-lg text-muted-foreground">Track your premium features usage and activity</p>
        </div>

        {/* Enhanced Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="p-6 hover-lift glass-card group relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="flex items-center justify-between relative">
              <div>
                <p className="text-sm text-muted-foreground mb-1 tracking-wide uppercase font-medium">Messages</p>
                <h3 className="text-4xl font-bold text-gradient">{stats.totalMessages}</h3>
              </div>
              <div className="p-4 rounded-2xl gradient-primary shadow-glow-lg group-hover:scale-110 group-hover:rotate-12 transition-all">
                <MessageSquare className="h-8 w-8 text-white" />
              </div>
            </div>
          </Card>

          <Card className="p-6 hover-lift glass-card group relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-secondary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="flex items-center justify-between relative">
              <div>
                <p className="text-sm text-muted-foreground mb-1 tracking-wide uppercase font-medium">Images</p>
                <h3 className="text-4xl font-bold text-gradient">{stats.totalImages}</h3>
              </div>
              <div className="p-4 rounded-2xl gradient-secondary shadow-glow-lg group-hover:scale-110 group-hover:rotate-12 transition-all">
                <Image className="h-8 w-8 text-white" />
              </div>
            </div>
          </Card>

          <Card className="p-6 hover-lift glass-card group relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="flex items-center justify-between relative">
              <div>
                <p className="text-sm text-muted-foreground mb-1 tracking-wide uppercase font-medium">Workflows</p>
                <h3 className="text-4xl font-bold text-gradient">{stats.totalWorkflows}</h3>
              </div>
              <div className="p-4 rounded-2xl gradient-accent shadow-glow-lg group-hover:scale-110 group-hover:rotate-12 transition-all">
                <Workflow className="h-8 w-8 text-white" />
              </div>
            </div>
          </Card>

          <Card className="p-6 hover-lift glass-card group relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-success/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="flex items-center justify-between relative">
              <div>
                <p className="text-sm text-muted-foreground mb-1 tracking-wide uppercase font-medium">Tasks</p>
                <h3 className="text-4xl font-bold text-gradient">{stats.totalTasks}</h3>
              </div>
              <div className="p-4 rounded-2xl gradient-success shadow-glow-lg group-hover:scale-110 group-hover:rotate-12 transition-all">
                <Calendar className="h-8 w-8 text-white" />
              </div>
            </div>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4">Daily Usage (Last 14 Days)</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#8884d8" name="Actions" />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4">Usage by Type</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name}: ${entry.value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card className="p-6 mt-6">
          <h2 className="text-xl font-bold mb-4">Recent Activity</h2>
          <div className="space-y-2">
            {analytics.slice(0, 20).map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-3">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  <span className="font-medium">
                    {item.action_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {new Date(item.created_at).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </Layout>
  );
}