import { IncomingForm } from 'formidable';
import FormData from 'form-data';
import fetch from 'node-fetch';
import fs from 'fs';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const form = new IncomingForm();

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Form parsing error' });
    }

    try {
      const file = files.file;
      if (!file) return res.status(400).json({ error: 'No file uploaded' });

      const media = fs.readFileSync(file.filepath);
      const fileSizeInBytes = media.length;
      const fileSizeInKB = (fileSizeInBytes / 1024).toFixed(2);
      const fileSizeInMB = (fileSizeInBytes / (1024 * 1024)).toFixed(2);
      const fileSize = fileSizeInMB >= 1 ? `${fileSizeInMB} MB` : `${fileSizeInKB} KB`;

      const uploadForm = new FormData();
      uploadForm.append('reqtype', 'fileupload');

      let ext = '';
      if (file.mimetype.includes('video')) ext = '.mp4';
      else if (file.mimetype.includes('jpeg')) ext = '.jpg';
      else if (file.mimetype.includes('png')) ext = '.png';
      else ext = '';

      uploadForm.append('fileToUpload', media, `file${ext}`);

      const response = await fetch('https://catbox.moe/user/api.php', {
        method: 'POST',
        body: uploadForm,
        headers: uploadForm.getHeaders(),
      });

      const result = await response.text();
      const url = result.trim();

      res.status(200).json({ url, size: fileSize });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: e.message });
    }
  });
}
