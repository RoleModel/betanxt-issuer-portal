'use client'

import { SignatureMaker } from '@docuseal/signature-maker-react'
import React from 'react'

import './signature-maker.css'

/**
 * SignatureMakerConfig Component
 *
 * This component demonstrates how to fully configure the SignatureMaker
 * with custom CSS classes to match the MUI/BetaNXT design system.
 *
 * All available data attributes and their corresponding CSS classes are shown below.
 */

interface SignatureMakerConfigProps {
  onSave?: (signature: string) => void
  withTyped?: boolean
  withDrawn?: boolean
  withUpload?: boolean
}

const SignatureMakerConfig: React.FC<SignatureMakerConfigProps> = ({
  onSave,
  withTyped = false,
  withDrawn = true,
  withUpload = false,
}) => {
  return (
    <SignatureMaker
      // Feature toggles
      downloadOnSave={false}
      withTyped={withTyped}
      withDrawn={withDrawn}
      withUpload={withUpload}
      withColorSelect={false}
      withSubmit={false}
      // Container classes and styles
      controlButtonsContainerClass="signature-actions"
      controlButtonsContainerStyle="display: flex; align-items: center; justify-content: flex-end; gap: 0;"
      // Save button configuration (hidden in our design)
      saveButtonText="Insert"
      saveButtonClass=""
      saveButtonStyle="display: none;"
      saveButtonDisabledClass=""
      // Undo button configuration
      undoButtonText="Undo"
      undoButtonClass="signature-undo-btn"
      undoButtonStyle="color: var(--mui-palette-primary-main);height: 36px;background-color: transparent; border: none; text-transform: none; font-weight: 600; font-size: 14px; padding: 6px 12px; cursor: pointer; display: inline-flex; align-items: center; gap: 8px;"
      // Clear button configuration
      clearButtonText="Clear"
      clearButtonClass="signature-clear-btn"
      clearButtonStyle="color: var(--mui-palette-primary-main);background-color: transparent; border: none; text-transform: none; font-weight: 600; font-size: 14px; padding: 6px 12px; cursor: pointer; display: inline-flex; align-items: center; gap: 8px;"
      // Text input configuration (for typed signatures)
      textInputPlaceholder="Type your signature"
      textInputClass="signature-text-input"
      textInputStyle=""
      // Canvas configuration
      canvasClass="signature-canvas"
      canvasStyle="display: block; vertical-align: middle; width: 100%; border-radius: 8px; background-color: #ffffff; padding: 1px; touch-action: none; user-select: none; text-align: center; line-height: 24px; border: 1px solid #D3D3D3"
      // Type buttons container (Draw/Type/Upload toggle)
      typeButtonsContainerClass="signature-type-buttons"
      typeButtonsContainerStyle="display: none;" // Hidden since we use MUI Tabs
      // Draw type button
      drawTypeButtonText="Draw"
      drawTypeButtonClass="signature-draw-btn"
      drawTypeButtonStyle=""
      drawTypeButtonActiveClass="signature-draw-btn-active"
      drawTypeButtonActiveStyle=""
      // Text type button
      textTypeButtonText="Type"
      textTypeButtonClass="signature-type-btn"
      textTypeButtonStyle=""
      textTypeButtonActiveClass="signature-type-btn-active"
      textTypeButtonActiveStyle=""
      // Upload type button
      uploadTypeButtonText="Upload"
      uploadTypeButtonClass="signature-upload-btn"
      uploadTypeButtonStyle=""
      uploadTypeButtonActiveClass="signature-upload-btn-active"
      uploadTypeButtonActiveStyle=""
      // Font URL for typed signatures (optional)
      fontUrl=""
      // Root element classes and styles
      className="signature-maker-container"
      style={{ display: 'block' }}
      // Event handler
      onSave={onSave}
    />
  )
}

export default SignatureMakerConfig

/**
 * Usage Example:
 *
 * <SignatureMakerConfig
 *   withTyped={false}
 *   withDrawn={true}
 *   withUpload={false}
 * />
 *
 * CSS Classes Reference:
 *
 * .signature-maker-container - Main container wrapper
 * .signature-canvas - Canvas element for drawing
 * .signature-actions - Action buttons container (Clear, Undo, Redo)
 * .signature-clear-btn - Clear button styling
 * .signature-undo-btn - Undo button styling
 * .signature-redo-btn - Redo button styling (if added)
 * .signature-btn-divider - Vertical divider between buttons
 * .signature-canvas-wrapper - Canvas wrapper with border
 * .signature-canvas-close - Close button in canvas corner
 * .signature-dialog-paper - Dialog paper background styling
 * .signature-text-input - Text input for typed signatures
 * .signature-type-buttons - Type selection buttons container
 * .signature-draw-btn - Draw mode button
 * .signature-type-btn - Type mode button
 * .signature-upload-btn - Upload mode button
 *
 * The CSS file (signature-maker.css) provides all the necessary styles
 * to override the default SignatureMaker appearance and match the
 * MUI/BetaNXT design system.
 */
