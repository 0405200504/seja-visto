"use client";

import { useState } from "react";
import { Search, X, Users } from "lucide-react";
import { StudentCard } from "./student-card";

interface StudentData {
  student: {
    user_id: string;
    name: string | null;
    email: string | null;
    is_admin: boolean;
    onboarding_completed: boolean;
    created_at: string;
    style_goal?: string | null;
    preferred_style?: string | null;
    main_difficulty?: string | null;
  };
  entitlements: string[];
  lastSeen: string | undefined;
  completedLessonsCount: number;
  aiMessagesCount: number;
  aiTokensCount: number;
}

interface StudentListProps {
  initialStudents: StudentData[];
  totalLessonsCount: number;
}

export function StudentList({ initialStudents, totalLessonsCount }: StudentListProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredStudents = initialStudents.filter((item) => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return true;

    const nameMatch = item.student.name?.toLowerCase().includes(term) ?? false;
    const emailMatch = item.student.email?.toLowerCase().includes(term) ?? false;

    return nameMatch || emailMatch;
  });

  return (
    <div className="space-y-5">
      {/* Barra de Pesquisa */}
      <div className="relative flex items-center">
        <div className="pointer-events-none absolute left-4 text-muted">
          <Search className="size-4" />
        </div>
        
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Pesquisar aluno por nome ou e-mail..."
          className="w-full rounded-2xl border border-border bg-surface pl-11 pr-11 py-3 text-sm outline-none transition-all focus:border-accent focus:ring-1 focus:ring-accent/50"
        />

        {searchTerm && (
          <button
            type="button"
            onClick={() => setSearchTerm("")}
            className="absolute right-4 text-muted hover:text-foreground transition-colors"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      {/* Contador de resultados da pesquisa */}
      {searchTerm && (
        <p className="text-xs text-muted flex items-center gap-1.5 px-1 animate-fade-in">
          <Users className="size-3.5" />
          Encontrado(s) <span className="font-semibold text-foreground">{filteredStudents.length}</span> de <span className="font-semibold text-foreground">{initialStudents.length}</span> alunos para "{searchTerm}"
        </p>
      )}

      {/* Lista de Alunos */}
      <div className="space-y-3.5">
        {filteredStudents.map((item) => (
          <StudentCard
            key={item.student.user_id}
            student={item.student}
            entitlements={item.entitlements}
            lastSeen={item.lastSeen}
            completedLessonsCount={item.completedLessonsCount}
            totalLessonsCount={totalLessonsCount}
            aiMessagesCount={item.aiMessagesCount}
            aiTokensCount={item.aiTokensCount}
          />
        ))}

        {filteredStudents.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border px-5 py-12 text-center text-sm text-muted">
            {searchTerm ? (
              <p>Nenhum aluno encontrado para a busca "{searchTerm}".</p>
            ) : (
              <p>Nenhum aluno cadastrado no sistema ainda.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
