import { useState } from 'react'
import { Upload, File, X } from 'lucide-react'
import clsx from 'clsx'

/**
 * Reusable FileUpload component
 */
export default function FileUpload({
  label,
  accept = '.pdf',
  multiple = false,
  maxSize = 10,
  files = [],
  onChange,
  error,
  className,
}) {
  const [dragActive, setDragActive] = useState(false)

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    const droppedFiles = Array.from(e.dataTransfer.files)
    handleFiles(droppedFiles)
  }

  const handleChange = (e) => {
    const selectedFiles = Array.from(e.target.files)
    handleFiles(selectedFiles)
  }

  const handleFiles = (newFiles) => {
    const validFiles = newFiles.filter((file) => {
      const sizeMB = file.size / (1024 * 1024)
      return sizeMB <= maxSize
    })

    if (multiple) {
      onChange([...files, ...validFiles])
    } else {
      onChange(validFiles.slice(0, 1))
    }
  }

  const removeFile = (index) => {
    onChange(files.filter((_, i) => i !== index))
  }

  return (
    <div className={className}>
      {label && <label className="label">{label}</label>}

      <div
        className={clsx(
          'border-2 border-dashed rounded-lg p-6 text-center transition-colors',
          dragActive
            ? 'border-primary-500 bg-primary-50'
            : error
            ? 'border-red-500 bg-red-50'
            : 'border-gray-300 hover:border-primary-400',
          'cursor-pointer'
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleChange}
          className="hidden"
          id="file-upload"
        />
        <label htmlFor="file-upload" className="cursor-pointer">
          <Upload className="w-10 h-10 mx-auto mb-3 text-gray-400" />
          <p className="text-sm text-gray-600 mb-1">
            <span className="text-primary-600 font-medium">Click to upload</span> or drag and
            drop
          </p>
          <p className="text-xs text-gray-500">
            {accept.toUpperCase()} files up to {maxSize}MB
          </p>
        </label>
      </div>

      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}

      {files.length > 0 && (
        <div className="mt-4 space-y-2">
          {files.map((file, index) => (
            <div
              key={index}
              className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200"
            >
              <File className="w-5 h-5 text-gray-400" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                <p className="text-xs text-gray-500">
                  {(file.size / (1024 * 1024)).toFixed(2)} MB
                </p>
              </div>
              <button
                onClick={() => removeFile(index)}
                className="text-gray-400 hover:text-red-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
