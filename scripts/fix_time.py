import os

file_path = r"c:\Users\tst20\.gemini\antigravity-ide\brain\32c05b85-0fb8-47e5-955e-abb2a01ae4e4\scratch\AEGIS\mobile\app\(tabs)\index.tsx"

with open(file_path, "r", encoding="utf-8") as f:
    lines = f.readlines()

new_lines = []
for line in lines:
    if 'const [isLocationModalVisible, setIsLocationModalVisible] = useState(false);' in line:
        new_lines.append(line)
        new_lines.append('  const [currentTimeStr, setCurrentTimeStr] = useState(() => {\n')
        new_lines.append('    try {\n')
        new_lines.append('      return new Date().toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit", hour12: true }) + " IST";\n')
        new_lines.append('    } catch {\n')
        new_lines.append('      return "LIVE IST";\n')
        new_lines.append('    }\n')
        new_lines.append('  });\n\n')
        new_lines.append('  useEffect(() => {\n')
        new_lines.append('    const updateTime = () => {\n')
        new_lines.append('      try {\n')
        new_lines.append('        setCurrentTimeStr(new Date().toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit", hour12: true }) + " IST");\n')
        new_lines.append('      } catch {}\n')
        new_lines.append('    };\n')
        new_lines.append('    updateTime();\n')
        new_lines.append('    const interval = setInterval(updateTime, 30000);\n')
        new_lines.append('    return () => clearInterval(interval);\n')
        new_lines.append('  }, []);\n')
    elif '06:46 PM IST' in line:
        new_lines.append(line.replace('06:46 PM IST', '{currentTimeStr}'))
    else:
        new_lines.append(line)

with open(file_path, "w", encoding="utf-8") as f:
    f.writelines(new_lines)

print("Successfully updated index.tsx with live IST clock")
