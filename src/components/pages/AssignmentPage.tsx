'use client';
import { useState } from 'react';
import { useAssignments } from '@/src/hooks/useAssignments';
import { RichTextEditor } from '@/src/components/common/RichTextEditor';
import { RichTextDisplay } from '@/src/components/common/RichTextDisplay';

export function AssignmentPage() {
  const { assignments, addAssignment, updateAssignment, deleteAssignment } = useAssignments();
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');

  const handleSubmit = () => {
    if (!newTitle.trim() && !newContent.trim()) return;
    addAssignment(newTitle.trim() || '無題', newContent);
    setNewTitle('');
    setNewContent('');
  };

  const startEdit = (id: string) => {
    const a = assignments.find((x) => x.id === id);
    if (!a) return;
    setEditingId(id);
    setEditTitle(a.title);
    setEditContent(a.content);
  };

  const saveEdit = () => {
    if (!editingId) return;
    updateAssignment(editingId, { title: editTitle, content: editContent });
    setEditingId(null);
  };

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      <h1 className="text-xl font-bold text-text-primary mb-6">課題提出</h1>

      {/* New Assignment Form */}
      <div className="bg-bg-card/70 backdrop-blur-sm border border-border rounded-xl p-5 mb-6">
        <h2 className="text-sm font-semibold text-amber-300 mb-3 flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          新しい課題を提出
        </h2>
        <input
          type="text"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="タイトル"
          className="w-full bg-bg-primary border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-amber-500/50 mb-3"
        />
        <RichTextEditor
          value={newContent}
          onChange={setNewContent}
          placeholder="課題の内容を入力..."
          minHeight="150px"
          accentColor="gold"
        />
        <div className="flex justify-end mt-3">
          <button
            onClick={handleSubmit}
            className="px-5 py-2 bg-amber-500/20 text-amber-300 rounded-lg text-sm font-medium hover:bg-amber-500/30 transition-colors"
          >
            提出する
          </button>
        </div>
      </div>

      {/* Assignment List */}
      <div className="space-y-3">
        {assignments.length === 0 && (
          <p className="text-center text-text-secondary/50 py-12 text-sm">まだ提出された課題はありません</p>
        )}
        {assignments.map((a) => (
          <div key={a.id} className="bg-bg-card/70 backdrop-blur-sm border border-border rounded-xl p-4">
            {editingId === a.id ? (
              <>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full bg-bg-primary border border-border rounded-lg px-3 py-2 text-sm text-text-primary mb-2 focus:outline-none focus:border-amber-500/50"
                />
                <RichTextEditor
                  value={editContent}
                  onChange={setEditContent}
                  placeholder="内容..."
                  minHeight="100px"
                  accentColor="gold"
                />
                <div className="flex justify-end gap-2 mt-2">
                  <button onClick={() => setEditingId(null)} className="px-3 py-1.5 text-xs text-text-secondary hover:text-text-primary">キャンセル</button>
                  <button onClick={saveEdit} className="px-3 py-1.5 text-xs bg-amber-500/20 text-amber-300 rounded hover:bg-amber-500/30">保存</button>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-sm font-semibold text-text-primary">{a.title}</h3>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] text-text-secondary">
                      {new Date(a.createdAt).toLocaleDateString('ja-JP')} {new Date(a.createdAt).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <button onClick={() => startEdit(a.id)} className="text-text-secondary/50 hover:text-amber-300 transition-colors">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                    <button onClick={() => deleteAssignment(a.id)} className="text-text-secondary/50 hover:text-red-400 transition-colors">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
                {a.content && <RichTextDisplay html={a.content} className="text-sm text-text-secondary" />}
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
