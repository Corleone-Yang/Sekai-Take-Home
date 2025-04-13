# Story and Character Management API

## 1. Create Story API

**Endpoint**: `/api/stories`  
**Method**: `POST`  
**Function**: Create a new story and automatically generate the specified number of characters

**Request Body**:
```json
{
  "title": "Story Title",
  "background": "Story Background Description",
  "character_num": 3,
  "user_id": "User ID"
}
```

**Response**:
```json
{
  "success": true,
  "story_id": "Newly Created Story ID",
  "message": "Story created successfully, 3 characters have been automatically generated"
}
```

## 2. Update Story API

**Endpoint**: `/api/stories/{story_id}`  
**Method**: `PUT`  
**Function**: Update story information and its characters

**Request Body**:
```json
{
  "title": "Updated Title",
  "background": "Updated Background",
  "character_num": 5,
  "characters": [
    {
      "character_id": "Character ID 1",
      "name": "Character Name 1",
      "character": "Character Traits 1",
      "background": "Character Background 1"
    },
    {
      "character_id": "Character ID 2",
      "name": "Character Name 2",
      "character": "Character Traits 2",
      "background": "Character Background 2"
    }
    // All characters to be retained
  ],
  "deleted_character_ids": ["Character ID to delete 1", "Character ID to delete 2"]
}
```

**Response**:
```json
{
  "success": true,
  "message": "Story and characters updated successfully"
}
```

**Note**:
- If `character_num` increases, the system will automatically create new characters
- If `character_num` decreases, the user needs to specify which characters to delete in `deleted_character_ids`

## 3. Get Story API

**Endpoint**: `/api/stories/{story_id}`  
**Method**: `GET`  
**Function**: Get story information and all its characters

**Response**:
```json
{
  "story": {
    "story_id": "Story ID",
    "title": "Story Title",
    "background": "Story Background",
    "character_num": 4,
    "created_at": "2023-01-01T12:00:00Z",
    "updated_at": "2023-01-02T12:00:00Z"
  },
  "characters": [
    {
      "character_id": "Character ID 1",
      "name": "Character Name 1",
      "character": "Character Traits 1",
      "background": "Character Background 1"
    },
    {
      "character_id": "Character ID 2",
      "name": "Character Name 2",
      "character": "Character Traits 2",
      "background": "Character Background 2"
    }
    // All characters
  ]
}
```

## 4. Delete Story API

**Endpoint**: `/api/stories/{story_id}`  
**Method**: `DELETE`  
**Function**: Delete a story and all its associated characters

**Response**:
```json
{
  "success": true,
  "message": "Story and its characters have been successfully deleted"
}
```

**Note**: When a story is deleted, the database will automatically cascade delete all associated characters
