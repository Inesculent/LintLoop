import 'package:flutter/material.dart';
import 'main.dart';
import 'home.dart';

void main() {
  runApp(const WhiteboardApp());
}

class WhiteboardApp extends StatelessWidget {
  const WhiteboardApp({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Whiteboard',
      theme: ThemeData(
        primarySwatch: Colors.blue,
      ),
      home: const WhiteboardPage(),
    );
  }
}

class WhiteboardPage extends StatefulWidget {
  const WhiteboardPage({Key? key}) : super(key: key);

  @override
  State<WhiteboardPage> createState() => _WhiteboardPageState();
}

class _WhiteboardPageState extends State<WhiteboardPage> {
  List<DrawingPoint> drawingPoints = [];
  Color selectedColor = Colors.black;
  bool isEraser = false;
  int _selectedIndex = 2; // Whiteboard is selected by default

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('LintLoop'),
        actions: [
          IconButton(
            icon: const Icon(Icons.clear),
            onPressed: () {
              setState(() {
                drawingPoints.clear();
              });
            },
            tooltip: 'Clear All',
          ),
        ],
      ),
      body: Column(
        children: [
          // Toolbar
          Container(
            padding: const EdgeInsets.symmetric(vertical: 8),
            color: Colors.grey[200],
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                // Draw tool
                _buildToolButton(
                  icon: Icons.create,
                  isSelected: !isEraser,
                  onPressed: () {
                    setState(() {
                      isEraser = false;
                    });
                  },
                  tooltip: 'Draw',
                ),
                const SizedBox(width: 16),
                // Eraser tool
                _buildToolButton(
                  icon: Icons.auto_fix_high,
                  isSelected: isEraser,
                  onPressed: () {
                    setState(() {
                      isEraser = true;
                    });
                  },
                  tooltip: 'Eraser',
                ),
                const SizedBox(width: 32),
                // Color buttons
                _buildColorButton(Colors.black),
                const SizedBox(width: 8),
                _buildColorButton(Colors.red),
                const SizedBox(width: 8),
                _buildColorButton(Colors.blue),
                const SizedBox(width: 8),
                _buildColorButton(Colors.green),
              ],
            ),
          ),
          // Canvas
          Expanded(
            child: Container(
              color: Colors.white,
              child: GestureDetector(
                onPanStart: (details) {
                  setState(() {
                    drawingPoints.add(
                      DrawingPoint(
                        offset: details.localPosition,
                        paint: Paint()
                          ..color = isEraser ? Colors.white : selectedColor
                          ..strokeWidth = isEraser ? 20 : 3
                          ..strokeCap = StrokeCap.round
                          ..isAntiAlias = true,
                      ),
                    );
                  });
                },
                onPanUpdate: (details) {
                  setState(() {
                    drawingPoints.add(
                      DrawingPoint(
                        offset: details.localPosition,
                        paint: Paint()
                          ..color = isEraser ? Colors.white : selectedColor
                          ..strokeWidth = isEraser ? 20 : 3
                          ..strokeCap = StrokeCap.round
                          ..isAntiAlias = true,
                      ),
                    );
                  });
                },
                onPanEnd: (details) {
                  setState(() {
                    drawingPoints.add(DrawingPoint(offset: null, paint: Paint()));
                  });
                },
                child: CustomPaint(
                  painter: DrawingPainter(drawingPoints: drawingPoints),
                  size: Size.infinite,
                ),
              ),
            ),
          ),
        ],
      ),
      bottomNavigationBar: BottomNavigationBar(
        items: const <BottomNavigationBarItem>[
          BottomNavigationBarItem(
            icon: Icon(Icons.home),
            label: 'Home',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.code),
            label: 'Code',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.draw),
            label: 'Whiteboard',
          ),
        ],
        currentIndex: _selectedIndex,
        selectedItemColor: Colors.blue,
        onTap: _onItemTapped,
      ),
    );
  }

  void _onItemTapped(int index) {
    setState(() {
      _selectedIndex = index;
    });
    
    // Handle navigation based on selected index
    if (index == 0) {
      // Navigate to Home
      Navigator.push(
        context,
        MaterialPageRoute(builder: (context) => const HomePage()),
      ).then((_) {
        // Reset to Whiteboard tab when returning from Home
        setState(() {
          _selectedIndex = 2;
        });
      });
    } else if (index == 1) {
      // Navigate to Code screen
      Navigator.push(
        context,
        MaterialPageRoute(builder: (context) => const MonacoEditorScreen()),
      ).then((_) {
        // Reset to Whiteboard tab when returning from Code
        setState(() {
          _selectedIndex = 2;
        });
      });
    }
    // index == 2 is the current Whiteboard screen, so do nothing
  }

  Widget _buildToolButton({
    required IconData icon,
    required bool isSelected,
    required VoidCallback onPressed,
    required String tooltip,
  }) {
    return Container(
      decoration: BoxDecoration(
        color: isSelected ? Colors.blue : Colors.transparent,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(
          color: isSelected ? Colors.blue : Colors.grey,
          width: 2,
        ),
      ),
      child: IconButton(
        icon: Icon(icon),
        color: isSelected ? Colors.white : Colors.grey[700],
        onPressed: onPressed,
        tooltip: tooltip,
      ),
    );
  }

  Widget _buildColorButton(Color color) {
    bool isSelected = selectedColor == color && !isEraser;
    return GestureDetector(
      onTap: () {
        setState(() {
          selectedColor = color;
          isEraser = false;
        });
      },
      child: Container(
        width: 40,
        height: 40,
        decoration: BoxDecoration(
          color: color,
          shape: BoxShape.circle,
          border: Border.all(
            color: isSelected ? Colors.blue : Colors.grey,
            width: isSelected ? 3 : 2,
          ),
        ),
      ),
    );
  }
}

class DrawingPoint {
  Offset? offset;
  Paint paint;

  DrawingPoint({this.offset, required this.paint});
}

class DrawingPainter extends CustomPainter {
  final List<DrawingPoint> drawingPoints;

  DrawingPainter({required this.drawingPoints});

  @override
  void paint(Canvas canvas, Size size) {
    for (int i = 0; i < drawingPoints.length - 1; i++) {
      if (drawingPoints[i].offset != null &&
          drawingPoints[i + 1].offset != null) {
        canvas.drawLine(
          drawingPoints[i].offset!,
          drawingPoints[i + 1].offset!,
          drawingPoints[i].paint,
        );
      }
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) {
    return true;
  }
}