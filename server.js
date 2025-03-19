// Add to the top of server.js
const { execSync } = require('child_process');
const simpleGit = require('simple-git');

const express = require('express');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'build')));
app.use(express.json({ limit: '100mb' })); // Adjust limit based on your needs

// Route to serve React app
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

// Make sure your server.js has these correct API endpoints

// POST /save-file
app.post('/save-file', async (req, res) => {
  try {
    const { path: filePath, content } = req.body;
    
    // Security check to prevent directory traversal
    if (filePath.includes('..')) {
      return res.status(400).json({ error: 'Invalid file path' });
    }
    
    // Create directory if it doesn't exist
    const directory = require('path').dirname(filePath);
    if (!fs.existsSync(directory)) {
      await fs.promises.mkdir(directory, { recursive: true });
    }
    
    // Write file content
    await fs.promises.writeFile(filePath, content, 'utf8');
    res.json({ success: true });
  } catch (error) {
    console.error('Error saving file:', error);
    res.status(500).json({ error: 'Error saving file' });
  }
});


// GET /file-content?path=...
app.get('/file-content', async (req, res) => {
  try {
    const filePath = req.query.path;
    
    // Security check to prevent directory traversal
    if (filePath.includes('..')) {
      return res.status(400).json({ error: 'Invalid file path' });
    }
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    // Read file content
    const content = await fs.promises.readFile(filePath, 'utf8');
    res.send(content);
  } catch (error) {
    console.error('Error reading file:', error);
    res.status(500).json({ error: 'Error reading file' });
  }
});


// Route to get controller.yaml
app.get('/controller.yaml', (req, res) => {
  // const filePath = path.join(__dirname, 'controller.yaml');
  const filePath = './controller.yaml'
  if (fs.existsSync(filePath)) {
    fs.readFile(filePath, 'utf8', (err, data) => {
      if (err) {
        console.error('Error reading controller.yaml:', err);
        return res.status(500).json({ error: 'Failed to read controller.yaml' });
      }
      res.type('text/yaml').send(data);
    });
  } else {
    // If file doesn't exist, return 404
    res.status(404).json({ error: 'controller.yaml not found' });
  }
});

// Route to save controller.yaml
app.post('/save-config', (req, res) => {
  const { content } = req.body;
  
  if (!content) {
    return res.status(400).json({ error: 'No content provided' });
  }
  
  // const filePath = path.join(__dirname, 'controller.yaml');
  const filePath = './controller.yaml'
  fs.writeFile(filePath, content, 'utf8', (err) => {
    if (err) {
      console.error('Error writing controller.yaml:', err);
      return res.status(500).json({ error: 'Failed to write controller.yaml' });
    }
    
    res.json({ message: 'Configuration saved successfully' });
  });
});

// Route to execute terminal commands
app.post('/execute-command', (req, res) => {
  const { command } = req.body;
  
  if (!command) {
    return res.status(400).json({ error: 'No command provided' });
  }
  
  // List of allowed commands for security
  const allowedCommands = [
    'bash bin/run',
    'bash bin/deploy',
    'bash bin/docker-stop',
    'bash bin/docker-logs',
    'echo $(pwd)',
    'sudo docker stop framework-scheduler',
    'sudo docker logs framework-scheduler'
  ];
  
  // Check if command is allowed
  const isAllowed = allowedCommands.some(allowed => command === allowed);
  
  if (!isAllowed) {
    return res.status(403).json({ error: 'Command not allowed' });
  }
  
  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error executing command: ${error}`);
      return res.status(500).json({ 
        success: false, 
        error: error.message,
        output: stderr 
      });
    }
    
    res.json({ 
      success: true, 
      output: stdout || 'Command executed successfully.'
    });
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
