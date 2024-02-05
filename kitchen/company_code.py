import json  # 导入json库
import openpyxl
import requests
import urllib.request


def getHtml(url, code):

    proxies = { "http": None, "https": None}
    content = requests.get(url, proxies=proxies).content
    file = "C:\\Users\\koyoshiro\\Pictures\\flight company logo\\"+code+'.png'
    print("正在抓："+file)
    with open(file, "wb") as f:
        f.write(content)


def excel_to_json_by_sheet(excel_file, json_file, sheet_name):
    wb = openpyxl.load_workbook(excel_file)  # 读取excel文件

    result = []
    for rows in wb[sheet_name]:  # 获取表的每一行数据
        tmp = {
            'companyCode': '',
            'companyEName': '',
            'companyName': '',
            'logoUrl': ''
        }  # 定义列表tmp存储每一行的数据
        for ci, cell in enumerate(rows):  # 遍历一行每个单元格的数据
            if(ci == 0):
                tmp['companyCode'] = cell.value
                tmp['logoUrl'] = 'https://pic.tripcdn.com/airline_logo/3x/' + \
                    cell.value.lower()+'.webp'
            elif(ci == 1):
                tmp['companyEName'] = cell.value
            elif(ci == 2):
                tmp['companyName'] = cell.value

            # getHtml(tmp['logoUrl'], tmp['companyCode'])
        result.append(tmp)
    # 覆盖写入json文件
    with open(json_file, mode='w', encoding='utf-8') as jf:
        json.dump(result, jf, indent=2, sort_keys=True, ensure_ascii=False)


excel_to_json_by_sheet(r'D:\Github\LLTrip-Cruise\kitchen\flightcompany.xlsx',
                       r'D:\Github\LLTrip-Cruise\kitchen\flightCompany1.json', 'Sheet1')  # 调用函数，传入参数
