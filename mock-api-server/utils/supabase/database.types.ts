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
          id: string | null
          name: string | null
          primary_contact: string | null
        }
        Insert: {
          client?: string | null
          client_id?: string | null
          created_at?: string | null
          id?: string | null
          name?: string | null
          primary_contact?: string | null
        }
        Update: {
          client?: string | null
          client_id?: string | null
          created_at?: string | null
          id?: string | null
          name?: string | null
          primary_contact?: string | null
        }
        Relationships: []
      }
      clients: {
        Row: {
          branding_id: number | null
          company_name: string | null
          created_at: string | null
          description: string | null
          id: string | null
          industry: string | null
          is_active: boolean | null
          primary_contact: string | null
          primary_contact_email: string | null
          short_name: string | null
          ticker: string | null
          updated_at: string | null
          website: string | null
        }
        Insert: {
          branding_id?: number | null
          company_name?: string | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          industry?: string | null
          is_active?: boolean | null
          primary_contact?: string | null
          primary_contact_email?: string | null
          short_name?: string | null
          ticker?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          branding_id?: number | null
          company_name?: string | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          industry?: string | null
          is_active?: boolean | null
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
            | Database['public']['Enums']['digital_shareholder_meeting_registrant_type']
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
            | Database['public']['Enums']['digital_shareholder_meeting_registrant_type']
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
            | Database['public']['Enums']['digital_shareholder_meeting_registrant_type']
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
          created_by: string | null
          created_by_first_name: string | null
          created_by_last_name: string | null
          deadline: string | null
          description: string | null
          display_category:
            | Database['public']['Enums']['document_display_category']
            | null
          file_path: string | null
          file_size: number | null
          file_type: string | null
          history: Json | null
          id: string | null
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
          updated_by: string | null
          updated_by_first_name: string | null
          updated_by_last_name: string | null
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
          created_by?: string | null
          created_by_first_name?: string | null
          created_by_last_name?: string | null
          deadline?: string | null
          description?: string | null
          display_category?:
            | Database['public']['Enums']['document_display_category']
            | null
          file_path?: string | null
          file_size?: number | null
          file_type?: string | null
          history?: Json | null
          id?: string | null
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
          updated_by?: string | null
          updated_by_first_name?: string | null
          updated_by_last_name?: string | null
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
          created_by?: string | null
          created_by_first_name?: string | null
          created_by_last_name?: string | null
          deadline?: string | null
          description?: string | null
          display_category?:
            | Database['public']['Enums']['document_display_category']
            | null
          file_path?: string | null
          file_size?: number | null
          file_type?: string | null
          history?: Json | null
          id?: string | null
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
          updated_by?: string | null
          updated_by_first_name?: string | null
          updated_by_last_name?: string | null
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
          event_type: Database['public']['Enums']['document_history_event_type'] | null
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
          event_type?: Database['public']['Enums']['document_history_event_type'] | null
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
          event_type?: Database['public']['Enums']['document_history_event_type'] | null
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
          dsm_enabled: boolean | null
          dsm_producer_email: string | null
          dsm_producer_name: string | null
          guest_link_registration_doc_id: string | null
          id: string | null
          inspector_email: string | null
          inspector_name: string | null
          ioe_enabled: boolean | null
          is_confirmed: boolean | null
          live_qa: boolean | null
          logistics_call_date: string | null
          logistics_call_notes: string | null
          logistics_call_scheduled: boolean | null
          meeting_id: string | null
          meeting_recording: boolean | null
          speaker_list_doc_id: string | null
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
          dsm_enabled?: boolean | null
          dsm_producer_email?: string | null
          dsm_producer_name?: string | null
          guest_link_registration_doc_id?: string | null
          id?: string | null
          inspector_email?: string | null
          inspector_name?: string | null
          ioe_enabled?: boolean | null
          is_confirmed?: boolean | null
          live_qa?: boolean | null
          logistics_call_date?: string | null
          logistics_call_notes?: string | null
          logistics_call_scheduled?: boolean | null
          meeting_id?: string | null
          meeting_recording?: boolean | null
          speaker_list_doc_id?: string | null
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
          dsm_enabled?: boolean | null
          dsm_producer_email?: string | null
          dsm_producer_name?: string | null
          guest_link_registration_doc_id?: string | null
          id?: string | null
          inspector_email?: string | null
          inspector_name?: string | null
          ioe_enabled?: boolean | null
          is_confirmed?: boolean | null
          live_qa?: boolean | null
          logistics_call_date?: string | null
          logistics_call_notes?: string | null
          logistics_call_scheduled?: boolean | null
          meeting_id?: string | null
          meeting_recording?: boolean | null
          speaker_list_doc_id?: string | null
          static_slide_doc_id?: string | null
          updated_at?: string | null
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
          id: string | null
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
          id?: string | null
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
          id?: string | null
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
          priority: Database['public']['Enums']['notification_priority'] | null
          read: boolean | null
          read_at: string | null
          task_id: string | null
          title: string | null
          type: Database['public']['Enums']['notification_type'] | null
          user_id: string | null
        }
        Insert: {
          action_url?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string | null
          meeting_id?: string | null
          message?: string | null
          priority?: Database['public']['Enums']['notification_priority'] | null
          read?: boolean | null
          read_at?: string | null
          task_id?: string | null
          title?: string | null
          type?: Database['public']['Enums']['notification_type'] | null
          user_id?: string | null
        }
        Update: {
          action_url?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string | null
          meeting_id?: string | null
          message?: string | null
          priority?: Database['public']['Enums']['notification_priority'] | null
          read?: boolean | null
          read_at?: string | null
          task_id?: string | null
          title?: string | null
          type?: Database['public']['Enums']['notification_type'] | null
          user_id?: string | null
        }
        Relationships: []
      }
      phase: {
        Row: {
          created_at: string | null
          id: string | null
          key_dates: string | null
          meeting_id: string | null
          name: string | null
          order_index: number | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string | null
          key_dates?: string | null
          meeting_id?: string | null
          name?: string | null
          order_index?: number | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string | null
          key_dates?: string | null
          meeting_id?: string | null
          name?: string | null
          order_index?: number | null
          status?: string | null
          updated_at?: string | null
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
          id: string | null
          meeting_id: string | null
          name: string | null
          set_key: string | null
          shares: number | null
          shares_voted: number | null
          source: Database['public']['Enums']['position_source'] | null
          updated_at: string | null
          vote_status: Database['public']['Enums']['position_vote_status'] | null
        }
        Insert: {
          account_number?: string | null
          account_type?: string | null
          control_number?: string | null
          created_at?: string | null
          cusip?: string | null
          date_voted?: string | null
          id?: string | null
          meeting_id?: string | null
          name?: string | null
          set_key?: string | null
          shares?: number | null
          shares_voted?: number | null
          source?: Database['public']['Enums']['position_source'] | null
          updated_at?: string | null
          vote_status?: Database['public']['Enums']['position_vote_status'] | null
        }
        Update: {
          account_number?: string | null
          account_type?: string | null
          control_number?: string | null
          created_at?: string | null
          cusip?: string | null
          date_voted?: string | null
          id?: string | null
          meeting_id?: string | null
          name?: string | null
          set_key?: string | null
          shares?: number | null
          shares_voted?: number | null
          source?: Database['public']['Enums']['position_source'] | null
          updated_at?: string | null
          vote_status?: Database['public']['Enums']['position_vote_status'] | null
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
          final_result: Database['public']['Enums']['proposal_final_result'] | null
          for_percentage: number | null
          frequency_options: Json | null
          id: string | null
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
          final_result?: Database['public']['Enums']['proposal_final_result'] | null
          for_percentage?: number | null
          frequency_options?: Json | null
          id?: string | null
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
          final_result?: Database['public']['Enums']['proposal_final_result'] | null
          for_percentage?: number | null
          frequency_options?: Json | null
          id?: string | null
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
          non_dtc_vote_status: string | null
          positions_voted: Json | null
          set_keys: Json | null
          share_range_performance: Json | null
          updated_at: string | null
          vote_distribution: Json | null
        }
        Insert: {
          broker_voting?: Json | null
          created_at?: string | null
          dtc_vote_status?: Json | null
          id: string
          last_calculated_at?: string | null
          meeting_id: string
          non_dtc_vote_status?: string | null
          positions_voted?: Json | null
          set_keys?: Json | null
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
          non_dtc_vote_status?: string | null
          positions_voted?: Json | null
          set_keys?: Json | null
          share_range_performance?: Json | null
          updated_at?: string | null
          vote_distribution?: Json | null
        }
        Relationships: []
      }
      task: {
        Row: {
          created_at: string | null
          description: string | null
          document_id: string | null
          due_date: string | null
          id: string | null
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
          id?: string | null
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
          id?: string | null
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
      user: {
        Row: {
          account: string | null
          account_id: string | null
          avatar_url: string | null
          email: string | null
          first_name: string | null
          id: string | null
          last_name: string | null
          password: string | null
          type: string | null
          username: string | null
        }
        Insert: {
          account?: string | null
          account_id?: string | null
          avatar_url?: string | null
          email?: string | null
          first_name?: string | null
          id?: string | null
          last_name?: string | null
          password?: string | null
          type?: string | null
          username?: string | null
        }
        Update: {
          account?: string | null
          account_id?: string | null
          avatar_url?: string | null
          email?: string | null
          first_name?: string | null
          id?: string | null
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
      reset_demo_data: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
    }
    Enums: {
      add_document_event_request_event_type:
        | 'CREATED'
        | 'UPLOADED'
        | 'VIEWED'
        | 'DOWNLOADED'
        | 'NOT_UPLOADED'
        | 'SIGNED'
        | 'APPROVED'
        | 'REJECTED'
        | 'COMMENTED'
        | 'UPDATED'
        | 'DELETED'
      cast_vote_request_vote: 'FOR' | 'AGAINST' | 'ABSTAIN' | 'WITHHOLD'
      create_digital_shareholder_meeting_request_registrant_type:
        | 'Shareholder'
        | 'Guest'
        | 'Proxy'
        | 'Other'
      create_position_request_source: 'WEB' | 'PRINT' | 'IVR'
      create_position_request_vote_status: 'Voted' | 'Unvoted'
      digital_shareholder_meeting_registrant_type:
        | 'Shareholder'
        | 'Guest'
        | 'Proxy'
        | 'Other'
      document_display_category:
        | 'general'
        | 'dsm'
        | 'proxy-materials'
        | 'meeting-materials'
        | 'post-meeting'
        | 'internal'
      document_history_event_type:
        | 'CREATED'
        | 'UPLOADED'
        | 'VIEWED'
        | 'DOWNLOADED'
        | 'SIGNED'
        | 'APPROVED'
        | 'REJECTED'
        | 'COMMENTED'
        | 'UPDATED'
        | 'DELETED'
      notification_priority: 'low' | 'medium' | 'high' | 'critical'
      notification_type: 'info' | 'warning' | 'error' | 'success'
      position_source: 'WEB' | 'PRINT' | 'IVR'
      position_vote_status: 'Voted' | 'Unvoted'
      proposal_final_result: 'PASSED' | 'FAILED' | 'PENDING'
      update_position_request_source: 'WEB' | 'PRINT' | 'IVR'
      update_position_request_vote_status: 'Voted' | 'Unvoted'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] &
        DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] &
        DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      add_document_event_request_event_type: [
        'CREATED',
        'UPLOADED',
        'VIEWED',
        'DOWNLOADED',
        'NOT_UPLOADED',
        'SIGNED',
        'APPROVED',
        'REJECTED',
        'COMMENTED',
        'UPDATED',
        'DELETED',
      ],
      cast_vote_request_vote: ['FOR', 'AGAINST', 'ABSTAIN', 'WITHHOLD'],
      create_digital_shareholder_meeting_request_registrant_type: [
        'Shareholder',
        'Guest',
        'Proxy',
        'Other',
      ],
      create_position_request_source: ['WEB', 'PRINT', 'IVR'],
      create_position_request_vote_status: ['Voted', 'Unvoted'],
      digital_shareholder_meeting_registrant_type: [
        'Shareholder',
        'Guest',
        'Proxy',
        'Other',
      ],
      document_display_category: [
        'general',
        'dsm',
        'proxy-materials',
        'meeting-materials',
        'post-meeting',
        'internal',
      ],
      document_history_event_type: [
        'CREATED',
        'UPLOADED',
        'VIEWED',
        'DOWNLOADED',
        'SIGNED',
        'APPROVED',
        'REJECTED',
        'COMMENTED',
        'UPDATED',
        'DELETED',
      ],
      notification_priority: ['low', 'medium', 'high', 'critical'],
      notification_type: ['info', 'warning', 'error', 'success'],
      position_source: ['WEB', 'PRINT', 'IVR'],
      position_vote_status: ['Voted', 'Unvoted'],
      proposal_final_result: ['PASSED', 'FAILED', 'PENDING'],
      update_position_request_source: ['WEB', 'PRINT', 'IVR'],
      update_position_request_vote_status: ['Voted', 'Unvoted'],
    },
  },
} as const
