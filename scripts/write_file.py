import sys, pathlib
filename = sys.argv[1]
b64_data = sys.stdin.read().strip()
pathlib.Path(filename).write_bytes(base64.b64decode(b64_data.encode('utf-8')))
print('Wrote', filename)
