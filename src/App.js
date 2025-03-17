import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Settings, Play, Upload, AlertCircle, Terminal, X, Save, Edit2 } from 'lucide-react';
import yaml from 'js-yaml'; // Import js-yaml for parsing YAML files

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
    
    // More flexible parsing approach
    let schedule = '* * * * *'; // Default schedule
    let s3Config = {
      name: '',
      access_key: '',
      secret_key: ''
    };
    let parsedSteps = [];
    
    // Extract schedule
    const scheduleMatch = yamlContent.match(/schedule:\s*"([^"]*)"/);
    if (scheduleMatch && scheduleMatch[1]) {
      schedule = scheduleMatch[1];
    }
    
    // Extract s3 config - make this more flexible
    const s3NameMatch = yamlContent.match(/name:\s*"([^"]*)"/);
    const s3AccessKeyMatch = yamlContent.match(/access_key:\s*"([^"]*)"/);
    const s3SecretKeyMatch = yamlContent.match(/secret_key:\s*"([^"]*)"/);
    
    if (s3NameMatch && s3NameMatch[1]) s3Config.name = s3NameMatch[1];
    if (s3AccessKeyMatch && s3AccessKeyMatch[1]) s3Config.access_key = s3AccessKeyMatch[1];
    if (s3SecretKeyMatch && s3SecretKeyMatch[1]) s3Config.secret_key = s3SecretKeyMatch[1];
    
    // Look for steps section
    if (yamlContent.includes('steps:')) {
      // Extract step blocks - more flexible approach
      const stepRegex = /- name:\s*"([^"]*)"\s*(table:\s*"([^"]*)"\s*)?(database:\s*"([^"]*)"\s*)?execute:\s*"([^"]*)"/g;
      let match;
      
      while ((match = stepRegex.exec(yamlContent)) !== null) {
        const name = match[1];
        const table = match[3] || null;
        const database = match[5] || null;
        const execute = match[6];
        
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
        
        const step = { name, execute, type };
        
        if (table) step.table = table;
        if (database) step.database = database;
        
        parsedSteps.push(step);
      }
    }
    
    // Set state with parsed data
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
       
       alert("Configuration saved to controller.yaml");
     } catch (error) {
       console.error("Error saving configuration:", error);
       alert(`Error saving configuration: ${error.message}`);
     } finally {
       setIsLoading(false);
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
      } else {
        console.error(`Command failed: ${result.error}`);
      }
    } catch (error) {
      console.error("Error executing command:", error);
      setLogs(`Error executing ${command}: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const runFlow = () => {
    executeTerminalCommand('source bin/run', 'Flow started successfully');
  };

  const deployFlow = () => {
    executeTerminalCommand('source bin/deploy', 'Flow deployed successfully');
  };

  const stopFlow = () => {
    executeTerminalCommand('source bin/docker-stop', 'Flow stopped successfully');
  };

  const viewLogs = () => {
    executeTerminalCommand('source bin/docker-logs', 'Logs retrieved successfully');
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

  const StepNode = ({ step, index }) => {
    return (
      <div className="flex flex-col items-center">
        <div className="rounded-full w-24 h-24 border-2 border-gray-300 flex items-center justify-center bg-white hover:bg-gray-50 cursor-pointer relative"
             onClick={() => setEditingStepIndex(index)}>
          <div className="absolute -top-1 -right-1">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                deleteStep(index);
              }}
              className="rounded-full bg-red-500 text-white p-1 hover:bg-red-600"
            >
              <Trash2 size={14} />
            </button>
          </div>
          <div className="text-center p-2">
            {step.type === "Python" && <div className="text-blue-600 text-xl">Py</div>}
            {step.type === "SQL Insert" && <div className="text-green-600 text-xl">SQL+</div>}
            {step.type === "SQL Query" && <div className="text-green-600 text-xl">SQL?</div>}
            {step.type === "SQL Script" && <div className="text-green-600 text-xl">SQL</div>}
            {step.type === "S3 Upload" && <div className="text-yellow-600 text-xl">S3</div>}
            <div className="text-xs mt-1">{step.name}</div>
          </div>
        </div>
        {index < steps.length - 1 && (
          <div className="w-12 h-6 flex items-center justify-center">
            <div className="w-8 h-0.5 bg-gray-400"></div>
            <div className="w-0 h-0 border-y-4 border-y-transparent border-l-8 border-l-gray-400"></div>
          </div>
        )}
      </div>
    );
  };

  const StepEditForm = ({ step, index }) => {
    const [formData, setFormData] = useState({...step});
    
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
      } else if (newType === "SQL Insert" || newType === "SQL Query") {
        updatedForm.table = formData.table || "";
        delete updatedForm.database;
      } else if (newType === "SQL Script") {
        delete updatedForm.table;
        updatedForm.database = formData.database || "";
      } else if (newType === "S3 Upload") {
        delete updatedForm.table;
        delete updatedForm.database;
        updatedForm.execute = "s3";
      }
      
      setFormData(updatedForm);
    };
    
    const handleSave = () => {
      updateStep(index, formData);
      setEditingStepIndex(null);
    };
    
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Edit Step</h2>
            <button onClick={() => setEditingStepIndex(null)} className="text-gray-500 hover:text-gray-700">
              <X size={20} />
            </button>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Step Type</label>
              <select 
                name="type" 
                value={formData.type} 
                onChange={handleTypeChange}
                className="w-full p-2 border border-gray-300 rounded"
              >
                <option value="Python">Python</option>
                <option value="SQL Insert">SQL Insert</option>
                <option value="SQL Query">SQL Query</option>
                <option value="SQL Script">SQL Script</option>
                <option value="S3 Upload">S3 Upload</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input 
                type="text" 
                name="name" 
                value={formData.name} 
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded" 
              />
            </div>
            
            {(formData.type === "SQL Insert" || formData.type === "SQL Query") && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Table</label>
                <input 
                  type="text" 
                  name="table" 
                  value={formData.table || ""} 
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded" 
                />
              </div>
            )}
            
            {formData.type === "SQL Script" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Database</label>
                <input 
                  type="text" 
                  name="database" 
                  value={formData.database || ""} 
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded" 
                />
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Execute</label>
              <input 
                type="text" 
                name="execute" 
                value={formData.execute} 
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded"
                disabled={formData.type === "S3 Upload"}
              />
            </div>
          </div>
          
          <div className="mt-6 flex justify-end">
            <button 
              onClick={handleSave}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
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
    };
    
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Global Settings</h2>
            <button onClick={() => setShowSettingsModal(false)} className="text-gray-500 hover:text-gray-700">
              <X size={20} />
            </button>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Schedule</label>
              <input 
                type="text" 
                name="schedule" 
                value={settings.schedule} 
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded" 
              />
              <p className="text-xs text-gray-500 mt-1">Format: "* * * * *" (minute hour day month weekday)</p>
            </div>
            
            <div className="border-t pt-4">
              <h3 className="font-medium mb-2">S3 Connection Parameters</h3>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bucket Name</label>
                  <input 
                    type="text" 
                    name="s3.name" 
                    value={settings.s3.name} 
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded" 
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Access Key</label>
                  <input 
                    type="password" 
                    name="s3.access_key" 
                    value={settings.s3.access_key} 
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded" 
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Secret Key</label>
                  <input 
                    type="password" 
                    name="s3.secret_key" 
                    value={settings.s3.secret_key} 
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded" 
                  />
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-6 flex justify-end">
            <button 
              onClick={handleSave}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Save Settings
            </button>
          </div>
        </div>
      </div>
    );
  };

  const LogsModal = () => {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-3/4 flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold flex items-center">
              <Terminal size={20} className="mr-2" />
              Logs
            </h2>
            <button onClick={() => setShowLogs(false)} className="text-gray-500 hover:text-gray-700">
              <X size={20} />
            </button>
          </div>
          
          <div className="flex-1 overflow-auto bg-gray-900 text-gray-100 p-4 font-mono rounded">
            <pre>{logs}</pre>
          </div>
          
          <div className="mt-4 flex justify-end">
            <button 
              onClick={() => setShowLogs(false)}
              className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Loading overlay
  const LoadingOverlay = () => {
    return isLoading ? (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-4 rounded-lg shadow-lg">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-3 text-center">Processing...</p>
        </div>
      </div>
    ) : null;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-4">
        <header className="bg-white shadow rounded-lg p-4 mb-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">Workflow Configuration</h1>
          
          <div className="flex space-x-2">
            <button 
              onClick={saveConfig}
              disabled={isLoading}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 flex items-center disabled:opacity-50"
            >
              <Save size={18} className="mr-1" />
              Save
            </button>
            
            <button 
              onClick={() => setShowSettingsModal(true)}
              disabled={isLoading}
              className="bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300 flex items-center disabled:opacity-50"
            >
              <Settings size={18} className="mr-1" />
              Settings
            </button>
          </div>
        </header>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="md:col-span-3">
            <div className="bg-white shadow rounded-lg p-6 min-h-96">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">Flow Steps</h2>
                <button 
                  onClick={addStep}
                  disabled={isLoading}
                  className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 flex items-center disabled:opacity-50"
                >
                  <Plus size={18} className="mr-1" />
                  Add Step
                </button>
              </div>
              
              {steps.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-gray-300 rounded-lg">
                  <AlertCircle size={48} className="text-gray-400 mb-4" />
                  <p className="text-gray-500 text-center">No steps defined yet. Click "Add Step" to create a workflow.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <div className="flex items-center space-x-4 py-4 px-2 min-w-max">
                    {steps.map((step, index) => (
                      <StepNode key={index} step={step} index={index} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-6">Actions</h2>
            
            <div className="space-y-4">
              <button 
                onClick={runFlow}
                disabled={isLoading}
                className="w-full bg-green-500 text-white px-4 py-3 rounded hover:bg-green-600 flex items-center justify-center disabled:opacity-50"
              >
                <Play size={18} className="mr-2" />
                Run
              </button>
              
              <button 
                onClick={deployFlow}
                disabled={isLoading}
                className="w-full bg-blue-500 text-white px-4 py-3 rounded hover:bg-blue-600 flex items-center justify-center disabled:opacity-50"
              >
                <Upload size={18} className="mr-2" />
                Deploy
              </button>
              
              <button 
                onClick={stopFlow}
                disabled={isLoading}
                className="w-full bg-red-500 text-white px-4 py-3 rounded hover:bg-red-600 flex items-center justify-center disabled:opacity-50"
              >
                <X size={18} className="mr-2" />
                Stop
              </button>
              
              <button 
                onClick={viewLogs}
                disabled={isLoading}
                className="w-full bg-gray-700 text-white px-4 py-3 rounded hover:bg-gray-800 flex items-center justify-center disabled:opacity-50"
              >
                <Terminal size={18} className="mr-2" />
                Logs
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {editingStepIndex !== null && (
        <StepEditForm step={steps[editingStepIndex]} index={editingStepIndex} />
      )}
      
      {showSettingsModal && <SettingsModal />}
      
      {showLogs && <LogsModal />}
      
      <LoadingOverlay />
    </div>
  );
};

export default App;
