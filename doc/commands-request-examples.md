## GET

```
curl -X 'GET' \
  'https://127.0.0.1:27124/commands/' \
  -H 'accept: application/json' \
  -H 'Authorization: Bearer bde7fa8bc00fbc576950a5d19243c774c2a7358a57c4215bb2a56f11123763be'
```

Response:
```json
{
  "commands": [
    {
      "id": "editor:save-file",
      "name": "Save current file"
    },
    {
      "id": "editor:download-attachments",
      "name": "Download attachments for current file"
    },
    {
      "id": "editor:follow-link",
      "name": "Follow link under cursor"
    },
    {
      "id": "editor:open-link-in-new-leaf",
      "name": "Open link under cursor in new tab"
    },
    ...
  ]
}
```

## POST

```
curl -X 'POST' \
  'https://127.0.0.1:27124/commands/workspace%3Asplit-vertical/' \
  -H 'accept: */*' \
  -H 'Authorization: Bearer bde7fa8bc00fbc576950a5d19243c774c2a7358a57c4215bb2a56f11123763be' \
  -d ''
```

Response
200 or 204 some statusc code