# User API Spec

## Register User

Endpoint : POST /api/users

Request Body :

```json
{
    
    "email" : "Acel@gmail.com",
    "username" : "Acel",
    "password" : "acel123" 
}
```

Response Body (Success) :
```json
{
    "data" : {
        "email" : "Acel@gmail.com"
        "username" : "Acel",
        
    }
}
```

Response Body (Error) :
```json
{
    "errors" : "Username already registered"
}
```

## Login User

Endpoint : POST /api/users/login

Request Body :
```json
{
    "email" : "Acel@gmail.com",
    "username" : "Acel",
    "password" : "acel123" 
}
```

Response Body (Success) :
```json
{
    "data" : {
        "email" : "Acel@gmail.com",
        "username" : "Acel",
        "token" : "session_id_generated"
    }
}
```

Response Body (Error) :
```json
{
    "errors" : "Email & Password Wrong"
}
```

## Get User

Endpoint : GET /api/users/current

Headers :
- authorization : token

Response Body (Success) :
```json
{
    "data" : {
        "email" : "Acel@gmail.com",
        "username" : "Acel",
        "token" : "session_id_generated"
    }
}
```

Response Body (Error) :
```json
{
    "errors" : "Unauthorized"
}
```

## Update User

Endpoint : PATCH /api/users/current

Headers : 
- Authorization : token

Request Body :
```json
{
    "username" : "Acel",
    "password" : "acel123"
}
```

Response Body (Success) :
```json
{
    "data" : {
        "email" : "Acel@gmail.com",
        "username" : "Acel",
    }
}
```

Response Body (Error) :
```json
{
    "errors" : "Username already registered"
}
```

## Logout User

Endpoint : DELETE /api/users/current

Headers : 
- Authorization : token

Response Body (Success) :
```json
{
    "data" : true
}
```
