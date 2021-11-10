# 2Adım

A Node.js server application generate secret key, shows QR codes and save it to MondoDB with hash

## End-Point

```
/api/check?id=[123456]&code=[123456]&key=[your_api_key]
```

1. Any query is **empty** returns: `400 Bad Request`

1. Api key is **wrong** returns: `401 Unauthorized`

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
