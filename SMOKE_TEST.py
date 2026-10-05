import urllib.request, json
u='http://127.0.0.1:8000/api/health'
print(json.loads(urllib.request.urlopen(u, timeout=5).read()))
