# 


## Version: 

### /

#### GET
##### Summary:



##### Description:



##### Parameters

| Name | Located in | Description | Required | Schema |
| ---- | ---------- | ----------- | -------- | ---- |

##### Responses

| Code | Description |
| ---- | ----------- |
| 200 |  |

#### POST
##### Summary:



##### Description:



##### Parameters

| Name | Located in | Description | Required | Schema |
| ---- | ---------- | ----------- | -------- | ---- |

##### Responses

| Code | Description |
| ---- | ----------- |
| 200 |  |

### /me

#### GET
##### Summary:



##### Description:



##### Parameters

| Name | Located in | Description | Required | Schema |
| ---- | ---------- | ----------- | -------- | ---- |

##### Responses

| Code | Description |
| ---- | ----------- |
| 200 |  |

### /me/{params1}/kiki/{params2}

#### GET
##### Summary:



##### Description:



##### Parameters

| Name | Located in | Description | Required | Schema |
| ---- | ---------- | ----------- | -------- | ---- |
| params1 | path |  | Yes | string |
| params2 | path |  | Yes | string |

##### Responses

| Code | Description |
| ---- | ----------- |
| 200 |  |

### /moi/{params1}/kiki/{params2}

#### GET
##### Summary:

je suis un resume

##### Description:

Cette route ne vaut pas dla marde.

##### Parameters

| Name | Located in | Description | Required | Schema |
| ---- | ---------- | ----------- | -------- | ---- |
| params1 | path |  | Yes | string |
| params2 | path |  | Yes | string |
| trainerId | query |  | No | string |
| trainerAge! | query |  | Yes | string |

##### Responses

| Code | Description |
| ---- | ----------- |
| 200 |  |

### Models


#### GetHomeResponse

| Name | Type | Description | Required |
| ---- | ---- | ----------- | -------- |
| salut | string |  | Yes |

#### LEBodyDuPost

| Name | Type | Description | Required |
| ---- | ---- | ----------- | -------- |
| dsad | string |  | Yes |

#### PostHomeResponse

| Name | Type | Description | Required |
| ---- | ---- | ----------- | -------- |
| leBodyDuPost | [LEBodyDuPost](#lebodydupost) |  | Yes |

#### GetMeResponse

| Name | Type | Description | Required |
| ---- | ---- | ----------- | -------- |
| id | string |  | Yes |
| nom | string |  | Yes |
| prenom | string |  | Yes |

#### GetMeParams1KikiParams2Response

| Name | Type | Description | Required |
| ---- | ---- | ----------- | -------- |
| id | string |  | Yes |
| nom | string |  | Yes |
| prenom | string |  | Yes |

#### GetMoiParams1KikiParams2Response

| Name | Type | Description | Required |
| ---- | ---- | ----------- | -------- |
| id | string |  | Yes |
| id2 | string |  | Yes |
| ide3 | string |  | Yes |
| picture | string |  | Yes |