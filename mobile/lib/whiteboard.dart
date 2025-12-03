import 'package:flutter/material.dart';

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

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Whiteboard'),
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
            child: GestureDetector(
              onPanStart: (details) {
                setState(() {
                  drawingPoints.add(
                    DrawingPoint(
                      offset: details.localPosition,
                      paint: Paint()
                        ..color = isEraser ? Colors.white : selectedColor
                        ..strokeWidth = isEraser ? 20 : 3
                        ..strokeCap = StrokeCap.round,
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
                        ..strokeCap = StrokeCap.round,
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
                child: Container(
                  width: double.infinity,
                  height: double.infinity,
                  color: Colors.white,
                ),
              ),
            ),
          ),
        ],
      ),
    );
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