import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { PythonShell } from 'python-shell';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const upload = multer({ dest: 'backend/uploads/' });

app.use(cors());
app.use(express.json());

// Ensure uploads directory exists
if (!fs.existsSync('backend/uploads')) {
  fs.mkdirSync('backend/uploads', { recursive: true });
}

app.post('/predict', upload.fields([
  { name: 'reference', maxCount: 1 },
  { name: 'file', maxCount: 1 }
]), async (req, res) => {
  try {
    if (!req.files['reference'] || !req.files['file']) {
      return res.status(400).json({ error: 'Both reference and test signatures are required' });
    }

    const referencePath = req.files['reference'][0].path;
    const testPath = req.files['file'][0].path;

    const options = {
      mode: 'text',
      pythonPath: 'python3',
      pythonOptions: ['-u'],
      scriptPath: join(__dirname, 'python'),
      args: [referencePath, testPath]
    };

    PythonShell.run('predict.py', options).then(results => {
      // Clean up uploaded files
      fs.unlinkSync(referencePath);
      fs.unlinkSync(testPath);

      // Parse the result from Python script
      const result = JSON.parse(results[0]);
      res.json(result);
    }).catch(err => {
      console.error('Error running Python script:', err);
      res.status(500).json({ error: 'Error processing signatures' });
    });
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});