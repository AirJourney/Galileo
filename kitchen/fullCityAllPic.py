import json  # 导入json库
import openpyxl
import requests
import urllib.request
from langconv import *


def getHtml(code):

    proxies = { "http": None, "https": None}
    url= "https://pic.c-ctrip.com/flight/fuzzy/"+code+"/640.jpg"
    content = requests.get(url, proxies=proxies).content
    file = "C:\\Users\\koyoshiro\\Pictures\\city pic\\"+code+'.jpg'
    print("正在抓："+file)
    with open(file, "wb") as f:
        f.write(content)

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
    
    with open('D:\\Github\\LLTrip-Cruise\\kitchen\\esa.json', 'r', encoding='utf-8') as f:
        # line = f.readline()
        topCiytList = json.load(f)  # 此时a是一个字典对象
        
        for ci, cell in enumerate(topCiytList):
            cityList.add(cell["from"])
            cityList.add(cell["to"])
        
        f.close()    

    return sorted(cityList)
 

cityList = refactor_cityinfo()
result = []
for di,dv in enumerate(cityList):
    getHtml(dv)
           
