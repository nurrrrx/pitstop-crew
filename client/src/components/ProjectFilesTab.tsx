import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Plus,
  Trash2,
  FileText,
  FileSpreadsheet,
  FileImage,
  File,
  Download,
  Upload,
  Briefcase,
  FileCheck,
  ClipboardList,
  Wallet,
  BarChart3,
  Palette,
  MoreHorizontal
} from 'lucide-react';
import { projectApi } from '../services/api';
import type { ProjectFile, FileCategory, CreateProjectFileData } from '../types';

interface ProjectFilesTabProps {
  projectId: number;
}

const CATEGORY_CONFIG: Record<FileCategory, { label: string; icon: React.ElementType; color: string }> = {
  business_case: { label: 'Business Case', icon: Briefcase, color: '#8b5cf6' },
  proposal: { label: 'Proposal', icon: FileCheck, color: '#3b82f6' },
  charter: { label: 'Project Charter', icon: ClipboardList, color: '#10b981' },
  budget: { label: 'Budget Documents', icon: Wallet, color: '#f59e0b' },
  status_report: { label: 'Status Reports', icon: BarChart3, color: '#06b6d4' },
  design: { label: 'Design Files', icon: Palette, color: '#ec4899' },
  other: { label: 'Other', icon: MoreHorizontal, color: '#6b7280' },
};

const CATEGORIES: FileCategory[] = [
  'business_case',
  'proposal',
  'charter',
  'budget',
  'status_report',
  'design',
  'other'
];

const getFileIcon = (mimeType: string | null) => {
  if (!mimeType) return File;
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return FileSpreadsheet;
  if (mimeType.includes('image')) return FileImage;
  if (mimeType.includes('pdf') || mimeType.includes('document') || mimeType.includes('text')) return FileText;
  return File;
};

const formatFileSize = (bytes: number | null) => {
  if (!bytes) return 'Unknown size';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

export function ProjectFilesTab({ projectId }: ProjectFilesTabProps) {
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState<CreateProjectFileData>({
    file_name: '',
    file_path: '',
    category: 'other',
  });

  useEffect(() => {
    loadFiles();
  }, [projectId]);

  const loadFiles = async () => {
    try {
      setLoading(true);
      const filesData = await projectApi.getFiles(projectId);
      setFiles(filesData);
    } catch (error) {
      console.error('Failed to load files:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.file_name.trim() || !formData.file_path.trim()) return;

    try {
      setUploading(true);
      await projectApi.createFile(projectId, formData);
      resetForm();
      loadFiles();
    } catch (error) {
      console.error('Failed to add file:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (fileId: number) => {
    if (!confirm('Delete this file record?')) return;
    try {
      await projectApi.deleteFile(projectId, fileId);
      loadFiles();
    } catch (error) {
      console.error('Failed to delete file:', error);
    }
  };

  const handleCategoryChange = async (fileId: number, category: FileCategory) => {
    try {
      await projectApi.updateFileCategory(projectId, fileId, category);
      loadFiles();
    } catch (error) {
      console.error('Failed to update file category:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      file_name: '',
      file_path: '',
      category: 'other',
    });
    setIsDialogOpen(false);
  };

  const getFilesByCategory = (category: FileCategory) => {
    return files.filter(f => f.category === category);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Loading files...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Add Button */}
      <div className="flex justify-end">
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          if (!open) resetForm();
          setIsDialogOpen(open);
        }}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add File Reference
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add File Reference</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <p className="text-sm text-muted-foreground">
                Add a reference to an existing file (e.g., SharePoint link, Google Drive URL, or local path).
              </p>

              <div className="space-y-2">
                <Label>File Name *</Label>
                <Input
                  value={formData.file_name}
                  onChange={(e) => setFormData({ ...formData, file_name: e.target.value })}
                  placeholder="e.g., Business Case Q1 2024.xlsx"
                />
              </div>

              <div className="space-y-2">
                <Label>File Path / URL *</Label>
                <Input
                  value={formData.file_path}
                  onChange={(e) => setFormData({ ...formData, file_path: e.target.value })}
                  placeholder="e.g., https://sharepoint.com/... or /shared/docs/..."
                />
              </div>

              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value as FileCategory })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {CATEGORY_CONFIG[cat].label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>File Size (optional)</Label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.file_size || ''}
                    onChange={(e) => setFormData({ ...formData, file_size: parseInt(e.target.value) || undefined })}
                    placeholder="Bytes"
                  />
                </div>
                <div className="space-y-2">
                  <Label>MIME Type (optional)</Label>
                  <Input
                    value={formData.mime_type || ''}
                    onChange={(e) => setFormData({ ...formData, mime_type: e.target.value })}
                    placeholder="e.g., application/pdf"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={uploading || !formData.file_name.trim() || !formData.file_path.trim()}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {uploading ? 'Adding...' : 'Add File'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Files by Category */}
      {files.length === 0 ? (
        <div className="text-center py-8">
          <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No files added yet.</p>
          <p className="text-sm text-gray-400 mt-1">
            Add file references to track project documents like business cases, proposals, and status reports.
          </p>
        </div>
      ) : (
        <Accordion type="multiple" defaultValue={CATEGORIES.filter(c => getFilesByCategory(c).length > 0)} className="space-y-2">
          {CATEGORIES.map((category) => {
            const categoryFiles = getFilesByCategory(category);
            if (categoryFiles.length === 0) return null;

            const config = CATEGORY_CONFIG[category];
            const Icon = config.icon;

            return (
              <AccordionItem key={category} value={category} className="border rounded-lg">
                <AccordionTrigger className="px-4 hover:no-underline">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: config.color + '20' }}
                    >
                      <Icon className="h-4 w-4" style={{ color: config.color }} />
                    </div>
                    <div className="text-left">
                      <div className="font-medium">{config.label}</div>
                      <div className="text-xs text-gray-500">
                        {categoryFiles.length} file{categoryFiles.length !== 1 ? 's' : ''}
                      </div>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="px-4 pb-4 space-y-2">
                    {categoryFiles.map((file) => {
                      const FileIcon = getFileIcon(file.mime_type);
                      return (
                        <div
                          key={file.id}
                          className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg group hover:bg-gray-100"
                        >
                          <FileIcon className="h-8 w-8 text-gray-400 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm truncate">{file.file_name}</div>
                            <div className="text-xs text-gray-500 truncate">
                              {file.file_path}
                            </div>
                            <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                              <span>{formatFileSize(file.file_size)}</span>
                              <span>•</span>
                              <span>{formatDate(file.uploaded_at)}</span>
                              {file.uploader_name && (
                                <>
                                  <span>•</span>
                                  <span>by {file.uploader_name}</span>
                                </>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Select
                              value={file.category}
                              onValueChange={(value) => handleCategoryChange(file.id, value as FileCategory)}
                            >
                              <SelectTrigger className="h-8 w-32 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {CATEGORIES.map((cat) => (
                                  <SelectItem key={cat} value={cat} className="text-xs">
                                    {CATEGORY_CONFIG[cat].label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => window.open(file.file_path, '_blank')}
                              title="Open file"
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(file.id)}
                              className="text-gray-400 hover:text-red-500"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      )}
    </div>
  );
}
