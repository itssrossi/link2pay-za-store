
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { GripVertical, Plus, Edit, Trash2, Package, Info, MessageCircle, Star, Code, CalendarDays } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface SectionManagerProps {
  sections: any[];
  setSections: (sections: any[]) => void;
  loading: boolean;
  onUpdate: () => void;
}

const sectionTypes = [
  { value: 'products', label: 'Products Grid', icon: Package, description: 'Display your products' },
  { value: 'about', label: 'About Us', icon: Info, description: 'Tell your story' },
  { value: 'contact', label: 'Contact', icon: MessageCircle, description: 'Contact information' },
  { value: 'testimonials', label: 'Testimonials', icon: Star, description: 'Customer reviews' },
  { value: 'booking_calendar', label: 'Booking Calendar', icon: CalendarDays, description: 'Appointment booking' },
  { value: 'custom_html', label: 'Custom HTML', icon: Code, description: 'Custom content' }
];

const SectionManager = ({ sections, setSections, loading, onUpdate }: SectionManagerProps) => {
  const { user } = useAuth();
  const [editingSection, setEditingSection] = useState<any>(null);
  const [newSectionType, setNewSectionType] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);

  const toggleSection = async (sectionId: string, enabled: boolean) => {
    try {
      const { error } = await supabase
        .from('store_sections')
        .update({ is_enabled: enabled })
        .eq('id', sectionId);

      if (error) throw error;
      
      setSections(sections.map(section => 
        section.id === sectionId ? { ...section, is_enabled: enabled } : section
      ));
      
      toast.success(`Section ${enabled ? 'enabled' : 'disabled'}`);
    } catch (error) {
      console.error('Error toggling section:', error);
      toast.error('Failed to update section');
    }
  };

  const saveSection = async (sectionData: any) => {
    try {
      if (sectionData.id) {
        // Update existing section
        const { error } = await supabase
          .from('store_sections')
          .update({
            section_title: sectionData.section_title,
            section_content: sectionData.section_content,
            section_settings: sectionData.section_settings || {},
            updated_at: new Date().toISOString()
          })
          .eq('id', sectionData.id);

        if (error) throw error;
        toast.success('Section updated successfully');
      } else {
        // Create new section
        const { error } = await supabase
          .from('store_sections')
          .insert({
            user_id: user?.id,
            section_type: sectionData.section_type,
            section_title: sectionData.section_title,
            section_content: sectionData.section_content,
            section_order: sections.length + 1,
            section_settings: sectionData.section_settings || {}
          });

        if (error) throw error;
        toast.success('Section created successfully');
      }

      onUpdate();
      setDialogOpen(false);
      setEditingSection(null);
    } catch (error) {
      console.error('Error saving section:', error);
      toast.error('Failed to save section');
    }
  };

  const deleteSection = async (sectionId: string) => {
    try {
      const { error } = await supabase
        .from('store_sections')
        .delete()
        .eq('id', sectionId);

      if (error) throw error;
      
      setSections(sections.filter(section => section.id !== sectionId));
      toast.success('Section deleted successfully');
    } catch (error) {
      console.error('Error deleting section:', error);
      toast.error('Failed to delete section');
    }
  };

  const getSectionIcon = (type: string) => {
    const sectionType = sectionTypes.find(t => t.value === type);
    const Icon = sectionType?.icon || Package;
    return <Icon className="h-4 w-4" />;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Store Sections</CardTitle>
            <CardDescription>
              Toggle sections on/off and customize their content
            </CardDescription>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditingSection({ section_type: '', section_title: '', section_content: '' })}>
                <Plus className="h-4 w-4 mr-2" />
                Add Section
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingSection?.id ? 'Edit Section' : 'Add New Section'}
                </DialogTitle>
                <DialogDescription>
                  Configure your store section content and settings
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                {!editingSection?.id && (
                  <div>
                    <Label>Section Type</Label>
                    <Select 
                      value={editingSection?.section_type || ''} 
                      onValueChange={(value) => setEditingSection({ ...editingSection, section_type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose section type" />
                      </SelectTrigger>
                      <SelectContent>
                        {sectionTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            <div className="flex items-center gap-2">
                              <type.icon className="h-4 w-4" />
                              <div>
                                <div>{type.label}</div>
                                <div className="text-xs text-gray-500">{type.description}</div>
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div>
                  <Label htmlFor="section_title">Section Title</Label>
                  <Input
                    id="section_title"
                    value={editingSection?.section_title || ''}
                    onChange={(e) => setEditingSection({ ...editingSection, section_title: e.target.value })}
                    placeholder="Section title"
                  />
                </div>

                {editingSection?.section_type !== 'products' && editingSection?.section_type !== 'contact' && (
                  <div>
                    <Label htmlFor="section_content">Content</Label>
                    <Textarea
                      id="section_content"
                      value={editingSection?.section_content || ''}
                      onChange={(e) => setEditingSection({ ...editingSection, section_content: e.target.value })}
                      placeholder="Section content..."
                      rows={4}
                    />
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={() => saveSection(editingSection)}>
                  Save Section
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-4">Loading sections...</div>
        ) : (
          <div className="space-y-3">
            {sections.map((section, index) => (
              <div key={section.id} className="flex items-center gap-3 p-3 border rounded-lg">
                <GripVertical className="h-4 w-4 text-gray-400" />
                
                <div className="flex items-center gap-2">
                  {getSectionIcon(section.section_type)}
                  <Badge variant="outline" className="text-xs">
                    {sectionTypes.find(t => t.value === section.section_type)?.label || section.section_type}
                  </Badge>
                </div>

                <div className="flex-1">
                  <p className="font-medium text-sm">{section.section_title}</p>
                  {section.section_content && (
                    <p className="text-xs text-gray-500 line-clamp-1">{section.section_content}</p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                    checked={section.is_enabled}
                    onCheckedChange={(checked) => toggleSection(section.id, checked)}
                  />
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditingSection(section);
                      setDialogOpen(true);
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteSection(section.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}

            {sections.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No sections configured yet</p>
                <p className="text-sm">Add your first section to get started</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SectionManager;
