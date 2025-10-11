"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";

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
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set());
  const [notesInput, setNotesInput] = useState<Record<string, string>>({});

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

  const handleNotesToggle = (techniqueId: string) => {
    const newExpanded = new Set(expandedNotes);
    if (newExpanded.has(techniqueId)) {
      newExpanded.delete(techniqueId);
    } else {
      newExpanded.add(techniqueId);
    }
    setExpandedNotes(newExpanded);
  };

  const handleNotesSave = async (techniqueId: Id<"techniques">) => {
    const notes = notesInput[techniqueId] || "";
    if (notes.trim()) {
      await updateNotes({ techniqueId, notes: notes.trim() });
    }
  };

  const handleNotesChange = (techniqueId: string, value: string) => {
    setNotesInput(prev => ({ ...prev, [techniqueId]: value }));
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
    return { learned, total, percentage: total > 0 ? Math.round((learned / total) * 100) : 0 };
  };

  const overallProgress = () => {
    const totalLearned = techniques.filter((t: Technique) => t.learned).length;
    const totalTechniques = techniques.length;
    return {
      learned: totalLearned,
      total: totalTechniques,
      percentage: totalTechniques > 0 ? Math.round((totalLearned / totalTechniques) * 100) : 0
    };
  };

  const overall = overallProgress();

  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            White to Blue Belt Progress
          </h1>
          <p className="text-lg text-gray-600 mb-4">
            Track your Brazilian Jiu-Jitsu technique mastery
          </p>
          
          {/* Overall Progress */}
          <div className="bg-white rounded-lg shadow-md p-6 max-w-md mx-auto">
            <h2 className="text-xl font-semibold mb-3">Overall Progress</h2>
            <div className="w-full bg-gray-200 rounded-full h-4 mb-2">
              <div 
                className="bg-blue-600 h-4 rounded-full transition-all duration-300"
                style={{ width: `${overall.percentage}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-600">
              {overall.learned} of {overall.total} techniques mastered ({overall.percentage}%)
            </p>
          </div>
        </div>

        {/* Categories */}
        <div className="space-y-8">
          {categories.map((category) => {
            const categoryTechniques = groupedTechniques[category];
            const progress = calculateProgress(categoryTechniques);
            
            return (
              <div key={category} className="bg-white rounded-lg shadow-md overflow-hidden">
                {/* Category Header */}
                <div className="bg-gray-800 text-white p-6">
                  <h2 className="text-2xl font-bold mb-2">{category}</h2>
                  <div className="w-full bg-gray-700 rounded-full h-3 mb-2">
                    <div 
                      className="bg-green-500 h-3 rounded-full transition-all duration-300"
                      style={{ width: `${progress.percentage}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-gray-300">
                    {progress.learned} of {progress.total} techniques mastered ({progress.percentage}%)
                  </p>
                </div>

                {/* Techniques Grid */}
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {categoryTechniques.map((technique: Technique) => (
                      <div 
                        key={technique._id}
                        className={`border rounded-lg p-4 transition-all duration-200 ${
                          technique.learned 
                            ? 'border-green-500 bg-green-50' 
                            : 'border-gray-300 bg-white hover:border-gray-400'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <h3 className="font-semibold text-gray-900 flex-1">
                            {technique.name}
                          </h3>
                          <label className="flex items-center cursor-pointer ml-2">
                            <input
                              type="checkbox"
                              checked={technique.learned}
                              onChange={() => handleToggleProgress(technique._id, technique.learned)}
                              className="w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500"
                            />
                          </label>
                        </div>

                        {technique.learned && technique.learnedAt && (
                          <div className="text-xs text-green-700 mb-2 flex items-center">
                            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"/>
                            </svg>
                            Learned on {formatDate(technique.learnedAt)}
                          </div>
                        )}
                        
                        <a
                          href={technique.videoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 transition-colors mb-2"
                        >
                          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
                            <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"/>
                          </svg>
                          Watch Video
                        </a>

                        {/* Notes Section */}
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <button
                            onClick={() => handleNotesToggle(technique._id)}
                            className="text-sm text-gray-600 hover:text-gray-900 flex items-center"
                          >
                            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"/>
                            </svg>
                            {technique.notes ? 'Edit Notes' : 'Add Notes'}
                          </button>
                          
                          {expandedNotes.has(technique._id) && (
                            <div className="mt-2">
                              <textarea
                                className="w-full p-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                rows={3}
                                placeholder="Add your notes about this technique..."
                                defaultValue={technique.notes || ""}
                                onChange={(e) => handleNotesChange(technique._id, e.target.value)}
                              />
                              <button
                                onClick={() => handleNotesSave(technique._id)}
                                className="mt-2 px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                              >
                                Save Notes
                              </button>
                            </div>
                          )}
                          
                          {technique.notes && !expandedNotes.has(technique._id) && (
                            <p className="mt-2 text-sm text-gray-600 italic">
                              {technique.notes}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {techniques.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-600">Initializing your technique library...</p>
          </div>
        )}
      </div>
    </main>
  );
}
