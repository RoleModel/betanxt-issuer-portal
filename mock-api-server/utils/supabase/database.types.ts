export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      account: {
        Row: {
          client: string | null
          client_id: string | null
          created_at: string | null
          id: string
          name: string | null
          primary_contact: string | null
        }
        Insert: {
          client?: string | null
          client_id?: string | null
          created_at?: string | null
          id: string
          name?: string | null
          primary_contact?: string | null
        }
        Update: {
          client?: string | null
          client_id?: string | null
          created_at?: string | null
          id?: string
          name?: string | null
          primary_contact?: string | null
        }
        Relationships: []
      }
      add_document_event_request: {
        Row: {
          event_type: Database["public"]["Enums"]["add_document_event_request_event_type"]
          metadata: Json | null
        }
        Insert: {
          event_type: Database["public"]["Enums"]["add_document_event_request_event_type"]
          metadata?: Json | null
        }
        Update: {
          event_type?: Database["public"]["Enums"]["add_document_event_request_event_type"]
          metadata?: Json | null
        }
        Relationships: []
      }
      approve_document_version_request: {
        Row: {
          comment: string | null
          meeting_id: string
        }
        Insert: {
          comment?: string | null
          meeting_id: string
        }
        Update: {
          comment?: string | null
          meeting_id?: string
        }
        Relationships: []
      }
      cast_vote_request: {
        Row: {
          proposal_id: string
          shares_voting: string
          vote: Database["public"]["Enums"]["cast_vote_request_vote"]
        }
        Insert: {
          proposal_id: string
          shares_voting: string
          vote: Database["public"]["Enums"]["cast_vote_request_vote"]
        }
        Update: {
          proposal_id?: string
          shares_voting?: string
          vote?: Database["public"]["Enums"]["cast_vote_request_vote"]
        }
        Relationships: []
      }
      clients: {
        Row: {
          accounts: Json | null
          branding_id: number | null
          company_name: string | null
          created_at: string | null
          description: string | null
          id: string
          industry: string | null
          is_active: boolean | null
          meetings: Json | null
          primary_contact: string | null
          primary_contact_email: string | null
          short_name: string | null
          ticker: string | null
          updated_at: string | null
          website: string | null
        }
        Insert: {
          accounts?: Json | null
          branding_id?: number | null
          company_name?: string | null
          created_at?: string | null
          description?: string | null
          id: string
          industry?: string | null
          is_active?: boolean | null
          meetings?: Json | null
          primary_contact?: string | null
          primary_contact_email?: string | null
          short_name?: string | null
          ticker?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          accounts?: Json | null
          branding_id?: number | null
          company_name?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          industry?: string | null
          is_active?: boolean | null
          meetings?: Json | null
          primary_contact?: string | null
          primary_contact_email?: string | null
          short_name?: string | null
          ticker?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Relationships: []
      }
      comment: {
        Row: {
          comment: string | null
          created_at: string | null
          document: string | null
          document_id: string | null
          first_name: string | null
          id: number | null
          last_name: string | null
          user: string | null
          user_id: string | null
        }
        Insert: {
          comment?: string | null
          created_at?: string | null
          document?: string | null
          document_id?: string | null
          first_name?: string | null
          id?: number | null
          last_name?: string | null
          user?: string | null
          user_id?: string | null
        }
        Update: {
          comment?: string | null
          created_at?: string | null
          document?: string | null
          document_id?: string | null
          first_name?: string | null
          id?: number | null
          last_name?: string | null
          user?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      create_account_request: {
        Row: {
          client_id: string
          name: string
          primary_contact: string
        }
        Insert: {
          client_id: string
          name: string
          primary_contact: string
        }
        Update: {
          client_id?: string
          name?: string
          primary_contact?: string
        }
        Relationships: []
      }
      create_account_user_request: {
        Row: {
          email: string
          first_name: string
          last_name: string
          password: string
          type: string
          username: string
        }
        Insert: {
          email: string
          first_name: string
          last_name: string
          password: string
          type: string
          username: string
        }
        Update: {
          email?: string
          first_name?: string
          last_name?: string
          password?: string
          type?: string
          username?: string
        }
        Relationships: []
      }
      create_client_request: {
        Row: {
          branding_id: number | null
          company_name: string
          description: string | null
          industry: string | null
          is_active: boolean | null
          primary_contact: string | null
          primary_contact_email: string | null
          short_name: string
          ticker: string
          website: string | null
        }
        Insert: {
          branding_id?: number | null
          company_name: string
          description?: string | null
          industry?: string | null
          is_active?: boolean | null
          primary_contact?: string | null
          primary_contact_email?: string | null
          short_name: string
          ticker: string
          website?: string | null
        }
        Update: {
          branding_id?: number | null
          company_name?: string
          description?: string | null
          industry?: string | null
          is_active?: boolean | null
          primary_contact?: string | null
          primary_contact_email?: string | null
          short_name?: string
          ticker?: string
          website?: string | null
        }
        Relationships: []
      }
      create_comment_request: {
        Row: {
          comment: string
        }
        Insert: {
          comment: string
        }
        Update: {
          comment?: string
        }
        Relationships: []
      }
      create_digital_shareholder_meeting_request: {
        Row: {
          email_address: string
          first_name: string
          last_name: string
          minutes_attended_meeting: number | null
          registrant_type: Database["public"]["Enums"]["create_digital_shareholder_meeting_request_registrant_type"]
          registration_questions: string | null
        }
        Insert: {
          email_address: string
          first_name: string
          last_name: string
          minutes_attended_meeting?: number | null
          registrant_type: Database["public"]["Enums"]["create_digital_shareholder_meeting_request_registrant_type"]
          registration_questions?: string | null
        }
        Update: {
          email_address?: string
          first_name?: string
          last_name?: string
          minutes_attended_meeting?: number | null
          registrant_type?: Database["public"]["Enums"]["create_digital_shareholder_meeting_request_registrant_type"]
          registration_questions?: string | null
        }
        Relationships: []
      }
      create_meeting_request: {
        Row: {
          client_id: string
          cusip: string
          distribution_type: string
          employee_stock_plans: string | null
          id: string
          ivr_dial_in_number: string | null
          mailing_date: string
          meeting_date: string
          meeting_type: string
          meeting_year: number
          plan_administrator: string | null
          plan_administrator_contact: string | null
          plan_administrator_contact_email: string | null
          quorum_requirement: number
          record_date: string
          solicitor: string | null
          solicitor_email: string | null
          ticker: string
          title: string
          total_shares_outstanding: string
          transfer_agent: string
        }
        Insert: {
          client_id: string
          cusip: string
          distribution_type: string
          employee_stock_plans?: string | null
          id: string
          ivr_dial_in_number?: string | null
          mailing_date: string
          meeting_date: string
          meeting_type: string
          meeting_year: number
          plan_administrator?: string | null
          plan_administrator_contact?: string | null
          plan_administrator_contact_email?: string | null
          quorum_requirement: number
          record_date: string
          solicitor?: string | null
          solicitor_email?: string | null
          ticker: string
          title: string
          total_shares_outstanding: string
          transfer_agent: string
        }
        Update: {
          client_id?: string
          cusip?: string
          distribution_type?: string
          employee_stock_plans?: string | null
          id?: string
          ivr_dial_in_number?: string | null
          mailing_date?: string
          meeting_date?: string
          meeting_type?: string
          meeting_year?: number
          plan_administrator?: string | null
          plan_administrator_contact?: string | null
          plan_administrator_contact_email?: string | null
          quorum_requirement?: number
          record_date?: string
          solicitor?: string | null
          solicitor_email?: string | null
          ticker?: string
          title?: string
          total_shares_outstanding?: string
          transfer_agent?: string
        }
        Relationships: []
      }
      create_phase_request: {
        Row: {
          key_dates: string | null
          name: string
          order_index: number
        }
        Insert: {
          key_dates?: string | null
          name: string
          order_index: number
        }
        Update: {
          key_dates?: string | null
          name?: string
          order_index?: number
        }
        Relationships: []
      }
      create_phase_request_key_dates: {
        Row: {
          due_date: string | null
          end_date: string | null
          start_date: string | null
        }
        Insert: {
          due_date?: string | null
          end_date?: string | null
          start_date?: string | null
        }
        Update: {
          due_date?: string | null
          end_date?: string | null
          start_date?: string | null
        }
        Relationships: []
      }
      create_position_request: {
        Row: {
          account_number: string | null
          account_type: string
          control_number: string | null
          cusip: string
          date_voted: string | null
          meeting_id: string
          name: string
          set_key: string
          shares: number
          shares_voted: number | null
          source:
            | Database["public"]["Enums"]["create_position_request_source"]
            | null
          vote_status: Database["public"]["Enums"]["create_position_request_vote_status"]
        }
        Insert: {
          account_number?: string | null
          account_type: string
          control_number?: string | null
          cusip: string
          date_voted?: string | null
          meeting_id: string
          name: string
          set_key: string
          shares: number
          shares_voted?: number | null
          source?:
            | Database["public"]["Enums"]["create_position_request_source"]
            | null
          vote_status: Database["public"]["Enums"]["create_position_request_vote_status"]
        }
        Update: {
          account_number?: string | null
          account_type?: string
          control_number?: string | null
          cusip?: string
          date_voted?: string | null
          meeting_id?: string
          name?: string
          set_key?: string
          shares?: number
          shares_voted?: number | null
          source?:
            | Database["public"]["Enums"]["create_position_request_source"]
            | null
          vote_status?: Database["public"]["Enums"]["create_position_request_vote_status"]
        }
        Relationships: []
      }
      create_proposal_request: {
        Row: {
          director_class: string | null
          director_name: string | null
          director_term_years: number | null
          frequency_options: Json | null
          proposal_number: number
          proposal_subtype: string | null
          proposal_title: string
          proposal_type: string
          recommendation: string
          term_expiration_year: number | null
        }
        Insert: {
          director_class?: string | null
          director_name?: string | null
          director_term_years?: number | null
          frequency_options?: Json | null
          proposal_number: number
          proposal_subtype?: string | null
          proposal_title: string
          proposal_type: string
          recommendation: string
          term_expiration_year?: number | null
        }
        Update: {
          director_class?: string | null
          director_name?: string | null
          director_term_years?: number | null
          frequency_options?: Json | null
          proposal_number?: number
          proposal_subtype?: string | null
          proposal_title?: string
          proposal_type?: string
          recommendation?: string
          term_expiration_year?: number | null
        }
        Relationships: []
      }
      create_task_request: {
        Row: {
          description: string | null
          document_id: string | null
          due_date: string | null
          links: Json | null
          owner: string
          phase_id: string
          phase_number: number
          task_id: string
          title: string
          type: string
        }
        Insert: {
          description?: string | null
          document_id?: string | null
          due_date?: string | null
          links?: Json | null
          owner: string
          phase_id: string
          phase_number: number
          task_id: string
          title: string
          type: string
        }
        Update: {
          description?: string | null
          document_id?: string | null
          due_date?: string | null
          links?: Json | null
          owner?: string
          phase_id?: string
          phase_number?: number
          task_id?: string
          title?: string
          type?: string
        }
        Relationships: []
      }
      create_user_request: {
        Row: {
          account_id: string | null
          email: string
          first_name: string
          last_name: string
          password: string
          type: string
          username: string
        }
        Insert: {
          account_id?: string | null
          email: string
          first_name: string
          last_name: string
          password: string
          type: string
          username: string
        }
        Update: {
          account_id?: string | null
          email?: string
          first_name?: string
          last_name?: string
          password?: string
          type?: string
          username?: string
        }
        Relationships: []
      }
      digital_shareholder_meeting: {
        Row: {
          created_at: string | null
          email_address: string | null
          first_name: string | null
          id: string | null
          last_name: string | null
          meeting_id: string | null
          minutes_attended_meeting: number | null
          registrant_type:
            | Database["public"]["Enums"]["digital_shareholder_meeting_registrant_type"]
            | null
          registration_questions: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email_address?: string | null
          first_name?: string | null
          id?: string | null
          last_name?: string | null
          meeting_id?: string | null
          minutes_attended_meeting?: number | null
          registrant_type?:
            | Database["public"]["Enums"]["digital_shareholder_meeting_registrant_type"]
            | null
          registration_questions?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email_address?: string | null
          first_name?: string | null
          id?: string | null
          last_name?: string | null
          meeting_id?: string | null
          minutes_attended_meeting?: number | null
          registrant_type?:
            | Database["public"]["Enums"]["digital_shareholder_meeting_registrant_type"]
            | null
          registration_questions?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      document: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          authorized_date: string | null
          comments: Json | null
          completed_date: string | null
          created_at: string | null
          deadline: string | null
          description: string | null
          display_category:
            | Database["public"]["Enums"]["document_display_category"]
            | null
          file_path: string | null
          file_size: number | null
          file_type: string | null
          history: Json | null
          id: string
          in_progress_date: string | null
          meeting: string | null
          meeting_id: string | null
          signatures: Json | null
          signed_date: string | null
          status: string | null
          task_id: string | null
          title: string | null
          type: string | null
          updated_at: string | null
          upload_date: string | null
          uploaded_date: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          authorized_date?: string | null
          comments?: Json | null
          completed_date?: string | null
          created_at?: string | null
          deadline?: string | null
          description?: string | null
          display_category?:
            | Database["public"]["Enums"]["document_display_category"]
            | null
          file_path?: string | null
          file_size?: number | null
          file_type?: string | null
          history?: Json | null
          id: string
          in_progress_date?: string | null
          meeting?: string | null
          meeting_id?: string | null
          signatures?: Json | null
          signed_date?: string | null
          status?: string | null
          task_id?: string | null
          title?: string | null
          type?: string | null
          updated_at?: string | null
          upload_date?: string | null
          uploaded_date?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          authorized_date?: string | null
          comments?: Json | null
          completed_date?: string | null
          created_at?: string | null
          deadline?: string | null
          description?: string | null
          display_category?:
            | Database["public"]["Enums"]["document_display_category"]
            | null
          file_path?: string | null
          file_size?: number | null
          file_type?: string | null
          history?: Json | null
          id?: string
          in_progress_date?: string | null
          meeting?: string | null
          meeting_id?: string | null
          signatures?: Json | null
          signed_date?: string | null
          status?: string | null
          task_id?: string | null
          title?: string | null
          type?: string | null
          updated_at?: string | null
          upload_date?: string | null
          uploaded_date?: string | null
        }
        Relationships: []
      }
      document_history: {
        Row: {
          created_at: string | null
          document: string | null
          document_id: string | null
          event_type: Database["public"]["Enums"]["document_history_event_type"]
          id: string | null
          metadata: Json | null
          user: string | null
          user_id: string | null
          user_name: string | null
        }
        Insert: {
          created_at?: string | null
          document?: string | null
          document_id?: string | null
          event_type?: Database["public"]["Enums"]["document_history_event_type"]
          id?: string | null
          metadata?: Json | null
          user?: string | null
          user_id?: string | null
          user_name?: string | null
        }
        Update: {
          created_at?: string | null
          document?: string | null
          document_id?: string | null
          event_type?: Database["public"]["Enums"]["document_history_event_type"]
          id?: string | null
          metadata?: Json | null
          user?: string | null
          user_id?: string | null
          user_name?: string | null
        }
        Relationships: []
      }
      dsm_config: {
        Row: {
          audio_only: boolean | null
          created_at: string | null
          display_docs_doc_id: string | null
          dry_run_date: string | null
          dry_run_notes: string | null
          dry_run_scheduled: boolean | null
          id: string
          is_confirmed: boolean | null
          live_qa: boolean | null
          logistics_call_date: string | null
          logistics_call_notes: string | null
          logistics_call_scheduled: boolean | null
          meeting_id: string | null
          meeting_recording: boolean | null
          static_slide_doc_id: string | null
          updated_at: string | null
        }
        Insert: {
          audio_only?: boolean | null
          created_at?: string | null
          display_docs_doc_id?: string | null
          dry_run_date?: string | null
          dry_run_notes?: string | null
          dry_run_scheduled?: boolean | null
          id: string
          is_confirmed?: boolean | null
          live_qa?: boolean | null
          logistics_call_date?: string | null
          logistics_call_notes?: string | null
          logistics_call_scheduled?: boolean | null
          meeting_id?: string | null
          meeting_recording?: boolean | null
          static_slide_doc_id?: string | null
          updated_at?: string | null
        }
        Update: {
          audio_only?: boolean | null
          created_at?: string | null
          display_docs_doc_id?: string | null
          dry_run_date?: string | null
          dry_run_notes?: string | null
          dry_run_scheduled?: boolean | null
          id?: string
          is_confirmed?: boolean | null
          live_qa?: boolean | null
          logistics_call_date?: string | null
          logistics_call_notes?: string | null
          logistics_call_scheduled?: boolean | null
          meeting_id?: string | null
          meeting_recording?: boolean | null
          static_slide_doc_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      error: {
        Row: {
          code: string | null
          details: Json | null
          message: string | null
        }
        Insert: {
          code?: string | null
          details?: Json | null
          message?: string | null
        }
        Update: {
          code?: string | null
          details?: Json | null
          message?: string | null
        }
        Relationships: []
      }
      get_documents_readiness_200_response: {
        Row: {
          outstanding_phase1: Json | null
          outstanding_phase2: Json | null
          overall_ready: boolean | null
          phase1_ready: boolean | null
          phase2_ready: boolean | null
        }
        Insert: {
          outstanding_phase1?: Json | null
          outstanding_phase2?: Json | null
          overall_ready?: boolean | null
          phase1_ready?: boolean | null
          phase2_ready?: boolean | null
        }
        Update: {
          outstanding_phase1?: Json | null
          outstanding_phase2?: Json | null
          overall_ready?: boolean | null
          phase1_ready?: boolean | null
          phase2_ready?: boolean | null
        }
        Relationships: []
      }
      list_account_users_200_response: {
        Row: {
          pagination: string | null
          users: Json | null
        }
        Insert: {
          pagination?: string | null
          users?: Json | null
        }
        Update: {
          pagination?: string | null
          users?: Json | null
        }
        Relationships: []
      }
      list_accounts_200_response: {
        Row: {
          accounts: Json | null
          pagination: string | null
        }
        Insert: {
          accounts?: Json | null
          pagination?: string | null
        }
        Update: {
          accounts?: Json | null
          pagination?: string | null
        }
        Relationships: []
      }
      list_clients_200_response: {
        Row: {
          clients: Json | null
          pagination: string | null
        }
        Insert: {
          clients?: Json | null
          pagination?: string | null
        }
        Update: {
          clients?: Json | null
          pagination?: string | null
        }
        Relationships: []
      }
      list_meetings_200_response: {
        Row: {
          meetings: Json | null
          pagination: string | null
        }
        Insert: {
          meetings?: Json | null
          pagination?: string | null
        }
        Update: {
          meetings?: Json | null
          pagination?: string | null
        }
        Relationships: []
      }
      list_notifications_200_response: {
        Row: {
          data: Json | null
          pagination: string | null
        }
        Insert: {
          data?: Json | null
          pagination?: string | null
        }
        Update: {
          data?: Json | null
          pagination?: string | null
        }
        Relationships: []
      }
      list_user_accounts_200_response: {
        Row: {
          accounts: Json
          total: number
        }
        Insert: {
          accounts: Json
          total: number
        }
        Update: {
          accounts?: Json
          total?: number
        }
        Relationships: []
      }
      login_user_200_response: {
        Row: {
          token: string | null
          user: string | null
        }
        Insert: {
          token?: string | null
          user?: string | null
        }
        Update: {
          token?: string | null
          user?: string | null
        }
        Relationships: []
      }
      login_user_request: {
        Row: {
          password: string
          username: string
        }
        Insert: {
          password: string
          username: string
        }
        Update: {
          password?: string
          username?: string
        }
        Relationships: []
      }
      logout_user_200_response: {
        Row: {
          message: string | null
        }
        Insert: {
          message?: string | null
        }
        Update: {
          message?: string | null
        }
        Relationships: []
      }
      mailing: {
        Row: {
          canceled_suppressed_positions: number | null
          consolidated_suppressed_positions: number | null
          courtesy_other_mail_positions: number | null
          created_at: string | null
          electronic_suppressed_positions: number | null
          fullset_mail_positions: number | null
          household_suppressed_positions: number | null
          id: string | null
          managed_suppressed_positions: number | null
          meeting_id: string | null
          naa_mail_positions: number | null
          ticker: string | null
          total_accounts: number | null
          total_positions: number | null
          total_retransmissions: number | null
          total_rollups: number | null
          updated_at: string | null
        }
        Insert: {
          canceled_suppressed_positions?: number | null
          consolidated_suppressed_positions?: number | null
          courtesy_other_mail_positions?: number | null
          created_at?: string | null
          electronic_suppressed_positions?: number | null
          fullset_mail_positions?: number | null
          household_suppressed_positions?: number | null
          id?: string | null
          managed_suppressed_positions?: number | null
          meeting_id?: string | null
          naa_mail_positions?: number | null
          ticker?: string | null
          total_accounts?: number | null
          total_positions?: number | null
          total_retransmissions?: number | null
          total_rollups?: number | null
          updated_at?: string | null
        }
        Update: {
          canceled_suppressed_positions?: number | null
          consolidated_suppressed_positions?: number | null
          courtesy_other_mail_positions?: number | null
          created_at?: string | null
          electronic_suppressed_positions?: number | null
          fullset_mail_positions?: number | null
          household_suppressed_positions?: number | null
          id?: string | null
          managed_suppressed_positions?: number | null
          meeting_id?: string | null
          naa_mail_positions?: number | null
          ticker?: string | null
          total_accounts?: number | null
          total_positions?: number | null
          total_retransmissions?: number | null
          total_rollups?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      meeting: {
        Row: {
          broker_search_date: string | null
          client: string | null
          client_id: string | null
          created_at: string | null
          current_phase: string | null
          cusip: string | null
          distribution_type: string | null
          employee_stock_plans: string | null
          filing_date: string | null
          id: string
          inspector: string | null
          ivr_dial_in_number: string | null
          mailing_date: string | null
          meeting_date: string | null
          meeting_type: string | null
          meeting_year: number | null
          overall_completion: number | null
          plan_administrator: string | null
          plan_administrator_contact: string | null
          plan_administrator_contact_email: string | null
          pre_filing_date: string | null
          quorum_requirement: number | null
          record_date: string | null
          solicitor: string | null
          solicitor_email: string | null
          status: string | null
          ticker: string | null
          title: string | null
          total_shares_outstanding: string | null
          transfer_agent: string | null
          updated_at: string | null
        }
        Insert: {
          broker_search_date?: string | null
          client?: string | null
          client_id?: string | null
          created_at?: string | null
          current_phase?: string | null
          cusip?: string | null
          distribution_type?: string | null
          employee_stock_plans?: string | null
          filing_date?: string | null
          id: string
          inspector?: string | null
          ivr_dial_in_number?: string | null
          mailing_date?: string | null
          meeting_date?: string | null
          meeting_type?: string | null
          meeting_year?: number | null
          overall_completion?: number | null
          plan_administrator?: string | null
          plan_administrator_contact?: string | null
          plan_administrator_contact_email?: string | null
          pre_filing_date?: string | null
          quorum_requirement?: number | null
          record_date?: string | null
          solicitor?: string | null
          solicitor_email?: string | null
          status?: string | null
          ticker?: string | null
          title?: string | null
          total_shares_outstanding?: string | null
          transfer_agent?: string | null
          updated_at?: string | null
        }
        Update: {
          broker_search_date?: string | null
          client?: string | null
          client_id?: string | null
          created_at?: string | null
          current_phase?: string | null
          cusip?: string | null
          distribution_type?: string | null
          employee_stock_plans?: string | null
          filing_date?: string | null
          id?: string
          inspector?: string | null
          ivr_dial_in_number?: string | null
          mailing_date?: string | null
          meeting_date?: string | null
          meeting_type?: string | null
          meeting_year?: number | null
          overall_completion?: number | null
          plan_administrator?: string | null
          plan_administrator_contact?: string | null
          plan_administrator_contact_email?: string | null
          pre_filing_date?: string | null
          quorum_requirement?: number | null
          record_date?: string | null
          solicitor?: string | null
          solicitor_email?: string | null
          status?: string | null
          ticker?: string | null
          title?: string | null
          total_shares_outstanding?: string | null
          transfer_agent?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      notification: {
        Row: {
          action_url: string | null
          created_at: string | null
          expires_at: string | null
          id: string | null
          meeting_id: string | null
          message: string | null
          priority: Database["public"]["Enums"]["notification_priority"] | null
          read: boolean | null
          read_at: string | null
          task_id: string | null
          title: string | null
          type: Database["public"]["Enums"]["notification_type"] | null
          user_id: string | null
        }
        Insert: {
          action_url?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string | null
          meeting_id?: string | null
          message?: string | null
          priority?: Database["public"]["Enums"]["notification_priority"] | null
          read?: boolean | null
          read_at?: string | null
          task_id?: string | null
          title?: string | null
          type?: Database["public"]["Enums"]["notification_type"] | null
          user_id?: string | null
        }
        Update: {
          action_url?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string | null
          meeting_id?: string | null
          message?: string | null
          priority?: Database["public"]["Enums"]["notification_priority"] | null
          read?: boolean | null
          read_at?: string | null
          task_id?: string | null
          title?: string | null
          type?: Database["public"]["Enums"]["notification_type"] | null
          user_id?: string | null
        }
        Relationships: []
      }
      pagination: {
        Row: {
          limit: number | null
          page: number | null
          pages: number | null
          total: number | null
        }
        Insert: {
          limit?: number | null
          page?: number | null
          pages?: number | null
          total?: number | null
        }
        Update: {
          limit?: number | null
          page?: number | null
          pages?: number | null
          total?: number | null
        }
        Relationships: []
      }
      phase: {
        Row: {
          created_at: string | null
          id: string
          key_dates: string | null
          meeting_id: string | null
          name: string | null
          order_index: number | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id: string
          key_dates?: string | null
          meeting_id?: string | null
          name?: string | null
          order_index?: number | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          key_dates?: string | null
          meeting_id?: string | null
          name?: string | null
          order_index?: number | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      phase_key_dates: {
        Row: {
          completion_date: string | null
          due_date: string | null
          end_date: string | null
          start_date: string | null
        }
        Insert: {
          completion_date?: string | null
          due_date?: string | null
          end_date?: string | null
          start_date?: string | null
        }
        Update: {
          completion_date?: string | null
          due_date?: string | null
          end_date?: string | null
          start_date?: string | null
        }
        Relationships: []
      }
      position: {
        Row: {
          account_number: string | null
          account_type: string | null
          control_number: string | null
          created_at: string | null
          cusip: string | null
          date_voted: string | null
          id: string
          meeting_id: string | null
          name: string | null
          set_key: string | null
          shares: number | null
          shares_voted: number | null
          source: Database["public"]["Enums"]["position_source"] | null
          updated_at: string | null
          vote_status:
            | Database["public"]["Enums"]["position_vote_status"]
            | null
        }
        Insert: {
          account_number?: string | null
          account_type?: string | null
          control_number?: string | null
          created_at?: string | null
          cusip?: string | null
          date_voted?: string | null
          id: string
          meeting_id?: string | null
          name?: string | null
          set_key?: string | null
          shares?: number | null
          shares_voted?: number | null
          source?: Database["public"]["Enums"]["position_source"] | null
          updated_at?: string | null
          vote_status?:
            | Database["public"]["Enums"]["position_vote_status"]
            | null
        }
        Update: {
          account_number?: string | null
          account_type?: string | null
          control_number?: string | null
          created_at?: string | null
          cusip?: string | null
          date_voted?: string | null
          id?: string
          meeting_id?: string | null
          name?: string | null
          set_key?: string | null
          shares?: number | null
          shares_voted?: number | null
          source?: Database["public"]["Enums"]["position_source"] | null
          updated_at?: string | null
          vote_status?:
            | Database["public"]["Enums"]["position_vote_status"]
            | null
        }
        Relationships: []
      }
      position_vote: {
        Row: {
          created_at: string | null
          id: string | null
          position_id: string | null
          proposal_id: string | null
          shares_voting: string | null
          vote: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string | null
          position_id?: string | null
          proposal_id?: string | null
          shares_voting?: string | null
          vote?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string | null
          position_id?: string | null
          proposal_id?: string | null
          shares_voting?: string | null
          vote?: string | null
        }
        Relationships: []
      }
      proposal: {
        Row: {
          abstain_percentage: number | null
          against_percentage: number | null
          created_at: string | null
          director_class: string | null
          director_name: string | null
          director_term_years: number | null
          final_result:
            | Database["public"]["Enums"]["proposal_final_result"]
            | null
          for_percentage: number | null
          frequency_options: Json | null
          id: string
          meeting_id: string | null
          participation_rate: number | null
          proposal_number: number | null
          proposal_subtype: string | null
          proposal_title: string | null
          proposal_type: string | null
          recommendation: string | null
          term_expiration_year: number | null
          total_shares_eligible: number | null
          total_votes_abstain: number | null
          total_votes_against: number | null
          total_votes_for: number | null
          updated_at: string | null
          voting_completed: boolean | null
          voting_completed_at: string | null
        }
        Insert: {
          abstain_percentage?: number | null
          against_percentage?: number | null
          created_at?: string | null
          director_class?: string | null
          director_name?: string | null
          director_term_years?: number | null
          final_result?:
            | Database["public"]["Enums"]["proposal_final_result"]
            | null
          for_percentage?: number | null
          frequency_options?: Json | null
          id: string
          meeting_id?: string | null
          participation_rate?: number | null
          proposal_number?: number | null
          proposal_subtype?: string | null
          proposal_title?: string | null
          proposal_type?: string | null
          recommendation?: string | null
          term_expiration_year?: number | null
          total_shares_eligible?: number | null
          total_votes_abstain?: number | null
          total_votes_against?: number | null
          total_votes_for?: number | null
          updated_at?: string | null
          voting_completed?: boolean | null
          voting_completed_at?: string | null
        }
        Update: {
          abstain_percentage?: number | null
          against_percentage?: number | null
          created_at?: string | null
          director_class?: string | null
          director_name?: string | null
          director_term_years?: number | null
          final_result?:
            | Database["public"]["Enums"]["proposal_final_result"]
            | null
          for_percentage?: number | null
          frequency_options?: Json | null
          id?: string
          meeting_id?: string | null
          participation_rate?: number | null
          proposal_number?: number | null
          proposal_subtype?: string | null
          proposal_title?: string | null
          proposal_type?: string | null
          recommendation?: string | null
          term_expiration_year?: number | null
          total_shares_eligible?: number | null
          total_votes_abstain?: number | null
          total_votes_against?: number | null
          total_votes_for?: number | null
          updated_at?: string | null
          voting_completed?: boolean | null
          voting_completed_at?: string | null
        }
        Relationships: []
      }
      sign_form_digital_request: {
        Row: {
          meeting_id: string
          replace_existing: boolean | null
          signature_reason: string | null
          signer_user_id: string
        }
        Insert: {
          meeting_id: string
          replace_existing?: boolean | null
          signature_reason?: string | null
          signer_user_id: string
        }
        Update: {
          meeting_id?: string
          replace_existing?: boolean | null
          signature_reason?: string | null
          signer_user_id?: string
        }
        Relationships: []
      }
      signature: {
        Row: {
          created_at: string | null
          document: string | null
          document_id: string | null
          height: number | null
          id: string | null
          page_number: number | null
          required: boolean | null
          signature_type: string | null
          updated_at: string | null
          width: number | null
          x_position: number | null
          y_position: number | null
        }
        Insert: {
          created_at?: string | null
          document?: string | null
          document_id?: string | null
          height?: number | null
          id?: string | null
          page_number?: number | null
          required?: boolean | null
          signature_type?: string | null
          updated_at?: string | null
          width?: number | null
          x_position?: number | null
          y_position?: number | null
        }
        Update: {
          created_at?: string | null
          document?: string | null
          document_id?: string | null
          height?: number | null
          id?: string | null
          page_number?: number | null
          required?: boolean | null
          signature_type?: string | null
          updated_at?: string | null
          width?: number | null
          x_position?: number | null
          y_position?: number | null
        }
        Relationships: []
      }
      tabulation_report: {
        Row: {
          broker_voting: Json | null
          created_at: string | null
          dtc_vote_status: Json | null
          id: string
          last_calculated_at: string | null
          meeting_id: string
          non_dtc_vote_status: Json | null
          positions_voted: Json | null
          set_keys: string[] | null
          share_range_performance: Json | null
          updated_at: string | null
          vote_distribution: Json | null
        }
        Insert: {
          broker_voting?: Json | null
          created_at?: string | null
          dtc_vote_status?: Json | null
          id?: string
          last_calculated_at?: string | null
          meeting_id: string
          non_dtc_vote_status?: Json | null
          positions_voted?: Json | null
          set_keys?: string[] | null
          share_range_performance?: Json | null
          updated_at?: string | null
          vote_distribution?: Json | null
        }
        Update: {
          broker_voting?: Json | null
          created_at?: string | null
          dtc_vote_status?: Json | null
          id?: string
          last_calculated_at?: string | null
          meeting_id?: string
          non_dtc_vote_status?: Json | null
          positions_voted?: Json | null
          set_keys?: string[] | null
          share_range_performance?: Json | null
          updated_at?: string | null
          vote_distribution?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_tabulation_report_meeting"
            columns: ["meeting_id"]
            isOneToOne: true
            referencedRelation: "meeting"
            referencedColumns: ["id"]
          },
        ]
      }
      tabulation_report_broker_voting_inner: {
        Row: {
          broker: string | null
          shares_abstain: number | null
          shares_against: number | null
          shares_for: number | null
        }
        Insert: {
          broker?: string | null
          shares_abstain?: number | null
          shares_against?: number | null
          shares_for?: number | null
        }
        Update: {
          broker?: string | null
          shares_abstain?: number | null
          shares_against?: number | null
          shares_for?: number | null
        }
        Relationships: []
      }
      tabulation_report_non_dtc_vote_status: {
        Row: {
          grand_total_shareholders: number | null
          grand_total_shares: number | null
          ivr_shareholders: number | null
          ivr_shares: number | null
          print_shareholders: number | null
          print_shares: number | null
          unvoted_shareholders: number | null
          unvoted_shares: number | null
          voted_subtotal_shareholders: number | null
          voted_subtotal_shares: number | null
          web_shareholders: number | null
          web_shares: number | null
        }
        Insert: {
          grand_total_shareholders?: number | null
          grand_total_shares?: number | null
          ivr_shareholders?: number | null
          ivr_shares?: number | null
          print_shareholders?: number | null
          print_shares?: number | null
          unvoted_shareholders?: number | null
          unvoted_shares?: number | null
          voted_subtotal_shareholders?: number | null
          voted_subtotal_shares?: number | null
          web_shareholders?: number | null
          web_shares?: number | null
        }
        Update: {
          grand_total_shareholders?: number | null
          grand_total_shares?: number | null
          ivr_shareholders?: number | null
          ivr_shares?: number | null
          print_shareholders?: number | null
          print_shares?: number | null
          unvoted_shareholders?: number | null
          unvoted_shares?: number | null
          voted_subtotal_shareholders?: number | null
          voted_subtotal_shares?: number | null
          web_shareholders?: number | null
          web_shares?: number | null
        }
        Relationships: []
      }
      tabulation_report_share_range_performance_inner: {
        Row: {
          percent_voted: number | null
          position_count: number | null
          range_label: string | null
          total_shares: number | null
        }
        Insert: {
          percent_voted?: number | null
          position_count?: number | null
          range_label?: string | null
          total_shares?: number | null
        }
        Update: {
          percent_voted?: number | null
          position_count?: number | null
          range_label?: string | null
          total_shares?: number | null
        }
        Relationships: []
      }
      task: {
        Row: {
          created_at: string | null
          description: string | null
          document_id: string | null
          due_date: string | null
          id: string
          links: Json | null
          meeting_id: string | null
          owner: string | null
          phase_id: string | null
          phase_number: number | null
          status: string | null
          task_id: string | null
          title: string | null
          type: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          document_id?: string | null
          due_date?: string | null
          id: string
          links?: Json | null
          meeting_id?: string | null
          owner?: string | null
          phase_id?: string | null
          phase_number?: number | null
          status?: string | null
          task_id?: string | null
          title?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          document_id?: string | null
          due_date?: string | null
          id?: string
          links?: Json | null
          meeting_id?: string | null
          owner?: string | null
          phase_id?: string | null
          phase_number?: number | null
          status?: string | null
          task_id?: string | null
          title?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      update_account_request: {
        Row: {
          client_id: string | null
          name: string | null
          primary_contact: string | null
        }
        Insert: {
          client_id?: string | null
          name?: string | null
          primary_contact?: string | null
        }
        Update: {
          client_id?: string | null
          name?: string | null
          primary_contact?: string | null
        }
        Relationships: []
      }
      update_client_request: {
        Row: {
          branding_id: number | null
          company_name: string | null
          description: string | null
          industry: string | null
          is_active: boolean | null
          primary_contact: string | null
          primary_contact_email: string | null
          short_name: string | null
          website: string | null
        }
        Insert: {
          branding_id?: number | null
          company_name?: string | null
          description?: string | null
          industry?: string | null
          is_active?: boolean | null
          primary_contact?: string | null
          primary_contact_email?: string | null
          short_name?: string | null
          website?: string | null
        }
        Update: {
          branding_id?: number | null
          company_name?: string | null
          description?: string | null
          industry?: string | null
          is_active?: boolean | null
          primary_contact?: string | null
          primary_contact_email?: string | null
          short_name?: string | null
          website?: string | null
        }
        Relationships: []
      }
      update_document_request: {
        Row: {
          description: string | null
          status: string | null
          title: string | null
        }
        Insert: {
          description?: string | null
          status?: string | null
          title?: string | null
        }
        Update: {
          description?: string | null
          status?: string | null
          title?: string | null
        }
        Relationships: []
      }
      update_meeting_request: {
        Row: {
          current_phase: string | null
          distribution_type: string | null
          employee_stock_plans: string | null
          ivr_dial_in_number: string | null
          mailing_date: string | null
          meeting_date: string | null
          meeting_type: string | null
          overall_completion: number | null
          plan_administrator: string | null
          plan_administrator_contact: string | null
          plan_administrator_contact_email: string | null
          quorum_requirement: number | null
          record_date: string | null
          solicitor: string | null
          solicitor_email: string | null
          status: string | null
          title: string | null
          total_shares_outstanding: string | null
          transfer_agent: string | null
        }
        Insert: {
          current_phase?: string | null
          distribution_type?: string | null
          employee_stock_plans?: string | null
          ivr_dial_in_number?: string | null
          mailing_date?: string | null
          meeting_date?: string | null
          meeting_type?: string | null
          overall_completion?: number | null
          plan_administrator?: string | null
          plan_administrator_contact?: string | null
          plan_administrator_contact_email?: string | null
          quorum_requirement?: number | null
          record_date?: string | null
          solicitor?: string | null
          solicitor_email?: string | null
          status?: string | null
          title?: string | null
          total_shares_outstanding?: string | null
          transfer_agent?: string | null
        }
        Update: {
          current_phase?: string | null
          distribution_type?: string | null
          employee_stock_plans?: string | null
          ivr_dial_in_number?: string | null
          mailing_date?: string | null
          meeting_date?: string | null
          meeting_type?: string | null
          overall_completion?: number | null
          plan_administrator?: string | null
          plan_administrator_contact?: string | null
          plan_administrator_contact_email?: string | null
          quorum_requirement?: number | null
          record_date?: string | null
          solicitor?: string | null
          solicitor_email?: string | null
          status?: string | null
          title?: string | null
          total_shares_outstanding?: string | null
          transfer_agent?: string | null
        }
        Relationships: []
      }
      update_phase_request: {
        Row: {
          key_dates: string | null
          name: string | null
          order_index: number | null
          status: string | null
        }
        Insert: {
          key_dates?: string | null
          name?: string | null
          order_index?: number | null
          status?: string | null
        }
        Update: {
          key_dates?: string | null
          name?: string | null
          order_index?: number | null
          status?: string | null
        }
        Relationships: []
      }
      update_phase_request_key_dates: {
        Row: {
          completion_date: string | null
          due_date: string | null
          end_date: string | null
          start_date: string | null
        }
        Insert: {
          completion_date?: string | null
          due_date?: string | null
          end_date?: string | null
          start_date?: string | null
        }
        Update: {
          completion_date?: string | null
          due_date?: string | null
          end_date?: string | null
          start_date?: string | null
        }
        Relationships: []
      }
      update_position_request: {
        Row: {
          account_number: string | null
          control_number: string | null
          date_voted: string | null
          name: string | null
          shares: number | null
          shares_voted: number | null
          source:
            | Database["public"]["Enums"]["update_position_request_source"]
            | null
          vote_status:
            | Database["public"]["Enums"]["update_position_request_vote_status"]
            | null
        }
        Insert: {
          account_number?: string | null
          control_number?: string | null
          date_voted?: string | null
          name?: string | null
          shares?: number | null
          shares_voted?: number | null
          source?:
            | Database["public"]["Enums"]["update_position_request_source"]
            | null
          vote_status?:
            | Database["public"]["Enums"]["update_position_request_vote_status"]
            | null
        }
        Update: {
          account_number?: string | null
          control_number?: string | null
          date_voted?: string | null
          name?: string | null
          shares?: number | null
          shares_voted?: number | null
          source?:
            | Database["public"]["Enums"]["update_position_request_source"]
            | null
          vote_status?:
            | Database["public"]["Enums"]["update_position_request_vote_status"]
            | null
        }
        Relationships: []
      }
      update_proposal_request: {
        Row: {
          director_class: string | null
          director_name: string | null
          director_term_years: number | null
          frequency_options: Json | null
          proposal_subtype: string | null
          proposal_title: string | null
          proposal_type: string | null
          recommendation: string | null
          term_expiration_year: number | null
        }
        Insert: {
          director_class?: string | null
          director_name?: string | null
          director_term_years?: number | null
          frequency_options?: Json | null
          proposal_subtype?: string | null
          proposal_title?: string | null
          proposal_type?: string | null
          recommendation?: string | null
          term_expiration_year?: number | null
        }
        Update: {
          director_class?: string | null
          director_name?: string | null
          director_term_years?: number | null
          frequency_options?: Json | null
          proposal_subtype?: string | null
          proposal_title?: string | null
          proposal_type?: string | null
          recommendation?: string | null
          term_expiration_year?: number | null
        }
        Relationships: []
      }
      update_task_request: {
        Row: {
          description: string | null
          document_id: string | null
          due_date: string | null
          links: Json | null
          owner: string | null
          phase_number: number | null
          status: string | null
          title: string | null
          type: string | null
        }
        Insert: {
          description?: string | null
          document_id?: string | null
          due_date?: string | null
          links?: Json | null
          owner?: string | null
          phase_number?: number | null
          status?: string | null
          title?: string | null
          type?: string | null
        }
        Update: {
          description?: string | null
          document_id?: string | null
          due_date?: string | null
          links?: Json | null
          owner?: string | null
          phase_number?: number | null
          status?: string | null
          title?: string | null
          type?: string | null
        }
        Relationships: []
      }
      update_user_request: {
        Row: {
          account_id: string | null
          email: string | null
          first_name: string | null
          last_name: string | null
          type: string | null
        }
        Insert: {
          account_id?: string | null
          email?: string | null
          first_name?: string | null
          last_name?: string | null
          type?: string | null
        }
        Update: {
          account_id?: string | null
          email?: string | null
          first_name?: string | null
          last_name?: string | null
          type?: string | null
        }
        Relationships: []
      }
      user: {
        Row: {
          account: string | null
          account_id: string | null
          email: string | null
          first_name: string | null
          id: string
          last_name: string | null
          password: string | null
          type: string | null
          username: string | null
        }
        Insert: {
          account?: string | null
          account_id?: string | null
          email?: string | null
          first_name?: string | null
          id: string
          last_name?: string | null
          password?: string | null
          type?: string | null
          username?: string | null
        }
        Update: {
          account?: string | null
          account_id?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          password?: string | null
          type?: string | null
          username?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      add_document_event_request_event_type:
        | "CREATED"
        | "UPLOADED"
        | "VIEWED"
        | "DOWNLOADED"
        | "SIGNED"
        | "APPROVED"
        | "REJECTED"
        | "COMMENTED"
        | "UPDATED"
        | "DELETED"
      add_document_history_request_event_type:
        | "CREATED"
        | "UPLOADED"
        | "VIEWED"
        | "DOWNLOADED"
        | "SIGNED"
        | "APPROVED"
        | "REJECTED"
        | "COMMENTED"
        | "UPDATED"
        | "DELETED"
      cast_vote_request_vote: "FOR" | "AGAINST" | "ABSTAIN" | "WITHHOLD"
      create_digital_shareholder_meeting_request_registrant_type:
        | "Shareholder"
        | "Guest"
        | "Proxy"
        | "Other"
      create_position_request_source: "WEB" | "PRINT" | "IVR"
      create_position_request_vote_status: "Voted" | "Unvoted"
      digital_shareholder_meeting_registrant_type:
        | "Shareholder"
        | "Guest"
        | "Proxy"
        | "Other"
      document_display_category:
        | "general"
        | "dsm"
        | "proxy-materials"
        | "meeting-materials"
        | "post-meeting"
        | "internal"
      document_history_event_type:
        | "CREATED"
        | "UPLOADED"
        | "VIEWED"
        | "DOWNLOADED"
        | "SIGNED"
        | "APPROVED"
        | "REJECTED"
        | "COMMENTED"
        | "UPDATED"
        | "DELETED"
      notification_priority: "low" | "medium" | "high" | "critical"
      notification_type: "info" | "warning" | "error" | "success"
      position_source: "WEB" | "PRINT" | "IVR"
      position_vote_status: "Voted" | "Unvoted"
      proposal_final_result: "PASSED" | "FAILED" | "PENDING"
      update_position_request_source: "WEB" | "PRINT" | "IVR"
      update_position_request_vote_status: "Voted" | "Unvoted"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      add_document_event_request_event_type: [
        "CREATED",
        "UPLOADED",
        "VIEWED",
        "DOWNLOADED",
        "SIGNED",
        "APPROVED",
        "REJECTED",
        "COMMENTED",
        "UPDATED",
        "DELETED",
      ],
      add_document_history_request_event_type: [
        "CREATED",
        "UPLOADED",
        "VIEWED",
        "DOWNLOADED",
        "SIGNED",
        "APPROVED",
        "REJECTED",
        "COMMENTED",
        "UPDATED",
        "DELETED",
      ],
      cast_vote_request_vote: ["FOR", "AGAINST", "ABSTAIN", "WITHHOLD"],
      create_digital_shareholder_meeting_request_registrant_type: [
        "Shareholder",
        "Guest",
        "Proxy",
        "Other",
      ],
      create_position_request_source: ["WEB", "PRINT", "IVR"],
      create_position_request_vote_status: ["Voted", "Unvoted"],
      digital_shareholder_meeting_registrant_type: [
        "Shareholder",
        "Guest",
        "Proxy",
        "Other",
      ],
      document_display_category: [
        "general",
        "dsm",
        "proxy-materials",
        "meeting-materials",
        "post-meeting",
        "internal",
      ],
      document_history_event_type: [
        "CREATED",
        "UPLOADED",
        "VIEWED",
        "DOWNLOADED",
        "SIGNED",
        "APPROVED",
        "REJECTED",
        "COMMENTED",
        "UPDATED",
        "DELETED",
      ],
      notification_priority: ["low", "medium", "high", "critical"],
      notification_type: ["info", "warning", "error", "success"],
      position_source: ["WEB", "PRINT", "IVR"],
      position_vote_status: ["Voted", "Unvoted"],
      proposal_final_result: ["PASSED", "FAILED", "PENDING"],
      update_position_request_source: ["WEB", "PRINT", "IVR"],
      update_position_request_vote_status: ["Voted", "Unvoted"],
    },
  },
} as const

