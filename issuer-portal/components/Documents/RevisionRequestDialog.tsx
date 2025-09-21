'use client'

import React, { useState } from 'react'

import { Close as CloseIcon } from '@mui/icons-material'
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  TextField,
  Typography,
} from '@mui/material'

interface RevisionRequestDialogProps {
  open: boolean
  onClose: () => void
  onSubmit: (revisionRequest: string) => Promise<void>
  title?: string
  description?: string
}

const RevisionRequestDialog: React.FC<RevisionRequestDialogProps> = ({
  open,
  onClose,
  onSubmit,
  title = 'Request Revision',
  description = 'Please describe the revisions needed for this document hosting site.',
}) => {
  const [revisionText, setRevisionText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async () => {
    if (!revisionText.trim()) {
      setError('Please provide revision details.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      await onSubmit(revisionText.trim())
      // Reset form on successful submission
      setRevisionText('')
      onClose()
    } catch (err) {
      console.error('Error submitting revision request:', err)
      setError(err instanceof Error ? err.message : 'Failed to submit revision request')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (!loading) {
      setRevisionText('')
      setError(null)
      onClose()
    }
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ pb: 1 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {title}
          <IconButton
            onClick={handleClose}
            disabled={loading}
            size="small"
            sx={{ color: 'text.secondary' }}
          >
            <CloseIcon />
          </IconButton>
        </div>
      </DialogTitle>

      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {description}
        </Typography>

        <TextField
          fullWidth
          label="Revision Details"
          multiline
          rows={4}
          value={revisionText}
          onChange={(e) => setRevisionText(e.target.value)}
          placeholder="Please describe the specific revisions needed..."
          variant="outlined"
          disabled={loading}
          error={!!error}
          helperText={error}
          sx={{ mb: 2 }}
        />
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={loading} variant="outlined">
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={loading || !revisionText.trim()}
          variant="contained"
          color="primary"
        >
          {loading ? 'Submitting...' : 'Submit Request'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default RevisionRequestDialog
