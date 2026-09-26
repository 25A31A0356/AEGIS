file_path = r"c:\Users\tst20\.gemini\antigravity-ide\brain\32c05b85-0fb8-47e5-955e-abb2a01ae4e4\scratch\AEGIS\mobile\app\(tabs)\index.tsx"

with open(file_path, "r", encoding="utf-8") as f:
    text = f.read()

text = text.replace(
    'width: dynamicUv.pct, backgroundColor: dynamicUv.color',
    'width: `${dynamicUv.pct}` as any, backgroundColor: dynamicUv.color'
)

text = text.replace(
    'nearestHazard.distanceKm > 0 ? `${nearestHazard.distanceKm} km away` : "Local Grid Zone"',
    '(nearestHazard.distanceKm ?? 0) > 0 ? `${nearestHazard.distanceKm} km away` : "Local Grid Zone"'
)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(text)

print("Fixed type issues in index.tsx")
