import json  # 导入json库
import openpyxl

def get_flight_set(flight_file):
    flight_data = ''
    with open(flight_file,'r',encoding='utf8')as fp:
        flight_data = json.load(fp)

    flight_set = set()
    for fi,fv in enumerate(flight_data):
        flight_set.add(fv['from'])
        flight_set.add(fv['to'])

    return flight_set


def match_city(hot_flight,city_file):
    with open(city_file,'r',encoding='utf8')as fp:
        city_data = json.load(fp)
    
    hot_city = []
    for fi,fv in enumerate(hot_flight):
        for ci,cv in enumerate(city_data):
            if(cv['cityCode'] == fv):
                hot_city.append(cv)
    return hot_city

ow_set = get_flight_set(r'D:\Github\LLTrip-Cruise\kitchen\new-ow.json')
rt_set = get_flight_set(r'D:\Github\LLTrip-Cruise\kitchen\new-rt.json')

union_set = ow_set.union(rt_set)
print(union_set)

match_result = match_city(union_set,r'D:\Github\LLTrip-Cruise\kitchen\cityInfo.json')
print(match_result)


with open(r'D:\Github\LLTrip-Cruise\kitchen\hot-city.json', mode='w', encoding='utf-8') as jf:
        json.dump(match_result, jf, indent=2, sort_keys=True, ensure_ascii=False)

