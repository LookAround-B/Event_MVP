import type { NextApiRequest, NextApiResponse } from 'next'
import { withAuth, AuthenticatedRequest } from '@/lib/auth-middleware'
import { ApiResponse } from '@/types'
import fs from 'fs'
import path from 'path'
import { IncomingForm, File } from 'formidable'

export const config = {
  api: {
    bodyParser: false,
  },
}

async function handler(req: AuthenticatedRequest, res: NextApiResponse<ApiResponse>) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed', statusCode: 405 })
  }

  const uploadDir = path.join(process.cwd(), 'public', 'uploads')
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true })
  }

  const form = new IncomingForm({
    uploadDir,
    keepExtensions: true,
    maxFileSize: 10 * 1024 * 1024, // 10MB
    filter: ({ mimetype }) => {
      const allowed = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf']
      return allowed.includes(mimetype || '')
    },
  })

  return new Promise<void>((resolve) => {
    form.parse(req, (err, _fields, files) => {
      if (err) {
        res.status(400).json({
          success: false,
          message: 'File upload failed: ' + err.message,
          statusCode: 400,
        })
        return resolve()
      }

      const file = Array.isArray(files.file) ? files.file[0] : files.file
      if (!file) {
        res.status(400).json({
          success: false,
          message: 'No file provided',
          statusCode: 400,
        })
        return resolve()
      }

      const filename = path.basename(file.filepath)
      const fileUrl = `/uploads/${filename}`

      res.status(200).json({
        success: true,
        message: 'File uploaded successfully',
        statusCode: 200,
        data: { fileUrl },
      })
      resolve()
    })
  })
}

export default withAuth(handler)
