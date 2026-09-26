class DisasterAiService {
  static const Map<String, List<String>> _guideData = {
    "FLOOD": [
      "Move immediately to higher ground; avoid basements.",
      "Do not walk or drive through flowing water (6 inches can sweep you away).",
      "Turn off main power switches if water enters the building.",
      "Keep emergency go-bag and clean drinking water ready.",
    ],
    "CYCLONE": [
      "Board up windows or apply tape in criss-cross pattern.",
      "Remain indoors during the calm eye of the storm; wind reverses violently.",
      "Keep battery-powered radio tuned to official IMD alerts.",
      "Disconnect electrical appliances before landfall.",
    ],
    "EARTHQUAKE": [
      "DROP, COVER, and HOLD ON under sturdy furniture.",
      "Stay away from glass, exterior walls, and heavy fixtures.",
      "If outdoors, move to an open area away from power lines and buildings.",
      "Do not use elevators during aftershocks.",
    ],
    "HEATWAVE": [
      "Stay hydrated; drink ORS, lemon water, or coconut water.",
      "Avoid direct sun exposure between 11:00 AM and 4:00 PM.",
      "Wear loose, light-colored cotton clothing.",
    ],
  };

  static List<String> getActionProtocol(String disasterType) {
    return _guideData[disasterType.toUpperCase()] ?? _guideData["FLOOD"]!;
  }
}
