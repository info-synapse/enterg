api method /EGBETCRM/getusrdata/ implements get user data for my account
in the input
{
  "crr_id": 0,
  "uid": 0,
  "bsp_id": 0,
  "uemail": "string",
  "presetcollection": 0,
  "fields": "string"
}
set value only for uid (the user id) and "presetcollection"=4 to receive all customer fields.

A subset of those fields will be like below

left: FIELDS in http gateway, front:field in the GUI front
    UID                   INTEGER NOT NULL,  front:userid
    UBSP_ID               INTEGER, 
    USG_ID                INTEGER,
    UNAME                 VARCHAR(15) NOT NULL, front:username (login name)
    UREG_STARTDATE        DATE,
    ULAST_LOGIN           DATE,
    UEMAIL                VARCHAR(80),  front:email
    USENDMAIL             SMALLINT default 0,  front:receive my results with email
    USENDSMS_FINAL        SMALLINT default 0,  front:receive final score updates for my bets
    USENDSMS_LIVE         SMALLINT default 0,  front:receive live score updates for my bets
    USENDSMS_RESULTS      SMALLINT default 0,  front:receive my results with sms or push notification
    R_SNAME               VARCHAR(70) CHARACTER SET UNICODE_FSS,  front:surname
    R_NAME                VARCHAR(60) CHARACTER SET UNICODE_FSS,  front:
    R_GENDER              VARCHAR(1) DEFAULT 'M',  front:gender
    R_ADDR1               VARCHAR(100) CHARACTER SET UNICODE_FSS, front:Address line 1
    R_ADDR2               VARCHAR(100) CHARACTER SET UNICODE_FSS, front:Address line 2
    R_PCODE               VARCHAR(30), front:postcode
    R_COUNTRY_CODE        VARCHAR(15), 
    R_REGION              VARCHAR(60) CHARACTER SET UNICODE_FSS, 
    R_LANGUAGE            VARCHAR(25), front:my language
    R_DBIRTH              DATE,  front:birthdate
    R_PHONE               VARCHAR(60), front:landline 
    R_MPHONE              VARCHAR(40), front: mobile phone
    R_CONTACT_TYPE        VARCHAR(10) DEFAULT '11101', front: each character is a flag 0,1 flase/true for  contact me via email, send me promotional updates weekly, send me promotional updates daily, receive AI agent suggestions, auto set my favourite leagues
    R_CLIENT_IP           VARCHAR(30),
    R_CLIENT_PC_SERIALNO  VARCHAR(100),
    R_CLIENT_PC_ACTCODE   VARCHAR(100),
    CRR_ID                INTEGER,
    R_TIMEZONE            INTEGER DEFAULT 0, front: slider with my time difference compared to default "show me matches with difference +/- X hours" 
    R_TIMEZONETEXT        VARCHAR(50), front: iso my timezone name
    UPROMCODE             VARCHAR(50), front: my promo code (can be edited only if null or empty string)
    UMARKETING            VARCHAR(10),
    TIMEZONE_ID           INTEGER,  front: id of the selected time zone
    UPINCODE              VARCHAR(10) CHARACTER SET UNICODE_FSS,
    UCITY_BIRTH           VARCHAR(100) CHARACTER SET UNICODE_FSS,
    UCOUNTRY_BIRTH        VARCHAR(100) CHARACTER SET UNICODE_FSS,  front:country birth
    UPROVINCE_BIRTH       VARCHAR(100) CHARACTER SET UNICODE_FSS,  front:nationality
    UBUILDINGNO           VARCHAR(10) CHARACTER SET UNICODE_FSS,
    UAPARTMENTNO          VARCHAR(10) CHARACTER SET UNICODE_FSS,
    UPESELID              VARCHAR(11) CHARACTER SET UNICODE_FSS,
    ULOYALITYNO           VARCHAR(20) CHARACTER SET UNICODE_FSS,
    ULOYALITYPASSWORD     VARCHAR(20) CHARACTER SET UNICODE_FSS,
    UEXTERNAL_USERID      VARCHAR(50) CHARACTER SET UNICODE_FSS,
    UIDENTITY             VARCHAR(20) CHARACTER SET UNICODE_FSS,  front: id
    UIDENTITY_TYPE        SMALLINT,                               front: id type dropdown for "ID,Passport,Dr Licensce"                     
    UBBPIN                VARCHAR(40) CHARACTER SET UNICODE_FSS,
    REG_SG_ID             INTEGER DEFAULT 0
);

Please map with the existing of the front website and add whatever does not already exist in the front end.
Add the fields in the personal details area of the front end.
