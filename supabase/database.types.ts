export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      accounts: {
        Row: {
          account: string;
          createdAt: string | null;
          id: string;
          name: string;
          primaryContact: string | null;
        };
        Insert: {
          account: string;
          createdAt?: string | null;
          id?: string;
          name: string;
          primaryContact?: string | null;
        };
        Update: {
          account?: string;
          createdAt?: string | null;
          id?: string;
          name?: string;
          primaryContact?: string | null;
        };
        Relationships: [];
      };
      comments: {
        Row: {
          comment: string;
          createdAt: string | null;
          documentId: string | null;
          firstName: string | null;
          id: string;
          lastName: string | null;
          userId: string | null;
        };
        Insert: {
          comment: string;
          createdAt?: string | null;
          documentId?: string | null;
          firstName?: string | null;
          id?: string;
          lastName?: string | null;
          userId?: string | null;
        };
        Update: {
          comment?: string;
          createdAt?: string | null;
          documentId?: string | null;
          firstName?: string | null;
          id?: string;
          lastName?: string | null;
          userId?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "comments_documentId_fkey";
            columns: ["documentId"];
            isOneToOne: false;
            referencedRelation: "documents";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "comments_userId_fkey";
            columns: ["userId"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      documents: {
        Row: {
          authorizedDate: string | null;
          completedDate: string | null;
          createdAt: string | null;
          description: string | null;
          filePath: string | null;
          fileSize: number | null;
          fileType: string | null;
          history: Json | null;
          id: string;
          inProgressDate: string | null;
          meetingId: string | null;
          signedDate: string | null;
          status: string | null;
          taskId: string | null;
          title: string;
          type: string | null;
          updatedAt: string | null;
          uploadDate: string | null;
          uploadedDate: string | null;
        };
        Insert: {
          authorizedDate?: string | null;
          completedDate?: string | null;
          createdAt?: string | null;
          description?: string | null;
          filePath?: string | null;
          fileSize?: number | null;
          fileType?: string | null;
          history?: Json | null;
          id?: string;
          inProgressDate?: string | null;
          meetingId?: string | null;
          signedDate?: string | null;
          status?: string | null;
          taskId?: string | null;
          title: string;
          type?: string | null;
          updatedAt?: string | null;
          uploadDate?: string | null;
          uploadedDate?: string | null;
        };
        Update: {
          authorizedDate?: string | null;
          completedDate?: string | null;
          createdAt?: string | null;
          description?: string | null;
          filePath?: string | null;
          fileSize?: number | null;
          fileType?: string | null;
          history?: Json | null;
          id?: string;
          inProgressDate?: string | null;
          meetingId?: string | null;
          signedDate?: string | null;
          status?: string | null;
          taskId?: string | null;
          title?: string;
          type?: string | null;
          updatedAt?: string | null;
          uploadDate?: string | null;
          uploadedDate?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "documents_meetingId_fkey";
            columns: ["meetingId"];
            isOneToOne: false;
            referencedRelation: "meetings";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "documents_taskId_fkey";
            columns: ["taskId"];
            isOneToOne: false;
            referencedRelation: "tasks";
            referencedColumns: ["id"];
          },
        ];
      };
      meetings: {
        Row: {
          accountId: string | null;
          brokerSearchDate: string | null;
          client: string | null;
          createdAt: string | null;
          currentPhase: string | null;
          cusip: string | null;
          distributionType: string | null;
          employeeStockPlans: string | null;
          filingDate: string | null;
          id: string;
          inspector: string | null;
          mailingDate: string | null;
          meetingDate: string | null;
          meetingType: string | null;
          meetingYear: number | null;
          overallCompletion: number | null;
          planAdministrator: string | null;
          planAdministratorContact: string | null;
          planAdministratorContactEmail: string | null;
          preFilingDate: string | null;
          quorumRequirement: number | null;
          recordDate: string | null;
          solicitor: string | null;
          solicitorEmail: string | null;
          status: string | null;
          ticker: string | null;
          title: string;
          totalSharesOutstanding: number | null;
          transferAgent: string | null;
          updatedAt: string | null;
        };
        Insert: {
          accountId?: string | null;
          brokerSearchDate?: string | null;
          client?: string | null;
          createdAt?: string | null;
          currentPhase?: string | null;
          cusip?: string | null;
          distributionType?: string | null;
          employeeStockPlans?: string | null;
          filingDate?: string | null;
          id: string;
          inspector?: string | null;
          mailingDate?: string | null;
          meetingDate?: string | null;
          meetingType?: string | null;
          meetingYear?: number | null;
          overallCompletion?: number | null;
          planAdministrator?: string | null;
          planAdministratorContact?: string | null;
          planAdministratorContactEmail?: string | null;
          preFilingDate?: string | null;
          quorumRequirement?: number | null;
          recordDate?: string | null;
          solicitor?: string | null;
          solicitorEmail?: string | null;
          status?: string | null;
          ticker?: string | null;
          title: string;
          totalSharesOutstanding?: number | null;
          transferAgent?: string | null;
          updatedAt?: string | null;
        };
        Update: {
          accountId?: string | null;
          brokerSearchDate?: string | null;
          client?: string | null;
          createdAt?: string | null;
          currentPhase?: string | null;
          cusip?: string | null;
          distributionType?: string | null;
          employeeStockPlans?: string | null;
          filingDate?: string | null;
          id?: string;
          inspector?: string | null;
          mailingDate?: string | null;
          meetingDate?: string | null;
          meetingType?: string | null;
          meetingYear?: number | null;
          overallCompletion?: number | null;
          planAdministrator?: string | null;
          planAdministratorContact?: string | null;
          planAdministratorContactEmail?: string | null;
          preFilingDate?: string | null;
          quorumRequirement?: number | null;
          recordDate?: string | null;
          solicitor?: string | null;
          solicitorEmail?: string | null;
          status?: string | null;
          ticker?: string | null;
          title?: string;
          totalSharesOutstanding?: number | null;
          transferAgent?: string | null;
          updatedAt?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "meetings_accountId_fkey";
            columns: ["accountId"];
            isOneToOne: false;
            referencedRelation: "accounts";
            referencedColumns: ["id"];
          },
        ];
      };
      notifications: {
        Row: {
          actionUrl: string | null;
          createdAt: string | null;
          id: string;
          meetingId: string | null;
          message: string | null;
          priority: string | null;
          read: boolean | null;
          readAt: string | null;
          title: string | null;
          type: string | null;
          userId: string | null;
        };
        Insert: {
          actionUrl?: string | null;
          createdAt?: string | null;
          id?: string;
          meetingId?: string | null;
          message?: string | null;
          priority?: string | null;
          read?: boolean | null;
          readAt?: string | null;
          title?: string | null;
          type?: string | null;
          userId?: string | null;
        };
        Update: {
          actionUrl?: string | null;
          createdAt?: string | null;
          id?: string;
          meetingId?: string | null;
          message?: string | null;
          priority?: string | null;
          read?: boolean | null;
          readAt?: string | null;
          title?: string | null;
          type?: string | null;
          userId?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "notifications_meetingId_fkey";
            columns: ["meetingId"];
            isOneToOne: false;
            referencedRelation: "meetings";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "notifications_userId_fkey";
            columns: ["userId"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      phases: {
        Row: {
          createdAt: string | null;
          id: string;
          keyDates: Json | null;
          meetingId: string | null;
          name: string;
          orderIndex: number;
          status: string | null;
          updatedAt: string | null;
        };
        Insert: {
          createdAt?: string | null;
          id?: string;
          keyDates?: Json | null;
          meetingId?: string | null;
          name: string;
          orderIndex: number;
          status?: string | null;
          updatedAt?: string | null;
        };
        Update: {
          createdAt?: string | null;
          id?: string;
          keyDates?: Json | null;
          meetingId?: string | null;
          name?: string;
          orderIndex?: number;
          status?: string | null;
          updatedAt?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "phases_meetingId_fkey";
            columns: ["meetingId"];
            isOneToOne: false;
            referencedRelation: "meetings";
            referencedColumns: ["id"];
          },
        ];
      };
      position_votes: {
        Row: {
          createdAt: string | null;
          id: string;
          positionId: string | null;
          proposalId: string | null;
          sharesVoting: number | null;
          updatedAt: string | null;
          vote: string | null;
          voteDate: string | null;
        };
        Insert: {
          createdAt?: string | null;
          id?: string;
          positionId?: string | null;
          proposalId?: string | null;
          sharesVoting?: number | null;
          updatedAt?: string | null;
          vote?: string | null;
          voteDate?: string | null;
        };
        Update: {
          createdAt?: string | null;
          id?: string;
          positionId?: string | null;
          proposalId?: string | null;
          sharesVoting?: number | null;
          updatedAt?: string | null;
          vote?: string | null;
          voteDate?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "position_votes_positionId_fkey";
            columns: ["positionId"];
            isOneToOne: false;
            referencedRelation: "positions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "position_votes_proposalId_fkey";
            columns: ["proposalId"];
            isOneToOne: false;
            referencedRelation: "proposals";
            referencedColumns: ["id"];
          },
        ];
      };
      positions: {
        Row: {
          accountNumber: string | null;
          accountType: string | null;
          controlNumber: string;
          createdAt: string | null;
          cusip: string | null;
          dateVoted: string | null;
          id: string;
          meetingId: string | null;
          name: string | null;
          setKey: string | null;
          shares: number | null;
          sharesVoted: number | null;
          source: string | null;
          updatedAt: string | null;
          voteStatus: string | null;
        };
        Insert: {
          accountNumber?: string | null;
          accountType?: string | null;
          controlNumber: string;
          createdAt?: string | null;
          cusip?: string | null;
          dateVoted?: string | null;
          id?: string;
          meetingId?: string | null;
          name?: string | null;
          setKey?: string | null;
          shares?: number | null;
          sharesVoted?: number | null;
          source?: string | null;
          updatedAt?: string | null;
          voteStatus?: string | null;
        };
        Update: {
          accountNumber?: string | null;
          accountType?: string | null;
          controlNumber?: string;
          createdAt?: string | null;
          cusip?: string | null;
          dateVoted?: string | null;
          id?: string;
          meetingId?: string | null;
          name?: string | null;
          setKey?: string | null;
          shares?: number | null;
          sharesVoted?: number | null;
          source?: string | null;
          updatedAt?: string | null;
          voteStatus?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "positions_meetingId_fkey";
            columns: ["meetingId"];
            isOneToOne: false;
            referencedRelation: "meetings";
            referencedColumns: ["id"];
          },
        ];
      };
      proposals: {
        Row: {
          createdAt: string | null;
          directorClass: string | null;
          directorName: string | null;
          directorTermYears: number | null;
          frequencyOptions: Json | null;
          id: string;
          meetingId: string | null;
          proposalNumber: number | null;
          proposalSubtype: string | null;
          proposalTitle: string;
          proposalType: string | null;
          recommendation: string | null;
          termExpirationYear: number | null;
          updatedAt: string | null;
        };
        Insert: {
          createdAt?: string | null;
          directorClass?: string | null;
          directorName?: string | null;
          directorTermYears?: number | null;
          frequencyOptions?: Json | null;
          id?: string;
          meetingId?: string | null;
          proposalNumber?: number | null;
          proposalSubtype?: string | null;
          proposalTitle: string;
          proposalType?: string | null;
          recommendation?: string | null;
          termExpirationYear?: number | null;
          updatedAt?: string | null;
        };
        Update: {
          createdAt?: string | null;
          directorClass?: string | null;
          directorName?: string | null;
          directorTermYears?: number | null;
          frequencyOptions?: Json | null;
          id?: string;
          meetingId?: string | null;
          proposalNumber?: number | null;
          proposalSubtype?: string | null;
          proposalTitle?: string;
          proposalType?: string | null;
          recommendation?: string | null;
          termExpirationYear?: number | null;
          updatedAt?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "proposals_meetingId_fkey";
            columns: ["meetingId"];
            isOneToOne: false;
            referencedRelation: "meetings";
            referencedColumns: ["id"];
          },
        ];
      };
      relationships: {
        Row: {
          accountId: string | null;
          createdAt: string | null;
          id: string;
          relationshipType: string | null;
          updatedAt: string | null;
          userId: string | null;
        };
        Insert: {
          accountId?: string | null;
          createdAt?: string | null;
          id?: string;
          relationshipType?: string | null;
          updatedAt?: string | null;
          userId?: string | null;
        };
        Update: {
          accountId?: string | null;
          createdAt?: string | null;
          id?: string;
          relationshipType?: string | null;
          updatedAt?: string | null;
          userId?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "relationships_accountId_fkey";
            columns: ["accountId"];
            isOneToOne: false;
            referencedRelation: "accounts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "relationships_userId_fkey";
            columns: ["userId"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      signatures: {
        Row: {
          createdAt: string | null;
          documentId: string | null;
          height: number | null;
          id: string;
          pageNumber: number | null;
          required: boolean | null;
          signatureType: string | null;
          updatedAt: string | null;
          width: number | null;
          xPosition: number | null;
          yPosition: number | null;
        };
        Insert: {
          createdAt?: string | null;
          documentId?: string | null;
          height?: number | null;
          id?: string;
          pageNumber?: number | null;
          required?: boolean | null;
          signatureType?: string | null;
          updatedAt?: string | null;
          width?: number | null;
          xPosition?: number | null;
          yPosition?: number | null;
        };
        Update: {
          createdAt?: string | null;
          documentId?: string | null;
          height?: number | null;
          id?: string;
          pageNumber?: number | null;
          required?: boolean | null;
          signatureType?: string | null;
          updatedAt?: string | null;
          width?: number | null;
          xPosition?: number | null;
          yPosition?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "signatures_documentId_fkey";
            columns: ["documentId"];
            isOneToOne: false;
            referencedRelation: "documents";
            referencedColumns: ["id"];
          },
        ];
      };
      tasks: {
        Row: {
          createdAt: string | null;
          dueDate: string | null;
          id: string;
          meetingId: string | null;
          owner: string | null;
          phaseId: string | null;
          phaseNumber: number | null;
          status: string | null;
          taskId: string | null;
          title: string;
          type: string | null;
          updatedAt: string | null;
        };
        Insert: {
          createdAt?: string | null;
          dueDate?: string | null;
          id?: string;
          meetingId?: string | null;
          owner?: string | null;
          phaseId?: string | null;
          phaseNumber?: number | null;
          status?: string | null;
          taskId?: string | null;
          title: string;
          type?: string | null;
          updatedAt?: string | null;
        };
        Update: {
          createdAt?: string | null;
          dueDate?: string | null;
          id?: string;
          meetingId?: string | null;
          owner?: string | null;
          phaseId?: string | null;
          phaseNumber?: number | null;
          status?: string | null;
          taskId?: string | null;
          title?: string;
          type?: string | null;
          updatedAt?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "tasks_meetingId_fkey";
            columns: ["meetingId"];
            isOneToOne: false;
            referencedRelation: "meetings";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tasks_phaseId_fkey";
            columns: ["phaseId"];
            isOneToOne: false;
            referencedRelation: "phases";
            referencedColumns: ["id"];
          },
        ];
      };
      users: {
        Row: {
          accountId: string | null;
          email: string;
          firstName: string | null;
          id: string;
          lastName: string | null;
          password: string;
          type: string;
          username: string;
        };
        Insert: {
          accountId?: string | null;
          email: string;
          firstName?: string | null;
          id?: string;
          lastName?: string | null;
          password: string;
          type: string;
          username: string;
        };
        Update: {
          accountId?: string | null;
          email?: string;
          firstName?: string | null;
          id?: string;
          lastName?: string | null;
          password?: string;
          type?: string;
          username?: string;
        };
        Relationships: [
          {
            foreignKeyName: "users_accountId_fkey";
            columns: ["accountId"];
            isOneToOne: false;
            referencedRelation: "accounts";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
