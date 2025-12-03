import 'package:flutter/material.dart';
import 'main.dart';
import 'whiteboard.dart';

class HomePage extends StatefulWidget {
  const HomePage({Key? key}) : super(key: key);

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  int _selectedIndex = 0; // Home is selected by default

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('LintLoop - Home'),
        elevation: 2,
        backgroundColor: const Color(0xFF1E1E1E),
        foregroundColor: Colors.white,
      ),
      body: Container(
        color: const Color(0xFF000000),
        child: Center(
          child: Padding(
            padding: const EdgeInsets.all(24.0),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(
                  Icons.home_rounded,
                  size: 100,
                  color: Colors.blue[300],
                ),
                const SizedBox(height: 24),
                const Text(
                  'Welcome to LintLoop',
                  style: TextStyle(
                    fontSize: 32,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                ),
                const SizedBox(height: 16),
                Text(
                  'Practice coding problems and collaborate',
                  style: TextStyle(
                    fontSize: 18,
                    color: Colors.grey[400],
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 48),
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    _buildFeatureCard(
                      icon: Icons.code,
                      title: 'Code Editor',
                      description: 'Solve problems with our Monaco editor',
                      color: Colors.blue,
                    ),
                    const SizedBox(width: 24),
                    _buildFeatureCard(
                      icon: Icons.draw,
                      title: 'Whiteboard',
                      description: 'Visualize ideas and solutions',
                      color: Colors.green,
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
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
    if (index == 1) {
      // Navigate to Code screen
      Navigator.push(
        context,
        MaterialPageRoute(builder: (context) => const MonacoEditorScreen()),
      ).then((_) {
        // Reset to Home tab when returning
        setState(() {
          _selectedIndex = 0;
        });
      });
    } else if (index == 2) {
      // Navigate to Whiteboard
      Navigator.push(
        context,
        MaterialPageRoute(builder: (context) => const WhiteboardPage()),
      ).then((_) {
        // Reset to Home tab when returning
        setState(() {
          _selectedIndex = 0;
        });
      });
    }
    // index == 0 is the current Home screen, so do nothing
  }

  Widget _buildFeatureCard({
    required IconData icon,
    required String title,
    required String description,
    required Color color,
  }) {
    return Container(
      width: 160,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: const Color(0xFF1E1E1E),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: color.withOpacity(0.3), width: 2),
      ),
      child: Column(
        children: [
          Icon(
            icon,
            size: 48,
            color: color,
          ),
          const SizedBox(height: 12),
          Text(
            title,
            style: const TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.bold,
              color: Colors.white,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 8),
          Text(
            description,
            style: TextStyle(
              fontSize: 12,
              color: Colors.grey[400],
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }
}