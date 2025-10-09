import React, { useEffect, useMemo, useState } from 'react'

import CloseIcon from '@mui/icons-material/Close'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore'
import NavigateNextIcon from '@mui/icons-material/NavigateNext'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import FormControl from '@mui/material/FormControl'
import IconButton from '@mui/material/IconButton'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import type { SelectChangeEvent } from '@mui/material/Select';
import Select from '@mui/material/Select'
import Typography from '@mui/material/Typography'

import { termsDefinitions } from '@/lib/termsDefinitions'

interface InfoDialogProps {
  open: boolean
  onClose: () => void
  term: string
  definition: string
}

export const InfoDialog: React.FC<InfoDialogProps> = ({
  open,
  onClose,
  term,
  definition,
}) => {
  // Create an array of unique categories from termsDefinitions
  const categoriesSet = new Set<string>()
  Object.values(termsDefinitions).forEach((term) => categoriesSet.add(term.category))
  const categories = Array.from(categoriesSet)

  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedTerm, setSelectedTerm] = useState('')
  const [currentTerms, setCurrentTerms] = useState<{ id: string; term: string }[]>([])
  const [currentDefinition, setCurrentDefinition] = useState('')

  // Create a memoized, sorted list of all terms
  const allTermsOrdered = useMemo(() => {
    return Object.entries(termsDefinitions)
      .map(([id, termObj]) => ({
        id,
        term: termObj.term,
        category: termObj.category,
      }))
      .sort((a, b) => a.term.localeCompare(b.term)) // Sort alphabetically by term
  }, [])

  // Initialize with provided term when modal opens, or default to first term
  useEffect(() => {
    if (open) {
      if (term) {
        // If a specific term is provided, use it
        const termKey = Object.keys(termsDefinitions).find(
          (key) => termsDefinitions[key as keyof typeof termsDefinitions].term === term
        )
        if (termKey) {
          const termObj = termsDefinitions[termKey as keyof typeof termsDefinitions]
          setSelectedCategory(termObj.category)
          setSelectedTerm(termKey)
          setCurrentDefinition(definition) // Use initial definition prop
        } else {
          // If initial term not found, default to first term overall
          if (allTermsOrdered.length > 0) {
            const firstTerm = allTermsOrdered[0]
            setSelectedCategory(firstTerm.category)
            setSelectedTerm(firstTerm.id)
            setCurrentDefinition(
              termsDefinitions[firstTerm.id as keyof typeof termsDefinitions].definition
            )
          }
        }
      } else {
        // If no specific term provided, default to first term overall
        if (allTermsOrdered.length > 0) {
          const firstTerm = allTermsOrdered[0]
          setSelectedCategory(firstTerm.category)
          setSelectedTerm(firstTerm.id)
          setCurrentDefinition(
            termsDefinitions[firstTerm.id as keyof typeof termsDefinitions].definition
          )
        }
      }
    }
  }, [open, term, definition, allTermsOrdered])

  // Update available terms for the dropdown when category changes
  useEffect(() => {
    if (selectedCategory) {
      const filteredTerms = allTermsOrdered.filter(
        (termObj) => termObj.category === selectedCategory
      )
      setCurrentTerms(filteredTerms.map(({ id, term }) => ({ id, term })))
      // No need to auto-select first term here anymore for navigation
    } else {
      setCurrentTerms([])
    }
  }, [selectedCategory, allTermsOrdered])

  // Handle category change
  const handleCategoryChange = (event: SelectChangeEvent) => {
    const newCategory = event.target.value
    setSelectedCategory(newCategory)
    // When category changes via dropdown, select the first term in that category
    const firstTermInCategory = allTermsOrdered.find((t) => t.category === newCategory)
    if (firstTermInCategory) {
      setSelectedTerm(firstTermInCategory.id)
      setCurrentDefinition(
        termsDefinitions[firstTermInCategory.id as keyof typeof termsDefinitions]
          .definition
      )
    }
  }

  // Handle term change (from dropdown)
  const handleTermChange = (event: SelectChangeEvent) => {
    const newTermKey = event.target.value
    if (newTermKey) {
      const termObj = termsDefinitions[newTermKey as keyof typeof termsDefinitions]
      setSelectedTerm(newTermKey)
      setCurrentDefinition(termObj.definition)
      // Ensure category is synced if term changes via dropdown
      if (selectedCategory !== termObj.category) {
        setSelectedCategory(termObj.category)
      }
    }
  }

  // Handle navigation using the full ordered list
  const handlePrevious = () => {
    const currentIndex = allTermsOrdered.findIndex((t) => t.id === selectedTerm)
    if (currentIndex > 0) {
      const prevTermData = allTermsOrdered[currentIndex - 1]
      setSelectedTerm(prevTermData.id)
      setSelectedCategory(prevTermData.category) // Sync category
      setCurrentDefinition(
        termsDefinitions[prevTermData.id as keyof typeof termsDefinitions].definition
      )
    }
  }

  const handleNext = () => {
    const currentIndex = allTermsOrdered.findIndex((t) => t.id === selectedTerm)
    if (currentIndex < allTermsOrdered.length - 1) {
      const nextTermData = allTermsOrdered[currentIndex + 1]
      setSelectedTerm(nextTermData.id)
      setSelectedCategory(nextTermData.category) // Sync category
      setCurrentDefinition(
        termsDefinitions[nextTermData.id as keyof typeof termsDefinitions].definition
      )
    }
  }

  // Handle Copy to Clipboard
  const handleCopyToClipboard = async () => {
    const textToCopy = currentDefinition || definition
    if (!textToCopy) {
      return
    }
    try {
      await navigator.clipboard.writeText(textToCopy)
      // Optional: Add user feedback here (e.g., Snackbar, temporary icon change)
    } catch {
      // Optional: Add user feedback for failure here
    }
  }

  // Update disabled logic based on the full ordered list
  const currentIndexInAll = allTermsOrdered.findIndex((t) => t.id === selectedTerm)
  const canGoPrevious = currentIndexInAll > 0
  const canGoNext = currentIndexInAll < allTermsOrdered.length - 1

  // Current displayed term title
  const displayedTerm = selectedTerm
    ? termsDefinitions[selectedTerm as keyof typeof termsDefinitions]?.term
    : ''

  return (
    <Dialog
      onClose={onClose}
      open={open}
      maxWidth="md"
      fullWidth
      aria-labelledby="info-modal-title"
      aria-describedby="info-modal-description"
    >
      <DialogTitle
        id="info-modal-title"
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        Terms and Definitions
        <IconButton aria-label="Close terms and definitions dialog" onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 3 }} id="info-modal-description">
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            gap: 2,
            mb: 2,
          }}
          role="region"
          aria-label="Terms and definitions navigation controls"
        >
          {/* Category Select */}
          <FormControl size="small" sx={{ minWidth: 150, flex: 1 }}>
            <InputLabel id="category-select-label" htmlFor="category-select">
              Category
            </InputLabel>
            <Select
              labelId="category-select-label"
              value={selectedCategory}
              label="Category"
              onChange={handleCategoryChange}
              size="small"
              native={false}
              aria-labelledby="category-select-label"
              slotProps={{
                input: {
                  id: 'category-select',
                },
              }}
            >
              {categories.map((category) => (
                <MenuItem key={category} value={category}>
                  {category}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Term Select */}
          <FormControl size="small" sx={{ minWidth: 150, flex: 1 }}>
            <InputLabel id="term-select-label" htmlFor="term-select">
              Term
            </InputLabel>
            <Select
              labelId="term-select-label"
              value={selectedTerm}
              label="Term"
              onChange={handleTermChange}
              disabled={!selectedCategory}
              size="small"
              native={false}
              slotProps={{
                input: {
                  id: 'term-select',
                },
              }}
            >
              {currentTerms.map(({ id, term }) => (
                <MenuItem key={id} value={id}>
                  {term}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          {/* Navigation Buttons */}
          <Button
            variant="text"
            onClick={handlePrevious}
            disabled={!canGoPrevious}
            startIcon={<NavigateBeforeIcon />}
          >
            Previous
          </Button>
          <Button
            variant="text"
            onClick={handleNext}
            disabled={!canGoNext}
            endIcon={<NavigateNextIcon />}
          >
            Next
          </Button>
        </Box>

        <Box sx={{ height: 300, overflow: 'auto' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Typography variant="body2" fontWeight="bold" gutterBottom>
              {displayedTerm}
            </Typography>
            <IconButton
              size="small"
              sx={{ ml: 1, visibility: selectedTerm ? 'visible' : 'hidden' }}
              onClick={handleCopyToClipboard}
              aria-label={`Copy definition of ${displayedTerm} to clipboard`}
            >
              <ContentCopyIcon />
            </IconButton>
          </Box>
          <Typography variant="body2">{currentDefinition || definition}</Typography>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} variant="outlined" size="large">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  )
}
