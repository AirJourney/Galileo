import json  # 导入json库
import openpyxl

# 获取热门航线


def excel_to_json_by_sheet(excel_file, json_file, sheet_name):
    wb = openpyxl.load_workbook(excel_file)  # 读取excel文件
    excel_data = {}  # 定义字典excel_data存储每个表的数据{表名:数据}
    result = []
    for rows in wb[sheet_name]:  # 获取表的每一行数据
        tmp = {
            'from': '',
            'to': ''
        }  # 定义列表tmp存储每一行的数据
        for ci, cell in enumerate(rows):  # 遍历一行每个单元格的数据
            if(ci == 0):
                tmp['from'] = cell.value
            elif(ci == 1):
                tmp['to'] = cell.value
        result.append(tmp)
    # 覆盖写入json文件
    with open(json_file, mode='w', encoding='utf-8') as jf:
        json.dump(result, jf, indent=2, sort_keys=True, ensure_ascii=False)


excel_to_json_by_sheet(r'D:\Github\LLTrip-Cruise\kitchen\top_new.xlsx',
              r'D:\Github\LLTrip-Cruise\kitchen\new-ow.json','ow')  # 调用函数，传入参数


excel_to_json_by_sheet(r'D:\Github\LLTrip-Cruise\kitchen\top_new.xlsx',
              r'D:\Github\LLTrip-Cruise\kitchen\new-rt.json','rt')  # 调用函数，传入参数