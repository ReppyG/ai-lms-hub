import { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Plus, Play, Edit, Trash2, Clock, CheckCircle, XCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface WorkflowStep {
  type: 'ai_task' | 'web_scrape' | 'api_call' | 'delay';
  name: string;
  prompt?: string;
  url?: string;
  method?: string;
  duration?: number;
}

export default function Workflows() {
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [runs, setRuns] = useState<any[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState<any>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [steps, setSteps] = useState<WorkflowStep[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    loadWorkflows();
    loadRuns();
  }, []);

  const loadWorkflows = async () => {
    const { data, error } = await supabase
      .from('ai_workflows')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading workflows:', error);
      return;
    }

    setWorkflows(data || []);
  };

  const loadRuns = async () => {
    const { data, error } = await supabase
      .from('workflow_runs')
      .select('*, ai_workflows(name)')
      .order('started_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Error loading runs:', error);
      return;
    }

    setRuns(data || []);
  };

  const handleSaveWorkflow = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const workflowData = {
      user_id: user.id,
      name,
      description,
      steps: steps as any
    };

    let error;
    if (editingWorkflow) {
      const result = await supabase
        .from('ai_workflows')
        .update(workflowData)
        .eq('id', editingWorkflow.id);
      error = result.error;
    } else {
      const result = await supabase
        .from('ai_workflows')
        .insert(workflowData);
      error = result.error;
    }

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to save workflow',
        variant: 'destructive'
      });
      return;
    }

    toast({
      title: 'Success',
      description: 'Workflow saved successfully'
    });

    setIsDialogOpen(false);
    resetForm();
    loadWorkflows();
  };

  const executeWorkflow = async (workflowId: string) => {
    toast({
      title: 'Starting',
      description: 'Workflow execution started'
    });

    const { data, error } = await supabase.functions.invoke('workflow-executor', {
      body: { workflowId }
    });

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to execute workflow',
        variant: 'destructive'
      });
      return;
    }

    toast({
      title: 'Complete',
      description: 'Workflow executed successfully'
    });

    loadRuns();
  };

  const deleteWorkflow = async (id: string) => {
    const { error } = await supabase
      .from('ai_workflows')
      .delete()
      .eq('id', id);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete workflow',
        variant: 'destructive'
      });
      return;
    }

    toast({
      title: 'Success',
      description: 'Workflow deleted'
    });

    loadWorkflows();
  };

  const addStep = () => {
    setSteps([...steps, { type: 'ai_task', name: 'New Step' }]);
  };

  const updateStep = (index: number, field: string, value: any) => {
    const newSteps = [...steps];
    newSteps[index] = { ...newSteps[index], [field]: value };
    setSteps(newSteps);
  };

  const removeStep = (index: number) => {
    setSteps(steps.filter((_, i) => i !== index));
  };

  const resetForm = () => {
    setName('');
    setDescription('');
    setSteps([]);
    setEditingWorkflow(null);
  };

  const editWorkflow = (workflow: any) => {
    setEditingWorkflow(workflow);
    setName(workflow.name);
    setDescription(workflow.description || '');
    setSteps(workflow.steps || []);
    setIsDialogOpen(true);
  };

  return (
    <Layout>
      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">AI Workflows</h1>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="h-4 w-4 mr-2" />
                Create Workflow
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingWorkflow ? 'Edit Workflow' : 'Create New Workflow'}
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="My Workflow"
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="What does this workflow do?"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <Label>Steps</Label>
                    <Button onClick={addStep} size="sm" variant="outline">
                      <Plus className="h-3 w-3 mr-1" />
                      Add Step
                    </Button>
                  </div>

                  {steps.map((step, index) => (
                    <Card key={index} className="p-4 mb-2">
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <Input
                            value={step.name}
                            onChange={(e) => updateStep(index, 'name', e.target.value)}
                            placeholder="Step name"
                            className="flex-1 mr-2"
                          />
                          <Button
                            onClick={() => removeStep(index)}
                            size="sm"
                            variant="destructive"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>

                        <Select
                          value={step.type}
                          onValueChange={(value) => updateStep(index, 'type', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ai_task">AI Task</SelectItem>
                            <SelectItem value="api_call">API Call</SelectItem>
                            <SelectItem value="delay">Delay</SelectItem>
                          </SelectContent>
                        </Select>

                        {step.type === 'ai_task' && (
                          <Textarea
                            value={step.prompt || ''}
                            onChange={(e) => updateStep(index, 'prompt', e.target.value)}
                            placeholder="AI prompt..."
                          />
                        )}

                        {step.type === 'api_call' && (
                          <div className="space-y-2">
                            <Input
                              value={step.url || ''}
                              onChange={(e) => updateStep(index, 'url', e.target.value)}
                              placeholder="API URL"
                            />
                            <Select
                              value={step.method || 'GET'}
                              onValueChange={(value) => updateStep(index, 'method', value)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="GET">GET</SelectItem>
                                <SelectItem value="POST">POST</SelectItem>
                                <SelectItem value="PUT">PUT</SelectItem>
                                <SelectItem value="DELETE">DELETE</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        )}

                        {step.type === 'delay' && (
                          <Input
                            type="number"
                            value={step.duration || 1000}
                            onChange={(e) => updateStep(index, 'duration', parseInt(e.target.value))}
                            placeholder="Delay in milliseconds"
                          />
                        )}
                      </div>
                    </Card>
                  ))}
                </div>

                <Button onClick={handleSaveWorkflow} className="w-full">
                  Save Workflow
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Workflows */}
          <div>
            <h2 className="text-xl font-bold mb-4">Your Workflows</h2>
            <ScrollArea className="h-[600px]">
              {workflows.map((workflow) => (
                <Card key={workflow.id} className="p-4 mb-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-bold">{workflow.name}</h3>
                      <p className="text-sm text-muted-foreground">{workflow.description}</p>
                      <Badge variant={workflow.enabled ? 'default' : 'secondary'} className="mt-2">
                        {workflow.enabled ? 'Enabled' : 'Disabled'}
                      </Badge>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => executeWorkflow(workflow.id)}
                        size="sm"
                        variant="outline"
                      >
                        <Play className="h-3 w-3" />
                      </Button>
                      <Button
                        onClick={() => editWorkflow(workflow)}
                        size="sm"
                        variant="outline"
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        onClick={() => deleteWorkflow(workflow.id)}
                        size="sm"
                        variant="destructive"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground mt-2">
                    {workflow.steps?.length || 0} steps
                    {workflow.last_run_at && (
                      <span className="ml-2">
                        • Last run: {new Date(workflow.last_run_at).toLocaleString()}
                      </span>
                    )}
                  </div>
                </Card>
              ))}
            </ScrollArea>
          </div>

          {/* Recent Runs */}
          <div>
            <h2 className="text-xl font-bold mb-4">Recent Runs</h2>
            <ScrollArea className="h-[600px]">
              {runs.map((run) => (
                <Card key={run.id} className="p-4 mb-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold">{(run as any).ai_workflows?.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {new Date(run.started_at).toLocaleString()}
                      </p>
                    </div>
                    <Badge variant={
                      run.status === 'completed' ? 'default' :
                      run.status === 'running' ? 'secondary' : 'destructive'
                    }>
                      {run.status === 'completed' && <CheckCircle className="h-3 w-3 mr-1" />}
                      {run.status === 'running' && <Clock className="h-3 w-3 mr-1 animate-spin" />}
                      {run.status === 'failed' && <XCircle className="h-3 w-3 mr-1" />}
                      {run.status}
                    </Badge>
                  </div>
                  {run.error_message && (
                    <p className="text-sm text-destructive mt-2">{run.error_message}</p>
                  )}
                </Card>
              ))}
            </ScrollArea>
          </div>
        </div>
      </div>
    </Layout>
  );
}