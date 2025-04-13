# 故事和角色管理 API

## 1. 创建故事 API

**端点**: `/api/stories`  
**方法**: `POST`  
**功能**: 创建新故事并自动生成指定数量的角色

**请求体**:
```json
{
  "title": "故事标题",
  "background": "故事背景描述",
  "character_num": 3,
  "user_id": "用户ID"
}
```

**响应**:
```json
{
  "success": true,
  "story_id": "新创建的故事ID",
  "message": "故事创建成功，已自动生成3个角色"
}
```

## 2. 更新故事 API

**端点**: `/api/stories/{story_id}`  
**方法**: `PUT`  
**功能**: 更新故事信息及其角色

**请求体**:
```json
{
  "title": "更新后的标题",
  "background": "更新后的背景",
  "character_num": 5,
  "characters": [
    {
      "character_id": "角色ID1",
      "name": "角色名称1",
      "character": "角色特征1",
      "background": "角色背景1"
    },
    {
      "character_id": "角色ID2",
      "name": "角色名称2",
      "character": "角色特征2",
      "background": "角色背景2"
    }
    // 所有需要保留的角色
  ],
  "deleted_character_ids": ["要删除的角色ID1", "要删除的角色ID2"]
}
```

**响应**:
```json
{
  "success": true,
  "message": "故事及角色更新成功"
}
```

**注意**:
- 如果 `character_num` 增加，系统将自动创建新的角色
- 如果 `character_num` 减少，用户需要在 `deleted_character_ids` 中指定要删除的角色

## 3. 获取故事 API

**端点**: `/api/stories/{story_id}`  
**方法**: `GET`  
**功能**: 获取故事信息及其所有角色

**响应**:
```json
{
  "story": {
    "story_id": "故事ID",
    "title": "故事标题",
    "background": "故事背景",
    "character_num": 4,
    "created_at": "2023-01-01T12:00:00Z",
    "updated_at": "2023-01-02T12:00:00Z"
  },
  "characters": [
    {
      "character_id": "角色ID1",
      "name": "角色名称1",
      "character": "角色特征1",
      "background": "角色背景1"
    },
    {
      "character_id": "角色ID2",
      "name": "角色名称2",
      "character": "角色特征2",
      "background": "角色背景2"
    }
    // 所有角色
  ]
}
```

## 4. 删除故事 API

**端点**: `/api/stories/{story_id}`  
**方法**: `DELETE`  
**功能**: 删除故事及其所有关联角色

**响应**:
```json
{
  "success": true,
  "message": "故事及其角色已成功删除"
}
```

**注意**: 删除故事时，数据库将自动级联删除所有关联的角色
