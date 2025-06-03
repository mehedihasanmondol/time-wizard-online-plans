import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Search, Clock, Calendar, DollarSign } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { WorkingHours as WorkingHoursType, Profile, Client, Project } from "@/types/database";
import { useToast } from "@/hooks/use-toast";
import { EditWorkingHoursDialog } from "./EditWorkingHoursDialog";

export const WorkingHoursComponent = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [workingHours, setWorkingHours] = useState<WorkingHoursType[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingWorkingHours, setEditingWorkingHours] = useState<WorkingHoursType | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    profile_id: "",
    client_id: "",
    project_id: "",
    date: "",
    start_time: "",
    end_time: "",
    sign_in_time: "",
    sign_out_time: "",
    hourly_rate: 0,
    notes: "",
    status: "pending"
  });

  useEffect(() => {
    fetchWorkingHours();
    fetchProfiles();
    fetchClients();
    fetchProjects();
  }, []);

  const fetchWorkingHours = async () => {
    try {
      const { data, error } = await supabase
        .from('working_hours')
        .select(`
          *,
          profiles!working_hours_profile_id_fkey (id, full_name, role),
          clients!working_hours_client_id_fkey (id, company),
          projects!working_hours_project_id_fkey (id, name)
        `)
        .order('date', { ascending: false });

      if (error) throw error;
      setWorkingHours(data as WorkingHoursType[]);
    } catch (error) {
      console.error('Error fetching working hours:', error);
      toast({
        title: "Error",
        description: "Failed to fetch working hours",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('is_active', true)
        .order('full_name');

      if (error) throw error;
      setProfiles(data as Profile[]);
    } catch (error) {
      console.error('Error fetching profiles:', error);
    }
  };

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('status', 'active')
        .order('company');

      if (error) throw error;
      setClients(data as Client[]);
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('status', 'active')
        .order('name');

      if (error) throw error;
      setProjects(data as Project[]);
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const handleEditWorkingHours = (workingHour: WorkingHoursType) => {
    setFormData({
      profile_id: workingHour.profile_id,
      client_id: workingHour.client_id,
      project_id: workingHour.project_id,
      date: workingHour.date,
      start_time: workingHour.start_time,
      end_time: workingHour.end_time,
      hourly_rate: workingHour.hourly_rate || 0,
      notes: workingHour.notes || "",
      sign_in_time: workingHour.sign_in_time || "",
      sign_out_time: workingHour.sign_out_time || "",
      status: "pending"
    });
    setEditingWorkingHours(workingHour);
  };

  const calculateTotalHours = (startTime: string, endTime: string) => {
    if (!startTime || !endTime) return 0;
    
    const start = new Date(`2000-01-01T${startTime}`);
    const end = new Date(`2000-01-01T${endTime}`);
    const diffMs = end.getTime() - start.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    
    return Math.max(0, diffHours);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const totalHours = calculateTotalHours(formData.start_time, formData.end_time);
      const selectedProfile = profiles.find(p => p.id === formData.profile_id);
      const hourlyRate = formData.hourly_rate || selectedProfile?.hourly_rate || 0;
      const totalAmount = totalHours * hourlyRate;

      const { error } = await supabase
        .from('working_hours')
        .insert([{
          profile_id: formData.profile_id,
          client_id: formData.client_id,
          project_id: formData.project_id,
          date: formData.date,
          start_time: formData.start_time,
          end_time: formData.end_time,
          sign_in_time: formData.sign_in_time || null,
          sign_out_time: formData.sign_out_time || null,
          total_hours: totalHours,
          hourly_rate: hourlyRate,
          total_amount: totalAmount,
          notes: formData.notes,
          status: 'pending' as const
        }]);

      if (error) throw error;

      toast({ title: "Success", description: "Working hours created successfully" });
      
      setIsDialogOpen(false);
      setFormData({
        profile_id: "",
        client_id: "",
        project_id: "",
        date: "",
        start_time: "",
        end_time: "",
        sign_in_time: "",
        sign_out_time: "",
        hourly_rate: 0,
        notes: "",
        status: "pending"
      });
      fetchWorkingHours();
    } catch (error) {
      console.error('Error saving working hours:', error);
      toast({
        title: "Error",
        description: "Failed to save working hours",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, status: 'approved' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('working_hours')
        .update({ status })
        .eq('id', id);

      if (error) throw error;
      toast({ 
        title: "Success", 
        description: `Working hours ${status} successfully` 
      });
      fetchWorkingHours();
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: "Error",
        description: "Failed to update status",
        variant: "destructive"
      });
    }
  };

  const deleteWorkingHours = async (id: string) => {
    if (!confirm('Are you sure you want to delete these working hours?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('working_hours')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast({ 
        title: "Success", 
        description: "Working hours deleted successfully" 
      });
      fetchWorkingHours();
    } catch (error) {
      console.error('Error deleting working hours:', error);
      toast({
        title: "Error",
        description: "Failed to delete working hours",
        variant: "destructive"
      });
    }
  };

  const filteredWorkingHours = workingHours.filter(wh =>
    (wh.profiles?.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (wh.clients?.company || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (wh.projects?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading && workingHours.length === 0) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Clock className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Working Hours</h1>
            <p className="text-gray-600">Track and manage employee working hours</p>
          </div>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Hours
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add Working Hours</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="profile_id">Employee</Label>
                <Select value={formData.profile_id} onValueChange={(value) => setFormData({ ...formData, profile_id: value })} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select employee" />
                  </SelectTrigger>
                  <SelectContent>
                    {profiles.map((profile) => (
                      <SelectItem key={profile.id} value={profile.id}>
                        {profile.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="client_id">Client</Label>
                <Select value={formData.client_id} onValueChange={(value) => setFormData({ ...formData, client_id: value })} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.company}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="project_id">Project</Label>
                <Select value={formData.project_id} onValueChange={(value) => setFormData({ ...formData, project_id: value })} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select project" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.filter(p => !formData.client_id || p.client_id === formData.client_id).map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start_time">Start Time</Label>
                  <Input
                    id="start_time"
                    type="time"
                    value={formData.start_time}
                    onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="end_time">End Time</Label>
                  <Input
                    id="end_time"
                    type="time"
                    value={formData.end_time}
                    onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="sign_in_time">Sign In Time (Optional)</Label>
                  <Input
                    id="sign_in_time"
                    type="time"
                    value={formData.sign_in_time}
                    onChange={(e) => setFormData({ ...formData, sign_in_time: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="sign_out_time">Sign Out Time (Optional)</Label>
                  <Input
                    id="sign_out_time"
                    type="time"
                    value={formData.sign_out_time}
                    onChange={(e) => setFormData({ ...formData, sign_out_time: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="hourly_rate">Hourly Rate (Optional)</Label>
                <Input
                  id="hourly_rate"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.hourly_rate}
                  onChange={(e) => setFormData({ ...formData, hourly_rate: parseFloat(e.target.value) || 0 })}
                />
              </div>

              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Additional notes..."
                />
              </div>

              <Button type="submit" disabled={loading} className="w-full">
                {loading ? "Saving..." : "Save Working Hours"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Working Hours Records</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search by employee, client or project..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Employee</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Client / Project</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Date</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Time</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Hours</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Amount</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredWorkingHours.map((wh) => (
                  <tr key={wh.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="font-medium text-gray-900">{wh.profiles?.full_name}</div>
                      <div className="text-sm text-gray-600">{wh.profiles?.role}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-gray-900">{wh.clients?.company}</div>
                      <div className="text-sm text-gray-600">{wh.projects?.name}</div>
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {new Date(wh.date).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {wh.start_time} - {wh.end_time}
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {wh.total_hours.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      ${wh.total_amount.toFixed(2)}
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={
                        wh.status === "approved" ? "default" : 
                        wh.status === "rejected" ? "destructive" : "secondary"
                      }>
                        {wh.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleEditWorkingHours(wh)}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          Edit
                        </Button>
                        {wh.status === "pending" && (
                          <>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => updateStatus(wh.id, "approved")}
                              className="text-green-600 hover:text-green-700"
                            >
                              Approve
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => updateStatus(wh.id, "rejected")}
                              className="text-red-600 hover:text-red-700"
                            >
                              Reject
                            </Button>
                          </>
                        )}
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => deleteWorkingHours(wh.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {editingWorkingHours && (
        <EditWorkingHoursDialog
          workingHours={editingWorkingHours}
          profiles={profiles}
          clients={clients}
          projects={projects}
          onClose={() => setEditingWorkingHours(null)}
          onSave={() => {
            setEditingWorkingHours(null);
            fetchWorkingHours();
          }}
        />
      )}
    </div>
  );
};
