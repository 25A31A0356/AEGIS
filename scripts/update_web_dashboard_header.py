file_path = r"c:\Users\tst20\.gemini\antigravity-ide\brain\32c05b85-0fb8-47e5-955e-abb2a01ae4e4\scratch\AEGIS\web\src\pages\DashboardPage.tsx"

with open(file_path, "r", encoding="utf-8") as f:
    text = f.read()

old_header = """        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Hi {userName}! 👋
          </h1>
          <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200 font-semibold text-base sm:text-lg mt-1.5 flex-wrap">
            <button
              onClick={onOpenSearch}
              className="text-emerald-600 dark:text-emerald-400 font-extrabold hover:underline flex items-center gap-1.5 cursor-pointer text-left"
              title="Click to search or change your exact village or city"
            >
              <span>📍 {locType}: {cleanVillageName}</span>
              <span className="text-xs bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-full font-mono">CHANGE ✏️</span>
            </button>
            {selectedLocation?.nearbyPlace && (
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                (Near {selectedLocation.nearbyPlace})
              </span>
            )}
          </div>
        </div>"""

new_header = """        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Hi {userName}!
          </h1>
          <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200 font-semibold text-base sm:text-lg mt-1.5 flex-wrap">
            <button
              onClick={onOpenSearch}
              className="text-emerald-600 dark:text-emerald-400 font-extrabold hover:underline flex items-center gap-1.5 cursor-pointer text-left"
              title="Click to search or change your exact village or city"
            >
              <span>{cleanVillageName || selectedLocation?.name || "Your Area"}</span>
            </button>
            {selectedLocation?.nearbyPlace && (
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                (Near {selectedLocation.nearbyPlace})
              </span>
            )}
          </div>
        </div>"""

if old_header in text:
    text = text.replace(old_header, new_header)
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(text)
    print("Updated web DashboardPage header successfully")
else:
    print("Could not match old_header in web DashboardPage")
