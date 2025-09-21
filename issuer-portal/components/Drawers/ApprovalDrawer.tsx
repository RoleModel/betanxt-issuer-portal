'use client'

import { useSession } from 'next-auth/react'
import React, { useState } from 'react'

import {
  ChevronLeftOutlined as ChevronLeftIcon,
  ChevronRightOutlined as ChevronRightIcon,
  Close as CloseIcon,
  CommentOutlined as CommentIcon,
  DownloadOutlined as DownloadIcon,
  EditOutlined as EditIcon,
  HistoryOutlined as HistoryOulinedIcon,
  OpenInFullOutlined as OpenInFullOutlinedIcon,
} from '@mui/icons-material'
import {
  Avatar,
  Box,
  Button,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'

import PDFViewer from '@/components/Documents/PDFViewer'
import StatusChip, { type UnifiedStatus } from '@/components/ui/StatusChip'

import { useDocuments } from '@/hooks/useDocuments'
import { type DocumentHistoryEntry } from '@/utils/documentUtils'

interface ApprovalDrawerProps {
  open: boolean
  onClose: () => void
  title: string
  pdfUrl: string
  onApprove: () => void
  taskStatus?: UnifiedStatus | string | null
  onOpenFullscreen?: () => void
  reviewCount?: number
  totalReviews?: number
  onAddComment: (comment: string) => void
}

interface CommentWithUser {
  id: string
  comment: string
  user: string
  first_name: string
  last_name: string
  created_at: string
  users: {
    avatar: string | null
  } | null
}

const ApprovalDrawer: React.FC<ApprovalDrawerProps> = ({
  open,
  onClose,
  title,
  pdfUrl,
  onApprove,
  taskStatus = 'Pending Approval',
  onOpenFullscreen,
  reviewCount,
  totalReviews,
  onAddComment,
}) => {
  const [currentPage, setCurrentPage] = useState(1)
  const [numPages, setNumPages] = useState(1)
  const [showHistory, setShowHistory] = useState(false)
  const [showComments, setShowComments] = useState(false)
  const [documentHistory, setDocumentHistory] = useState<DocumentHistoryEntry[]>([])
  const [comments, setComments] = useState<CommentWithUser[]>([])
  const [currentDocumentId, setCurrentDocumentId] = useState<string | null>(null)
  const [comment, setComment] = useState('')
  const [showCommentField, setShowCommentField] = useState(false)

  // Get current user from NextAuth
  const { data: session } = useSession()
  const { getCommentsForDocument: _getCommentsForDocument, addCommentToDocument } = useDocuments()

  // Reset state when drawer opens/closes
  React.useEffect(() => {
    if (open) {
      setCurrentPage(1)
      setShowHistory(false)
      setShowComments(false)
      setShowCommentField(false)
      setComment('')
      setComments([])
      setCurrentDocumentId(null)
    }
  }, [open])

  // Fetch document history and comments when drawer opens
  React.useEffect(() => {
    const loadDocumentData = async () => {
      if (open && pdfUrl) {
        try {
          // Extract filename from URL if it's a full Supabase Storage URL
          const getFilePathForQuery = (url: string) => {
            if (url.includes('/storage/v1/object/public/')) {
              // Extract filename from Supabase Storage URL
              return url.split('/').pop() || url
            }
            if (url.startsWith('/docs/')) {
              // Extract filename from local path
              return url.replace('/docs/', '')
            }
            // Handle any other path-like URLs by extracting the filename
            if (url.includes('/')) {
              return url.split('/').pop() || url
            }
            // Already a filename
            return url
          }

          const filePathForQuery = getFilePathForQuery(pdfUrl)
          console.log('ApprovalDrawer URL debug:', {
            pdfUrl,
            filePathForQuery,
            urlType: pdfUrl.includes('/storage/v1/object/public/')
              ? 'storage'
              : pdfUrl.startsWith('/docs/')
                ? 'local'
                : 'filename',
          })

          // For now, use placeholder data - these operations will need proper API endpoints
          console.warn(
            'ApprovalDrawer: loadDocumentData - Placeholder implementation - needs API endpoint',
            {
              filePathForQuery,
            }
          )

          // Set placeholder data
          setDocumentHistory([])
          setComments([])
          setCurrentDocumentId('placeholder-doc-id')
        } catch (err) {
          console.error('Error loading document data:', err)
        }
      }
    }

    loadDocumentData()
  }, [open, pdfUrl])

  const handlePageChange = (newPage: number) => {
    setCurrentPage(Math.min(Math.max(1, newPage), numPages))
  }

  const handleDownload = () => {
    const link = document.createElement('a')
    link.href = pdfUrl
    link.download = `${title}.pdf`
    link.click()
  }

  const handleHistory = () => {
    setShowHistory(!showHistory)
    setShowComments(false)
  }

  const handleComments = () => {
    setShowComments(!showComments)
    setShowHistory(false)
  }

  const handleFullscreen = () => {
    console.log('ApprovalDrawer: handleFullscreen called')
    console.log('ApprovalDrawer: onOpenFullscreen prop:', onOpenFullscreen)

    if (onOpenFullscreen) {
      console.log('ApprovalDrawer: Calling onOpenFullscreen()')
      onOpenFullscreen()
    } else {
      console.warn('ApprovalDrawer: onOpenFullscreen prop is not provided')
      // Fallback: close the drawer if no onOpenFullscreen handler
      onClose()
    }

    // Let the parent component handle closing this drawer
  }

  const handleEdit = () => {
    // Handle edit action - could open external editor
    console.log('Edit document')
  }

  const handleView = () => {
    // Handle view action - same as fullscreen
    handleFullscreen()
  }

  const handleAddComment = () => {
    setShowCommentField(true)
    // Smooth scroll to bottom when comment field appears
    setTimeout(() => {
      const commentsContainer = document.querySelector('[data-comments-container]')
      if (commentsContainer) {
        commentsContainer.scrollTo({
          top: commentsContainer.scrollHeight,
          behavior: 'smooth',
        })
      }
    }, 100)
  }

  const handleSubmitComment = async () => {
    if (!comment.trim()) {
      console.error('Comment is empty')
      return
    }

    if (!currentDocumentId) {
      console.error('No document ID available')
      return
    }

    if (!session?.user?.username) {
      console.error('No current user available')
      return
    }

    try {
      // Use hook to add comment
      await addCommentToDocument(currentDocumentId, comment.trim())

      // Create optimistic comment for immediate UI update
      const optimisticComment: CommentWithUser = {
        id: `temp-${Date.now()}`,
        comment: comment.trim(),
        user: session.user.username || '',
        first_name: (session.user.name || '').split(' ')[0] || '',
        last_name: (session.user.name || '').split(' ').slice(1).join(' ') || '',
        created_at: new Date().toISOString(),
        users: null,
      }

      // Add new comment to the top of the list
      setComments((prev) => [optimisticComment, ...prev])

      // Call parent's onAddComment for any additional handling
      onAddComment(comment.trim())

      setComment('')
      setShowCommentField(false)
    } catch (err) {
      console.error('Error submitting comment:', err)
    }
  }

  // Helper function to format timestamps
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInHours = Math.abs(now.getTime() - date.getTime()) / (1000 * 60 * 60)

    if (diffInHours < 24) {
      return (
        date.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        }) + ', Today'
      )
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      })
    }
  }

  return (
    <Drawer
      anchor="left"
      open={open}
      onClose={onClose}
      elevation={8}
      keepMounted={false}
      sx={{
        zIndex: 1400, // Higher than other drawers
      }}
      ModalProps={{
        disableEnforceFocus: true,
        disableAutoFocus: true,
        disableRestoreFocus: true,
      }}
      slotProps={{
        paper: {
          sx: {
            width: '100%',
            maxWidth: 550,
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
          },
        },
      }}
    >
      {/* Header */}
      <Box
        sx={(theme) => ({
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 2,
          pl: 3,
          background: theme.vars.palette.appBarPrimary.defaultFill,
          color: theme.vars.palette.appBarPrimary.defaultContrast,
          borderBottom: `1px solid`,
          borderColor: theme.vars.palette.divider,
        })}
      >
        <Typography variant="h3">{title}</Typography>
        <IconButton size="small" onClick={onClose} sx={{ color: 'inherit' }}>
          <CloseIcon />
        </IconButton>
      </Box>

      {/* Icon Toolbar */}
      <Box
        sx={(theme) => ({
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'end',
          gap: 2,
          p: 1,
          borderBottom: `1px solid`,
          borderColor: theme.vars.palette.divider,
          background: theme.vars.palette.appBarPrimary.defaultFill,
        })}
      >
        {/* Page Navigation */}
        <Box
          sx={(theme) => ({
            display: 'flex',
            alignItems: 'center',
            gap: 0,
            color: theme.vars.palette.appBarPrimary.defaultContrast,
            flexGrow: '1',
          })}
        >
          <IconButton
            size="small"
            color="inherit"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage <= 1}
            sx={{
              '&.Mui-disabled': {
                color: (theme) => theme.vars.palette.appBarPrimary.defaultContrast,
                opacity: 0.5,
              },
            }}
          >
            <ChevronLeftIcon fontSize="medium" />
          </IconButton>
          <Typography variant="caption">
            Page {currentPage} of {numPages}
          </Typography>
          <IconButton
            size="small"
            color="inherit"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage >= numPages}
            sx={{
              '&.Mui-disabled': {
                color: (theme) => theme.vars.palette.common.white,
                opacity: 0.4,
              },
            }}
          >
            <ChevronRightIcon fontSize="medium" />
          </IconButton>
        </Box>
        <Tooltip title="Edit">
          <IconButton size="small" onClick={handleEdit} sx={{ color: 'white' }}>
            <EditIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="View">
          <IconButton size="small" onClick={handleView} sx={{ color: 'white' }}>
            <OpenInFullOutlinedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Comments">
          <IconButton size="small" onClick={handleComments} sx={{ color: 'white' }}>
            <CommentIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="History">
          <IconButton size="small" onClick={handleHistory} sx={{ color: 'white' }}>
            <HistoryOulinedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Download">
          <IconButton size="small" onClick={handleDownload} sx={{ color: 'white' }}>
            <DownloadIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Status Chip and Page Navigation */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 2,
          pb: 1,
        }}
      >
        <StatusChip
          status={taskStatus}
          size="small"
          reviewCount={reviewCount}
          totalReviews={totalReviews}
          sx={{
            fontSize: '12px',
            height: 20,
            fontWeight: 500,
          }}
        />
      </Box>

      {/* Main Content Area */}
      <Box
        sx={{
          display: 'flex',
          overflow: 'hidden',
          height: '100%',
          flexDirection: 'column',
          flexShrink: 1,
          position: 'relative',
        }}
      >
        {/* PDF Viewer */}
        <Box
          sx={{
            p: 2,
            pt: 0,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'start',
            alignItems: 'center',
            overflow: 'auto',
          }}
        >
          <Box sx={{ maxWidth: 350 }}>
            <PDFViewer
              file={pdfUrl}
              pageNumber={currentPage}
              onLoadSuccess={(pdf) => setNumPages(pdf.numPages)}
            />
          </Box>
        </Box>
        {/* Approve Button - only show if not already approved/complete */}
        {!showComments &&
          !showHistory &&
          taskStatus !== 'Complete' &&
          taskStatus !== 'Approved' && (
            <Box
              sx={(theme) => ({
                p: 1,
                display: 'flex',
                justifyContent: 'end',
                borderTop: `1px solid ${theme.vars.palette.divider}`,
                background: theme.vars.palette.background.paper,
              })}
            >
              <Button
                variant="contained"
                size="large"
                color="success"
                onClick={onApprove}
              >
                Approve Document
              </Button>
            </Box>
          )}
      </Box>
      {/* History Side Panel */}
      <Box
        sx={(theme) => ({
          width: '100%',
          background: (theme) => theme.vars.palette.background.paper,
          display: 'flex',
          flexDirection: 'column',
          position: 'absolute',
          bottom: 0,
          height: '60%',
          maxHeight: showHistory ? '60%' : '0%',
          overflowY: 'auto',
          left: 0,
          transition: theme.transitions.create(['max-height']),
        })}
      >
        <Box
          sx={{
            px: 2,
            py: 0.5,
            background: (theme) => theme.vars.palette.appBarPrimary.defaultFill,
            color: (theme) => theme.vars.palette.appBarPrimary.defaultContrast,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Typography variant="body3">Document History</Typography>
          <IconButton size="small" onClick={handleHistory} sx={{ color: 'inherit' }}>
            <CloseIcon />
          </IconButton>
        </Box>
        <List>
          {documentHistory && documentHistory.length > 0 ? (
            documentHistory.map((historyItem, index) => (
              <ListItem key={index} divider>
                <ListItemText
                  primary={historyItem.action}
                  secondary={`${historyItem.userName}: ${formatTimestamp(historyItem.timestamp)}`}
                />
              </ListItem>
            ))
          ) : (
            <Box sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                No history available
              </Typography>
            </Box>
          )}
        </List>
      </Box>

      {/* Comments Side Panel */}

      <Box
        sx={(theme) => ({
          width: '100%',
          background: (theme) => theme.vars.palette.background.paper,
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          position: 'absolute',
          // top: showComments ? '50%' : '50%',
          bottom: 0,
          maxHeight: showComments ? '60%' : '0%',
          overflowY: 'auto',
          left: 0,
          transition: theme.transitions.create(['top', 'max-height']),
        })}
      >
        <Box
          sx={{
            px: 2,
            py: 0.5,
            background: (theme) => theme.vars.palette.appBarPrimary.defaultFill,
            color: (theme) => theme.vars.palette.appBarPrimary.defaultContrast,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            zIndex: 100,
          }}
        >
          <Typography variant="body3">Comments</Typography>
          <IconButton size="small" onClick={handleComments} sx={{ color: 'inherit' }}>
            <CloseIcon />
          </IconButton>
        </Box>
        <Box
          sx={{ p: 1, flex: 1, overflow: 'auto', height: '100%' }}
          data-comments-container
        >
          <List>
            {comments.length > 0 ? (
              comments.map((commentItem) => (
                <ListItem key={commentItem.id} divider>
                  <ListItemAvatar>
                    <Avatar
                      src={commentItem.users?.avatar || undefined}
                      sx={{
                        width: 40,
                        height: 40,
                        backgroundColor: (theme) => theme.vars.palette.secondary.main,
                        borderRadius: 1,
                      }}
                    />
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box
                        component="span"
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <Typography component="span" variant="body3" fontWeight={500}>
                          {`${commentItem.first_name} ${commentItem.last_name}`}
                        </Typography>
                        <Typography
                          component="span"
                          variant="body3"
                          color="text.secondary"
                        >
                          {formatTimestamp(commentItem.created_at)}
                        </Typography>
                      </Box>
                    }
                    secondary={commentItem.comment}
                  />
                </ListItem>
              ))
            ) : (
              <ListItem>
                <ListItemText
                  primary={
                    <Typography variant="body2" color="text.secondary" align="center">
                      No comments yet
                    </Typography>
                  }
                />
              </ListItem>
            )}
          </List>
          <Box
            sx={(theme) => ({
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
              alignItems: 'end',
              width: '100%',
              background: theme.vars.palette.background.paper,
            })}
          >
            {showCommentField && (
              <TextField
                label="Add Comment"
                aria-label="Add Comment"
                variant="outlined"
                size="small"
                fullWidth
                multiline
                rows={6}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                autoFocus
              />
            )}
            <Button
              variant="contained"
              color="primary"
              onClick={showCommentField ? handleSubmitComment : handleAddComment}
            >
              {showCommentField ? 'Submit Comment' : 'Add Comment'}
            </Button>
          </Box>
        </Box>
      </Box>
    </Drawer>
  )
}

export default ApprovalDrawer
