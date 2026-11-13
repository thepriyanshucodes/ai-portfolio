"use client"

import React, { useState, useEffect, useCallback, useRef } from 'react';

export interface NoteDocument {
  id: string;
  title: string;
  content: string;
  updatedAt: number;
}

interface NotesAppProps {
  appStatus?: 'open' | 'minimized' | 'closed';
}

const STORAGE_KEY = 'portfolio_notes_documents';
const ACTIVE_DOC_KEY = 'portfolio_active_doc_id';

const DEFAULT_DOC: NoteDocument = {
  id: 'default-1',
  title: 'Untitled Note',
  content: '',
  updatedAt: Date.now(),
};

export default function NotesApp( {appStatus} : NotesAppProps) {

  const statusRef = useRef(appStatus);
  // Load documents from localStorage or initialize with default
  const [documents, setDocuments] = useState<NoteDocument[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [DEFAULT_DOC];
  });

  // Active document ID state
  const [activeId, setActiveId] = useState<string>(() => {
    const savedId = localStorage.getItem(ACTIVE_DOC_KEY);
    return savedId || 'default-1';
  });

  const activeDoc = documents.find((doc) => doc.id === activeId) || documents[0];

  // Fix synchronous setState in useEffect by syncing during render pass
  const [prevActiveId, setPrevActiveId] = useState<string>(activeId);
  const [editorContent, setEditorContent] = useState<string>(activeDoc ? activeDoc.content : '');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);

  if (activeId !== prevActiveId) {
    setPrevActiveId(activeId);
    setEditorContent(activeDoc ? activeDoc.content : '');
    setHasUnsavedChanges(false);
  }

  // UI state for document selection modal/dropdown
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [showDocPicker, setShowDocPicker] = useState<boolean>(false);
  const [showTitlePrompt, setShowTitlePrompt] = useState<boolean>(false);
  const [newTitleInput, setNewTitleInput] = useState<string>('');

  useEffect(() => {
    statusRef.current = appStatus;
  }, [appStatus]);

  useEffect(() => {
    return () => {
      
      if (statusRef.current === 'minimized') {
      
        if (hasUnsavedChanges && activeDoc) {
          const saved = localStorage.getItem(STORAGE_KEY);
          const currentDocs = saved ? JSON.parse(saved) : documents;
          const updatedDocs = currentDocs.map((doc: NoteDocument) =>
            doc.id === activeId ? { ...doc, content: editorContent, updatedAt: Date.now() } : doc
          );
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedDocs));
        }
      } else if (statusRef.current === 'closed') {
        // Unsaved edits are discarded; default behaviour
      }
    };
  }, [activeId, activeDoc, editorContent, hasUnsavedChanges, documents]);

  // Persist documents list to localStorage
  const persistDocuments = (updatedDocs: NoteDocument[]) => {
    setDocuments(updatedDocs);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedDocs));
  };

  // Perform Save Action
  const performSave = useCallback(
    (titleOverride?: string) => {
      if (!activeDoc) return;

      if (activeDoc.title === 'Untitled Note' && !titleOverride) {
        setNewTitleInput('');
        setShowTitlePrompt(true);
        return;
      }

      setIsSaving(true);

      const finalTitle = titleOverride || activeDoc.title;
      const updatedDocs = documents.map((doc) =>
        doc.id === activeDoc.id
          ? { ...doc, title: finalTitle, content: editorContent, updatedAt: Date.now() }
          : doc
      );

      persistDocuments(updatedDocs);
      setHasUnsavedChanges(false);

      setTimeout(() => {
        setIsSaving(false);
      }, 500);
    },
    [activeDoc, documents, editorContent]
  );

  // Keyboard shortcut Ctrl + S or Cmd + S
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        performSave();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [performSave]);

  // Text Change Handler
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setEditorContent(val);
    setHasUnsavedChanges(val !== activeDoc.content);
  };

  const saveCurrentDraft = () => {
    if (hasUnsavedChanges && activeDoc) {
      const updatedDocs = documents.map((doc) =>
        doc.id === activeDoc.id
          ? { ...doc, content: editorContent, updatedAt: Date.now() }
          : doc
      );
      persistDocuments(updatedDocs);
    }
  };

  // Create New Document
  const handleCreateNew = () => {

    saveCurrentDraft();

    const newDoc: NoteDocument = {
      id: `doc-${Date.now()}`,
      title: 'Untitled Note',
      content: '',
      updatedAt: Date.now(),
    };

    const nextDocs = [newDoc, ...documents];
    persistDocuments(nextDocs);
    setActiveId(newDoc.id);
    localStorage.setItem(ACTIVE_DOC_KEY, newDoc.id);
    setShowDocPicker(false);

  };

  // Select Document
  const handleSelectDoc = (id: string) => {
    saveCurrentDraft()
    setActiveId(id);
    localStorage.setItem(ACTIVE_DOC_KEY, id);
    setShowDocPicker(false);
  };

  // Delete Document
  const handleDeleteDoc = (e: React.MouseEvent, idToDelete: string) => {
    e.stopPropagation(); // Prevents document selection event from firing

    let updatedDocs = documents.filter((doc) => doc.id !== idToDelete);

    // If deleting all documents, create a default blank document
    if (updatedDocs.length === 0) {
      updatedDocs = [DEFAULT_DOC];
    }

    persistDocuments(updatedDocs);

    // Switch active document if deleting current active document
    if (activeId === idToDelete) {
      const nextActiveId = updatedDocs[0].id;
      setActiveId(nextActiveId);
      localStorage.setItem(ACTIVE_DOC_KEY, nextActiveId);
    }
  };

  // Title Dialog Submit
  const handleTitleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitleInput.trim()) return;
    setShowTitlePrompt(false);
    performSave(newTitleInput.trim());
  };

  return (
    <div className="relative flex flex-col h-full w-full bg-inherit text-slate-100 select-none font-sans overflow-hidden">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between px-3 py-2 bg-slate-900 border-b border-white/10 z-10 rounded-2xl">
        {/* Left Side: New & Documents */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleCreateNew}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-white/10 hover:bg-white/15 rounded-md transition-colors"
          >
            <span>+</span> New
          </button>

          <button
            onClick={() => setShowDocPicker((prev) => !prev)}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-white/10 hover:bg-white/15 rounded-md transition-colors"
          >
            📁 Documents
          </button>
        </div>

        {/* Center: Current Document Title */}
        <span className="text-xs text-slate-400 font-medium truncate max-w-35">
          {activeDoc?.title}
        </span>

        {/* Right Side: Unsaved Indicator & Save Button */}
        <div className="flex items-center gap-2">
          {/* Unsaved Changes White Dot */}
          {hasUnsavedChanges && !isSaving && (
            <span
              title="Unsaved changes"
              className="w-2 h-2 rounded-full bg-white animate-pulse"
            />
          )}

          <div className="relative inline-flex items-center justify-center p-0.5 overflow-hidden rounded-md group">
            {/* Rotating Snake-like Glowing Border */}
            {isSaving && (
              <span className="absolute -inset-full animate-[spin_1.5s_linear_infinite] bg-[conic-gradient(from_0deg,#0000_0_260deg,#3b82f6_310deg,#60a5fa_340deg,#ffffff_360deg)] blur-[1px] drop-shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
            )}

            <button
              onClick={() => performSave()}
              disabled={isSaving}
              className={`relative z-10 px-3 py-1 text-xs font-semibold rounded-sm transition-all ${
                isSaving
                  ? 'bg-slate-900 text-blue-200'
                  : 'bg-blue-500/80 hover:bg-blue-500 text-white'
              }`}
            >
              Save
            </button>
          </div>
        </div>
      </div>

      {/* Editor Area */}
      <div className="relative flex-1 p-3">
        <textarea
          value={editorContent}
          onChange={handleContentChange}
          placeholder="Start typing your note..."
          className="w-full h-full bg-transparent resize-none focus:outline-none text-slate-200 text-sm font-mono leading-relaxed placeholder:text-slate-600 no-scrollbar"
        />
      </div>

      {/* Document Picker Overlay Modal */}
      {showDocPicker && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-20 flex flex-col p-4 animate-in fade-in duration-150 rounded-xl">
          <div className="flex items-center justify-between mb-3 border-b border-white/10 pb-2">
            <h3 className="text-sm font-semibold text-white">Your Documents</h3>
            <button
              onClick={() => setShowDocPicker(false)}
              className="text-slate-400 hover:text-white text-xs px-2 py-1"
            >
              ✕ Close
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
            {documents.map((doc) => (
              <div
                key={doc.id}
                onClick={() => handleSelectDoc(doc.id)}
                className={`w-full flex items-center justify-between p-2.5 rounded-lg text-left text-xs cursor-pointer transition-colors ${
                  doc.id === activeId
                    ? 'bg-blue-600/30 border border-blue-500/50 text-white'
                    : 'bg-white/5 hover:bg-white/10 text-slate-300'
                }`}
              >
                <div className="flex flex-col flex-1 overflow-hidden mr-2">
                  <span className="font-medium text-slate-100 truncate">{doc.title}</span>
                  <span className="text-[10px] text-slate-500 truncate max-w-50">
                    {doc.content || 'Empty note'}
                  </span>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-[10px] text-slate-400">
                    {new Date(doc.updatedAt).toLocaleDateString()}
                  </span>

                  {/* Delete Button */}
                  <button
                    onClick={(e) => handleDeleteDoc(e, doc.id)}
                    title="Delete document"
                    className="p-1 text-slate-400 hover:text-red-400 hover:bg-white/10 rounded transition-colors"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Save Title Prompt Dialog for New Documents */}
      {showTitlePrompt && (
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm z-30 flex items-center justify-center p-4">
          <form
            onSubmit={handleTitleSubmit}
            className="w-full max-w-xs bg-[#232328] border border-white/10 rounded-xl p-4 shadow-2xl space-y-3"
          >
            <h4 className="text-xs font-semibold text-slate-200">Name Your Document</h4>
            <input
              type="text"
              autoFocus
              value={newTitleInput}
              onChange={(e) => setNewTitleInput(e.target.value)}
              placeholder="e.g. Work Notes, Ideas..."
              className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
            />
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowTitlePrompt(false)}
                className="px-2.5 py-1 text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3 py-1 text-xs bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-md"
              >
                Save
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}