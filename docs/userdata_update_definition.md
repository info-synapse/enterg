api method /EGBETCRM/updusrdata/ implements update user data
in the input
{
  "uid": 0,
  "acc_id": 0,
  "presetcollection": 0,
  "fieldsvalues": "string",
  "response_json": true
}
set value for uid (the user id) and "presetcollection"=1. 
fieldsvalues must be like an sql command , example SOME_DATE_FIELD="YYYY.MM.DD HH:NN:SS", some_char_field="newvalue", someintfield=10, someRealField=19.25
 
