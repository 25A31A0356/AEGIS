import 'package:flutter/material.dart';
import '../core/constants/theme_tokens.dart';
import '../services/api_client.dart';
import '../models/citizen_report.dart';

class CitizenReportsScreen extends StatefulWidget {
  const CitizenReportsScreen({super.key});

  @override
  State<CitizenReportsScreen> createState() => _CitizenReportsScreenState();
}

class _CitizenReportsScreenState extends State<CitizenReportsScreen> {
  final ValueNotifier<List<CitizenReportModel>> _reportsNotifier = ValueNotifier<List<CitizenReportModel>>([]);

  @override
  void initState() {
    super.initState();
    _loadReports();
  }

  @override
  void dispose() {
    _reportsNotifier.dispose();
    super.dispose();
  }

  Future<void> _loadReports() async {
    final data = await AegisApiClient().fetchReports();
    _reportsNotifier.value = data;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AegisTokens.background,
      appBar: AppBar(
        backgroundColor: AegisTokens.surface,
        elevation: 0,
        title: const Text("Citizen Hazard Reports", style: AegisTokens.titleStyle),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh, color: AegisTokens.primaryCyan),
            onPressed: _loadReports,
          ),
        ],
      ),
      body: ValueListenableBuilder<List<CitizenReportModel>>(
        valueListenable: _reportsNotifier,
        builder: (context, reports, _) {
          if (reports.isEmpty) {
            return const Center(child: CircularProgressIndicator(color: AegisTokens.primaryCyan));
          }
          return ListView.builder(
            itemCount: reports.length,
            itemBuilder: (context, index) {
              final r = reports[index];
              return Container(
                margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: AegisTokens.surface,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AegisTokens.border),
                ),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(color: AegisTokens.warningOrange.withOpacity(0.15), shape: BoxShape.circle),
                      child: const Icon(Icons.report_problem, color: AegisTokens.warningOrange, size: 20),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(r.title, style: const TextStyle(color: AegisTokens.textPrimary, fontWeight: FontWeight.w700, fontSize: 14)),
                          const SizedBox(height: 4),
                          Text(r.description, style: const TextStyle(color: AegisTokens.textSecondary, fontSize: 12)),
                          const SizedBox(height: 6),
                          Row(
                            children: [
                              Text(r.timestamp, style: const TextStyle(color: AegisTokens.textSecondary, fontSize: 11)),
                              const SizedBox(width: 12),
                              Text("▲ ${r.upvotes} Confirmations", style: const TextStyle(color: AegisTokens.primaryCyan, fontSize: 11, fontWeight: FontWeight.w700)),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              );
            },
          );
        },
      ),
    );
  }
}
