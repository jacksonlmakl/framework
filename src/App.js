import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  Settings, 
  Play, 
  Upload, 
  AlertCircle, 
  Terminal, 
  X, 
  Save, 
  Edit2, 
  Code,
  ChevronRight,
  Clock,
  Database,
  Server,
  FileText,
  PenTool,
  CheckCircle,
  XCircle,
  RefreshCw,
  HelpCircle,
  Calendar,
  Cloud,
  MoreHorizontal,
  ChevronDown
} from 'lucide-react';
import yaml from 'js-yaml';

const App = () => {
  const [steps, setSteps] = useState([]);
  const [globalConfig, setGlobalConfig] = useState({
    schedule: '* * * * *',
    s3: {
      name: '',
      access_key: '',
      secret_key: ''
    }
  });
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [editingStepIndex, setEditingStepIndex] = useState(null);
  const [logs, setLogs] = useState('');
  const [showLogs, setShowLogs] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragIndex, setDragIndex] = useState(null);
  
  // Theme colors
  const themeColors = {
    primary: 'bg-indigo-600 hover:bg-indigo-700',
    secondary: 'bg-slate-700 hover:bg-slate-800',
    success: 'bg-emerald-500 hover:bg-emerald-600',
    warning: 'bg-amber-500 hover:bg-amber-600',
    danger: 'bg-rose-500 hover:bg-rose-600',
    info: 'bg-sky-500 hover:bg-sky-600',
    light: 'bg-slate-200 hover:bg-slate-300 text-slate-800',
    stepBackground: 'bg-white dark:bg-slate-800',
    stepBorder: 'border-slate-200 dark:border-slate-700',
    stepBorderActive: 'border-indigo-500 dark:border-indigo-400',
    stepShadow: 'shadow-md hover:shadow-lg',
    panelBackground: 'bg-white dark:bg-slate-800',
    panelBorder: 'border border-slate-200 dark:border-slate-700',
    textPrimary: 'text-slate-900 dark:text-white',
    textSecondary: 'text-slate-600 dark:text-slate-300',
    textMuted: 'text-slate-500 dark:text-slate-400',
  };

  // Step type icons and colors
  const stepTypeIcons = {
    "Python": { icon: <Code className="text-blue-500" size={20} />, color: 'bg-blue-100 text-blue-700 border-blue-200' },
    // "SQL Insert": { icon: <Database className="text-emerald-500" size={20} />, color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
    // "SQL Query": { icon: <FileText className="text-teal-500" size={20} />, color: 'bg-teal-100 text-teal-700 border-teal-200' },
    "SQL": { icon: <Server className="text-violet-500" size={20} />, color: 'bg-violet-100 text-violet-700 border-violet-200' },
    // "S3 Upload": { icon: <Cloud className="text-amber-500" size={20} />, color: 'bg-amber-100 text-amber-700 border-amber-200' },
  };

  const LoadingOverlay = () => {
    return isLoading ? (
      <div className="fixed inset-0 bg-slate-900 bg-opacity-70 flex items-center justify-center z-50 backdrop-blur-sm">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-xl">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            <p className="mt-4 text-slate-700 dark:text-slate-200 font-medium">Processing...</p>
          </div>
        </div>
      </div>
    ) : null;
  };

  const LogsModal = () => {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-slate-900 bg-opacity-70 z-50 overflow-y-auto p-4 backdrop-blur-sm">
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl p-6 w-full max-w-5xl max-h-[90vh] flex flex-col relative">
          <div className="flex justify-between items-center mb-4 sticky top-0 bg-white dark:bg-slate-800 z-10 pb-4 border-b border-slate-200 dark:border-slate-700">
            <h2 className="text-xl font-semibold text-slate-800 dark:text-white flex items-center">
              <Terminal size={20} className="mr-2 text-indigo-500" />
              Execution Logs
            </h2>
            <button 
              onClick={() => setShowLogs(false)} 
              className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          </div>
          
          <div className="flex-1 overflow-auto bg-slate-900 text-slate-100 p-4 font-mono rounded-lg max-h-[calc(90vh-120px)]">
            <pre className="whitespace-pre-wrap">{logs}</pre>
          </div>
          
          <div className="mt-4 flex justify-end sticky bottom-0 bg-white dark:bg-slate-800 z-10 pt-4 border-t border-slate-200 dark:border-slate-700">
            <button 
              onClick={() => setShowLogs(false)}
              className="px-4 py-2 rounded-lg bg-slate-200 text-slate-800 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Load configuration on initial render
  useEffect(() => {
    loadConfig();
  }, []);

  // Modify loadConfig function to better handle errors and missing files
  const loadConfig = async () => {
    try {
      setIsLoading(true);
      
      // Use fetch to get the controller.yaml file
      const response = await fetch('/controller.yaml');
      
      // If file doesn't exist, create a default configuration
      if (response.status === 404) {
        console.log("Creating new controller.yaml file with default structure");
        
        setGlobalConfig({
          schedule: '* * * * *',
          s3: {
            name: '',
            access_key: '',
            secret_key: ''
          }
        });
        
        setSteps([]);
        setIsLoading(false);
        return;
      }
      
      if (!response.ok) {
        throw new Error(`Failed to load controller.yaml: ${response.status} ${response.statusText}`);
      }
      
      const yamlContent = await response.text();
      console.log("Loaded YAML content:", yamlContent);
      
      // Parse YAML with js-yaml instead of regex
      const parsedYaml = yaml.load(yamlContent);
      console.log("Parsed YAML:", parsedYaml);
      
      // Extract schedule
      const schedule = parsedYaml.schedule || '* * * * *';
      
      // Extract s3 config
      const s3Config = {
        name: '',
        access_key: '',
        secret_key: ''
      };
      
      if (Array.isArray(parsedYaml.s3)) {
        parsedYaml.s3.forEach(item => {
          if (item.name) s3Config.name = item.name;
          if (item.access_key) s3Config.access_key = item.access_key;
          if (item.secret_key) s3Config.secret_key = item.secret_key;
        });
      }
      
      // Process steps to add the type field
      let parsedSteps = [];
      if (Array.isArray(parsedYaml.steps)) {
        parsedSteps = parsedYaml.steps.map(step => {
          const { name, execute, table, database } = step;
          
          let type = "Python"; // Default type
          
          if (execute === "s3") {
            type = "S3 Upload";
          } else if (table && execute.endsWith(".json")) {
            type = "SQL Insert";
          } else if (table && execute.endsWith(".sql")) {
            type = "SQL Query";
          } else if (database && execute.endsWith(".sql")) {
            type = "SQL Script";
          }
          
          return { ...step, type };
        });
      }
      
      setGlobalConfig({
        schedule,
        s3: s3Config
      });
      
      setSteps(parsedSteps);
      
    } catch (error) {
      console.error("Error loading configuration:", error);
      alert(`Error loading configuration: ${error.message}`);
      
      // Set defaults on error
      setGlobalConfig({
        schedule: '* * * * *',
        s3: {
          name: '',
          access_key: '',
          secret_key: ''
        }
      });
      
      setSteps([]);
    } finally {
      setIsLoading(false);
    }
  };

  const saveConfig = async () => {
    try {
      setIsLoading(true);
      
      // Format the s3 configuration as an array of objects for YAML output
      const s3Array = [
        { name: globalConfig.s3.name },
        { access_key: globalConfig.s3.access_key },
        { secret_key: globalConfig.s3.secret_key }
      ];
      
      // Prepare steps without the type field (since it's not in the file format)
      const cleanSteps = steps.map(step => {
        const { type, ...cleanStep } = step;
        return cleanStep;
      });
      
      // Create the config object
      const configToSave = {
        schedule: globalConfig.schedule,
        s3: s3Array,
        steps: cleanSteps
      };
      
      // Convert to YAML
      const yamlContent = yaml.dump(configToSave);
      
      // Use fetch to save the controller.yaml file
      const response = await fetch('/save-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: yamlContent }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to save configuration: ${response.status} ${response.statusText}`);
      }
      
      // Show success notification instead of alert
      showNotification("Configuration saved successfully", "success");
    } catch (error) {
      console.error("Error saving configuration:", error);
      showNotification(`Error saving configuration: ${error.message}`, "error");
    } finally {
      setIsLoading(false);
    }
  };

  // New notification system
  const [notification, setNotification] = useState({ show: false, message: '', type: 'info' });
  
  const showNotification = (message, type = 'info') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: '', type: 'info' }), 3000);
  };
  
  const Notification = () => {
    if (!notification.show) return null;
    
    const bgColor = notification.type === 'success' ? 'bg-emerald-500' : 
                    notification.type === 'error' ? 'bg-rose-500' : 
                    notification.type === 'warning' ? 'bg-amber-500' : 'bg-sky-500';
    
    const icon = notification.type === 'success' ? <CheckCircle size={20} /> : 
                notification.type === 'error' ? <XCircle size={20} /> : 
                notification.type === 'warning' ? <AlertCircle size={20} /> : <HelpCircle size={20} />;
    
    return (
      <div className={`fixed top-4 right-4 z-50 ${bgColor} text-white px-4 py-3 rounded-lg shadow-lg flex items-center max-w-sm animate-fade-in-down`}>
        <span className="mr-2">{icon}</span>
        <p>{notification.message}</p>
      </div>
    );
  };

  // New function to load file content
  const loadFileContent = async (filePath) => {
    try {
      if (!filePath) return '';
      
      const response = await fetch(`/file-content?path=${encodeURIComponent(filePath)}`);
      
      if (response.status === 404) {
        console.log(`File not found: ${filePath}, will create when saved`);
        return '';
      }
      
      if (!response.ok) {
        throw new Error(`Failed to load file: ${response.status} ${response.statusText}`);
      }
      
      const content = await response.text();
      return content;
    } catch (error) {
      console.error(`Error loading file ${filePath}:`, error);
      return '';
    }
  };

  // New function to save file content
  const saveFileContent = async (filePath, content) => {
    try {
      const response = await fetch('/save-file', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ path: filePath, content }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to save file: ${response.status} ${response.statusText}`);
      }
      
      console.log(`File saved: ${filePath}`);
      return true;
    } catch (error) {
      console.error(`Error saving file ${filePath}:`, error);
      showNotification(`Error saving file ${filePath}: ${error.message}`, "error");
      return false;
    }
  };
  
  const executeTerminalCommand = async (command, successMessage) => {
    try {
      setIsLoading(true);
      setLogs(`Executing: ${command}\n...`);
      setShowLogs(true);
      
      // Use fetch to execute the command
      const response = await fetch('/execute-command', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ command }),
      });
      
      if (!response.ok) {
        throw new Error(`Command execution failed: ${response.status} ${response.statusText}`);
      }
      
      const result = await response.json();
      
      setLogs(`Executing: ${command}\n\n${result.output}`);
      
      if (result.success) {
        console.log(`${successMessage}: ${result.output}`);
        showNotification(successMessage, "success");
      } else {
        console.error(`Command failed: ${result.error}`);
        showNotification(`Command failed: ${result.error}`, "error");
      }
    } catch (error) {
      console.error("Error executing command:", error);
      setLogs(`Error executing ${command}: ${error.message}`);
      showNotification(`Error executing command: ${error.message}`, "error");
    } finally {
      setIsLoading(false);
    }
  };

  const runFlow = () => {
    const command = 'bash bin/run';
    executeTerminalCommand(command, 'Flow tested successfully');
  };

  const deployFlow = () => {
    executeTerminalCommand('bash bin/deploy', 'Flow deployed successfully');
  };

  const stopFlow = () => {
    executeTerminalCommand('bash bin/docker-stop', 'Flow stopped successfully');
  };

  const viewLogs = () => {
    executeTerminalCommand('bash bin/docker-logs', 'Logs retrieved successfully');
  };

  const addStep = () => {
    const newStep = {
      name: "New Step",
      execute: "",
      type: "Python"
    };
    
    setSteps([...steps, newStep]);
    setEditingStepIndex(steps.length);
  };

  const deleteStep = (index) => {
    const updatedSteps = [...steps];
    updatedSteps.splice(index, 1);
    setSteps(updatedSteps);
    
    if (editingStepIndex === index) {
      setEditingStepIndex(null);
    }
  };

  const updateStep = (index, updatedStep) => {
    const updatedSteps = [...steps];
    updatedSteps[index] = updatedStep;
    setSteps(updatedSteps);
  };

  // Handle step dragging and reordering
  const handleDragStart = (e, index) => {
    setIsDragging(true);
    setDragIndex(index);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === index) return;
    
    const newSteps = [...steps];
    const draggedStep = newSteps[dragIndex];
    
    // Remove the dragged step
    newSteps.splice(dragIndex, 1);
    // Insert it at the new position
    newSteps.splice(index, 0, draggedStep);
    
    setSteps(newSteps);
    setDragIndex(index);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    setDragIndex(null);
  };

  // Enhanced Flow Node Component
  const StepNode = ({ step, index }) => {
    const typeInfo = stepTypeIcons[step.type] || { 
      icon: <HelpCircle size={20} />, 
      color: 'bg-slate-100 text-slate-700 border-slate-200' 
    };
    
    return (
      <div 
        draggable={true}
        onDragStart={(e) => handleDragStart(e, index)}
        onDragOver={(e) => handleDragOver(e, index)}
        onDragEnd={handleDragEnd}
        className={`flex flex-col items-center ${isDragging && dragIndex === index ? 'opacity-50' : 'opacity-100'} transition-opacity duration-200`}
      >
        {/* Step Node */}
        <div 
          className={`relative rounded-xl ${themeColors.stepBackground} ${themeColors.stepBorder} ${themeColors.stepShadow} border-2 w-36 h-36 flex flex-col items-center justify-center cursor-pointer transition-all duration-200 group hover:border-indigo-400 ${index === editingStepIndex ? themeColors.stepBorderActive : ''}`}
          onClick={() => setEditingStepIndex(index)}
        >
          {/* Delete button */}
          <button 
            onClick={(e) => {
              e.stopPropagation();
              deleteStep(index);
            }}
            className="absolute -top-2 -right-2 rounded-full bg-rose-500 text-white p-1.5 hover:bg-rose-600 shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10"
            aria-label="Delete step"
          >
            <Trash2 size={14} />
          </button>
          
          {/* Step type badge */}
          <div className={`mb-3 px-3 py-1 rounded-full ${typeInfo.color} text-xs font-medium flex items-center`}>
            <span className="mr-1">{typeInfo.icon}</span>
            {step.type}
          </div>
          
          {/* Step icon */}
          <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center mb-2">
            {step.type === "Python" && <Code size={24} className="text-indigo-600" />}
            {step.type === "SQL Insert" && <Database size={24} className="text-emerald-600" />}
            {step.type === "SQL Query" && <FileText size={24} className="text-teal-600" />}
            {step.type === "SQL Script" && <Server size={24} className="text-violet-600" />}
            {step.type === "S3 Upload" && <Cloud size={24} className="text-amber-600" />}
          </div>
          
          {/* Step name */}
          <div className="text-center px-2">
            <h3 className="font-medium text-slate-800 dark:text-white truncate max-w-full">{step.name}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-full">
              {step.execute === 's3' ? 'S3 Upload' : step.execute}
            </p>
          </div>
        </div>
        
        {/* Connector Line */}
        {index < steps.length - 1 && (
          <div className="my-2 w-16 flex items-center justify-center relative">
            <div className="h-10 border-r-2 border-dashed border-slate-300 dark:border-slate-600 absolute"></div>
          </div>
        )}
      </div>
    );
  };

  const StepEditForm = ({ step, index }) => {
    const [formData, setFormData] = useState({...step});
    const [fileContent, setFileContent] = useState('');
    const [tableContent, setTableContent] = useState('');
    const [activeTab, setActiveTab] = useState('details');
    const [isLoadingFiles, setIsLoadingFiles] = useState(false);
    
    // Load file content when the modal is opened
    useEffect(() => {
      const loadFiles = async () => {
        setIsLoadingFiles(true);
        
        // Load the execute file content
        if (formData.execute && formData.execute !== 's3') {
          const content = await loadFileContent('model/'+formData.execute);
          setFileContent(content);
        }
        
        // Load the table YAML content if it exists
        if (formData.table) {
          const content = await loadFileContent('model/'+formData.table);
          
          if (content) {
            setTableContent(content);
          } else {
            // Set default table YAML if none exists
            setTableContent(`name: new_table
database: demo
primary_key: id
schema_definition:
  - [id, INTEGER]
  - [name, VARCHAR]
  - [created_at, TIMESTAMP]
error_behavior: "null"
`);
          }
        }
        
        setIsLoadingFiles(false);
      };
      
      loadFiles();
    }, [formData.execute, formData.table]);
    
    const handleChange = (e) => {
      setFormData({
        ...formData,
        [e.target.name]: e.target.value
      });
    };
    
    const handleTypeChange = (e) => {
      const newType = e.target.value;
      let updatedForm = {
        ...formData,
        type: newType,
        name: formData.name,
        execute: formData.execute
      };
      
      // Reset fields based on type
      if (newType === "Python") {
        delete updatedForm.table;
        delete updatedForm.database;
        if (!updatedForm.execute || !updatedForm.execute.endsWith('.py')) {
          updatedForm.execute = updatedForm.name.toLowerCase().replace(/\s+/g, '_') + '.py';
          setFileContent('# Python script\n\ndef main():\n    print("Hello World")\n\nif __name__ == "__main__":\n    main()');
        }
      } else if (newType === "SQL Insert") {
        updatedForm.table = formData.table || (updatedForm.name.toLowerCase().replace(/\s+/g, '_') + '.yml');
        delete updatedForm.database;
        if (!updatedForm.execute || !updatedForm.execute.endsWith('.json')) {
          updatedForm.execute = updatedForm.name.toLowerCase().replace(/\s+/g, '_') + '.json';
          setFileContent('[\n  {\n    "id": 1,\n    "name": "Sample Data",\n    "created_at": "2025-01-01 00:00:00"\n  }\n]');
        }
        
        // Set default table content if not already set
        if (!tableContent) {
          setTableContent(`name: ${updatedForm.name.toLowerCase().replace(/\s+/g, '_')}
database: demo
primary_key: id
schema_definition:
  - [id, INTEGER]
  - [name, VARCHAR]
  - [created_at, TIMESTAMP]
error_behavior: "null"
`);
        }
      } else if (newType === "SQL Query") {
        updatedForm.table = formData.table || (updatedForm.name.toLowerCase().replace(/\s+/g, '_') + '.yml');
        delete updatedForm.database;
        if (!updatedForm.execute || !updatedForm.execute.endsWith('.sql')) {
          updatedForm.execute = updatedForm.name.toLowerCase().replace(/\s+/g, '_') + '.sql';
          setFileContent('SELECT * FROM some_table WHERE condition = true;');
        }
        
        // Set default table content if not already set
        if (!tableContent) {
          setTableContent(`name: ${updatedForm.name.toLowerCase().replace(/\s+/g, '_')}
database: demo
primary_key: id
schema_definition:
  - [id, INTEGER]
  - [name, VARCHAR]
  - [created_at, TIMESTAMP]
error_behavior: "null"
`);
        }
      } else if (newType === "SQL Script") {
        delete updatedForm.table;
        updatedForm.database = formData.database || 'demo';
        if (!updatedForm.execute || !updatedForm.execute.endsWith('.sql')) {
          updatedForm.execute = updatedForm.name.toLowerCase().replace(/\s+/g, '_') + '.sql';
          setFileContent('-- SQL Script\n\nCREATE TABLE IF NOT EXISTS example_table (\n  id INTEGER PRIMARY KEY,\n  name VARCHAR,\n  created_at TIMESTAMP\n);\n');
        }
      } else if (newType === "S3 Upload") {
        delete updatedForm.table;
        delete updatedForm.database;
        updatedForm.execute = "s3";
        setFileContent('');
      }
      
      setFormData(updatedForm);
    };
    
    const handleFileContentChange = (e) => {
      setFileContent(e.target.value);
    };
    
    const handleTableContentChange = (e) => {
      setTableContent(e.target.value);
    };
    
    const handleSave = async () => {
      try {
        setIsLoading(true);
        
        // Save the execute file if not S3
        if (formData.execute && formData.execute !== 's3' && fileContent !== '') {
          await saveFileContent('model/'+formData.execute, fileContent);
        }
        
        // Save the table YAML file if it exists
        if (formData.table && tableContent !== '') {
          await saveFileContent('model/'+formData.table, tableContent);
        }
        
        // Update the step in the main state
        updateStep(index, formData);
        setEditingStepIndex(null);
        showNotification("Step updated successfully", "success");
      } catch (error) {
        console.error("Error saving files:", error);
        showNotification(`Error saving files: ${error.message}`, "error");
      } finally {
        setIsLoading(false);
      }
    };
    
    // Get step type icon and color
    const typeInfo = stepTypeIcons[formData.type] || { 
      icon: <HelpCircle className="text-slate-500" size={20} />, 
      color: 'bg-slate-100 text-slate-700 border-slate-200' 
    };
    
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-slate-900 bg-opacity-70 z-50 overflow-y-auto p-4 backdrop-blur-sm">
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto relative">
          <div className="flex justify-between items-center mb-4 sticky top-0 bg-white dark:bg-slate-800 z-10 pb-4 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center">
              <div className={`w-10 h-10 rounded-lg ${typeInfo.color} flex items-center justify-center mr-3`}>
                {typeInfo.icon}
              </div>
              <h2 className="text-xl font-semibold text-slate-800 dark:text-white">
                Edit {formData.type} Step
              </h2>
            </div>
            <button 
              onClick={() => setEditingStepIndex(null)} 
              className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          </div>
          
          {/* Tab Navigation */}
          <div className="flex mb-6 border-b border-slate-200 dark:border-slate-700">
            <button 
              className={`py-2 px-4 relative ${activeTab === 'details' ? 'text-indigo-600 dark:text-indigo-400 font-medium' : 'text-slate-600 dark:text-slate-400'}`}
              onClick={() => setActiveTab('details')}
            >
              Step Details
              {activeTab === 'details' && (
                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600 dark:bg-indigo-400"></div>
              )}
            </button>
            {formData.execute && formData.execute !== 's3' && (
              <button 
                className={`py-2 px-4 relative ${activeTab === 'file' ? 'text-indigo-600 dark:text-indigo-400 font-medium' : 'text-slate-600 dark:text-slate-400'}`}
                onClick={() => setActiveTab('file')}
              >
                {formData.execute.endsWith('.py') ? 'Python Code' : 
                 formData.execute.endsWith('.sql') ? 'SQL Script' : 
                 formData.execute.endsWith('.json') ? 'JSON Data' : 'File Content'}
                {activeTab === 'file' && (
                  <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600 dark:bg-indigo-400"></div>
                )}
              </button>
            )}
            {formData.table && (
              <button 
                className={`py-2 px-4 relative ${activeTab === 'table' ? 'text-indigo-600 dark:text-indigo-400 font-medium' : 'text-slate-600 dark:text-slate-400'}`}
                onClick={() => setActiveTab('table')}
              >
                Table Definition
                {activeTab === 'table' && (
                  <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600 dark:bg-indigo-400"></div>
                )}
              </button>
            )}
          </div>
          
          {isLoadingFiles && (
            <div className="flex justify-center items-center p-6">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
              <span className="ml-3 text-slate-600 dark:text-slate-300">Loading file content...</span>
            </div>
          )}
          
          {/* Tab Content */}
          {activeTab === 'details' && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Step Type</label>
                  <select 
                    name="type" 
                    value={formData.type} 
                    onChange={handleTypeChange}
                    className="w-full p-2.5 rounded-lg bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="Python">Python</option>
                    <option value="SQL Insert">SQL Insert</option>
                    <option value="SQL Query">SQL Query</option>
                    <option value="SQL Script">SQL Script</option>
                    <option value="S3 Upload">S3 Upload</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Step Name</label>
                  <input 
                    type="text" 
                    name="name" 
                    value={formData.name} 
                    onChange={handleChange}
                    className="w-full p-2.5 rounded-lg bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" 
                  />
                </div>
              </div>
              
              {(formData.type === "SQL Insert" || formData.type === "SQL Query") && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Table Definition File</label>
                  <div className="flex">
                    <input 
                      type="text" 
                      name="table" 
                      value={formData.table || ""} 
                      onChange={handleChange}
                      className="flex-1 p-2.5 rounded-l-lg bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" 
                    />
                    <button
                      onClick={() => setActiveTab('table')}
                      className="px-3 rounded-r-lg border border-l-0 border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-500"
                    >
                      <FileText size={18} />
                    </button>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Path to YAML file defining the table structure</p>
                </div>
              )}
              
              {formData.type === "SQL Script" && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Database</label>
                  <input 
                    type="text" 
                    name="database" 
                    value={formData.database || ""} 
                    onChange={handleChange}
                    className="w-full p-2.5 rounded-lg bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" 
                  />
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Execute</label>
                <div className="flex">
                  <input 
                    type="text" 
                    name="execute" 
                    value={formData.execute} 
                    onChange={handleChange}
                    className="flex-1 p-2.5 rounded-lg bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    disabled={formData.type === "S3 Upload"}
                  />
                  {formData.execute && formData.execute !== 's3' && (
                    <button
                      onClick={() => setActiveTab('file')}
                      className="ml-2 px-3 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-500"
                    >
                      <Code size={18} />
                    </button>
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {formData.type === "Python" ? "Path to Python (.py) file" : 
                   formData.type === "SQL Insert" ? "Path to JSON (.json) file" : 
                   formData.type === "SQL Query" || formData.type === "SQL Script" ? "Path to SQL (.sql) file" : 
                   ""}
                </p>
              </div>
            </div>
          )}
          
          {activeTab === 'file' && (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  {formData.execute.endsWith('.py') ? <Code className="text-blue-600 mr-2" size={18} /> : 
                   formData.execute.endsWith('.sql') ? <Database className="text-emerald-600 mr-2" size={18} /> : 
                   formData.execute.endsWith('.json') ? <FileText className="text-amber-600 mr-2" size={18} /> : 
                   <FileText className="text-slate-600 mr-2" size={18} />}
                  <h3 className="font-medium text-slate-800 dark:text-white">
                    {formData.execute.endsWith('.py') ? 'Python Script' : 
                     formData.execute.endsWith('.sql') ? 'SQL Script' : 
                     formData.execute.endsWith('.json') ? 'JSON Data' : 'File Content'}
                  </h3>
                </div>
                <div className="text-sm px-2 py-1 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                  {formData.execute}
                </div>
              </div>
              
              <div className="relative">
                <textarea 
                  value={fileContent} 
                  onChange={handleFileContentChange}
                  className="w-full h-96 p-4 font-mono text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  spellCheck="false"
                />
                
                <div className="absolute top-2 right-2">
                  <div className="px-2 py-1 text-xs rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                    {formData.execute.endsWith('.py') ? 'Python' : 
                     formData.execute.endsWith('.sql') ? 'SQL' : 
                     formData.execute.endsWith('.json') ? 'JSON' : 'Text'}
                  </div>
                </div>
              </div>
              
              {formData.execute.endsWith('.py') && (
                <p className="text-xs text-slate-500 dark:text-slate-400">Python file content. This will be executed as a Python script.</p>
              )}
              {formData.execute.endsWith('.sql') && (
                <p className="text-xs text-slate-500 dark:text-slate-400">SQL content. This will be executed against the database.</p>
              )}
              {formData.execute.endsWith('.json') && (
                <p className="text-xs text-slate-500 dark:text-slate-400">JSON data to be inserted into the table.</p>
              )}
            </div>
          )}
          
          {activeTab === 'table' && (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <Database className="text-indigo-600 mr-2" size={18} />
                  <h3 className="font-medium text-slate-800 dark:text-white">Table Definition (YAML)</h3>
                </div>
                <div className="text-sm px-2 py-1 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                  {formData.table}
                </div>
              </div>
              
              <div className="relative">
                <textarea 
                  value={tableContent} 
                  onChange={handleTableContentChange}
                  className="w-full h-96 p-4 font-mono text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  spellCheck="false"
                />
                <div className="absolute top-2 right-2">
                  <div className="px-2 py-1 text-xs rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                    YAML
                  </div>
                </div>
              </div>
              
              <p className="text-xs text-slate-500 dark:text-slate-400">YAML definition for the table structure. This defines the schema for the SQL operations.</p>
            </div>
          )}
          
          <div className="mt-6 flex justify-end sticky bottom-0 bg-white dark:bg-slate-800 z-10 pt-4 border-t border-slate-200 dark:border-slate-700">
            <button 
              onClick={() => setEditingStepIndex(null)}
              className="px-4 py-2 rounded-lg bg-slate-200 text-slate-800 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600 mr-3"
            >
              Cancel
            </button>
            <button 
              onClick={handleSave}
              disabled={isLoading}
              className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 flex items-center disabled:opacity-50 disabled:hover:bg-indigo-600"
            >
              <Save size={18} className="mr-1.5" />
              Save Changes
            </button>
          </div>
        </div>
      </div>
    );
  };

  const SettingsModal = () => {
    const [settings, setSettings] = useState({...globalConfig});
    
    const handleChange = (e) => {
      const { name, value } = e.target;
      if (name.startsWith('s3.')) {
        const s3Field = name.split('.')[1];
        setSettings({
          ...settings,
          s3: {
            ...settings.s3,
            [s3Field]: value
          }
        });
      } else {
        setSettings({
          ...settings,
          [name]: value
        });
      }
    };
    
    const handleSave = () => {
      setGlobalConfig(settings);
      setShowSettingsModal(false);
      showNotification("Settings updated successfully", "success");
    };
    
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-slate-900 bg-opacity-70 z-50 overflow-y-auto p-4 backdrop-blur-sm">
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto relative">
          <div className="flex justify-between items-center mb-4 sticky top-0 bg-white dark:bg-slate-800 z-10 pb-4 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center">
              <Settings size={20} className="text-indigo-500 mr-2" />
              <h2 className="text-xl font-semibold text-slate-800 dark:text-white">Global Settings</h2>
            </div>
            <button onClick={() => setShowSettingsModal(false)} className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white transition-colors">
              <X size={20} />
            </button>
          </div>
          
          {/* Form content */}
          <div className="space-y-5 mt-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Schedule (Cron Expression)</label>
              <div className="flex items-center">
                <Clock size={18} className="text-slate-400 mr-2" />
                <input 
                  type="text" 
                  name="schedule" 
                  value={settings.schedule} 
                  onChange={handleChange}
                  className="flex-1 p-2.5 rounded-lg bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" 
                />
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">Format: "* * * * *" (minute hour day month weekday)</p>
            </div>
            
            <div className="pt-3 border-t border-slate-200 dark:border-slate-700">
              <h3 className="font-medium text-slate-800 dark:text-white flex items-center mb-3">
                <Cloud size={18} className="text-amber-500 mr-2" />
                S3 Connection Parameters
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Bucket Name</label>
                  <input 
                    type="text" 
                    name="s3.name" 
                    value={settings.s3.name} 
                    onChange={handleChange}
                    className="w-full p-2.5 rounded-lg bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" 
                    placeholder="my-s3-bucket"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Access Key</label>
                  <input 
                    type="password" 
                    name="s3.access_key" 
                    value={settings.s3.access_key} 
                    onChange={handleChange}
                    className="w-full p-2.5 rounded-lg bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" 
                    placeholder="AKIAXXXXXXXXXXXXXXXX"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Secret Key</label>
                  <input 
                    type="password" 
                    name="s3.secret_key" 
                    value={settings.s3.secret_key} 
                    onChange={handleChange}
                    className="w-full p-2.5 rounded-lg bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" 
                    placeholder="XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
                  />
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-6 flex justify-end sticky bottom-0 bg-white dark:bg-slate-800 z-10 pt-4 border-t border-slate-200 dark:border-slate-700">
            <button 
              onClick={() => setShowSettingsModal(false)}
              className="px-4 py-2 rounded-lg bg-slate-200 text-slate-800 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600 mr-3"
            >
              Cancel
            </button>
            <button 
              onClick={handleSave}
              className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 flex items-center"
            >
              <Save size={18} className="mr-1.5" />
              Save Settings
            </button>
          </div>
        </div>
      </div>
    );
  };
  
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="container mx-auto px-4 py-6">
        <header className="bg-white dark:bg-slate-800 shadow-md rounded-xl p-5 mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-1">Data Workflow Designer</h1>
            <p className="text-slate-500 dark:text-slate-400">Create, configure, and manage your ETL workflows</p>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <button 
              onClick={saveConfig}
              disabled={isLoading}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center disabled:opacity-50 shadow-sm"
            >
              <Save size={18} className="mr-1.5" />
              Save Config
            </button>
            
            <button 
              onClick={() => setShowSettingsModal(true)}
              disabled={isLoading}
              className="bg-slate-200 text-slate-800 px-4 py-2 rounded-lg hover:bg-slate-300 flex items-center disabled:opacity-50 shadow-sm dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
            >
              <Settings size={18} className="mr-1.5" />
              Settings
            </button>
          </div>
        </header>
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3">
            <div className="bg-white dark:bg-slate-800 shadow-md rounded-xl p-6 h-full">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-slate-800 dark:text-white flex items-center">
                  <Server size={20} className="text-indigo-500 mr-2" />
                  Workflow Steps
                </h2>
                <button 
                  onClick={addStep}
                  disabled={isLoading}
                  className="bg-emerald-500 text-white px-3 py-2 rounded-lg hover:bg-emerald-600 flex items-center disabled:opacity-50 shadow-sm"
                >
                  <Plus size={18} className="mr-1.5" />
                  Add Step
                </button>
              </div>
              
              {steps.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-16 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
                  <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center mb-4">
                    <AlertCircle size={32} className="text-slate-400 dark:text-slate-500" />
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 text-center mb-4">No steps defined yet. Create your first workflow step.</p>
                  <button 
                    onClick={addStep}
                    className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300 px-4 py-2 rounded-lg hover:bg-indigo-200 dark:hover:bg-indigo-800 flex items-center"
                  >
                    <Plus size={18} className="mr-1.5" />
                    Create First Step
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto pb-4">
                  <div className="flex flex-col items-center space-y-2 min-w-max">
                    {steps.map((step, index) => (
                      <StepNode key={index} step={step} index={index} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="bg-white dark:bg-slate-800 shadow-md rounded-xl p-6">
            <h2 className="text-xl font-semibold text-slate-800 dark:text-white flex items-center mb-6">
              <Play size={20} className="text-indigo-500 mr-2" />
              Workflow Actions
            </h2>
            
            <div className="space-y-4">
              <button 
                onClick={runFlow}
                disabled={isLoading}
                className="w-full bg-amber-500 text-white px-4 py-3 rounded-lg hover:bg-amber-600 flex items-center justify-center disabled:opacity-50 transition-colors shadow-sm"
              >
                <Play size={18} className="mr-2" />
                Test Workflow
              </button>
              
              <button 
                onClick={deployFlow}
                disabled={isLoading}
                className="w-full bg-emerald-500 text-white px-4 py-3 rounded-lg hover:bg-emerald-600 flex items-center justify-center disabled:opacity-50 transition-colors shadow-sm"
              >
                <Upload size={18} className="mr-2" />
                Deploy & Start
              </button>
              
              <button 
                onClick={stopFlow}
                disabled={isLoading}
                className="w-full bg-rose-500 text-white px-4 py-3 rounded-lg hover:bg-rose-600 flex items-center justify-center disabled:opacity-50 transition-colors shadow-sm"
              >
                <X size={18} className="mr-2" />
                Stop Workflow
              </button>
              
              <button 
                onClick={viewLogs}
                disabled={isLoading}
                className="w-full bg-slate-700 text-white px-4 py-3 rounded-lg hover:bg-slate-800 flex items-center justify-center disabled:opacity-50 transition-colors shadow-sm dark:bg-slate-600 dark:hover:bg-slate-700"
              >
                <Terminal size={18} className="mr-2" />
                View Logs
              </button>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-700">
              <h3 className="text-slate-600 dark:text-slate-300 font-medium mb-3 flex items-center">
                <Calendar className="mr-2" size={16} />
                Schedule Information
              </h3>
              <div className="bg-slate-50 dark:bg-slate-700 p-3 rounded-lg">
                <div className="flex items-center mb-1">
                  <Clock size={14} className="text-slate-400 mr-1.5" />
                  <p className="text-sm text-slate-600 dark:text-slate-300">Running on cron:</p>
                </div>
                <code className="block bg-white dark:bg-slate-800 p-2 rounded text-xs font-mono text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-600">
                  {globalConfig.schedule}
                </code>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {editingStepIndex !== null && (
        <StepEditForm step={steps[editingStepIndex]} index={editingStepIndex} />
      )}
      
      {showSettingsModal && <SettingsModal />}
      
      {showLogs && <LogsModal />}
      
      <Notification />
      
      <LoadingOverlay />
    </div>
  );
};

export default App;
