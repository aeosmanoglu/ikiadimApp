# 2Adım

A Node.js server application generate secret key, shows QR codes and save it to MondoDB with hash

## End-Point

```text
/api/check?id=[1234567]&code=[123456]
```

1. Any query is **empty** or id is **not valid**, returns: `400 Bad Request`

1. `200 OK` returns a JSON data:

    ```json
    {
        "id": "1234567",
        "status": false
    }
    ```

    or

    ```json
    {
        "id": "1234567",
        "status": true
    }
    ```
