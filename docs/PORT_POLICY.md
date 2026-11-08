# Combat Protocol — Port Policy

## Reserved port

```text
Combat Protocol: 4173
URL: http://127.0.0.1:4173/
```

Port `4173` is reserved for this project. `start.bat` and the default value in
`server.mjs` both point to it. The `/health` endpoint identifies the owner:

```json
{"status":"ok","app":"Combat Protocol","version":"1.7.0"}
```

## Other projects

Other local games must use their own ports. If another process is already
listening on `4173`, stop that process before starting Combat Protocol; do not
change this game's port to make room for another project.

## Verification

```powershell
netstat -ano | findstr ":4173"
Invoke-WebRequest http://127.0.0.1:4173/health
```

The listener and health response must refer to Combat Protocol before opening
the browser URL.
