"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { FileText } from "lucide-react";

interface Technique {
  _id: Id<"techniques">;
  name: string;
  category: string;
  videoUrl?: string;
  learned: boolean;
  learnedAt?: number;
  notes?: string;
  progressId?: Id<"userProgress">;
}

export default function TechniqueTracker() {
  const { user } = useUser();
  const techniques = useQuery(api.techniques.getAllTechniques);
  const updateProgress = useMutation(api.techniques.updateUserProgress);
  const updateNotes = useMutation(api.techniques.updateUserNotes);
  const seedTechniques = useMutation(api.techniques.seedTechniques);
  const syncUser = useMutation(api.users.syncUser);
  const [seeded, setSeeded] = useState(false);
  const [notesInput, setNotesInput] = useState<Record<string, string>>({});
  const [openDialogs, setOpenDialogs] = useState<Set<string>>(new Set());

  // Sync user with Convex when component mounts
  useEffect(() => {
    if (user) {
      syncUser({
        clerkId: user.id,
        email: user.primaryEmailAddress?.emailAddress || "",
        name: user.fullName || undefined,
        firstName: user.firstName || undefined,
        lastName: user.lastName || undefined,
        imageUrl: user.imageUrl || undefined,
      });
    }
  }, [user, syncUser]);

  // Seed techniques on first load if none exist
  useEffect(() => {
    if (techniques && techniques.length === 0 && !seeded) {
      seedTechniques().then(() => setSeeded(true));
    }
  }, [techniques, seedTechniques, seeded]);

  if (techniques === undefined) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading your BJJ progress...</div>
      </div>
    );
  }

  // Group techniques by category
  const groupedTechniques = techniques.reduce((acc: Record<string, Technique[]>, technique: Technique) => {
    if (!acc[technique.category]) {
      acc[technique.category] = [];
    }
    acc[technique.category].push(technique);
    return acc;
  }, {} as Record<string, Technique[]>);

  const categories = Object.keys(groupedTechniques);

  const handleToggleProgress = async (techniqueId: Id<"techniques">, currentStatus: boolean) => {
    await updateProgress({
      techniqueId,
      learned: !currentStatus,
    });
  };

  const handleNotesSave = async (techniqueId: Id<"techniques">) => {
    const notes = notesInput[techniqueId] || "";
    await updateNotes({ techniqueId, notes: notes.trim() });
    // Close the dialog after saving
    setOpenDialogs(prev => {
      const newSet = new Set(prev);
      newSet.delete(techniqueId);
      return newSet;
    });
  };

  const handleNotesChange = (techniqueId: string, value: string) => {
    setNotesInput(prev => ({ ...prev, [techniqueId]: value }));
  };

  const handleDialogChange = (techniqueId: string, open: boolean) => {
    setOpenDialogs(prev => {
      const newSet = new Set(prev);
      if (open) {
        newSet.add(techniqueId);
      } else {
        newSet.delete(techniqueId);
      }
      return newSet;
    });
  };

  const formatDate = (timestamp?: number) => {
    if (!timestamp) return null;
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const calculateProgress = (categoryTechniques: Technique[]) => {
    const learned = categoryTechniques.filter(t => t.learned).length;
    const total = categoryTechniques.length;
    return { learned, total, percentage: total > 0 ? (learned / total) * 100 : 0 };
  };

  const overallProgress = () => {
    const totalLearned = techniques.filter((t: Technique) => t.learned).length;
    const totalTechniques = techniques.length;
    return {
      learned: totalLearned,
      total: totalTechniques,
      percentage: totalTechniques > 0 ? (totalLearned / totalTechniques) * 100 : 0
    };
  };

  const overall = overallProgress();

  // Get categories that are not 100% complete to open by default
  const defaultOpenCategories = categories.filter(category => {
    const progress = calculateProgress(groupedTechniques[category]);
    return progress.percentage < 100;
  });

  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 mt-16">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            White to Blue Belt Progress
          </h1>
          <p className="text-lg text-gray-600 mb-6">
            Track your Brazilian Jiu-Jitsu technique mastery
          </p>
          
          {/* Overall Progress */}
          <div className="bg-white rounded-lg shadow-md p-6 max-w-md mx-auto">
            <h2 className="text-xl font-semibold mb-3">Overall Progress</h2>
            <Progress value={overall.percentage} className="h-3 mb-2" />
            <p className="text-sm text-gray-600">
              {overall.learned} of {overall.total} techniques mastered ({Math.round(overall.percentage)}%)
            </p>
          </div>
        </div>

        {/* Categories Accordion */}
        <Accordion type="multiple" defaultValue={defaultOpenCategories} className="space-y-4">
          {categories.map((category) => {
            const categoryTechniques = groupedTechniques[category];
            const progress = calculateProgress(categoryTechniques);
            
            return (
              <AccordionItem 
                key={category} 
                value={category}
                className="bg-white rounded-lg shadow-md border-0 overflow-hidden"
              >
                <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-gray-50">
                  <div className="flex flex-col items-start gap-3 w-full pr-4">
                    <h2 className="text-xl font-bold text-gray-900">{category}</h2>
                    <div className="w-full">
                      <Progress value={progress.percentage} className="h-2 mb-1" />
                      <p className="text-sm text-gray-600">
                        {progress.learned} of {progress.total} mastered ({Math.round(progress.percentage)}%)
                      </p>
                    </div>
                  </div>
                </AccordionTrigger>
                
                <AccordionContent className="px-6 pb-4">
                  <div className="space-y-3 pt-2">
                    {categoryTechniques.map((technique: Technique) => (
                      <div 
                        key={technique._id}
                        className={`flex flex-col gap-2 p-4 rounded-lg border transition-colors ${
                          technique.learned 
                            ? 'bg-green-50 border-green-200' 
                            : 'bg-white border-gray-200'
                        }`}
                      >
                        {/* First line: Checkbox + Technique name */}
                        <div className="flex items-start gap-3">
                          <Checkbox
                            id={technique._id}
                            checked={technique.learned}
                            onCheckedChange={() => handleToggleProgress(technique._id, technique.learned)}
                            className="mt-1"
                          />
                          <label
                            htmlFor={technique._id}
                            className="flex-1 text-base font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                          >
                            {technique.name}
                          </label>
                        </div>

                        {/* Second line: Actions and status */}
                        <div className="flex items-center gap-3 text-sm flex-wrap">
                          <Dialog 
                            open={openDialogs.has(technique._id)}
                            onOpenChange={(open) => handleDialogChange(technique._id, open)}
                          >
                            <DialogTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                className="h-auto p-0 text-gray-600 hover:text-gray-900 font-normal"
                                onClick={() => {
                                  if (!notesInput[technique._id]) {
                                    setNotesInput(prev => ({ 
                                      ...prev, 
                                      [technique._id]: technique.notes || "" 
                                    }));
                                  }
                                }}
                              >
                                <FileText className="h-4 w-4 mr-1" />
                                {technique.notes ? 'Notes' : 'Add Notes'}
                              </Button>
                            </DialogTrigger>
                            <DialogContent 
                              className="sm:max-w-[425px] max-w-[95vw] max-h-[90vh]"
                              onOpenAutoFocus={(e) => {
                                // Disable auto-focus on mobile
                                if (window.innerWidth < 768) {
                                  e.preventDefault();
                                  return;
                                }
                                // Find the textarea and set cursor to end on desktop
                                if (!e.currentTarget) return;
                                const textarea = (e.currentTarget as HTMLElement).querySelector('textarea');
                                if (textarea) {
                                  const length = textarea.value.length;
                                  textarea.setSelectionRange(length, length);
                                }
                              }}
                            >
                              <DialogHeader>
                                <DialogTitle>Technique Notes</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4 py-4">
                                <Textarea
                                  placeholder="Add your notes about this technique..."
                                  value={notesInput[technique._id] ?? technique.notes ?? ""}
                                  onChange={(e) => handleNotesChange(technique._id, e.target.value)}
                                  rows={8}
                                  className="resize-none"
                                />
                                <Button 
                                  onClick={() => handleNotesSave(technique._id)}
                                  className="w-full"
                                >
                                  Save Notes
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>

                          {technique.learned && technique.learnedAt && (
                            <>
                              <span className="text-gray-400">•</span>
                              <Badge variant="secondary" className="text-xs">
                                Learned {formatDate(technique.learnedAt)}
                              </Badge>
                            </>
                          )}
                        </div>

                        {/* Show notes preview if exists and dialog is closed */}
                        {technique.notes && !openDialogs.has(technique._id) && (
                          <div className="text-sm text-gray-600 italic border-l-2 border-gray-300 pl-3">
                            {technique.notes}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>

        {techniques.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-600">Initializing your technique library...</p>
          </div>
        )}
      </div>
    </main>
  );
}
