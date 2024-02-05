# LLTrip-Cruise



## QuickStart

<!-- add docs here for user -->

see [egg docs][egg] for more detail.

### Development

```bash
$ npm i
$ npm run dev
$ open http://localhost:7001/
```

### Deploy

```bash
$ npm start
$ npm stop
```

### npm scripts

- Use `npm run lint` to check code style.
- Use `npm test` to run unit test.
- Use `npm run autod` to auto detect dependencies upgrade, see [autod](https://www.npmjs.com/package/autod) for more detail.


[egg]: https://eggjs.org


# Transport

https://github.com/Travelport-Ukraine/uapi-json

https://support.travelport.com/webhelp/uapi/Content/Getting_Started/Endpoints_Services.htm  region

https://github.com/Travelport-Ukraine/uapi-json/blob/master/docs/Air.md

https://github.com/Travelport-Ukraine/uapi-json/blob/master/docs/Utils.md

https://support.travelport.com/webhelp/uapi/uAPI.htm#Air/Low_Fare_Shopping/Retrieving_Low_Fare_Search_Data.htm?TocPath=Air%257CAir%2520Shopping%2520and%2520Booking%257CLow%2520Fare%2520Shopping%257CLow%2520Fare%2520Shopping%2520(Asynchronous)%257C_____1

https://github.com/eggjs/egg-redis


# Redis

.\redis-server.exe redis.windows.conf

.\redis-cli.exe -h 127.0.0.1 -p 6379

## Key -Value 

一级key的优化：
经过一期优化后的一级key格式：直飞：DepartureDateDepartureCityAirlineCodeArrivalCity-POS-SourceType[-TripType]  29OCT19SHAMUSEL-CN-CLA
联程:   DepartureDateDepartureCityAirlineCodeTransferCityTransferAirlineCodeArrivalCity-POS-SourceType[-TripType]  29OCT19SHAMUHKGMUSEL-CN-CLA
这个key可以更小，分别从以下几个方便进行缩小：
1.起飞日期格式ddMMMyy，即使编码也需要至少5个字节才能存储，而经过日期优化后只需要2个字节
2.SourceType存储了枚举值，这样只需要一个字节就能表示
因此新的一级key的格式(byte[])，第一个字节为sourceType，之后两个字节为起飞日期，之后的字节是POS+ClassTask(CNSHAMUSEL)[+triptype]编码后的byte[]数组


二级key的优化：
经过一期优化后的二级key格式：直飞 FlightNumber 222  联程 FlightNumber+TransferFlightNumber+DepartureDateOffset 111+222+1
因为一期的时候av的更新也有.net，但是.net credis接口不支持map的二级key是byte，因此没有对二级key进行编码，因为转java的完成，对二级key也做了编码，将字符串编码成byte数组，
而且采用了一个字符用4个bit的编码，因为航组的航班号只会有数字，所以只会有0-9这几种情况，只需要4个字符即可编码完成。


子舱位数量的优化：
子舱位的数量之前是0-9且包含A-Z的字母，字母代表的含义是A直接翻译成还有9个舱位，除A的字母其他都代表关舱即0个，这里和引擎等业务确认过逻辑，对于其余的字母没有什么特殊作用。
因此子舱位数量统一用0-9表示，这样子舱位数量连接而成的字符串就可以用4bit进行字符串编码，比之前的6bit编码每个字符少了两个bit。


直飞：DepartureDate DepartureCity AirlineCode ArrivalCity-POS-SourceType[-TripType]  29OCT 19 SHA MU SEL-CN-CLA
联程:   DepartureDate DepartureCity AirlineCode TransferCity TransferAirlineCode ArrivalCity-POS-SourceType[-TripType]  29OCT 19 SHA MU HKG MU SEL-CN-CLA

## key

- Key:[DepartureMonth-DepartureDay-DepartureCity-ArrivalCity]  0216LHRPVG 
- Value:[DepartureTime-DepartureOffet-AirlineCode-FlightNumber-DeparturePort-DepartureStation/                            
         TransferPort-TransferStation-TransOffset/
         TransferTime-ArrivalOffset-TransferAirlineCode-TransferFlightNumber-ArrivalPort-ArrivalStation/
         ADTBase-ADTTaxes-CHDBase-CHDTaxes-INSBase-INSTaxes]
- Example
  1810-0250-AY-1338-LHR-T3/
  HEL-T2-1750/
  1650-0855-AY-0087-PVG-T2/
  2000-500-1000-500-500-500
