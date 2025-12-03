// import 'package:flutter/widget_previews.dart';
import 'package:flutter/material.dart';
import 'package:webview_flutter/webview_flutter.dart';
// import 'dart:convert';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'LintLoop',
      theme: ThemeData(
        primarySwatch: Colors.blue,
        useMaterial3: true,
        scaffoldBackgroundColor: const Color(0xFF000000),
        appBarTheme: const AppBarTheme(
          backgroundColor: Color(0xFF1E1E1E),
          foregroundColor: Colors.white,
        ),
      ),
      home: const MonacoEditorScreen(),
    );
  }
}

class MonacoEditorScreen extends StatefulWidget {
  const MonacoEditorScreen({Key? key}) : super(key: key);

  @override
  State<MonacoEditorScreen> createState() => _MonacoEditorScreenState();
}

class _MonacoEditorScreenState extends State<MonacoEditorScreen> {
  bool _isInstructionsExpanded = false;
  final String _instructions = '''1. Two Sum
  Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target. You may assume that each input would have exactly one solution, and you may not use the same element twice. You can return the answer in any order.''';
  bool _isExamplesExpanded = false;
  final String _examples = '''
  Example 1:
  * Input: nums = [2,7,11,15], target = 9
  * Output: [0,1]
  * Explanation: Because nums[0] + nums[1] == 9, we return [0, 1].

  Example 2:
  * Input: nums = [3,2,4], target = 6
  * Output: [1,2]''';
  bool _isEditorExpanded = false;
  String _selectedLanguage = 'cpp';
  late WebViewController _webViewController;

  final List<String> _languages = [
    'cpp',
    'java',
    'python',
    'javascript',
    'typescript',
    'csharp',
    'c',
    'go',
    'kotlin',
    'swift',
    'rust',
    'ruby',
    'php',
    'dart',
    'scala',
    'elixir',
    'erlang',
    'racket'
  ];

  @override
  void initState() {
    super.initState();
    _initializeWebView();
  }

  void _initializeWebView() {
    _webViewController = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..loadHtmlString(_getMonacoHtml());
  }

  String _getMonacoHtml() {
    return '''
<!DOCTYPE html>
<html>
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { margin: 0; padding: 0; overflow: hidden; }
        #container { width: 100vw; height: 100vh; }
    </style>
</head>
<body>
    <div id="container"></div>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.44.0/min/vs/loader.min.js"></script>
    <script>
        require.config({ paths: { vs: 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.44.0/min/vs' }});
        
        let editor;
        
        require(['vs/editor/editor.main'], function() {
            editor = monaco.editor.create(document.getElementById('container'), {
                value: '// Write your code here...',
                language: 'cpp',
                theme: 'hc-black',
                automaticLayout: true,
                minimap: { enabled: false },
                fontSize: 14,
                lineNumbers: 'on',
                roundedSelection: true,
                scrollBeyondLastLine: false,
            });
        });
        
        function setLanguage(lang) {
            if (editor) {
                monaco.editor.setModelLanguage(editor.getModel(), lang);
            }
        }
        
        function getCode() {
            if (editor) {
                return editor.getValue();
            }
            return '';
        }
        
        function setCode(code) {
            if (editor) {
                editor.setValue(code);
            }
        }
    </script>
</body>
</html>
    ''';
  }

  void _updateEditorLanguage(String language) {
    _webViewController.runJavaScript('setLanguage("$language")');
  }

void _runCode() async {
  final code = await _webViewController
      .runJavaScriptReturningResult('getCode()') as String;
  
  // Remove quotes from the result
  final cleanCode = code.replaceAll('"', '').replaceAll('\\n', '\n');
  
  if (mounted) {
    // Show loading snackbar
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Running $_selectedLanguage code...'),
        duration: const Duration(seconds: 1),
      ),
    );
    
    // Simulate code execution (replace with actual API call)
    await Future.delayed(const Duration(milliseconds: 500));
    
    // Mock output - replace this with actual execution result
    String output = '''Status: Accepted!

    Problem: 1. Two Sum

    Language: $_selectedLanguage

    Tests Passed: 3/3

    Execution Time: 60ms
    ''';
    
    // Show output dialog
    _showOutputDialog(output);
  }
  
  print('Code to run:\n$cleanCode');
}

void _showOutputDialog(String output) {
  showDialog(
    context: context,
    builder: (BuildContext context) {
      return Dialog(
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
        ),
        child: Container(
          constraints: const BoxConstraints(
            maxWidth: 600,
            maxHeight: 500,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Header
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.grey[800],
                  borderRadius: const BorderRadius.only(
                    topLeft: Radius.circular(20),
                    topRight: Radius.circular(20),
                  ),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text(
                      'Results',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    IconButton(
                      icon: const Icon(Icons.close, color: Colors.white),
                      onPressed: () => Navigator.of(context).pop(),
                    ),
                  ],
                ),
              ),
              // Output content
              Flexible(
                child: Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(16),
                  child: SingleChildScrollView(
                    child: SelectableText(
                      output.isEmpty ? 'No output' : output,
                      style: TextStyle(
                        fontFamily: 'monospace',
                        fontSize: 14,
                        color: Colors.grey[800],
                      ),
                    ),
                  ),
                ),
              ),
              // Footer with action buttons
              Padding(
                padding: const EdgeInsets.all(16),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.end,
                  children: [
                    TextButton(
                      onPressed: () => Navigator.of(context).pop(),
                      child: const Text('Close'),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      );
    },
  );
}

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('LintLoop'),
        elevation: 2,
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Instructions box with expand button
            Container(
              decoration: BoxDecoration(
                color: Colors.blue[50],
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: Colors.blue[200]!, width: 2),
              ),
              child: Column(
                children: [
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                    child: Row(
                      children: [
                        Icon(Icons.info_outline, color: Colors.blue[700]),
                        const SizedBox(width: 8),
                        const Text(
                          'Instructions',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const Spacer(),
                        IconButton(
                          icon: Icon(_isInstructionsExpanded 
                              ? Icons.expand_less 
                              : Icons.expand_more),
                          onPressed: () {
                            setState(() {
                              _isInstructionsExpanded = !_isInstructionsExpanded;
                            });
                          },
                        ),
                      ],
                    ),
                  ),
                  if (_isInstructionsExpanded)
                    Padding(
                      padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
                      child: Container(
                        width: double.infinity,
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(
                          _instructions,
                          style: TextStyle(
                            fontSize: 14,
                            color: Colors.grey[800],
                            height: 1.5,
                          ),
                        ),
                      ),
                    ),
                ],
              ),
            ),
            
            const SizedBox(height: 16),
            
            // Examples box with expand button
            Container(
              decoration: BoxDecoration(
                color: Colors.green[50],
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: Colors.green[200]!, width: 2),
              ),
              child: Column(
                children: [
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                    child: Row(
                      children: [
                        Icon(Icons.code, color: Colors.green[700]),
                        const SizedBox(width: 8),
                        const Text(
                          'Examples',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const Spacer(),
                        IconButton(
                          icon: Icon(_isExamplesExpanded 
                              ? Icons.expand_less 
                              : Icons.expand_more),
                          onPressed: () {
                            setState(() {
                              _isExamplesExpanded = !_isExamplesExpanded;
                            });
                          },
                        ),
                      ],
                    ),
                  ),
                  if (_isExamplesExpanded)
                    Padding(
                      padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
                      child: Container(
                        width: double.infinity,
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(
                          _examples,
                          style: TextStyle(
                            fontSize: 14,
                            color: Colors.grey[800],
                            height: 1.5,
                            fontFamily: 'monospace',
                          ),
                        ),
                      ),
                    ),
                ],
              ),
            ),
            
            const SizedBox(height: 16),
            
            // Language dropdown and Run button
            Row(
              children: [
                Expanded(
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12),
                    decoration: BoxDecoration(
                      color: Colors.grey[100],
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: Colors.grey[300]!),
                    ),
                    child: DropdownButtonHideUnderline(
                      child: DropdownButton<String>(
                        value: _selectedLanguage,
                        isExpanded: true,
                        items: _languages.map((String language) {
                          return DropdownMenuItem<String>(
                            value: language,
                            child: Text(language.toUpperCase()),
                          );
                        }).toList(),
                        onChanged: (String? newValue) {
                          if (newValue != null) {
                            setState(() {
                              _selectedLanguage = newValue;
                            });
                            _updateEditorLanguage(newValue);
                          }
                        },
                      ),
                    ),
                  ),
                ),
                
                const SizedBox(width: 12),
                
                ElevatedButton(
                  onPressed: _runCode,
                  style: ElevatedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 24,
                      vertical: 12,
                    ),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  child: const Text('Run'),
                ),
              ],
            ),
            
            const SizedBox(height: 16),
            
            // Monaco Editor with expand button
            Expanded(
              flex: _isEditorExpanded ? 3 : 1,
              child: Container(
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: Colors.grey[300]!),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.1),
                      blurRadius: 4,
                      offset: const Offset(0, 2),
                    ),
                  ],
                ),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(12),
                  child: Column(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: Colors.grey[800],
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text(
                              'Code Editor',
                              style: TextStyle(
                                color: Colors.white,
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                            IconButton(
                              icon: Icon(
                                _isEditorExpanded 
                                    ? Icons.fullscreen_exit 
                                    : Icons.fullscreen,
                                color: Colors.white,
                              ),
                              onPressed: () {
                                setState(() {
                                  _isEditorExpanded = !_isEditorExpanded;
                                });
                              },
                            ),
                          ],
                        ),
                      ),
                      Expanded(
                        child: WebViewWidget(
                          controller: _webViewController,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  @override
  void dispose() {
    super.dispose();
  }
}