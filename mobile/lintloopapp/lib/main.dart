import 'monaco_editor_widget.dart';
import 'package:flutter/material.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Flutter Demo',
      theme: ThemeData(
        
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.deepPurple),
        useMaterial3: true,
      ),
      home: const MyHomePage(title: 'Flutter Demo Home Page'),
    );
  }
}

class MyHomePage extends StatefulWidget {
  const MyHomePage({super.key, required this.title});
  final String title;

  @override
  State<MyHomePage> createState() => _MyHomePageState();
}

class _MyHomePageState extends State<MyHomePage> {

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.title),
      ),
      body: Center(
        child: ElevatedButton(
          onPressed: () {
            Navigator.push(
              context,
              MaterialPageRoute(builder: (context) => MonacoEditorWidget()),
            );
          },
          child: const Text('Open Monaco Editor'),
        ),
      ),
    );
  }
}



/* import 'package:flutter/material.dart';
import 'monaco_editor_widget.dart';
import 'package:device_preview/device_preview.dart';
import 'basic.dart';
import 'custom_plugin.dart';

void main() {
   // runApp(const MyApp());
   runApp(const MonacoApp());

   runApp(DevicePreview(
    backgroundColor: Colors.white,
    enabled: true,
    tools: [
      ...DevicePreview.defaultTools,
      const CustomPlugin(),
    ],
    builder:(context) => BasicApp(),
      )
    );

   }

class MonacoApp extends StatelessWidget {
  const MonacoApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Monaco Editor Flutter',
      theme: ThemeData.dark(useMaterial3: true),
      home: const MonacoHomePage(),
      debugShowCheckedModeBanner: false,
    );
  }
}

class MonacoHomePage extends StatefulWidget {
  const MonacoHomePage({super.key});

  @override
  State<MonacoHomePage> createState() => _MonacoHomePageState();
}

class _MonacoHomePageState extends State<MonacoHomePage> {
  String _language = 'swift';
  String _theme = 'vs-dark';
  String _code = '''
import Foundation

print("Hello from Swift in Monaco + Flutter!")
''';

  final GlobalKey<MonacoEditorWidgetState> _editorKey =
      GlobalKey<MonacoEditorWidgetState>();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Monaco Editor in Flutter'),
        actions: [
          IconButton(
            icon: const Icon(Icons.save),
            tooltip: 'Get current code',
            onPressed: () async {
              final code = await _editorKey.currentState?.getCode();
              if (code != null) {
                setState(() {
                  _code = code;
                });
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Code snapshot captured')),
                );
              }
            },
          ),
        ],
      ),
      body: Column(
        children: [
          _buildToolbar(),
          const Divider(height: 1),
          Expanded(
            child: MonacoEditorWidget(
              key: _editorKey,
              initialCode: _code,
              language: _language,
              theme: _theme,
              onCodeChanged: (text) {
                // You can react live here, e.g., for validation
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildToolbar() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      child: Row(
        children: [
          const Text('Language:'),
          const SizedBox(width: 8),
          DropdownButton<String>(
            value: _language,
            items: const [
              DropdownMenuItem(value: 'swift', child: Text('Swift')),
              DropdownMenuItem(value: 'dart', child: Text('Dart')),
              DropdownMenuItem(value: 'javascript', child: Text('JavaScript')),
              DropdownMenuItem(value: 'python', child: Text('Python')),
            ],
            onChanged: (value) {
              if (value == null) return;
              setState(() => _language = value);
              _editorKey.currentState?.setLanguage(value);
            },
          ),
          const SizedBox(width: 24),
          const Text('Theme:'),
          const SizedBox(width: 8),
          DropdownButton<String>(
            value: _theme,
            items: const [
              DropdownMenuItem(value: 'vs-dark', child: Text('Dark')),
              DropdownMenuItem(value: 'vs', child: Text('Light')),
            ],
            onChanged: (value) {
              if (value == null) return;
              setState(() => _theme = value);
              _editorKey.currentState?.setTheme(value);
            },
          ),
        ],
      ),
    );
  }
}

/* flutter demo */
class MyApp extends StatelessWidget {
  const MyApp({super.key});

  // This widget is the root of your application.
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Flutter Demo',
      theme: ThemeData(
        // This is the theme of your application.
        //
        // TRY THIS: Try running your application with "flutter run". You'll see
        // the application has a purple toolbar. Then, without quitting the app,
        // try changing the seedColor in the colorScheme below to Colors.green
        // and then invoke "hot reload" (save your changes or press the "hot
        // reload" button in a Flutter-supported IDE, or press "r" if you used
        // the command line to start the app).
        //
        // Notice that the counter didn't reset back to zero; the application
        // state is not lost during the reload. To reset the state, use hot
        // restart instead.
        //
        // This works for code too, not just values: Most code changes can be
        // tested with just a hot reload.
        colorScheme: .fromSeed(seedColor: Colors.deepPurple),
      ),
      home: const MyHomePage(title: 'Flutter Demo Home Page'),
    );
  }
}

class MyHomePage extends StatefulWidget {
  const MyHomePage({super.key, required this.title});

  // This widget is the home page of your application. It is stateful, meaning
  // that it has a State object (defined below) that contains fields that affect
  // how it looks.

  // This class is the configuration for the state. It holds the values (in this
  // case the title) provided by the parent (in this case the App widget) and
  // used by the build method of the State. Fields in a Widget subclass are
  // always marked "final".

  final String title;

  @override
  State<MyHomePage> createState() => _MyHomePageState();
}

class _MyHomePageState extends State<MyHomePage> {
  int _counter = 0;

  void _incrementCounter() {
    setState(() {
      // This call to setState tells the Flutter framework that something has
      // changed in this State, which causes it to rerun the build method below
      // so that the display can reflect the updated values. If we changed
      // _counter without calling setState(), then the build method would not be
      // called again, and so nothing would appear to happen.
      _counter++;
    });
  }

  @override
  Widget build(BuildContext context) {
    // This method is rerun every time setState is called, for instance as done
    // by the _incrementCounter method above.
    //
    // The Flutter framework has been optimized to make rerunning build methods
    // fast, so that you can just rebuild anything that needs updating rather
    // than having to individually change instances of widgets.
    return Scaffold(
      appBar: AppBar(
        // TRY THIS: Try changing the color here to a specific color (to
        // Colors.amber, perhaps?) and trigger a hot reload to see the AppBar
        // change color while the other colors stay the same.
        backgroundColor: Theme.of(context).colorScheme.inversePrimary,
        // Here we take the value from the MyHomePage object that was created by
        // the App.build method, and use it to set our appbar title.
        title: Text(widget.title),
      ),
      body: Center(
        // Center is a layout widget. It takes a single child and positions it
        // in the middle of the parent.
        child: Column(
          // Column is also a layout widget. It takes a list of children and
          // arranges them vertically. By default, it sizes itself to fit its
          // children horizontally, and tries to be as tall as its parent.
          //
          // Column has various properties to control how it sizes itself and
          // how it positions its children. Here we use mainAxisAlignment to
          // center the children vertically; the main axis here is the vertical
          // axis because Columns are vertical (the cross axis would be
          // horizontal).
          //
          // TRY THIS: Invoke "debug painting" (choose the "Toggle Debug Paint"
          // action in the IDE, or press "p" in the console), to see the
          // wireframe for each widget.
          mainAxisAlignment: .center,
          children: [
            const Text('You have pushed the button this many times:'),
            Text(
              '$_counter',
              style: Theme.of(context).textTheme.headlineMedium,
            ),
          ],
        ),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: _incrementCounter,
        tooltip: 'Increment',
        child: const Icon(Icons.add),
      ),
    );
  }
}
*/