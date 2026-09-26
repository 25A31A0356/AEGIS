import 'package:flutter/material.dart';
import '../core/constants/theme_tokens.dart';
import '../services/disaster_ai_service.dart';

class DisasterGuideScreen extends StatefulWidget {
  const DisasterGuideScreen({super.key});

  @override
  State<DisasterGuideScreen> createState() => _DisasterGuideScreenState();
}

class _DisasterGuideScreenState extends State<DisasterGuideScreen> {
  String _selectedCategory = "FLOOD";

  @override
  Widget build(BuildContext context) {
    final steps = DisasterAiService.getActionProtocol(_selectedCategory);

    return Scaffold(
      backgroundColor: AegisTokens.background,
      appBar: AppBar(
        backgroundColor: AegisTokens.surface,
        elevation: 0,
        title: const Text("Disaster Action Guides", style: AegisTokens.titleStyle),
      ),
      body: Column(
        children: [
          // Disaster Tabs
          Container(
            padding: const EdgeInsets.symmetric(vertical: 8),
            color: AegisTokens.surfaceElevated,
            child: SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Row(
                children: ["FLOOD", "CYCLONE", "EARTHQUAKE", "HEATWAVE"].map((cat) {
                  final isSelected = _selectedCategory == cat;
                  return Padding(
                    padding: const EdgeInsets.only(right: 8.0),
                    child: ChoiceChip(
                      label: Text(cat, style: TextStyle(fontWeight: FontWeight.w800, fontSize: 12, color: isSelected ? Colors.white : AegisTokens.textSecondary)),
                      selected: isSelected,
                      selectedColor: AegisTokens.primaryCyan,
                      backgroundColor: AegisTokens.surface,
                      onSelected: (val) {
                        if (val) setState(() => _selectedCategory = cat);
                      },
                    ),
                  );
                }).toList(),
              ),
            ),
          ),

          // Protocol Steps (Sliver List)
          Expanded(
            child: ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: steps.length,
              itemBuilder: (context, index) {
                return Container(
                  margin: const EdgeInsets.only(bottom: 12),
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: AegisTokens.surface,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: AegisTokens.border),
                  ),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      CircleAvatar(
                        radius: 14,
                        backgroundColor: AegisTokens.primaryCyan.withOpacity(0.2),
                        child: Text("${index + 1}", style: const TextStyle(color: AegisTokens.primaryCyan, fontWeight: FontWeight.w900, fontSize: 12)),
                      ),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Text(
                          steps[index],
                          style: const TextStyle(color: AegisTokens.textPrimary, fontSize: 14, height: 1.4),
                        ),
                      ),
                    ],
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}
