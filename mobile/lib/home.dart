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
        automaticallyImplyLeading: false,
        title: const Text('LintLoop'),
        elevation: 2,
        backgroundColor: const Color(0xFF1E1E1E),
        foregroundColor: Colors.white,
      ),
      body: Container(
        color: const Color(0xFF000000),
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Welcome section
              const Text(
                'Welcome back, Laila!',
                style: TextStyle(
                  fontSize: 28,
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                'Continue your coding practice journey.',
                style: TextStyle(
                  fontSize: 16,
                  color: Colors.grey[400],
                ),
              ),
              const SizedBox(height: 24),
              
              // Stats cards
              Row(
                children: [
                  Expanded(
                    child: _buildStatCard(
                      title: 'Problems Solved',
                      value: '1',
                      color: Colors.green,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: _buildStatCard(
                      title: 'Problems Available',
                      value: '4',
                      color: Colors.blue,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              _buildStatCard(
                title: 'Completion Rate',
                value: '25%',
                color: Colors.purple,
                isWide: true,
              ),
              const SizedBox(height: 32),
              
              // Available Problems section
              const Text(
                'Available Problems',
                style: TextStyle(
                  fontSize: 22,
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                ),
              ),
              const SizedBox(height: 16),
              
              // Problems table
              _buildProblemItem(
                status: 'Unsolved',
                title: 'Two Sum',
                difficulty: 'Easy',
                difficultyColor: Colors.green,
                isSolved: false,
              ),
              const SizedBox(height: 8),
              _buildProblemItem(
                status: 'Solved',
                title: 'Merge Intervals',
                difficulty: 'Medium',
                difficultyColor: Colors.orange,
                isSolved: true,
              ),
              const SizedBox(height: 8),
              _buildProblemItem(
                status: 'Unsolved',
                title: 'Valid Parentheses',
                difficulty: 'Easy',
                difficultyColor: Colors.green,
                isSolved: false,
              ),
              const SizedBox(height: 8),
              _buildProblemItem(
                status: 'Unsolved',
                title: 'Trapping Rain Water',
                difficulty: 'Hard',
                difficultyColor: Colors.red,
                isSolved: false,
              ),
              const SizedBox(height: 20),
            ],
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

  Widget _buildStatCard({
    required String title,
    required String value,
    required Color color,
    bool isWide = false,
  }) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF1E1E1E),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey[800]!, width: 1),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: TextStyle(
              fontSize: 13,
              color: Colors.grey[400],
              fontWeight: FontWeight.w500,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            value,
            style: TextStyle(
              fontSize: 32,
              fontWeight: FontWeight.bold,
              color: color,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildProblemItem({
    required String status,
    required String title,
    required String difficulty,
    required Color difficultyColor,
    required bool isSolved,
  }) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF1E1E1E),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey[800]!, width: 1),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              // Status badge
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: isSolved ? Colors.green.withOpacity(0.2) : Colors.grey.withOpacity(0.2),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  status,
                  style: TextStyle(
                    fontSize: 12,
                    color: isSolved ? Colors.green : Colors.grey[400],
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
              const Spacer(),
              // Difficulty badge
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: difficultyColor.withOpacity(0.2),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  difficulty,
                  style: TextStyle(
                    fontSize: 12,
                    color: difficultyColor,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            title,
            style: const TextStyle(
              fontSize: 16,
              color: Colors.white,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 12),
          Align(
            alignment: Alignment.centerRight,
            child: TextButton(
              onPressed: () {
                // Navigate to code editor
                Navigator.push(
                  context,
                  MaterialPageRoute(builder: (context) => const MonacoEditorScreen()),
                );
              },
              style: TextButton.styleFrom(
                foregroundColor: Colors.blue,
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              ),
              child: const Text(
                'Solve',
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}