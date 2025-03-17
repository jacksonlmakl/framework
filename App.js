import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Settings, Play, Upload, AlertCircle, Terminal, X, Save, Edit2 } from 'lucide-react';

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

  // Load configuration on initial render
  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      // In a real app, this would use the actual file system API
      // Here we'll use the actual structure from the uploaded controller.yaml
      console.log("Loading controller.yaml");
      
      // Parse the YAML content from controller.yaml
      const yamlContent = `schedule: "* * * * *"  # Run Every Minute
s3: 
 - name: "jacksonnnn"
 - access_key: "AKIAY6QVZNFW72362DFZ"
 - secret_key: "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"
 
steps:
  - name: "Replicate Data"
    execute: "model/replicate.py"
    
  - name: "Initialize Table & Insert Replication Data"
    table: "model/table.yaml"
    execute: "model/data.json"
  
  - name: "Transform Table With SQL Query"
    table: "model/table.yaml"
    execute: "model/table.sql"
    
  - name: "Execute SQL Script on DB"
    database: "demo"
    execute: "model/test.sql"
    
  - name: "Upload DB To S3"
    execute: "s3"`;
      
      // Parse the YAML structure
      // In a real implementation, we would use a proper YAML parser
      // For simplicity, we'll parse it manually here
      
      // Extract schedule
      const scheduleMatch = yamlContent.match(/schedule: "([^"]*)"/);
      const schedule = scheduleMatch ? scheduleMatch[1] : "";
      
      // Extract s3 configuration
      const s3ConfigLines = yamlContent.match(/s3:[\s\S]*?(?=steps:|$)/)[0];
      const s3NameMatch = s3ConfigLines.match(/name: "([^"]*)"/);
      const s3AccessKeyMatch = s3ConfigLines.match(/access_key: "([^"]*)"/);
      const s3SecretKeyMatch = s3ConfigLines.match(/secret_key: "([^"]*)"/);
      
      const s3Config = {
        name: s3NameMatch ? s3NameMatch[1] : "",
        access_key: s3AccessKeyMatch ? s3AccessKeyMatch[1] : "",
        secret_key: s3SecretKeyMatch ? s3SecretKeyMatch[1] : ""
      };
      
      // Extract steps
      const stepsSection = yamlContent.match(/steps:[\s\S]*/)[0];
      const stepBlocks = stepsSection.split(/\s{2}-\s/).slice(1);
      
      const parsedSteps = stepBlocks.map(block => {
        const nameMatch = block.match(/name: "([^"]*)"/);
        const executeMatch = block.match(/execute: "([^"]*)"/);
        const tableMatch = block.match(/table: "([^"]*)"/);
        const databaseMatch = block.match(/database: "([^"]*)"/);
        
        const name = nameMatch ? nameMatch[1] : "";
        const execute = executeMatch ? executeMatch[1] : "";
        
        let type = "Python"; // Default type
        
        if (execute === "s3") {
          type = "S3 Upload";
        } else if (tableMatch && execute.endsWith(".json")) {
          type = "SQL Insert";
        } else if (tableMatch && execute.endsWith(".sql")) {
          type = "SQL Query";
        } else if (databaseMatch && execute.endsWith(".sql")) {
          type = "SQL Script";
        }
        
        const step = { name, execute, type };
        
        if (tableMatch) {
          step.table = tableMatch[1];
        }
        
        if (databaseMatch) {
          step.database = databaseMatch[1];
        }
        
        return step;
      });
      
      setGlobalConfig({
        schedule,
        s3: s3Config
      });
      
      setSteps(parsedSteps);
      
    } catch (error) {
      console.error("Error loading configuration:", error);
      setSteps([]);
    }
  };

  const saveConfig = () => {
    // Generate YAML content to save to controller.yaml
    let yamlContent = `schedule: "${globalConfig.schedule}"  # Run Every Minute
s3: 
 - name: "${globalConfig.s3.name}"
 - access_key: "${globalConfig.s3.access_key}"
 - secret_key: "${globalConfig.s3.secret_key}"
 
steps:`;

    // Add each step to the YAML content
    steps.forEach(step => {
      yamlContent += `\n  - name: "${step.name}"`;
      
      if (step.table) {
        yamlContent += `\n    table: "${step.table}"`;
      }
      
      if (step.database) {
        yamlContent += `\n    database: "${step.database}"`;
      }
      
      yamlContent += `\n    execute: "${step.execute}"`;
      
      // Add an empty line between steps for readability
      yamlContent += `\n`;
    });
    
    // In a real app, this would write to the file system
    console.log("Saving configuration:");
    console.log(yamlContent);
    
    // Show a success message
    alert("Configuration saved to controller.yaml");
  };

  const runFlow = () => {
    // Simulate running the flow
    console.log("Running flow with ./bin/run");
    setLogs("Executing ./bin/run\n...\nFlow started successfully.");
    setShowLogs(true);
  };

  const deployFlow = () => {
    // Simulate deploying the flow
    console.log("Deploying flow with ./bin/deploy");
    setLogs("Executing ./bin/deploy\n...\nFlow deployed successfully.");
    setShowLogs(true);
  };

  const stopFlow = () => {
    // Simulate stopping the flow
    console.log("Stopping flow with sudo docker stop framework-scheduler");
    setLogs("Executing sudo docker stop framework-scheduler\n...\nFlow stopped successfully.");
    setShowLogs(true);
  };

  const viewLogs = () => {
    // Simulate viewing logs
    console.log("Viewing logs with sudo docker logs framework-scheduler");
    setLogs("Executing sudo docker logs framework-scheduler\n\n[2025-03-17 10:15:23] INFO: Starting workflow\n[2025-03-17 10:15:24] INFO: Step 1 completed\n[2025-03-17 10:15:25] INFO: Step 2 completed\n[2025-03-17 10:15:27] INFO: Step 3 completed\n[2025-03-17 10:15:28] INFO: Step 4 completed\n[2025-03-17 10:15:30] INFO: Step 5 completed\n[2025-03-17 10:15:31] INFO: Workflow completed successfully");
    setShowLogs(true);
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
              <p className="text-xs text-gray-500 mt-1">Format: "0 0 0 0 0*" (minute hour day month weekday)</p>
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-4">
        <header className="bg-white shadow rounded-lg p-4 mb-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">Workflow Configuration</h1>
          
          <div className="flex space-x-2">
            <button 
              onClick={saveConfig}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 flex items-center"
            >
              <Save size={18} className="mr-1" />
              Save
            </button>
            
            <button 
              onClick={() => setShowSettingsModal(true)}
              className="bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300 flex items-center"
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
                  className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 flex items-center"
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
                className="w-full bg-green-500 text-white px-4 py-3 rounded hover:bg-green-600 flex items-center justify-center"
              >
                <Play size={18} className="mr-2" />
                Run
              </button>
              
              <button 
                onClick={deployFlow}
                className="w-full bg-blue-500 text-white px-4 py-3 rounded hover:bg-blue-600 flex items-center justify-center"
              >
                <Upload size={18} className="mr-2" />
                Deploy
              </button>
              
              <button 
                onClick={stopFlow}
                className="w-full bg-red-500 text-white px-4 py-3 rounded hover:bg-red-600 flex items-center justify-center"
              >
                <X size={18} className="mr-2" />
                Stop
              </button>
              
              <button 
                onClick={viewLogs}
                className="w-full bg-gray-700 text-white px-4 py-3 rounded hover:bg-gray-800 flex items-center justify-center"
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
    </div>
  );
};

export default App;
