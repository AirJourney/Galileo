import json  # 导入json库
import openpyxl
import requests
import urllib.request
from langconv import *

# 转换简体到繁体
def chs_to_cht(line):
    line = Converter('zh-hant').convert(line)
    line.encode('utf-8')
    return line

def getHtml(code):
    url= "https://flights.ctrip.com/international/search/api/poi/search?key="+code+"&v=0.3336917109384274"
    proxies = { "http": None, "https": None}
    content = requests.get(url, proxies=proxies).content
    letterCodeList = content.decode('utf8')
    print(code)
   
    resultInfo = ''
    letterCodeInfo = json.loads(letterCodeList)['Data']
  
    for ci, cell in enumerate(letterCodeInfo):
        if(resultInfo=='' and cell['Type']==3):
            cell['nearby'] =  cell['Nearby']  = ''
            cell['CountryTW'] = chs_to_cht(cell['Country'])
            cell['NameTW'] = chs_to_cht(cell['Name'])
            cell['Datas'][0]['CountryTW'] = chs_to_cht(cell['Datas'][0]['Country'])
            cell['Datas'][0]['NameTW'] = chs_to_cht(cell['Datas'][0]['Name'])
            if('Province' in cell['Datas'][0]):
                cell['Datas'][0]['ProvinceTW'] = chs_to_cht(cell['Datas'][0]['Province'])
            
            tmp = {}
            tmp = cell['Datas'][0]
            tmp['Datas'] = []
            tmp['Datas'].append(cell)
            tmp['Datas'][0]['Datas'] = ''

           
            
            resultInfo = tmp
            break
        elif(resultInfo=='' and cell['Type']==5 and ('Datas' in cell) and len(cell['Datas'])>0):
            for di,dv in enumerate(cell['Datas']):
                if(dv['Type']==3):
                    resultInfo = cell
                    break
            if(resultInfo!=''):
                
                resultInfo['CountryTW'] = chs_to_cht(resultInfo['Country'])
                resultInfo['NameTW'] = chs_to_cht(resultInfo['Name'])
                
                for di,dv in enumerate(resultInfo['Datas']):
                    dv['CountryTW'] = chs_to_cht(dv['Country'])
                    dv['NameTW'] = chs_to_cht(dv['Name'])
                    if('Province' in dv):
                        dv['ProvinceTW'] = chs_to_cht(dv['Province'])

    return resultInfo


# 转换简体到繁体
def chs_to_cht(line):
    line = Converter('zh-hant').convert(line)
    line.encode('utf-8')
    return line


def refactor_cityinfo():

    cityList = set()
    with open('D:\\Github\\LLTrip-Cruise\\kitchen\\new-ow.json', 'r', encoding='utf-8') as f:
        # line = f.readline()
        topCiytList = json.load(f)  # 此时a是一个字典对象
        
        for ci, cell in enumerate(topCiytList):
            cityList.add(cell["from"])
            cityList.add(cell["to"])
        
        f.close()

    with open('D:\\Github\\LLTrip-Cruise\\kitchen\\new-rt.json', 'r', encoding='utf-8') as f:
        # line = f.readline()
        topCiytList = json.load(f)  # 此时a是一个字典对象
        
        for ci, cell in enumerate(topCiytList):
            cityList.add(cell["from"])
            cityList.add(cell["to"])
        
        f.close()    
    
    return sorted(cityList)
 

cityList = refactor_cityinfo()
result = []
# letterCodeInfo = getHtml('LON')
for di,dv in enumerate(cityList):
    letterCodeInfo = getHtml(dv)
    result.append(letterCodeInfo)
           

with open('D:\\Github\\LLTrip-Cruise\\kitchen\\diffCity.json', mode='w', encoding='utf-8') as jf:
        json.dump(result, jf, indent=2, sort_keys=True, ensure_ascii=False)
