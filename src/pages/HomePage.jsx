
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const HomePage = () => {
  const { user, API_BASE_URL } = useAuth(); // Get API URL from AuthContext
  
  // 🔧 FLEXIBLE: Use the same API URL logic as AuthContext
  const getApiUrl = () => {
    const hostname = window.location.hostname;
    
    // If we're on localhost or local network, use local backend
    if (hostname === 'localhost' || 
        hostname === '127.0.0.1' || 
        hostname.startsWith('192.168.') ||
        hostname.startsWith('10.') ||
        hostname.startsWith('172.')) {
      return 'http://localhost:3000'; // Your local backend
    }
    
    // If we're on the production domain, use production backend
    return 'https://test-gen-backend.onrender.com';
  };

  // Use API URL from AuthContext if available, otherwise determine it
  const BACKEND_URL = API_BASE_URL || getApiUrl();

  // Add debug logging
  useEffect(() => {
    console.log('🏠 HomePage initialized');
    console.log('🌐 Frontend URL:', window.location.origin);
    console.log('🎯 Backend URL:', BACKEND_URL);
    console.log('👤 User:', user);
  }, [BACKEND_URL, user]);

  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isModifying, setIsModifying] = useState(false);
  const [isProcessingPrompt, setIsProcessingPrompt] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('');
  const [selectedSpreadsheet, setSelectedSpreadsheet] = useState(null);
  const [spreadsheets, setSpreadsheets] = useState([]);
  const [availableSheets, setAvailableSheets] = useState([]);
  const [selectedSheet, setSelectedSheet] = useState('');
  const [activeTab, setActiveTab] = useState('generate'); // 'generate', 'analyze', 'modify', 'arrange'

  // Enhanced form data for test case generation with options
  const [testCaseForm, setTestCaseForm] = useState({
    module: '',
    summary: '',
    acceptanceCriteria: '',
    generateTestCases: true,      // Default to generating test cases
    generateTestScenarios: true,  // Default to generating scenarios
    testCasesCount: 20,          // Default number of test cases
    testScenariosCount: 10       // Default number of scenarios
  });

  // Analysis and modification states
  const [existingTestCases, setExistingTestCases] = useState([]);
  const [analysisResult, setAnalysisResult] = useState('');
  const [analysisType, setAnalysisType] = useState('general');
  const [modificationPrompt, setModificationPrompt] = useState('');
  const [modificationResult, setModificationResult] = useState(null);

  // Custom prompt states
  const [customPrompt, setCustomPrompt] = useState('');
  const [promptResult, setPromptResult] = useState(null);

  // Enhanced generated content state
  const [generatedContent, setGeneratedContent] = useState({
    testCases: [],
    testScenarios: [],
    createdSheets: []
  });
  const [generatedTestCases, setGeneratedTestCases] = useState([]);
  const [errors, setErrors] = useState({});

  // 🔧 FLEXIBLE: Updated API call function
  const makeApiCall = async (endpoint, options = {}) => {
    const url = `${BACKEND_URL}${endpoint}`;
    console.log(`📡 Making API call to: ${url}`);
    
    const defaultOptions = {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    };

    try {
      const response = await fetch(url, defaultOptions);
      console.log(`📊 API response from ${endpoint}: ${response.status}`);
      return response;
    } catch (error) {
      console.error(`❌ API call failed for ${endpoint}:`, error);
      throw error;
    }
  };

  // Check Google Sheets connection status on component mount
  useEffect(() => {
    checkConnectionStatus();
  }, []);

  // Load available sheets when spreadsheet is selected
  useEffect(() => {
    if (selectedSpreadsheet && isConnected) {
      loadAvailableSheets();
    }
  }, [selectedSpreadsheet, isConnected]);

  // Load test cases when sheet is selected
  useEffect(() => {
    if (selectedSheet && selectedSpreadsheet) {
      loadExistingTestCases();
    }
  }, [selectedSheet, selectedSpreadsheet]);

  const checkConnectionStatus = async () => {
    try {
      const response = await makeApiCall('/api/sheets/status');

      if (response.ok) {
        const data = await response.json();
        setIsConnected(data.connected);
        if (data.connected && data.spreadsheets) {
          setSpreadsheets(data.spreadsheets);
        }
        console.log('✅ Connection status checked:', data.connected);
      }
    } catch (error) {
      console.error('❌ Error checking connection status:', error);
    }
  };

  const loadAvailableSheets = async () => {
    try {
      const response = await makeApiCall(`/api/sheets/sheets?spreadsheetId=${selectedSpreadsheet.id}`);

      if (response.ok) {
        const data = await response.json();
        setAvailableSheets(data.sheets);
        console.log('✅ Loaded available sheets:', data.sheets.length);
      }
    } catch (error) {
      console.error('❌ Error loading sheets:', error);
    }
  };

  const loadExistingTestCases = async () => {
    try {
      const response = await makeApiCall(`/api/sheets/test-cases?spreadsheetId=${selectedSpreadsheet.id}&sheetName=${encodeURIComponent(selectedSheet)}`);

      if (response.ok) {
        const data = await response.json();
        setExistingTestCases(data.testCases);
        console.log('✅ Loaded existing test cases:', data.testCases.length);
      }
    } catch (error) {
      console.error('❌ Error loading test cases:', error);
    }
  };

  const handleGoogleSheetsConnect = async () => {
    setIsLoading(true);
    setConnectionStatus('Connecting to Google Sheets...');
    console.log('🔗 Initiating Google Sheets connection...');

    try {
      const response = await makeApiCall('/api/sheets/auth-url');

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Got auth URL, opening popup...');
        
        const popup = window.open(
          data.authUrl,
          'google-sheets-auth',
          'width=500,height=600,scrollbars=yes,resizable=yes'
        );

        const checkClosed = setInterval(() => {
          if (popup.closed) {
            clearInterval(checkClosed);
            console.log('🔄 Popup closed, checking connection status...');
            setTimeout(() => {
              checkConnectionStatus();
              setIsLoading(false);
              setConnectionStatus('');
            }, 1000);
          }
        }, 1000);
      } else {
        throw new Error('Failed to get authorization URL');
      }
    } catch (error) {
      console.error('❌ Error connecting to Google Sheets:', error);
      setConnectionStatus('Failed to connect to Google Sheets');
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setTestCaseForm(prev => ({
      ...prev,
      [name]: value
    }));

    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Enhanced validation with generation options
  const validateForm = () => {
    const newErrors = {};

    if (!testCaseForm.module.trim()) {
      newErrors.module = 'Module name is required';
    }

    if (!testCaseForm.summary.trim()) {
      newErrors.summary = 'Summary is required';
    }

    if (!testCaseForm.acceptanceCriteria.trim()) {
      newErrors.acceptanceCriteria = 'Acceptance criteria is required';
    }

    if (!selectedSpreadsheet) {
      newErrors.spreadsheet = 'Please select a spreadsheet';
    }

    // Check if at least one generation option is selected
    if (!testCaseForm.generateTestCases && !testCaseForm.generateTestScenarios) {
      newErrors.generation = 'Please select at least one option to generate (Test Cases or Test Scenarios)';
    }

    return newErrors;
  };

  // Updated generation function with flexible API call
  const generateTestCases = async () => {
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsGenerating(true);
    setErrors({});
    console.log('🚀 Starting test case generation...');

    try {
      const response = await makeApiCall('/api/sheets/generate', {
        method: 'POST',
        body: JSON.stringify({
          module: testCaseForm.module,
          summary: testCaseForm.summary,
          acceptanceCriteria: testCaseForm.acceptanceCriteria,
          spreadsheetId: selectedSpreadsheet.id,
          generateTestCases: testCaseForm.generateTestCases,
          generateTestScenarios: testCaseForm.generateTestScenarios,
          testCasesCount: testCaseForm.testCasesCount,
          testScenariosCount: testCaseForm.testScenariosCount
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to generate content');
      }

      const data = await response.json();
      console.log('✅ Generation successful:', data);
      
      // Update generated content state
      setGeneratedContent({
        testCases: data.testCases || [],
        testScenarios: data.testScenarios || [],
        createdSheets: data.createdSheets || []
      });

      // Keep the old state for backward compatibility
      setGeneratedTestCases(data.testCases || []);

      // Refresh available sheets
      await loadAvailableSheets();

      // Reset form
      setTestCaseForm({
        module: '',
        summary: '',
        acceptanceCriteria: '',
        generateTestCases: true,
        generateTestScenarios: true,
        testCasesCount: 20,
        testScenariosCount: 10
      });

      // Show success message
      let successMessage = 'Successfully generated ';
      const parts = [];
      
      if (data.testCases && data.testCases.length > 0) {
        parts.push(`${data.testCases.length} test cases`);
      }
      
      if (data.testScenarios && data.testScenarios.length > 0) {
        parts.push(`${data.testScenarios.length} test scenarios`);
      }
      
      successMessage += parts.join(' and ');
      successMessage += ' and added to your spreadsheet!';
      
      alert(successMessage);

    } catch (error) {
      console.error('❌ Error generating content:', error);
      alert('Failed to generate content: ' + error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const analyzeTestCases = async () => {
    if (!selectedSheet) {
      alert('Please select a sheet first');
      return;
    }

    setIsAnalyzing(true);
    console.log('🔍 Starting test case analysis...');

    try {
      const response = await makeApiCall('/api/sheets/analyze', {
        method: 'POST',
        body: JSON.stringify({
          spreadsheetId: selectedSpreadsheet.id,
          sheetName: selectedSheet,
          analysisType: analysisType
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to analyze test cases');
      }

      const data = await response.json();
      setAnalysisResult(data.analysis);
      console.log('✅ Analysis completed');

    } catch (error) {
      console.error('❌ Error analyzing test cases:', error);
      alert('Failed to analyze test cases: ' + error.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const modifyTestCases = async () => {
    if (!selectedSheet) {
      alert('Please select a sheet first');
      return;
    }

    if (!modificationPrompt.trim()) {
      alert('Please enter a modification prompt');
      return;
    }

    setIsModifying(true);
    console.log('✏️ Starting test case modification...');

    try {
      const response = await makeApiCall('/api/sheets/modify', {
        method: 'POST',
        body: JSON.stringify({
          spreadsheetId: selectedSpreadsheet.id,
          sheetName: selectedSheet,
          modificationPrompt: modificationPrompt
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to modify test cases');
      }

      const data = await response.json();
      setModificationResult(data);
      setModificationPrompt('');

      // Reload test cases to show changes
      await loadExistingTestCases();

      alert(`Successfully modified test cases: ${data.summary}`);
      console.log('✅ Modification completed');

    } catch (error) {
      console.error('❌ Error modifying test cases:', error);
      alert('Failed to modify test cases: ' + error.message);
    } finally {
      setIsModifying(false);
    }
  };

  const processCustomPrompt = async () => {
    if (!selectedSheet) {
      alert('Please select a sheet first');
      return;
    }

    if (!customPrompt.trim()) {
      alert('Please enter a custom prompt');
      return;
    }

    setIsProcessingPrompt(true);
    setPromptResult(null);
    console.log('🧠 Processing custom arrangement prompt...');

    try {
      const response = await makeApiCall('/api/sheets/custom-prompt', {
        method: 'POST',
        body: JSON.stringify({
          spreadsheetId: selectedSpreadsheet.id,
          sheetName: selectedSheet,
          customPrompt: customPrompt
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to process custom prompt');
      }

      const data = await response.json();
      setPromptResult(data);

      // Reload test cases to show new arrangement
      await loadExistingTestCases();

      alert(`Successfully arranged test cases: ${data.summary}`);
      console.log('✅ Custom prompt processing completed');

    } catch (error) {
      console.error('❌ Error processing custom prompt:', error);
      alert('Failed to process custom prompt: ' + error.message);
    } finally {
      setIsProcessingPrompt(false);
    }
  };

  // Debug function to test API connectivity
  const testApiConnection = async () => {
    console.log('🧪 Testing API connection...');
    try {
      const response = await makeApiCall('/health');
      if (response.ok) {
        const data = await response.json();
        console.log('✅ API connection test successful:', data);
        alert('API connection successful! ✅');
      } else {
        console.log('❌ API connection test failed:', response.status);
        alert(`API connection failed: ${response.status}`);
      }
    } catch (error) {
      console.error('❌ API connection test error:', error);
      alert(`API connection error: ${error.message}`);
    }
  };

  const quickModificationPrompts = [
    "Change PC_1, PC_2, PC_3 test case type to Negative",
    "Update all test cases with status 'Not Tested' to 'In Progress'", 
    "Add validation steps to PC_5, PC_6, PC_7",
    "Change environment of PC_10-PC_15 from 'Test' to 'Production'",
    "Delete PC_20 as it is duplicate"
  ];

  const customPromptSuggestions = [
    {
      category: "Workflow Arrangement",
      prompts: [
        "Arrange this into proper workflow",
        "Organize these tests by user journey flow",
        "Create a logical testing sequence for this module",
        "Arrange by business process workflow"
      ]
    },
    {
      category: "Priority & Risk",
      prompts: [
        "Sort by execution priority for regression testing",
        "Arrange by risk level and business impact",
        "Prioritize for smoke testing",
        "Order by critical path dependencies"
      ]
    },
    {
      category: "Technical Organization",
      prompts: [
        "Group by module and arrange by complexity",
        "Organize for parallel execution",
        "Arrange by technical dependencies",
        "Sort by automation potential"
      ]
    },
    {
      category: "Team & Execution",
      prompts: [
        "Organize these tests for a new QA engineer",
        "Arrange for efficient manual testing",
        "Create dependency-based test execution order",
        "Group for different team members"
      ]
    }
  ];


  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            AI Test Case Manager
          </h1>
          <p className="text-lg text-gray-600 mb-2">
            Welcome back, <span className="font-semibold text-indigo-600">{user?.username}</span>!
          </p>
          <p className="text-gray-500">
            Generate, analyze, modify, and intelligently arrange test cases using AI
          </p>
        </div>

        {/* Google Sheets Connection Card */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <svg className="w-6 h-6 mr-2 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
              </svg>
              Google Sheets Integration
            </h2>
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${isConnected
              ? 'bg-green-100 text-green-800'
              : 'bg-red-100 text-red-800'
              }`}>
              {isConnected ? 'Connected' : 'Not Connected'}
            </div>
          </div>

          {!isConnected ? (
            <div className="text-center py-8">
              <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Connect to Google Sheets</h3>
              <p className="text-gray-500 mb-4">
                Connect your Google account to automatically save generated test cases to your spreadsheets
              </p>
              <button
                onClick={handleGoogleSheetsConnect}
                disabled={isLoading}
                className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center mx-auto"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Connecting...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    Connect Google Sheets
                  </>
                )}
              </button>
              {connectionStatus && (
                <p className="mt-2 text-sm text-gray-600">{connectionStatus}</p>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Spreadsheet Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Spreadsheet
                </label>
                <select
                  value={selectedSpreadsheet?.id || ''}
                  onChange={(e) => {
                    const selected = spreadsheets.find(sheet => sheet.id === e.target.value);
                    setSelectedSpreadsheet(selected);
                    setSelectedSheet(''); // Reset sheet selection
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">Choose a spreadsheet...</option>
                  {spreadsheets.map((sheet) => (
                    <option key={sheet.id} value={sheet.id}>
                      {sheet.name}
                    </option>
                  ))}
                </select>
                {errors.spreadsheet && (
                  <p className="text-red-500 text-sm mt-1">{errors.spreadsheet}</p>
                )}
              </div>

              {/* Sheet Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Sheet
                </label>
                <select
                  value={selectedSheet}
                  onChange={(e) => setSelectedSheet(e.target.value)}
                  disabled={!selectedSpreadsheet}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50"
                >
                  <option value="">Choose a sheet...</option>
                  {availableSheets.map((sheet) => (
                    <option key={sheet.id} value={sheet.name}>
                      {sheet.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Tab Navigation */}
        {isConnected && (
          <div className="bg-white rounded-xl shadow-lg mb-8">
            <div className="border-b border-gray-200">
              <nav className="flex">
                <button
                  onClick={() => setActiveTab('generate')}
                  className={`px-6 py-4 text-sm font-medium border-b-2 ${activeTab === 'generate'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                >
                  Generate Test Cases
                </button>
                <button
                  onClick={() => setActiveTab('analyze')}
                  className={`px-6 py-4 text-sm font-medium border-b-2 ${activeTab === 'analyze'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                >
                  Analyze Test Cases
                </button>
                <button
                  onClick={() => setActiveTab('modify')}
                  className={`px-6 py-4 text-sm font-medium border-b-2 ${activeTab === 'modify'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                >
                  Modify Test Cases
                </button>
                <button
                  onClick={() => setActiveTab('arrange')}
                  className={`px-6 py-4 text-sm font-medium border-b-2 ${activeTab === 'arrange'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                >
                  🧠 Smart Arrange
                </button>
              </nav>
            </div>

            <div className="p-6">
              {/* Generate Tab with Options */}
              {activeTab === 'generate' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                    <svg className="w-6 h-6 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    Generate Test Content
                  </h2>

                  {/* Generation Options */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-indigo-200 rounded-lg p-4">
                    <h3 className="text-lg font-medium text-indigo-900 mb-3">What would you like to generate?</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      
                      {/* Test Cases Option */}
                      <div className="bg-white border border-indigo-200 rounded-lg p-4">
                        <div className="flex items-center mb-3">
                          <input
                            type="checkbox"
                            id="generateTestCases"
                            checked={testCaseForm.generateTestCases}
                            onChange={(e) => setTestCaseForm(prev => ({
                              ...prev,
                              generateTestCases: e.target.checked
                            }))}
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                          />
                          <label htmlFor="generateTestCases" className="ml-2 text-sm font-medium text-gray-900">
                            📋 Test Cases
                          </label>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">
                          Detailed test cases with steps, expected results, and execution details
                        </p>
                        {testCaseForm.generateTestCases && (
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Number of test cases
                            </label>
                            <select
                              value={testCaseForm.testCasesCount}
                              onChange={(e) => setTestCaseForm(prev => ({
                                ...prev,
                                testCasesCount: parseInt(e.target.value)
                              }))}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500"
                            >
                              <option value={10}>10 Test Cases</option>
                              <option value={15}>15 Test Cases</option>
                              <option value={20}>20 Test Cases</option>
                              <option value={25}>25 Test Cases</option>
                              <option value={30}>30 Test Cases</option>
                            </select>
                          </div>
                        )}
                      </div>

                      {/* Test Scenarios Option */}
                      <div className="bg-white border border-indigo-200 rounded-lg p-4">
                        <div className="flex items-center mb-3">
                          <input
                            type="checkbox"
                            id="generateTestScenarios"
                            checked={testCaseForm.generateTestScenarios}
                            onChange={(e) => setTestCaseForm(prev => ({
                              ...prev,
                              generateTestScenarios: e.target.checked
                            }))}
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                          />
                          <label htmlFor="generateTestScenarios" className="ml-2 text-sm font-medium text-gray-900">
                            🎯 Test Scenarios
                          </label>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">
                          High-level scenarios covering complete user workflows and business processes
                        </p>
                        {testCaseForm.generateTestScenarios && (
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Number of scenarios
                            </label>
                            <select
                              value={testCaseForm.testScenariosCount}
                              onChange={(e) => setTestCaseForm(prev => ({
                                ...prev,
                                testScenariosCount: parseInt(e.target.value)
                              }))}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500"
                            >
                              <option value={5}>5 Test Scenarios</option>
                              <option value={8}>8 Test Scenarios</option>
                              <option value={10}>10 Test Scenarios</option>
                              <option value={15}>15 Test Scenarios</option>
                              <option value={20}>20 Test Scenarios</option>
                            </select>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Validation Message */}
                    {!testCaseForm.generateTestCases && !testCaseForm.generateTestScenarios && (
                      <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <div className="flex items-center">
                          <svg className="w-5 h-5 text-yellow-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          <span className="text-yellow-800 text-sm">Please select at least one option to generate</span>
                        </div>
                      </div>
                    )}

                    {errors.generation && (
                      <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-red-800 text-sm">{errors.generation}</p>
                      </div>
                    )}
                  </div>

                  {/* Module Input */}
                  <div>
                    <label htmlFor="module" className="block text-sm font-medium text-gray-700 mb-2">
                      Module Name *
                    </label>
                    <input
                      type="text"
                      id="module"
                      name="module"
                      value={testCaseForm.module}
                      onChange={handleInputChange}
                      placeholder="e.g., User Authentication, Payment Gateway, etc."
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${errors.module ? 'border-red-400' : 'border-gray-300'}`}
                    />
                    {errors.module && (
                      <p className="text-red-500 text-sm mt-1">{errors.module}</p>
                    )}
                  </div>

                  {/* Summary Input */}
                  <div>
                    <label htmlFor="summary" className="block text-sm font-medium text-gray-700 mb-2">
                      Feature Summary *
                    </label>
                    <textarea
                      id="summary"
                      name="summary"
                      value={testCaseForm.summary}
                      onChange={handleInputChange}
                      rows={3}
                      placeholder="Provide a brief summary of the feature or functionality to be tested..."
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${errors.summary ? 'border-red-400' : 'border-gray-300'}`}
                    />
                    {errors.summary && (
                      <p className="text-red-500 text-sm mt-1">{errors.summary}</p>
                    )}
                  </div>

                  {/* Acceptance Criteria Input */}
                  <div>
                    <label htmlFor="acceptanceCriteria" className="block text-sm font-medium text-gray-700 mb-2">
                      Acceptance Criteria *
                    </label>
                    <textarea
                      id="acceptanceCriteria"
                      name="acceptanceCriteria"
                      value={testCaseForm.acceptanceCriteria}
                      onChange={handleInputChange}
                      rows={5}
                      placeholder="Enter the acceptance criteria for this feature. Include expected behaviors, constraints, and success conditions..."
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${errors.acceptanceCriteria ? 'border-red-400' : 'border-gray-300'}`}
                    />
                    {errors.acceptanceCriteria && (
                      <p className="text-red-500 text-sm mt-1">{errors.acceptanceCriteria}</p>
                    )}
                  </div>

                  {/* Generate Button */}
                  <button
                    onClick={generateTestCases}
                    disabled={isGenerating || !selectedSpreadsheet || (!testCaseForm.generateTestCases && !testCaseForm.generateTestScenarios)}
                    className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 px-6 rounded-lg hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center text-lg font-medium"
                  >
                    {isGenerating ? (
                      <>
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                        Generating Content...
                      </>
                    ) : (
                      <>
                        <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        Generate {testCaseForm.generateTestCases && testCaseForm.generateTestScenarios ? 'Test Cases & Scenarios' : 
                                  testCaseForm.generateTestCases ? 'Test Cases' : 
                                  testCaseForm.generateTestScenarios ? 'Test Scenarios' : 'Content'} with AI
                      </>
                    )}
                  </button>

                  {/* Generation Summary */}
                  {(testCaseForm.generateTestCases || testCaseForm.generateTestScenarios) && (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-2">Generation Summary</h4>
                      <div className="text-sm text-gray-600 space-y-1">
                        {testCaseForm.generateTestCases && (
                          <div className="flex items-center">
                            <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                            {testCaseForm.testCasesCount} detailed test cases will be generated
                          </div>
                        )}
                        {testCaseForm.generateTestScenarios && (
                          <div className="flex items-center">
                            <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                            {testCaseForm.testScenariosCount} high-level test scenarios will be generated
                          </div>
                        )}
                        <div className="flex items-center">
                          <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                          Content will be saved to separate sheets in your selected spreadsheet
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Analyze Tab */}
              {activeTab === 'analyze' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                    <svg className="w-6 h-6 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    Analyze Test Cases
                  </h2>

                  {existingTestCases.length > 0 && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="text-blue-800">
                        <strong>{existingTestCases.length}</strong> test cases found in selected sheet
                      </p>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Analysis Type
                    </label>
                    <select
                      value={analysisType}
                      onChange={(e) => setAnalysisType(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="general">General Analysis</option>
                      <option value="coverage">Coverage Analysis</option>
                      <option value="quality">Quality Assessment</option>
                      <option value="duplicates">Duplicate Detection</option>
                    </select>
                  </div>

                  <button
                    onClick={analyzeTestCases}
                    disabled={isAnalyzing || !selectedSheet}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 px-6 rounded-lg hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center text-lg font-medium"
                  >
                    {isAnalyzing ? (
                      <>
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                        Analyzing Test Cases...
                      </>
                    ) : (
                      <>
                        <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        Analyze Test Cases
                      </>
                    )}
                  </button>

                  {analysisResult && (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Analysis Result</h3>
                      <pre className="whitespace-pre-wrap text-sm text-gray-700 bg-white p-4 rounded border">
                        {analysisResult}
                      </pre>
                    </div>
                  )}
                </div>
              )}

              {/* Modify Tab */}
              {activeTab === 'modify' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                    <svg className="w-6 h-6 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Modify Test Cases
                  </h2>

                  {existingTestCases.length > 0 && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <p className="text-green-800">
                        <strong>{existingTestCases.length}</strong> test cases available for modification
                      </p>
                    </div>
                  )}

                  {/* Quick Action Buttons */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Quick Actions
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                      {quickModificationPrompts.map((prompt, index) => (
                        <button
                          key={index}
                          onClick={() => setModificationPrompt(prompt)}
                          className="text-left p-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg text-sm transition-colors"
                        >
                          {prompt}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Custom Modification Input */}
                  <div>
                    <label htmlFor="modificationPrompt" className="block text-sm font-medium text-gray-700 mb-2">
                      Modification Instructions
                    </label>
                    <textarea
                      id="modificationPrompt"
                      value={modificationPrompt}
                      onChange={(e) => setModificationPrompt(e.target.value)}
                      rows={4}
                      placeholder="Describe what changes you want to make to the test cases. For example: 'Change PC_1, PC_2, PC_3 test case type to Negative and update their environment to Production'"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>

                  <button
                    onClick={modifyTestCases}
                    disabled={isModifying || !selectedSheet || !modificationPrompt.trim()}
                    className="w-full bg-gradient-to-r from-green-600 to-teal-600 text-white py-4 px-6 rounded-lg hover:from-green-700 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center text-lg font-medium"
                  >
                    {isModifying ? (
                      <>
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                        Modifying Test Cases...
                      </>
                    ) : (
                      <>
                        <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Apply Modifications
                      </>
                    )}
                  </button>

                  {modificationResult && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <h3 className="text-lg font-medium text-green-900 mb-2">Modification Result</h3>
                      <p className="text-green-800 mb-4">{modificationResult.summary}</p>

                      {modificationResult.modifications && modificationResult.modifications.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="font-medium text-green-900">Changes Made:</h4>
                          {modificationResult.modifications.map((mod, index) => (
                            <div key={index} className="bg-white border border-green-200 rounded p-3">
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-medium text-green-900">{mod.testCaseId}</span>
                                <span className={`px-2 py-1 rounded text-xs ${mod.action === 'update' ? 'bg-blue-100 text-blue-800' :
                                  mod.action === 'delete' ? 'bg-red-100 text-red-800' :
                                    'bg-green-100 text-green-800'
                                  }`}>
                                  {mod.action}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600">{mod.reason}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Smart Arrange Tab */}
              {activeTab === 'arrange' && (
                <div className="space-y-6">
                  <div className="text-center">
                    <h2 className="text-xl font-semibold text-gray-900 flex items-center justify-center mb-2">
                      <svg className="w-6 h-6 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        Smart Test Case Arrangement
                      </svg>
                    </h2>
                    <p className="text-gray-600 mb-4">
                      Use natural language to intelligently arrange your test cases. Just describe how you want them organized!
                    </p>
                  </div>

                  {existingTestCases.length > 0 && (
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                      <p className="text-purple-800">
                        <strong>{existingTestCases.length}</strong> test cases ready for intelligent arrangement
                      </p>
                    </div>
                  )}

                  {/* Quick Arrangement Suggestions */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Popular Arrangement Patterns
                    </label>
                    <div className="space-y-4">
                      {customPromptSuggestions.map((category, categoryIndex) => (
                        <div key={categoryIndex}>
                          <h4 className="text-sm font-medium text-gray-600 mb-2">{category.category}</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {category.prompts.map((prompt, index) => (
                              <button
                                key={index}
                                onClick={() => setCustomPrompt(prompt)}
                                className="text-left p-3 bg-gradient-to-r from-purple-50 to-indigo-50 hover:from-purple-100 hover:to-indigo-100 border border-purple-200 rounded-lg text-sm transition-all duration-200"
                              >
                                <div className="flex items-center">
                                  <svg className="w-4 h-4 mr-2 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                  </svg>
                                  {prompt}
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Custom Prompt Input */}
                  <div>
                    <label htmlFor="customPrompt" className="block text-sm font-medium text-gray-700 mb-2">
                      Custom Arrangement Instructions
                    </label>
                    <textarea
                      id="customPrompt"
                      value={customPrompt}
                      onChange={(e) => setCustomPrompt(e.target.value)}
                      rows={4}
                      placeholder="Describe how you want your test cases arranged. Examples:
• 'Arrange this into proper workflow'
• 'Sort by execution priority for regression testing'  
• 'Organize for a new QA engineer'
• 'Group by module and arrange by complexity'"
                      className="w-full px-4 py-3 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>

                  <button
                    onClick={processCustomPrompt}
                    disabled={isProcessingPrompt || !selectedSheet || !customPrompt.trim()}
                    className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-4 px-6 rounded-lg hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center text-lg font-medium"
                  >
                    {isProcessingPrompt ? (
                      <>
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                        Arranging Test Cases...
                      </>
                    ) : (
                      <>
                        <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                        🧠 Arrange with AI
                      </>
                    )}
                  </button>

                  {promptResult && (
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                      <h3 className="text-lg font-medium text-purple-900 mb-2">Arrangement Result</h3>
                      <div className="space-y-3">
                        <div className="bg-white p-3 rounded border border-purple-200">
                          <h4 className="font-medium text-purple-900">Intent Detected:</h4>
                          <p className="text-purple-800 capitalize">{promptResult.intent}</p>
                        </div>
                        <div className="bg-white p-3 rounded border border-purple-200">
                          <h4 className="font-medium text-purple-900">Strategy Applied:</h4>
                          <p className="text-purple-800">{promptResult.arrangementStrategy}</p>
                        </div>
                        <div className="bg-white p-3 rounded border border-purple-200">
                          <h4 className="font-medium text-purple-900">Summary:</h4>
                          <p className="text-purple-800">{promptResult.summary}</p>
                        </div>
                        <div className="bg-white p-3 rounded border border-purple-200">
                          <h4 className="font-medium text-purple-900">Changes Made:</h4>
                          <p className="text-purple-800">{promptResult.changes}</p>
                        </div>
                        <div className="text-center">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                            ✅ {promptResult.arrangedCount} test cases successfully rearranged
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Generated Content Display */}
        {generatedContent.createdSheets && generatedContent.createdSheets.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <svg className="w-6 h-6 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Generated Content
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {generatedContent.createdSheets.map((sheet, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium text-gray-900 text-sm flex items-center">
                      {sheet.type === 'testCases' ? (
                        <>
                          <svg className="w-4 h-4 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                          </svg>
                          Test Cases
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                          Test Scenarios
                        </>
                      )}
                    </h3>
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">
                      {sheet.count} items
                    </span>
                  </div>
                  <h4 className="text-sm font-medium text-gray-800 mb-2 truncate">
                    {sheet.name}
                  </h4>
                  <p className="text-xs text-gray-600">
                    {sheet.type === 'testCases' 
                      ? 'Detailed test cases with steps and expected results' 
                      : 'High-level scenarios covering complete workflows'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Existing Test Cases Display */}
        {selectedSheet && existingTestCases.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <svg className="w-6 h-6 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Existing Test Cases ({existingTestCases.length})
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
              {existingTestCases.slice(0, 12).map((testCase, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-gray-900 text-sm">{testCase.id}</h3>
                    <div className="flex space-x-1">
                      <span className={`px-2 py-1 rounded text-xs ${testCase.testCaseType === 'Positive' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {testCase.testCaseType}
                      </span>
                      <span className={`px-2 py-1 rounded text-xs ${
                        testCase.status === 'Pass' ? 'bg-green-100 text-green-800' :
                        testCase.status === 'Fail' ? 'bg-red-100 text-red-800' :
                        testCase.status === 'Blocked' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {testCase.status}
                      </span>
                    </div>
                  </div>
                  <h4 className="text-sm font-medium text-gray-800 mb-2 line-clamp-2">
                    {testCase.summary}
                  </h4>
                  <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                    <strong>Module:</strong> {testCase.module}
                  </p>
                  <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                    <strong>Submodule:</strong> {testCase.submodule}
                  </p>
                  <div className="text-xs text-gray-500">
                    <span className="font-medium">Environment:</span> {testCase.environment}
                  </div>
                </div>
              ))}
            </div>

            {existingTestCases.length > 12 && (
              <div className="mt-4 text-center">
                <p className="text-gray-500 text-sm">
                  Showing 12 of {existingTestCases.length} test cases. View full list in Google Sheets.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Generated Test Cases Preview (for backward compatibility) */}
        {generatedTestCases.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <svg className="w-6 h-6 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Generated Test Cases ({generatedTestCases.length})
            </h2>

            <div className="space-y-4 max-h-96 overflow-y-auto">
              {generatedTestCases.slice(0, 10).map((testCase, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-gray-900">
                      {testCase.id}: {testCase.summary}
                    </h3>
                    <div className="flex space-x-1">
                      <span className={`px-2 py-1 rounded text-xs ${testCase.testCaseType === 'Positive' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {testCase.testCaseType}
                      </span>
                      <span className="px-2 py-1 rounded text-xs bg-blue-100 text-blue-800">
                        {testCase.environment}
                      </span>
                    </div>
                  </div>
                  <p className="text-gray-600 text-sm mb-2">
                    <strong>Module:</strong> {testCase.module} | <strong>Submodule:</strong> {testCase.submodule}
                  </p>
                  <p className="text-gray-600 text-sm mb-2">
                    <strong>Steps:</strong> {testCase.testSteps}
                  </p>
                  <p className="text-gray-600 text-sm">
                    <strong>Expected Results:</strong> {testCase.expectedResults}
                  </p>
                </div>
              ))}
            </div>

            {generatedTestCases.length > 10 && (
              <div className="mt-4 text-center">
                <p className="text-gray-500 text-sm">
                  Showing 10 of {generatedTestCases.length} generated test cases. All test cases have been added to your spreadsheet.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default HomePage;